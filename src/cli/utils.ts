import assert from "assert";
import { spawn } from "child_process";
import { readdirSync, readFileSync } from "fs";
import fs from "fs";
import { mkdir, readdir, readFile, stat, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import process from "process";
import { type Duplex, Writable } from "stream";
import { fileURLToPath } from "url";

import axios from "axios";
import { compareVersions } from "compare-versions";
import Docker from "dockerode";
import type { Schema } from "jsonschema";
import nunjucks from "nunjucks";
import type { PackageJson } from "type-fest";

import type { Logger } from "lib/logging";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectoryPath = path.dirname(currentFilePath);

/**
 * Checks if a given command exists in the system's PATH.
 *
 * This function attempts to spawn the command with the `--version` flag, assuming that most
 * commands will support it or at least not have side effects when it is passed.
 *
 * @param command - The name of the command to check.
 *
 * @returns A boolean indicating whether the command exists.
 */
export function checkCommandExists(command: string): Promise<boolean> {
  return new Promise((resolve) => {
    const process = spawn(command, ["--version"]);

    process.on("error", () => {
      // Command could not be spawned or was not found in the PATH
      resolve(false);
    });

    process.on("exit", (code) => {
      // Command exists if there are no errors or the exit code isn't 127.
      resolve(code !== 127 && code !== null);
    });
  });
}

/**
 * Checks whether we can connect to the Docker daemon.
 *
 * @returns A boolean value indicating whether the Docker daemon is accessible.
 */
export async function checkDockerAvailability(
  logger?: Logger,
): Promise<boolean> {
  const docker = new Docker();
  try {
    await docker.ping();
  } catch (error) {
    logger?.debug("Failed to connect to the Docker daemon.");
    logger?.debug(error);
    return false;
  }
  logger?.debug("Docker daemon is accessible.");
  return true;
}

/**
 * Supported external commands, each must correspond to a `docker-zkp` image repository.
 */
type ExternalCommand = "circomspect" | "nargo";

/**
 * A writable stream that discards all input.
 */
export const devNull = new Writable({
  write(_chunk, _encoding, callback) {
    callback();
  },
});

/**
 * Executes an external command, either locally or in a Docker container.
 *
 * @param command - The command to execute, corresponds to a `docker-zkp` image.
 * @param args - The arguments to pass to the command.
 * @param options - Additional options for the command.
 * @param options.cwd - The current working directory for the executed command.
 * @param options.docker - The `Docker` instance to use for running the command. Defaults to a new
 *   `Docker` instance with default options.
 * @param options.logger - The logger to use for logging messages. There will be no logging if not
 *   specified.
 * @param options.rootDirectory - The project root directory on the host. Will be determined by
 *   searching up the directory tree for a `sindri.json` file if not specified. This directory is
 *   mounted into the Docker container at `/sindri/` if the command is executed in Docker.
 * @param options.tag - The tag of the Docker image to use. Defaults to `auto`, which will map to
 *   the `latest` tag unless a version specifier is found in `sindri.json` that supersedes it.
 * @param options.tty - Whether to use a TTY for the command. Defaults to `false` which means that
 *   the command's output will be ignored.
 *
 * @returns The exit code of the command, or `null` if the command is not available locally or in
 *   Docker.
 */
export async function execCommand(
  command: ExternalCommand,
  args: string[] = [],
  {
    cwd = process.cwd(),
    docker = new Docker(),
    logger,
    rootDirectory,
    tag = "auto",
    tty = false,
  }: {
    cwd?: string;
    docker?: Docker;
    logger?: Logger;
    rootDirectory?: string;
    tag?: string;
    tty?: boolean;
  },
): Promise<
  { code: number; method: "docker" | "local" } | { code: null; method: null }
> {
  // Try using a local command first (unless `SINDRI_FORCE_DOCKER` is set).
  if (isTruthy(process.env.SINDRI_FORCE_DOCKER ?? "false")) {
    logger?.debug(
      `Forcing docker usage for command "${command}" because "SINDRI_FORCE_DOCKER" is set to ` +
        `"${process.env.SINDRI_FORCE_DOCKER}".`,
    );
  } else if (await checkCommandExists(command)) {
    logger?.debug(`Executing the "${command}" command locally.`);
    return {
      code: await execLocalCommand(command, args, { cwd, logger, tty }),
      method: "local",
    };
  } else {
    logger?.debug(
      `The "${command}" command was not found locally, trying Docker instead.`,
    );
  }

  // Fall back to using Docker if possible.
  if (await checkDockerAvailability(logger)) {
    logger?.debug(`Executing the "${command}" command in a Docker container.`);
    return {
      code: await execDockerCommand(command, args, {
        cwd,
        docker,
        logger,
        rootDirectory,
        tag,
        tty,
      }),
      method: "docker",
    };
  }

  // There's no way to run the command.
  logger?.debug(
    `The "${command}" command is not available locally or in Docker.`,
  );
  return { code: null, method: null };
}

/**
 * Executes an external command in a Docker container.
 *
 * @param command - The command to execute, corresponds to a `docker-zkp` image.
 * @param args - The arguments to pass to the command.
 * @param options - Additional options for the command.
 * @param options.cwd - The current working directory on the host for the executed command.
 * @param options.docker - The `Docker` instance to use for running the command. Defaults to a new
 *   `Docker` instance with default options.
 * @param options.logger - The logger to use for logging messages. There will be no logging if not
 *   specified.
 * @param options.rootDirectory - The project root directory on the host. Will be determined by
 *   searching up the directory tree for a `sindri.json` file if not specified. This directory is
 *   mounted into the Docker container at `/sindri/`.
 * @param options.tag - The tag of the Docker image to use. Defaults to `auto`, which will map to
 *   the `latest` tag unless a version specifier is found in `sindri.json` that supersedes it.
 * @param options.tty - Whether to use a TTY for the command. Defaults to `false` which means that
 *  the command's output will be ignored.
 *
 * @returns The exit code of the command.
 */
export async function execDockerCommand(
  command: ExternalCommand,
  args: string[] = [],
  {
    cwd = process.cwd(),
    docker = new Docker(),
    logger,
    rootDirectory,
    tag = "auto",
    tty = false,
  }: {
    cwd?: string;
    docker?: Docker;
    logger?: Logger;
    rootDirectory?: string;
    tag?: string;
    tty?: boolean;
  },
): Promise<number> {
  // Find the project root if one wasn't specified.
  const sindriJsonPath = findFileUpwards(/^sindri.json$/i, cwd);
  if (!rootDirectory) {
    if (sindriJsonPath) {
      rootDirectory = path.dirname(sindriJsonPath);
    } else {
      rootDirectory = cwd;
      logger?.warn(
        `No "sindri.json" file was found in or above "${cwd}", ` +
          `using the current directory as the project root.`,
      );
    }
  }
  rootDirectory = path.normalize(path.resolve(rootDirectory));

  // Determine the image to use.
  let image: string;
  if (command === "nargo" && tag === "auto") {
    let tag = "latest";
    if (sindriJsonPath) {
      try {
        const sindriJsonContent = await readFile(sindriJsonPath, {
          encoding: "utf-8",
        });
        const sindriJson = JSON.parse(sindriJsonContent);
        if (sindriJson.noirVersion) {
          tag = sindriJson.noirVersion;
          if (tag && !tag.startsWith("v")) {
            tag = `v${tag}`;
          }
        }
      } catch (error) {
        logger?.error(
          `Failed to parse the "${sindriJsonPath}" file, ` +
            'using the "latest" tag for the "nargo" command.',
        );
        logger?.debug(error);
      }
    } else {
      logger?.warn(
        `No "sindri.json" file was found in or above "${cwd}", ` +
          'using the "latest" tag for the "nargo" command.',
      );
    }
    image = `sindrilabs/${command}:${tag}`;
  } else if (["circomspect", "nargo"].includes(command)) {
    image = `sindrilabs/${command}:${tag === "auto" ? "latest" : tag}`;
  } else {
    throw new Error(`The command "${command}" is not supported.`);
  }

  // Pull the appropriate image.
  logger?.debug(`Pulling the "${image}" image.`);
  try {
    await new Promise((resolve, reject) => {
      docker.pull(
        image,
        (error: Error | null, stream: NodeJS.ReadableStream) => {
          if (error) {
            reject(error);
          } else {
            docker.modem.followProgress(stream, (error, result) =>
              error ? reject(error) : resolve(result),
            );
          }
        },
      );
    });
  } catch (error) {
    logger?.error(`Failed to pull the "${image}" image.`);
    logger?.error(error);
    return process.exit(1);
  }

  // Remap the root directory to its location on the host system when running in development mode.
  // This is because the development container has the project root mounted at `/sindri/`, but the
  // mounts are performed on the host system so the paths need to exist there.
  let mountDirectory: string = rootDirectory;
  if (process.env.SINDRI_DEVELOPMENT_HOST_ROOT) {
    if (rootDirectory === "/sindri" || rootDirectory.startsWith("/sindri/")) {
      mountDirectory = rootDirectory.replace(
        "/sindri",
        process.env.SINDRI_DEVELOPMENT_HOST_ROOT,
      );
      logger?.debug(
        `Remapped "${rootDirectory}" to "${mountDirectory}" for bind mount on the Docker host.`,
      );
    } else {
      logger?.fatal(
        `The root directory path "${rootDirectory}" must be under "/sindri/"` +
          'when using "SINDRI_DEVELOPMENT_HOST_ROOT".',
      );
      return process.exit(1);
    }
  }

  // Remap the current working directory to its location inside the container. If the user is in a
  // subdirectory of the project root, we need to remap the current working directory to the same
  // subdirectory inside the container.
  const relativeCwd = path.relative(rootDirectory, cwd);
  let internalCwd: string;
  if (relativeCwd.startsWith("..")) {
    internalCwd = "/sindri/";
    logger?.warn(
      `The current working directory ("${cwd}") is not under the project root ` +
        `("${rootDirectory}"), will use the project root as the current working directory.`,
    );
  } else {
    internalCwd = path.join("/sindri/", relativeCwd);
  }
  logger?.debug(
    `Remapped the "${cwd}" working directory to "${internalCwd}" in the Docker container.`,
  );

  // Run the command with the project root mounted and pipe the output to stdout.
  const data: { StatusCode: number } = await new Promise((resolve, reject) => {
    docker
      .run(
        image,
        args,
        tty ? [process.stdout, process.stderr] : devNull,
        {
          AttachStderr: tty,
          AttachStdin: tty,
          AttachStdout: tty,
          HostConfig: {
            Binds: [
              // Circuit project root.
              `${mountDirectory}:/sindri`,
              // Shared temporary directory.
              `/tmp/sindri/:/tmp/sindri/`,
            ],
          },
          OpenStdin: tty,
          StdinOnce: false,
          Tty: tty,
          WorkingDir: internalCwd,
        },
        (error, data) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        },
      )
      .on("container", (container) => {
        if (!tty) return;

        // Attach stdin/stdout/stderr if we're running in TTY mode.
        const stream = container.attach(
          {
            stream: true,
            stdin: true,
            stdout: true,
            stderr: true,
          },
          function (error: Error, stream: Duplex) {
            if (error) {
              reject(error);
            }

            // Connect stdin and stdout.
            // Note that stderr is redirected into stdout because this is the normal TTY behavior.
            stream.pipe(process.stdout);
          },
        );

        // Ensure the stream is resumed because streams start paused.
        if (stream) {
          stream.resume();
        }
      });
  });
  return data.StatusCode;
}

/**
 * Executes a command locally.
 *
 * @param command - The command to execute.
 * @param args - The arguments to pass to the command.
 * @param options - Additional options for the command.
 * @param options.cwd - The current working directory for the executed command.
 * @param options.logger - The logger to use for logging messages. There will be no logging if not
 *  specified.
 * @param options.tty - Whether to use a TTY for the command. Defaults to `false` which means that
 *  the command's output will be ignored.
 *
 * @returns The exit code of the command.
 */
export async function execLocalCommand(
  command: ExternalCommand,
  args: string[] = [],
  {
    cwd = process.cwd(),
    logger,
    tty = false,
  }: {
    cwd?: string;
    logger?: Logger;
    tty?: boolean;
  },
): Promise<number> {
  const child = spawn(command, args, {
    cwd,
    stdio: tty ? "inherit" : "ignore",
  });
  try {
    const code: number = await new Promise((resolve, reject) => {
      child.on("error", (error) => {
        reject(error);
      });
      child.on("close", (code, signal) => {
        // If the command exits with a signal (e.g. `SIGABRT`), then follow the common convention of
        // mapping this to an exit code of: 128 + (the signal number).
        if (code == null && signal != null) {
          code = 128 + os.constants.signals[signal];
        }
        assert(code != null);
        resolve(code);
      });
    });
    return code;
  } catch (error) {
    logger?.error(`Failed to execute the "${command}" command.`);
    logger?.error(error);
    return process.exit(1);
  }
}

/**
 * Checks whether or not a file (including directories) exists.
 *
 * @param filePath - The path of the file to check.
 * @returns A boolean value indicating whether the file path exists.
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    // Note that pkg has some bugs around `fs` function calls, so we can't use `access()` here.
    // See: https://github.com/vercel/pkg/issues/2020
    await fs.promises.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Recursively searches for a file in the given directory and its parent directories.
 *
 * @param filename - The name or regular expression of the file to find.
 * @param initialDirectory - The directory to start the search in.
 * @returns The fully qualified path of the first file found, or `null` if none is found.
 */
export function findFileUpwards(
  filename: string | RegExp,
  initialDirectory: string = currentDirectoryPath,
): string | null {
  // List files in the current directory.
  const files = readdirSync(initialDirectory);

  // Check if any file matches the filename.
  for (const file of files) {
    if (
      typeof filename === "string" ? file === filename : filename.test(file)
    ) {
      return path.join(initialDirectory, file);
    }
  }

  // If the parent directory is the same as the current, we've reached the root.
  const parentDirectory = path.dirname(initialDirectory);
  if (parentDirectory === initialDirectory) {
    return null;
  }

  // Recursively search in the parent directory.
  return findFileUpwards(filename, parentDirectory);
}

/**
 * Retrieves the available tags for a Docker image from DockerHub, ordered from oldest to newest.
 *
 * @param repository - The name of the Docker image repository.
 * @param username - The DockerHub username of the repository owner (default: "sindrilabs").
 *
 * @returns An array of available tags for the Docker image.
 */
export async function getDockerImageTags(
  repository: string,
  username: string = "sindrilabs",
): Promise<string[]> {
  let url: string | undefined =
    `https://hub.docker.com/v2/repositories/${username}/${repository}/tags/?page_size=1`;
  interface Result {
    last_updated: string;
    name: string;
    tag_status: string;
  }
  interface Response {
    count: number;
    next?: string;
    previous: string | null;
    results: Result[];
  }
  let results: Result[] = [];

  while (url) {
    const response: { data: Response } = await axios.get<Response>(url);

    results = results.concat(response.data.results);
    url = response.data.next; // Update the URL for the next request, or null if no more pages
  }

  return results
    .filter(({ tag_status }) => tag_status === "active")
    .filter(({ name }) => name !== "dev")
    .sort((a, b) => a.last_updated.localeCompare(b.last_updated))
    .map(({ name }) => name)
    .sort((a, b) =>
      a === "latest" ? 1 : b === "latest" ? -1 : compareVersions(a, b),
    );
}

/**
 * Determines if a string represents a truthy value.
 *
 * @param {string} str - The string to check for truthiness.
 *
 * @returns {boolean} `true` if the string represents a truthy value, otherwise `false`.
 */
export function isTruthy(str: string): boolean {
  const truthyValues = ["1", "true", "t", "yes", "y", "on"];
  return truthyValues.includes(str.toLowerCase());
}

/**
 * Loads the project's `package.json` file.
 *
 * @returns The contents of `package.json`.
 */
export function loadPackageJson(): PackageJson {
  const packageJsonPath = locatePackageJson();
  const packageJsonContent = readFileSync(packageJsonPath, {
    encoding: "utf-8",
  });
  const packageJson: PackageJson = JSON.parse(packageJsonContent);
  return packageJson;
}

/**
 * Loads the project's `sindri-manifest.json` file.
 *
 * @returns The contents of `sindri-manifest.json`.
 */
export function loadSindriManifestJsonSchema(): Schema {
  const sindriManifestJsonPath = findFileUpwards("sindri-manifest.json");
  if (!sindriManifestJsonPath) {
    throw new Error(
      "A `sindri-manifest.json` file was unexpectedly not found.",
    );
  }
  const sindriManifestJsonContent = readFileSync(sindriManifestJsonPath, {
    encoding: "utf-8",
  });
  const sindriManifestJson: Schema = JSON.parse(sindriManifestJsonContent);
  return sindriManifestJson;
}

/**
 * Locates the project's `package.json` file.
 *
 * @returns The fully qualified path to `package.json`.
 */
export function locatePackageJson(): string {
  const packageJsonPath = findFileUpwards("package.json");
  if (!packageJsonPath) {
    throw new Error("A `package.json` file was unexpectedly not found.");
  }
  return packageJsonPath;
}

/**
 * Recursively copies and populates the contents of a template directory into an output directory.
 *
 * @param templateDirectory - The path to the template directory. Can be an absolute path or a
 *     subdirectory of the `templates/` directory in the project root.
 * @param outputDirectory - The path to the output directory where the populated templates will be
 *     written.
 * @param context - The nunjucks template context.
 * @param logger - The logger to use for debug messages.
 */
export async function scaffoldDirectory(
  templateDirectory: string,
  outputDirectory: string,
  context: object,
  logger?: Logger,
): Promise<void> {
  // Normalize the paths and create the output directory if necessary.
  const fullOutputDirectory = path.resolve(outputDirectory);
  if (!(await fileExists(fullOutputDirectory))) {
    await mkdir(fullOutputDirectory, { recursive: true });
  }
  const rootTemplateDirectory = findFileUpwards("templates");
  if (!rootTemplateDirectory) {
    throw new Error("Root template directory not found.");
  }
  const fullTemplateDirectory = path.isAbsolute(templateDirectory)
    ? templateDirectory
    : path.resolve(rootTemplateDirectory, templateDirectory);
  if (!(await fileExists(fullTemplateDirectory))) {
    throw new Error(`The "${fullTemplateDirectory}" directory does not exist.`);
  }

  // Render a template using two syntaxes:
  // * hacky `templateVARIABLENAME` syntax.
  // * `nunjucks` template syntax.
  const render = (content: string, context: object): string => {
    let newContent = content;
    // Poor man's templating with `templateVARIABLENAME`:
    Object.entries(context).forEach(([key, value]) => {
      if (typeof value !== "string") return;
      newContent = newContent.replace(
        new RegExp(`template${key.toUpperCase()}`, "gi"),
        value,
      );
    });
    // Real templating:
    return nunjucks.renderString(newContent, context);
  };

  // Process the template directory recursively.
  const processPath = async (
    inputPath: string,
    outputPath: string,
  ): Promise<void> => {
    // Handle directories.
    if ((await stat(inputPath)).isDirectory()) {
      // Ensure the output directory exists.
      if (!(await fileExists(outputPath))) {
        await mkdir(outputPath, { recursive: true });
        logger?.debug(`Created directory: "${outputPath}"`);
      }
      if (!(await stat(outputPath)).isDirectory()) {
        throw new Error(`"File ${outputPath} exists and is not a directory.`);
      }

      // Process all files in the directory.
      const files = await readdir(inputPath);
      await Promise.all(
        files.map(async (file) => {
          // Render the filename so that `outputPath` always corresponds to the true output path.
          // This handles situations like `{{ circuitName }}.go` where there's a variable in the name.
          const populatedFile = render(file, context);
          await processPath(
            path.join(inputPath, file),
            path.join(outputPath, populatedFile),
          );
        }),
      );
      return;
    }

    // Handle files, rendering them and writing them out.
    const template = await readFile(inputPath, { encoding: "utf-8" });
    const renderedTemplate = render(template, context);
    await writeFile(outputPath, renderedTemplate, { encoding: "utf-8" });
    logger?.debug(`Rendered "${inputPath}" template to "${outputPath}".`);
  };
  await processPath(fullTemplateDirectory, fullOutputDirectory);
}

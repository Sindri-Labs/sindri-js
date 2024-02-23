import { constants as fsConstants, readdirSync, readFileSync } from "fs";
import { access, mkdir, readdir, readFile, stat, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import process from "process";
import { Writable } from "stream";
import { fileURLToPath } from "url";

import Docker from "dockerode";
import type { Schema } from "jsonschema";
import nunjucks from "nunjucks";
import type { PackageJson } from "type-fest";

import type { Logger } from "lib/logging";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectoryPath = path.dirname(currentFilePath);

/** A writable stream that discards all input. */
export const devNull = new Writable({
  write(_chunk, _encoding, callback) {
    callback();
  },
});

/** Executes an external command in a Docker container.
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
 * @param options.stream - The stream to write the command's output to. Defaults to discarding all
 *   output if not specified.
 * @param options.tag - The tag of the Docker image to use. Defaults to `auto`, which will map to
 *   the `latest` tag unless a version specifier is found in `sindri.json` that supersedes it.
 *
 * @returns The exit code of the command.
 */
export async function execDockerCommand(
  command: "circomspect",
  args: string[] = [],
  {
    cwd = process.cwd(),
    docker = new Docker(),
    logger,
    rootDirectory,
    stream = devNull,
    tag = "auto",
  }: {
    cwd?: string;
    docker? Docker;
    logger?: Logger;
    rootDirectory?: string;
    stream: NodeJS.WritableStream | NodeJS.WritableStream[];
    tag?: string;
  },
): Promise<number> {
  // Determine the image to use.
  const image =
    command === "circomspect"
      ? `sindrilabs/circomspect:${tag === "auto" ? "latest" : tag}`
      : null;
  if (!image) {
    throw new Error(`The command "${command}" is not supported.`);
  }

  // Find the project root if one wasn't specified.
  if (!rootDirectory) {
    const cwd = process.cwd();
    const sindriJsonPath = findFileUpwards(/^sindri.json$/i, cwd);
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

  // Run circomspect with the project root mounted and pipe the output to stdout.
  const data: { StatusCode: number } = await new Promise((resolve, reject) => {
    docker.run(
      image,
      args,
      stream,
      {
        HostConfig: {
          Binds: [
            // Circuit project root.
            `${mountDirectory}:/sindri`,
            // Shared temporary directory.
            `${os.tmpdir()}/sindri/:/tmp/sindri/`,
          ],
        },
        WorkingDir: internalCwd,
      },
      (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      },
    );
  });
  return data.StatusCode;
}

/**
 * Checks whether or not a file (including directories) exists.
 *
 * @param filePath - The path of the file to check.
 * @returns A boolean value indicating whether the file path exists.
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, fsConstants.F_OK);
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

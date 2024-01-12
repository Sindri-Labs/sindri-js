import { constants as fsConstants, readdirSync, readFileSync } from "fs";
import { access, mkdir, readdir, readFile, stat, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import type { Schema } from "jsonschema";
import nunjucks from "nunjucks";
import type { PackageJson } from "type-fest";

import { logger } from "lib/logging";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectoryPath = path.dirname(currentFilePath);

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
 */
export async function scaffoldDirectory(
  templateDirectory: string,
  outputDirectory: string,
  context: object,
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
        logger.debug(`Created directory: "${outputPath}"`);
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
    logger.debug(`Rendered "${inputPath}" template to "${outputPath}".`);
  };
  await processPath(fullTemplateDirectory, fullOutputDirectory);
}

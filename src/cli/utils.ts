import { readdirSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

import type { Schema } from "jsonschema";
import type { PackageJson } from "type-fest";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectoryPath = path.dirname(currentFilePath);

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

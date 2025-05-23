import { execSync } from "child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from "fs";
import path from "path";
import process from "process";

import { Command } from "@commander-js/extra-typings";
import { confirm, input, select } from "@inquirer/prompts";

import { scaffoldDirectory } from "cli/utils";
import sindri from "lib";

export const initCommand = new Command()
  .name("init")
  .description("Initialize a new Sindri project.")
  .argument(
    "[directory]",
    "The directory where the new project should be initialized.",
    ".",
  )
  .action(async (directory) => {
    // Prepare the directory paths.
    const directoryPath = path.resolve(directory);
    const directoryName = path.basename(directoryPath);

    // Ensure that the directory exists.
    if (!existsSync(directoryPath)) {
      mkdirSync(directoryPath, { recursive: true });
    } else if (!statSync(directoryPath).isDirectory()) {
      sindri.logger.warn(
        `File "${directoryPath}" exists and is not a directory, aborting.`,
      );
      return process.exit(1);
    }

    // Check that the directory is empty.
    const existingFiles = readdirSync(directoryPath);
    if (existingFiles.length > 0) {
      const proceed = await confirm({
        message:
          `The "${directoryPath}" directory already exists and contains files. Continuing will ` +
          "overwrite your existing files. Are you *SURE* you would like to proceed?",
        default: false,
      });
      if (!proceed) {
        sindri.logger.info("Aborting.");
        return process.exit(1);
      }
    }

    // Collect common fields.
    const circuitName = await input({
      message: "Circuit Name:",
      default: directoryName.replace(/[^-a-zA-Z0-9_]/g, "-"),
      validate: (input): boolean | string => {
        if (input.length === 0) {
          return "You must specify a circuit name.";
        }
        if (!/^[-a-zA-Z0-9_]+$/.test(input)) {
          return "Only alphanumeric characters, hyphens, and underscores are allowed.";
        }
        return true;
      },
    });
    const circuitType:
      | "circom"
      | "gnark"
      | "halo2"
      | "jolt"
      | "noir"
      | "plonky2"
      | "sp1" = await select({
      message: "Proving Framework:",
      default: "circom",
      choices: [
        { name: "Circom", value: "circom" },
        { name: "Gnark", value: "gnark" },
        { name: "Halo2", value: "halo2" },
        { name: "Jolt", value: "jolt" },
        { name: "Noir", value: "noir" },
        { name: "Plonky2", value: "plonky2" },
        { name: "SP1", value: "sp1" },
      ],
    });
    const context: object = { circuitName, circuitType };
    let templateDirectory: string = circuitType;

    // Handle individual circuit types.
    if (circuitType === "circom") {
      // Circom.
      const provingScheme: "groth16" = await select({
        message: "Proving Scheme:",
        default: "groth16",
        choices: [{ name: "Groth16", value: "groth16" }],
      });
      const curveName: "bn254" = await select({
        message: "Curve Name:",
        default: "bn254",
        choices: [{ name: "BN254", value: "bn254" }],
      });
      const witnessCompiler: "c++" | "wasm" = await select({
        message: "Witness Compiler:",
        default: "c++",
        choices: [
          { name: "C++", value: "c++" },
          { name: "Wasm", value: "wasm" },
        ],
      });
      Object.assign(context, {
        curveName,
        provingScheme,
        witnessCompiler,
      });
    } else if (circuitType === "gnark") {
      // Gnark.
      const packageName = await input({
        message: "Go Package Name:",
        default: circuitName
          .replace(/[^a-zA-Z0-9]/g, "")
          .replace(/^[^a-z]*/g, ""),
        validate: (input): boolean | string => {
          if (input.length === 0) {
            return "You must specify a package name.";
          }
          if (!/^[a-z][a-z0-9]*$/.test(input)) {
            return (
              "Package names must begin with a lowercase letter and only be followed by " +
              "alphanumeric characters."
            );
          }
          return true;
        },
      });
      const provingScheme: "groth16" | "plonk" = await select({
        message: "Proving Scheme:",
        default: "groth16",
        choices: [
          { name: "Groth16", value: "groth16" },
          { name: "PlonK", value: "plonk" },
        ],
      });
      const curveName:
        | "bn254"
        | "bls12-377"
        | "bls12-381"
        | "bls24-315"
        | "bw6-633"
        | "bw6-761" = await select({
        message: "Curve Name:",
        default: "bn254",
        choices: [
          { name: "BN254", value: "bn254" },
          { name: "BLS12-377", value: "bls12-377" },
          { name: "BLS12-381", value: "bls12-381" },
          { name: "BLS24-315", value: "bls24-315" },
          { name: "BW6-633", value: "bw6-633" },
          { name: "BW6-761", value: "bw6-761" },
        ],
      });
      const gnarkCurveName = curveName.toUpperCase().replace("-", "_");
      Object.assign(context, {
        curveName,
        gnarkCurveName,
        packageName,
        provingScheme,
      });
    } else if (circuitType === "halo2") {
      // Halo2.
      const halo2Version: "axiom-v0.3.0" | "pse-v0.3.0" = await select({
        message: "Halo2 Base Version:",
        default: "axiom-v0.3.0",
        choices: [
          { name: "Axiom v0.3.0", value: "axiom-v0.3.0" },
          { name: "PSE v0.3.0", value: "pse-v0.3.0" },
        ],
      });
      const packageName = await input({
        message: "Halo2 Package Name:",
        default: circuitName
          .toLowerCase()
          .replace(/[^a-z0-9_]+/, "_")
          .replace(/_+/g, "_")
          .replace(/-+/g, "-"),
        validate: (input): boolean | string => {
          if (input.length === 0) {
            return "You must specify a package name.";
          }
          if (!/^[a-z0-9_]+(?:-[a-z0-9_]+)*$/.test(input)) {
            return (
              "Package names must begin with a lowercase letter, number, or underscore, and only " +
              "be followed by lowercase or numeric characters and underscores (optionally " +
              "separated by hyphens)."
            );
          }
          return true;
        },
      });
      // Collect `degree` as a positive integer.
      const degree: number = parseInt(
        await input({
          message: "Degree:",
          default: "13",
          validate: (input): boolean | string => {
            if (input.length === 0) {
              return "You must specify a degree.";
            }
            if (!/^[1-9]\d*$/.test(input)) {
              return "Degree must be a positive integer.";
            }
            return true;
          },
        }),
        10,
      );
      const threadBuilder: "GateThreadBuilder" | undefined =
        halo2Version === "axiom-v0.3.0"
          ? await select({
              message: "Halo2 Base Version:",
              default: "GateThreadBuilder",
              choices: [
                { name: "Gate Thread Builder", value: "GateThreadBuilder" },
              ],
            })
          : undefined;
      // Return the circuit path, depending on the halo2Version field
      const circuitPath:
        | "::circuit::EqualCircuit"
        | "::circuit_def::CircuitInput" =
        halo2Version !== "axiom-v0.3.0"
          ? "::circuit::EqualCircuit"
          : "::circuit_def::CircuitInput";
      // Replace hyphens with underscores in the package name.
      const className = `${packageName.replace(/-/g, "_")}${circuitPath}`;
      templateDirectory = `${templateDirectory}/${halo2Version}`;

      Object.assign(context, {
        className,
        halo2Version,
        degree,
        packageName,
        threadBuilder,
      });
    } else if (circuitType === "jolt") {
      // Jolt.
      const packageName = await input({
        message: "Jolt Package Name:",
        default: circuitName
          .toLowerCase()
          .replace(/[^a-z0-9_]+/, "_")
          .replace(/_+/g, "_")
          .replace(/-+/g, "-"),
        validate: (input): boolean | string => {
          if (input.length === 0) {
            return "You must specify a package name.";
          }
          if (!/^[a-z0-9_]+(?:-[a-z0-9_]+)*$/.test(input)) {
            return (
              "Package names must begin with a lowercase letter, number, or underscore, and only " +
              "be followed by lowercase or numeric characters and underscores (optionally " +
              "separated by hyphens)."
            );
          }
          return true;
        },
      });
      const commitmentScheme: "hyperkzg" | "zeromorph" = await select({
        message: "Commitment Scheme:",
        default: "hyperkzg",
        choices: [
          { name: "HyperKZG", value: "hyperkzg" },
          { name: "Zeromorph", value: "zeromorph" },
        ],
      });
      const stdEnabled: boolean = await confirm({
        message: "Use Rust standard library:",
        default: true,
      });
      Object.assign(context, {
        commitmentScheme,
        packageName,
        stdEnabled,
      });
    } else if (circuitType === "noir") {
      const packageName = await input({
        message: "Noir Package Name:",
        default: circuitName
          .toLowerCase()
          .replace(/[- ]/g, "_")
          .replace(/[^a-zA-Z0-9_]+/, "")
          .replace(/_+/g, "_"),
        validate: (input): boolean | string => {
          if (input.length === 0) {
            return "You must specify a package name.";
          }
          if (!/^[a-zA-Z0-9_]+$/.test(input)) {
            return "Package names must only contain alphanumeric characters and underscores.";
          }
          return true;
        },
      });
      const noirVersion: "0.17.0" | "0.18.0" | "0.19.4" | "0.22.0" | "0.23.0" =
        await select({
          message: "Noir Version:",
          default: "0.23.0",
          choices: [
            { name: "0.17.0", value: "0.17.0" },
            { name: "0.18.0", value: "0.18.0" },
            { name: "0.19.4", value: "0.19.4" },
            { name: "0.22.0", value: "0.22.0" },
            { name: "0.23.0", value: "0.23.0" },
          ],
        });
      const provingScheme: "barretenberg" = await select({
        message: "Proving Scheme:",
        default: "barretenberg",
        choices: [{ name: "Barretenberg", value: "barretenberg" }],
      });
      Object.assign(context, {
        packageName,
        noirVersion,
        provingScheme,
      });
    } else if (circuitType === "plonky2") {
      const packageName = await input({
        message: "Plonky2 Package Name:",
        default: circuitName
          .toLowerCase()
          .replace(/[^a-z0-9_]+/, "_")
          .replace(/_+/g, "_")
          .replace(/-+/g, "-"),
        validate: (input): boolean | string => {
          if (input.length === 0) {
            return "You must specify a package name.";
          }
          if (!/^[a-z0-9_]+(?:-[a-z0-9_]+)*$/.test(input)) {
            return (
              "Package names must begin with a lowercase letter, number, or underscore, and only " +
              "be followed by lowercase or numeric characters and underscores (optionally " +
              "separated by hyphens)."
            );
          }
          return true;
        },
      });
      const structName = await input({
        message: "Full path to circuit struct:",
        default: "Circuit",
        validate: (input): boolean | string => {
          if (!/^[A-Z][A-Za-z0-9_]*$/.test(input)) {
            return (
              "Struct name must begin with an uppercase letter and contain only " +
              "alphanumeric characters and underscores."
            );
          }
          return true;
        },
      });
      const plonky2Version: "0.2.0" | "0.2.1" | "0.2.2" = await select({
        message: "Plonky2 Version:",
        default: "0.2.2",
        choices: [
          { name: "0.2.0", value: "0.2.0" },
          { name: "0.2.1", value: "0.2.1" },
          { name: "0.2.2", value: "0.2.2" },
        ],
      });
      Object.assign(context, {
        packageName,
        plonky2Version,
        structName,
      });
    } else if (circuitType === "sp1") {
      const provingScheme: "core" | "compressed" | "groth16" | "plonk" =
        await select({
          message: "Proving Scheme:",
          default: "groth16",
          choices: [
            { name: "Compressed", value: "compressed" },
            { name: "Core", value: "core" },
            { name: "Groth16", value: "groth16" },
            { name: "Plonk", value: "plonk" },
          ],
        });
      Object.assign(context, {
        provingScheme,
      });
    } else {
      sindri.logger.fatal(`Sorry, ${circuitType} is not yet supported.`);
      return process.exit(1);
    }

    // Perform the scaffolding.
    sindri.logger.info(
      `Proceeding to generate scaffolded project in "${directoryPath}".`,
    );
    await scaffoldDirectory("common", directoryPath, context, sindri.logger);
    await scaffoldDirectory(
      templateDirectory,
      directoryPath,
      context,
      sindri.logger,
    );
    // We use this in `common` right now to keep the directory tracked, we can remove this once we
    // add files there.
    const gitKeepFile = path.join(directoryPath, ".gitkeep");
    if (existsSync(gitKeepFile)) {
      rmSync(gitKeepFile);
    }
    sindri.logger.info("Project scaffolding successful.");

    // Install dependencies.
    if (circuitType === "circom") {
      let npmInstalled: boolean = false;
      try {
        execSync("npm --version");
        npmInstalled = true;
      } catch {
        sindri.logger.warn(
          "NPM is not installed, cannot install circomlib as a dependency. " +
            "You will need to install NPM and run `npm install` yourself.",
        );
      }
      if (npmInstalled) {
        sindri.logger.info("Installing circomlib.");
        execSync("npm install", { cwd: directoryPath });
      }
    }

    // Optionally, initialize a git repository.
    let gitInstalled: boolean = false;
    try {
      execSync("git --version");
      gitInstalled = true;
    } catch {
      sindri.logger.debug(
        "Git is not installed, skipping git initialization questions.",
      );
    }
    const gitAlreadyInitialized = existsSync(path.join(directoryPath, ".git"));
    if (gitInstalled && !gitAlreadyInitialized) {
      const initializeGit = await confirm({
        message: `Would you like to initialize a git repository in "${directoryPath}"?`,
        default: true,
      });
      if (initializeGit) {
        sindri.logger.info(
          `Initializing git repository in "${directoryPath}".`,
        );
        try {
          execSync("git init .", { cwd: directoryPath });
          execSync("git add .", { cwd: directoryPath });
          execSync("git commit -m 'Initial commit.'", { cwd: directoryPath });
          sindri.logger.info("Successfully initialized git repository.");
        } catch (error) {
          sindri.logger.error(
            "Error occurred while initializing the git repository.",
          );
          // Node.js doesn't seem to have a typed version of this error, so we assert it as
          // something that's at least in the right ballpark.
          const execError = error as NodeJS.ErrnoException & {
            output: Buffer | string;
            stderr: Buffer | string;
            stdout: Buffer | string;
          };
          // The output is a really long list of numbers because it's a buffer, so truncate it.
          const noisyKeys: Array<"output" | "stderr" | "stdout"> = [
            "output",
            "stderr",
            "stdout",
          ];
          noisyKeys.forEach((key) => {
            if (key in execError) {
              execError[key] = "<truncated>";
            }
          });
          sindri.logger.error(execError);
        }
      }
    }
  });

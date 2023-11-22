#! /usr/bin/env node
import { argv } from "process";

import { Command } from "@commander-js/extra-typings";

import { loginCommand } from "cli/login";
import { whoamiCommand } from "cli/whoami";

const program = new Command()
  .name("sindri")
  .description("The Sindri CLI client.")
  .version(process.env.npm_package_version ?? "0.0.0")
  .addCommand(loginCommand)
  .addCommand(whoamiCommand);

program.parse(argv);

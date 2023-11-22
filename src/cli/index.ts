#! /usr/bin/env node
import process from "process";

import { Command } from "@commander-js/extra-typings";

import { loginCommand } from "cli/login";
import { whoamiCommand } from "cli/whoami";

const program = new Command()
  .name("sindri")
  .description("The Sindri CLI client.")
  .version("1.0.0") // TODO: Pull this in for real.
  .addCommand(loginCommand)
  .addCommand(whoamiCommand);

program.parse(process.argv);

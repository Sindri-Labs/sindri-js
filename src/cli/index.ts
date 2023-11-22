#! /usr/bin/env node
import process from "process";

import { Command } from "@commander-js/extra-typings";

import { loginCommand } from "cli/login";

const program = new Command()
  .name("sindri")
  .description("The Sindri CLI client.")
  .version("1.0.0") // TODO: Pull this in for real.
  .addCommand(loginCommand);

program.parse(process.argv);

#! /usr/bin/env node
import { Command } from "@commander-js/extra-typings";
import process from "process";

const loginCommand = new Command()
  .name("login")
  .description("Authorize the client.")
  .action(() => {
    console.log("hey");
  });

const program = new Command()
  .name("sindri")
  .description("The Sindri CLI client.")
  .version("1.0.0") // TODO: Pull this in for real.
  .addCommand(loginCommand);

program.parse(process.argv);

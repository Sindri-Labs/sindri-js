import os from "os";

import axios from "axios";
import chalk from "chalk";
import { Command } from "@commander-js/extra-typings";
import { input, password as passwordInput, select } from "@inquirer/prompts";

import { config } from "cli/config";
import { AuthorizationService, InternalService, TokenService } from "lib/api";

export const loginCommand = new Command()
  .name("login")
  .description("Authorize the client.")
  .action(async () => {
    // Collect details for generating an API key.
    const username = await input({ message: "Username:" });
    const password = await passwordInput({ mask: true, message: "Password:" });
    const name = await input({
      default: `${os.hostname()}-sdk`,
      message: "Key Name:",
    });

    // Generate an API key for one of their teams.
    try {
      // Generate a JWT token to authenticate the user.
      const tokenResult = await TokenService.bf740E1AControllerObtainToken({
        username,
        password,
      });
      axios.defaults.headers.common = {
        Authorization: `Bearer ${tokenResult.access}`,
      };

      // Fetch their teams and have the user select one.
      const userResult = await InternalService.userMeWithJwtAuth();
      const teamId = await select({
        message: "Select a Team:",
        choices: userResult.teams.map(({ id, slug }) => ({
          name: slug,
          value: id,
        })),
      });
      const team = userResult.teams.find((team) => team.id === teamId);
      if (!team) {
        throw new Error("No team selected.");
      }

      // Generate an API key.
      const result = await AuthorizationService.apikeyGenerate({
        username,
        password,
        name,
      });
      const apiKey = result.api_key;
      if (!apiKey) {
        throw new Error("Error generating API key.");
      }

      // Store the new auth information.
      config.update({ auth: { apiKey, teamId, teamSlug: team.slug } });
      console.log(
        chalk.green(
          "You have successfully authorized the client with your Sindri account.",
        ),
      );
    } catch (error) {
      console.error(chalk.red("Something went wrong."));
      console.error(error);
    }
  });

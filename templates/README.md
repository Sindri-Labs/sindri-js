# Project Scaffolding Templates

Each directory here corresponds to a project scaffold where the directory name corresponds to the `circuitName` variable collected when using the `sindri init` command.
Any file under the `{{ circuitType }}` directory will be copied into the destination directory as a rendered template.
The templating rendering includes file names, directory names, and the contents of each file.
There are two templating mechanisms that are applied.

1. Any [`nunjucks`](https://mozilla.github.io/nunjucks/) templating will be applied, again in both filenames and file contents.
   This includes variable substitution as well as more sophisticated features like conditional logic or loops.
2. Any `templateVariableName` string in a case-insensitive search will be replaced if the `context` variable is a string.
   This pass exists so that variables can be used without breaking code formatting, LSP completion, and other helpful editor features that don't play nicely with `{{ variableName }}` syntax.
   It should only be used if you run into issues with the nunjucks templates, and camelCase names like `templateCircuitName` should be preferred unless there's a reason to do otherwise.

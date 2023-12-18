# Sindri CLI

[![Build](https://img.shields.io/github/actions/workflow/status/Sindri-Labs/sindri-js/ci.yaml)](https://github.com/Sindri-Labs/sindri-js/actions)
[![License](https://img.shields.io/npm/l/sindri?color=blue)](https://github.com/Sindri-Labs/sindri-js/blob/main/LICENSE.md)
[![Version](https://img.shields.io/npm/v/sindri)](https://www.npmjs.com/package/sindri)

<img src="./media/sindri-gradient-logo.webp" height="160" align="right"/>

#### [Quickstart](https://sindri-labs.github.io/docs/getting-started/cli/) | [Reference Docs](https://sindri-labs.github.io/docs/reference/cli/) | [Development](#development)

> Sindri is a platform that makes compiling Zero-Knowledge Proof circuits in any framework and generating proofs with full GPU acceleration as easy and scalable as AWS Lambda.
> The CLI tool offers an easy and intuitive interface for iterative circuit development and deployment that will feel very familiar to anyone who has used Docker, Git, Heroku, or NPM.

For more information about the Sindri platform, please check out [sindri.app](https://sindri.app/).
The best way to get started with the Sindri CLI is to begin with the [Sindri CLI Quickstart](https://sindri-labs.github.io/docs/getting-started/cli/) and to then refer to the [Sindri CLI Reference Docs](https://sindri-labs.github.io/docs/reference/cli/) for more detailed information about the CLI commands and options.

#### Why Should I Use Sindri?

Sindri makes it easy to develop circuits in the framework of your choice, and to deploy them in a highly scalable and cost-effective way.
You only pay for what you use, and you can scale up to thousands of GPUs in seconds.
Our public circuit registry also makes it easy to share and reuse circuits, so you can build off of circuits that have already been audited and battle tested even if they're written in a different framework than the one you're using.

## Installation

The Sindri CLI tool is available as an NPM package and can be installed with the following command:

```bash
npm install -g sindri@latest
```

See the [Sindri CLI Quickstart](https://sindri-labs.github.io/docs/getting-started/cli/) for more information about installing and configuring the CLI tool.

## Development

### Using Docker

Most of the project commands should be relatively easy to run natively on any system with node and Yarn v1 installed, but a Docker Compose configuration is provided as a convenience.
In addition to ensuring that the proper dependencies are available, the container is also configured to install the package globally as a symbolic link with `npm link` and automatically rebuild it whenever files change.
This means that the `sindri` command inside the container should always reflect your local code changes.

You can bring the container up in the usual way.

```bash
docker compose up
```

This will install the latest packages and start the build process in watch mode so that it rebuilds whenever local files change.

To drop into a shell in the running container, you can run the following.

```bash
docker compose exec sindri-js bash
```

From here, you can use the `sindri` command or run any of the Yarn invocations for linting, formatting, etc.

#### Integrating With Local Development Server

Inside of the Docker container, you can run

```bash
sindri -d login -u http://host.docker.internal login
```

to authenticate against a Sindri development backend running locally on port 80.
Both your credentials and the local base URL for the server will be stored in `sindri.conf.json` and used in subsequent requests.

### Installing Dependencies

To install the project dependencies:

```bash
yarn install
```

### Building

#### Development Build

To run the build process in development mode and watch for file changes:

```bash
yarn build:watch
```

This command will run automatically in the container if you're using Docker Compose.

#### Production Build

To perform a production build with minified outputs:

```bash
yarn build
```

### Updating the API Client

This will fetch the latest OpenAPI schema for the Sindri API and autogenerate an updated API client in [`src/lib/api/`](src/lib/api/).

```bash
yarn generate-api
```

To develop against unreleased API features, you can use these variants to target a local development server:

```bash
# If you're not using Docker:
yarn generate-api:dev

# Or...

# If you are using Docker:
yarn denerate-api:docker
```

### Updating Sindri Manifest JSON Schema

The Sindri Manifest JSON Schema is stored in [`sindri-manifest.json`](sindri-manifest.json) and needs to be manually updated and committed when the schema changes.
The file can be updated by running:

```bash
yarn download-sindri-manifest-schema
```

To develop against an unreleased version of the schema, you can use these variants to target a local development server:

```bash
# If you're not using Docker:
yarn download-sindri-manifest-schema:dev

# Or...

# If you are using Docker:
yarn download-sindri-manifest-schema:docker
```

### Linting

To lint the project with Eslint and Prettier:

```bash
yarn lint
```

This check will already run on CI.

### Formatting

To reformat the project using Prettier:

```bash
yarn format
```

### Type Checking

To check the TypeScript types:

```bash
yarn type-check
```

This check will already run on CI.

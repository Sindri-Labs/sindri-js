# Sindri CLI and TypeScript SDK

[![Build](https://img.shields.io/github/actions/workflow/status/Sindri-Labs/sindri-js/ci.yaml)](https://github.com/Sindri-Labs/sindri-js/actions)
[![License](https://img.shields.io/npm/l/sindri?color=blue)](https://github.com/Sindri-Labs/sindri-js/blob/main/LICENSE.md)
[![Version](https://img.shields.io/npm/v/sindri)](https://www.npmjs.com/package/sindri)

<img src="https://github.com/Sindri-Labs/sindri-js/blob/487fb8a7fd5e0e3147a46eafb72ca89a06fe7540/media/sindri-gradient-logo.webp" height="160" align="right"/>

#### [CLI Quickstart](https://sindri-labs.github.io/docs/getting-started/cli/) | [CLI Docs](https://sindri-labs.github.io/docs/reference/cli/) | [SDK Quickstart](https://sindri-labs.github.io/docs/getting-started/typescript-sdk/) | [SDK Docs](https://sindri.app/docs/reference/sdk/ts/classes/SindriClient/) | [Development](#development)

> Sindri is a platform that makes compiling Zero-Knowledge Proof circuits in any framework and generating proofs with full GPU acceleration as easy and scalable as serverless platforms like AWS Lambda.
> The CLI tool offers an easy and intuitive interface for circuit development and deployment that will feel very familiar to anyone who has used Docker, Git, Heroku, or NPM.

For more information about the Sindri platform, please check out [sindri.app](https://sindri.app/).
The best way to get started with the Sindri CLI is to begin with the [Sindri CLI Quickstart](https://sindri-labs.github.io/docs/getting-started/cli/) and to then refer to the [Sindri CLI Reference Docs](https://sindri-labs.github.io/docs/reference/cli/) for more detailed information about the CLI commands and options.
For the TypeScript SDK, you can similarly check out the [TypeScript SDK Quickstart](https://sindri-labs.github.io/docs/getting-started/typescript-sdk/) and the [TypeScript SDK Reference Docs](https://sindri-labs.github.io/docs/reference/sdk/ts/classes/SindriClient/).

#### Why Should I Use Sindri?

Sindri makes it easy to develop circuits in the framework of your choice, and to deploy them in a highly scalable and cost-effective way.
You only pay for what you use, and you can scale up to thousands of GPUs in seconds.
Our public circuit registry also makes it easy to share and reuse circuits, so you can build off of circuits that have already been audited and battle tested even if they're written in a different framework than the one you're using.

## Using the Sindri CLI

This section provides the essentials to get started with the CLI.
The [Sindri CLI Quickstart](https://sindri-labs.github.io/docs/getting-started/cli/) goes into more detail on each of these steps and is the recommended way to get started.

### Installation

The Sindri CLI tool is available as an NPM package and can be installed with the following command:

```bash
npm install -g sindri@latest
```

### Authentication

To compile circuits on Sindri, you'll need to have an account and authenticate the CLI to use it.
Visit [sindri.app](https://sindri.app/) to find more details about account creation.
You can then use the [`sindri login`](https://sindri.app/docs/reference/cli/login/) command to create a machine-local API key that will be used for subsequent commands.

```bash
sindri login
```

### Circuit Project Creation

The Sindri CLI provides a project scaffolding tool to help you get started with circuit development.
The [`sindri init`](https://sindri.app/docs/reference/cli/init/) command will initialize a new circuit project for you with everything you need to get started.

```bash
sindri init my-circuit
```

### Linting Circuits

You can run [`sindri lint`](https://sindri.app/docs/reference/cli/lint/) from within your circuit project directory to perform local checks to ensure your circuit is valid and ready for compilation.
This will not actually compile your circuit, but will perform basic checks to uncover issues that would prevent your circuit from compiling successfully.

```bash
sindri lint
```

### Circuit Compilation

To compile your circuit on the Sindri platform, you can use the [`sindri deploy`](https://sindri.app/docs/reference/cli/deploy/) command to upload and compile it.
If there are compilation errors, they will be reported, and the command will exit with a non-zero exit code.

```bash
sindri deploy
```

### Proof Generation

You can use the [`sindri proof create`](https://sindri.app/docs/reference/cli/proof/create/) command to create a new proof for your circuit.

```bash
sindri proof create --input proof-input.json
```

## Using the TypeScript SDK

This section provides the essentials to get started with the TypeScript SDK.
The SDK is fully compatible with both TypeScript and JavaScript, NodeJS and browser environments, and CommonJS and ES Module import systems.
For more detailed information about getting started, please take a look at the [TypeScript SDK Quickstart](https://sindri-labs.github.io/docs/getting-started/typescript-sdk/) and the [TypeScript SDK Reference Docs](https://sindri-labs.github.io/docs/reference/sdk/ts/classes/SindriClient/).

### Installation

The TypeScript SDK is provided by the same [sindri](https://www.npmjs.com/package/sindri) package that provides the CLI tool.
You can add it to your project by running.

```bash
npm install sindri@latest
```

### Authentication

When you run `sindri login`, a machine-local API key will automatically be stored in a config file in your home directory and used for authentication with both the CLI and the SDK.
You can alternatively set a `SINDRI_API_KEY` environment variable to override this, or specify an API key manually when authorizing the client.
Visit [https://sindri.app/signup/](https://sindri.app/signup/) to create an account first and [https://sindri.app/z/me/page/settings/api-keys](https://sindri.app/z/me/page/settings/api-keys) to create an API key.

```typescript
import sindri from "sindri";

sindri.authorize({ apiKey: "my-key-here" });
```

### Circuit Compilation

You can use the [`SindriClient.createCircuit()`](https://sindri.app/docs/reference/sdk/ts/classes/SindriClient/#createcircuit) method to compile a new version of a circuit.

```typescript
import sindri from "sindri";

// Compile the circuit in the `/path/to/my/circuit/` directory.
const circuit = await sindri.createCircuit("/path/to/my/circuit/");
```

### Proof Generation

You can use the [`SindriClient.proveCircuit()`](https://sindri.app/docs/reference/sdk/ts/classes/SindriClient/#provecircuit) method to generate a proof for a circuit.

```typescript
import sindri from "sindri";

const circuitIdentifier = "my-circuit";
const proofInput = JSON.stringify({ X: 5, Y: 32 });
const proof = await sindri.proveCircuit(circuitIdentifier, proofInput);
```

## Development

### Using Docker

Most of the project commands should be relatively easy to run natively on any system with node and npm installed, but a Docker Compose configuration is provided as a convenience.
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

From here, you can use the `sindri` command or run any of the npm script invocations for linting, formatting, etc.

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
npm install
```

### Building

#### Development Build

To run the build process in development mode and watch for file changes:

```bash
npm run build:watch
```

This command will run automatically in the container if you're using Docker Compose.

#### Production Build

To perform a production build with minified outputs:

```bash
npm run build
```

### Testing

#### Test Production Builds

The test suite can be run with:

```bash
npm run test
```

This will first build the project and then run the tests against the build outputs using pre-recorded fixtures for network requests.
To skip the build step, you can use `npm run test:fast`.

#### Test Watcher

In development, you can use

```bash
npm run test:watch
```

to rebuild the project and rerun the tests whenever there are code changes.
Additionally, this command will allow network requests without fixtures to go through, so this is useful when writing new tests.

#### Recording Test Fixtures

This command will build the project and record new fixtures for all network requests.

```bash
npm run test:record
```

You will need to have your environment authenticated with an API key for the "Sindri CLI/SDK Testing Team" organization on [Sindri](https://sindri.app) in order to make the necessary network requests for recording fixtures.
The credentials stored by `sindri login` will be used automatically for the tests.

### Updating the API Client

This will fetch the latest OpenAPI schema for the Sindri API and autogenerate an updated API client in [`src/lib/api/`](src/lib/api/).

```bash
npm run generate-api
```

To develop against unreleased API features, you can use these variants to target a local development server:

```bash
# If you're not using Docker:
npm run generate-api:dev

# Or...

# If you are using Docker:
npm run generate-api:docker
```

You can also generate against stage with:

```bash
npm run generate-api:stage
```

### Updating Sindri Manifest JSON Schema

The Sindri Manifest JSON Schema is stored in [`sindri-manifest.json`](sindri-manifest.json) and needs to be manually updated and committed when the schema changes.
The file can be updated by running:

```bash
npm run download-sindri-manifest-schema
```

To develop against an unreleased version of the schema, you can use these variants to target a local development server:

```bash
# If you're not using Docker:
npm run download-sindri-manifest-schema:dev

# Or...

# If you are using Docker:
npm run download-sindri-manifest-schema:docker
```

### Linting

To lint the project with Eslint and Prettier:

```bash
npm run lint
```

This check will already run on CI.

### Formatting

To reformat the project using Prettier:

```bash
npm run format
```

### Type Checking

To check the TypeScript types:

```bash
npm run type-check
```

This check will already run on CI.

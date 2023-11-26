# Sindri SDK

The Sindri JavaScript SDK.
Please see [Sindri.app](https://sindri.app) for more details.

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

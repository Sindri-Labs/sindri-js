FROM node:18.19.0-slim as development
ENV NODE_ENV=development

# Optionally convert the user to another UID/GUID to match host user file permissions.
ARG GID=1000
ARG UID=1000
RUN if [ "$GID" != "1000" ]; then \
        if getent group $GID; then groupdel $(getent group $GID | cut -d: -f1); fi && \
        groupmod -g $GID node && \
        (find / -group 1000 -exec chgrp -h $GID {} \; || true) \
    ; fi
RUN if [ "$UID" != "1000" ]; then \
        usermod -u $UID node && \
        (find / -user 1000 -exec chgrp -h $UID {} \; || true) \
    ; fi

RUN apt-get update
RUN apt-get install --yes git jq python3 \
    `# Chromium installation dependencies` \
    curl unzip \
    `# Chromium runtime dependencies` \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libgbm1 libasound2 libpangocairo-1.0-0 libxss1 libgtk-3-0

USER node
WORKDIR /sindri/

# Conditionally install an arm64 build of Chromium for Puppeteer if we're on an arm64 host.
# This prevents us from having to emulate x86_64 on arm Macs during development to run browser tests.
# See:
# * https://github.com/puppeteer/puppeteer/issues/7740#issuecomment-1875162960
# * https://pptr.dev/chromium-support - Puppeteer version compatibility with Chromium.
# * https://github.com/microsoft/playwright/commits/main/ - Playwright Chromium versions added in commits.
RUN if [ "$(uname -m)" = "aarch64" ]; then \
      cd /home/node/ && \
      curl 'https://playwright.azureedge.net/builds/chromium/1129/chromium-linux-arm64.zip' > chromium.zip && \
      unzip chromium.zip && \
      rm -f chromium.zip && \
      echo 'export PUPPETEER_SKIP_DOWNLOAD=true' >> ~/.bashrc && \
      echo 'export CHROME_PATH=/home/node/chrome-linux/chrome' >> ~/.bashrc && \
      echo 'export PUPPETEER_EXECUTABLE_PATH=/home/node/chrome-linux/chrome' >> ~/.bashrc; \
    fi
# Manually install Puppeteer to install Chrome into ~/.cache/puppeteer/ on amd64.
# This should install automatically when the container starts, but it doesn't for some reason.
# It doesn't hurt to cache it in the image anyway, it cuts down on startup time.
COPY --chown=node:node ./package.json ./package-lock.json /sindri/
RUN if [ "$(uname -m)" != "aarch64" ]; then \
      export PUPPETEER_VERSION="$(jq -r '.packages["node_modules/puppeteer"].version' package-lock.json)"; \
      export TEMP_DIRECTORY="$(mktemp -d)"; \
      cd "$TEMP_DIRECTORY"; \
      npm install "puppeteer@${PUPPETEER_VERSION}"; \
      cd -; \
      rm -rf "$TEMP_DIRECTORY"; \
      rm -rf ~/.npm/*; \
    fi

# Skip installing any node dependencies (other than maybe Puppeteer) because we're going
# to bind mount over `node_modules` anyway. We'll also do a volume mount to persist the npm cache.
RUN mkdir -p ~/.npm/

# Set up npm to use a non-root directory for global packages.
RUN mkdir -p ~/.npm-global && \
    npm config set prefix '~/.npm-global' && \
    echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc

# Set up bash completion for npm.
RUN npm completion >> ~/.bashrc && \
    echo '# Do not split words on colons in completion:' >> ~/.bashrc && \
    echo 'export COMP_WORDBREAKS=${COMP_WORDBREAKS//:}' >> ~/.bashrc

# Link the `sindri-js` project.
# We need at least `package.json` and a stub for the CLI to create the symlinks,
# then we'll bind mount over this with the real project at runtime with docker compose.
# Running `npm link` requires `patch-package` to be in the PATH as a `postinstall` script,
# so we create a small stub script to satisfy this requirement and then delete it.
RUN mkdir -p dist/cli/ && \
    touch dist/cli/index.js && \
    chmod u+x dist/cli/index.js && \
    echo "#! /bin/sh" > patch-package && \
    chmod u+x patch-package && \
    export PATH="./:$PATH" && \
    npm link && \
    rm patch-package

CMD ["/bin/sh", "-c", "npm install && npm run build:watch"]

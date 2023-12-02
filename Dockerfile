FROM node:hydrogen-slim as development
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
RUN apt-get install --yes git

USER node

# Skip installing any node dependencies because we're going to bind mount over `node_modules` anyway.
# We'll also do a volume mount to persist the yarn cache.
RUN mkdir -p ~/.cache/yarn

# Set up npm to use a non-root directory for global packages.
RUN mkdir -p ~/.npm-global && \
    npm config set prefix '~/.npm-global' && \
    echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc

WORKDIR /sindri/

# Link the `sindri-js` project.
# We need at least `package.json` and a stub for the CLI to create the symlinks,
# then we'll bind mount over this with the real project at runtime with docker compose.
COPY ./package.json /sindri/package.json
RUN mkdir -p dist/cli/ && \
    touch dist/cli/index.js && \
    chmod u+x dist/cli/index.js && \
    npm link

CMD ["/bin/sh", "-c", "yarn install && yarn build:watch"]

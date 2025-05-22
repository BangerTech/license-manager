# backend/Dockerfile

# Use an official Node.js runtime as a parent image
FROM node:18-alpine AS base

WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# Install dependencies in a separate layer to leverage Docker cache
FROM base AS dependencies
RUN npm install --omit=dev

# Copy application source code
FROM base AS build
COPY . .
RUN npm install # Install all dependencies including dev for potential build steps if any

# Production image: copy only necessary files from previous stages
FROM base AS production
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app ./

# Expose the port the app runs on
EXPOSE 4000

# Define the command to run your app
CMD [ "node", "server.js" ] 
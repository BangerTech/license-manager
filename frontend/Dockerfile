# frontend/Dockerfile

# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Set the build-time environment variable for the API URL
# This will be overridden by the runtime environment variable in docker-compose.yml if set
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

# Build the React application
RUN npm run build

# Stage 2: Serve the built application using a lightweight web server (nginx)
FROM nginx:1.25-alpine

# Copy the built static files from the build stage to nginx's web root
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (nginx default)
EXPOSE 80

# Start nginx when the container launches
CMD ["nginx", "-g", "daemon off;"] 
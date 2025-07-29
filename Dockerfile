# Stage 1: Build the React application
FROM node:18 AS build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json ./
COPY package-lock.json ./

# Install dependencies
RUN npm cache clean --force && npm install

# Copy the rest of the application source code
COPY . .

# Build the application
RUN npm run build

# Clear npm and build cache
RUN npm cache clean --force

# Stage 2: Serve the application using Nginx
FROM nginx:stable-alpine

# Remove any existing files and copy the built application from the build stage
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/build /usr/share/nginx/html

# Remove the default Nginx configuration
RUN rm /etc/nginx/conf.d/default.conf
# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/monopoly.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

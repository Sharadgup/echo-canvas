
# Stage 1: Build the application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm for dependency management (optional, use npm or yarn if preferred)
# RUN npm install -g pnpm

# Copy package.json and lock file
COPY package.json ./
# COPY pnpm-lock.yaml ./
# For npm:
COPY package-lock.json ./

# Install dependencies
# RUN pnpm install --frozen-lockfile
# For npm:
RUN npm install --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Set build-time environment variables if needed
# For example, if you have NEXT_PUBLIC_ variables that are not in .env.docker but needed at build time
# ARG NEXT_PUBLIC_SOME_BUILD_VAR
# ENV NEXT_PUBLIC_SOME_BUILD_VAR=$NEXT_PUBLIC_SOME_BUILD_VAR

# Build the Next.js application
RUN npm run build

# Stage 2: Production image
FROM node:18-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Automatically leverage output traces to reduce image size
# Copy the standalone Next.js server output
COPY --from=builder /app/.next/standalone ./
# Copy the public folder
COPY --from=builder /app/public ./public
# Copy the static assets
COPY --from=builder /app/.next/static ./.next/static

# Expose the port the app runs on
EXPOSE 3000

# Set the CWD to the app folder to make sure server.js can be found.
# The default CMD is ["node", "server.js"] in the standalone output
# You can uncomment the line below to set a different CWD if needed
# WORKDIR /app

# Start the Next.js application
# The server.js file is created by the standalone output mode
CMD ["node", "server.js"]

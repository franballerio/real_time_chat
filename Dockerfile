# Dockerfile

# ---- Base Stage ----
# Use an official Node.js runtime as a parent image.
# The 'alpine' version is a lightweight Linux distribution.
FROM node:18-alpine AS base
WORKDIR /usr/src/app

# ---- Dependencies Stage ----
# This stage is for installing dependencies.
FROM base AS deps
RUN npm install -g pnpm
COPY package.json ./
RUN pnpm install 

# ---- Production Stage ----
# This is the final stage that will be used for the production image.
FROM base AS production
ENV NODE_ENV=production
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
EXPOSE 8080
CMD ["node", "whatsapp.js"]
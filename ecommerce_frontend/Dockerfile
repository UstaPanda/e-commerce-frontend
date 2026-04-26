# Use Node 22 Alpine for a small runtime image
FROM node:22-alpine

WORKDIR /app

# Copy the pre-built dist folder from the local machine
# This avoids doing a high-memory build on the 2GB server
COPY dist ./dist

# Critical Fix: Allow all hostnames for SSR to prevent SSRF block
# We set multiple variations to be safe across different Angular versions
ENV ANGULAR_ALLOWED_HOSTS="*"
ENV ALLOWED_HOSTS="*"
ENV NODE_ENV=production

EXPOSE 4000

# Run the Angular SSR server
CMD ["node", "dist/ecommerce_frontend/server/server.mjs"]

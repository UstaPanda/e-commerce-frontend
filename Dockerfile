# Use Node 22 Alpine for a small runtime image
FROM node:22-alpine

WORKDIR /app

# Copy the pre-built dist folder from the local machine
# This avoids doing a high-memory build on the 2GB server
COPY dist ./dist

EXPOSE 4200

# Run the Angular SSR server
CMD ["node", "dist/ecommerce_frontend/server/server.mjs"]

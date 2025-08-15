# Use Amazon ECR public mirror for Node 18 Alpine
FROM public.ecr.aws/docker/library/node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy the rest of the source code
COPY . .

# Build the app
RUN npm run build

# Install 'serve' globally to serve the production build
RUN npm install -g serve

# Expose port for the frontend
EXPOSE 3000

# Start the application
CMD ["serve", "-s", "build", "-l", "3000"]

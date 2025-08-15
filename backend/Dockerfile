# Use Amazon ECR public mirror for Node 18 Alpine to avoid Docker Hub
FROM public.ecr.aws/docker/library/node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy the rest of the source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose application port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]

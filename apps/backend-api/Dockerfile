FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY ../../packages ./packages

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3001

# Start server
CMD ["npm", "start"]

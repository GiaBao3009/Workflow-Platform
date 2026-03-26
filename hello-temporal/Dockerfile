# FROM node:18-alpine

# WORKDIR /app

# # Copy package files
# COPY package*.json ./
# COPY ../../packages ./packages

# # Install dependencies
# RUN npm install

# # Copy source code
# COPY . .

# # Build TypeScript
# RUN npm run build

# # Start worker
# CMD ["npm", "run", "start:worker"]

FROM node:18-alpine

# Tạo thư mục gốc trong container
WORKDIR /app

# 1. Copy TOÀN BỘ repo (bao gồm thư mục gốc, 'packages' và 'hello-temporal') vào /app
COPY . .

# 2. Cực kỳ quan trọng: Di chuyển vào đúng thư mục dự án cần làm việc
WORKDIR /app/hello-temporal

# 3. Cài đặt các thư viện (nó sẽ đọc package.json bên trong hello-temporal)
RUN npm install

# 4. Chạy lệnh build TypeScript
RUN npm run build

# 5. Khởi động worker
CMD ["npm", "run", "start:worker"]

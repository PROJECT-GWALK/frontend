FROM node:24-alpine

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

ENV NODE_ENV=production

# Generate Prisma Client
# Set a dummy DATABASE_URL for generation only (Prisma needs it to validate schema, but doesn't connect)
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

# Build the application
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]

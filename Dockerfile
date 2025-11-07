FROM oven/bun:1.0.5-alpine

WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install
COPY . .

EXPOSE 3500
CMD ["bun", "run", "start"]
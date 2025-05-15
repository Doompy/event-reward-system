# 빌드 스테이지
FROM node:18 AS builder
WORKDIR /app

# 의존성 설치
COPY package.json yarn.lock ./
COPY nest-cli.json ./
COPY tsconfig*.json ./

# 소스 코드 복사
COPY . .

RUN yarn install --frozen-lockfile

# 빌드
RUN yarn build event

# 런타임 스테이지
FROM node:18-slim AS runner
WORKDIR /app

# 필요한 파일만 복사
COPY --from=builder /app/dist/apps/event ./dist
COPY --from=builder /app/node_modules ./node_modules

# 포트 노출
EXPOSE 3002

# 실행
CMD ["node", "dist/main.js"] 
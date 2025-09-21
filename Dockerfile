FROM node:20-bullseye-slim

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

RUN apt-get update && \
    apt-get install -y chromium libnss3 libxss1 libasound2 libgbm-dev libxshmfence-dev && \
    rm -rf /var/lib/apt/lists/*

EXPOSE 3000

CMD ["npm", "start"]

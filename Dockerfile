# Usa una imagen de Docker con Node.js y Puppeteer preinstalado
FROM zenika/alpine-chrome-node

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de tu proyecto
COPY package.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]

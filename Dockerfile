# Usa una imagen de Node.js con un navegador Chrome preinstalado para Puppeteer.
FROM browserless/chrome:latest

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de tu proyecto
COPY package.json ./

# Instala las dependencias de Node.js
RUN npm install

COPY . .

# El puerto por defecto para esta imagen es el 3000
EXPOSE 3000

# Comando para ejecutar tu aplicación
CMD ["node", "index.js"]

const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = 3000;

app.use(express.json());

app.post('/screenshot', async (req, res) => {
    const { url, x, y, width, height } = req.body;

    // 1. Validación de los datos de entrada
    if (!url || x === undefined || y === undefined || width === undefined || height === undefined) {
        return res.status(400).json({ error: 'URL y coordenadas de captura (x, y, width, height) son obligatorios.' });
    }

    let browser;
    try {
        // 2. Configuración de Puppeteer (Modo 'new' y argumentos recomendados)
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-gpu',
                '--disable-dev-shm-usage',
            ]
        });
        const page = await browser.newPage();
        
        await page.setViewport({ width: 1920, height: 1080 });

        // 3. Navegación y espera robusta
        // Espera a que la red esté casi inactiva, con un timeout amplio de 30 segundos.
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // **ESTRATEGIA CLAVE**: Espera hasta que el elemento de la tabla esté visible.
        // Esto asegura que el contenido principal haya sido inyectado por JavaScript.
        // ¡Si conoces un selector más específico que 'body table', úsalo!
        await page.waitForSelector('body table', { timeout: 30000 }); 

        // Pausa de seguridad de 2 segundos para el renderizado final (animaciones, estilos).
        await new Promise(r => setTimeout(r, 2000));

        // 4. Captura de pantalla
        const screenshotBuffer = await page.screenshot({
            clip: { x: Number(x), y: Number(y), width: Number(width), height: Number(height) }
        });

        res.type('image/png').send(screenshotBuffer);

    } catch (error) {
        console.error('Error al tomar la captura de pantalla:', error);
        
        // 5. Manejo de Errores Detallado (para diagnóstico en n8n)
        if (error.name === 'TimeoutError') {
             // 408 si el problema es que la página tardó demasiado en cargar
             res.status(408).json({ error: 'La página tardó demasiado en cargar (Timeout).', details: error.message });
        } else {
             // 500 para errores internos (problemas de Puppeteer, etc.)
             res.status(500).json({ error: 'Error interno del servidor al procesar la solicitud.', details: error.message, stack: error.stack });
        }
    } finally {
        // 6. Cierre del navegador (Crucial para liberar recursos)
        if (browser) {
            await browser.close();
        }
    }
});

app.listen(port, () => {
    console.log(`Servicio de captura de pantalla iniciado en el puerto ${port}`);
});

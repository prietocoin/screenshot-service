const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = 3000;

app.use(express.json());

app.post('/screenshot', async (req, res) => {
    const { url, x, y, width, height } = req.body;

    if (!url || x === undefined || y === undefined || width === undefined || height === undefined) {
        return res.status(400).json({ error: 'URL y coordenadas de captura (x, y, width, height) son obligatorios.' });
    }

    let browser;
    try {
        // 1. Configuración de Puppeteer
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
        
        await page.setViewport({ width: 2500, height: 2100 }); 

        // 2. Navegación y espera robusta
        // Aumenta el timeout de navegación total a 60 segundos
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        
        // **ESTRATEGIA CLAVE**: Pausa de 15 segundos para asegurar el renderizado
        // Esto reemplaza el selector que fallaba y da tiempo a Google Sheets para cargar.
        await new Promise(r => setTimeout(r, 15000)); 

        // 3. Captura de pantalla
        const screenshotBuffer = await page.screenshot({
            clip: { x: Number(x), y: Number(y), width: Number(width), height: Number(height) }
        });

        res.type('image/png').send(screenshotBuffer);

    } catch (error) {
        console.error('Error al tomar la captura de pantalla:', error);
        
        // 4. Manejo de Errores Detallado
        if (error.name === 'TimeoutError') {
             // 408 si el problema es que la página tardó demasiado en cargar
             res.status(408).json({ error: 'La página tardó demasiado en cargar (Timeout).', details: error.message });
        } else {
             // 500 para errores internos
             res.status(500).json({ error: 'Error interno del servidor al procesar la solicitud.', details: error.message, stack: error.stack });
        }
    } finally {
        // 5. Cierre del navegador (Crucial para liberar recursos)
        if (browser) {
            await browser.close();
        }
    }
});

app.listen(port, () => {
    console.log(`Servicio de captura de pantalla iniciado en el puerto ${port}`);
});

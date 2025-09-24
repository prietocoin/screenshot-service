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
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-gpu',
                '--disable-dev-shm-usage',
                '--no-zygote',
                '--single-process'
            ]
        });
        const page = await browser.newPage();
        
        await page.setViewport({ width: 1920, height: 1080 });

        // Espera de forma robusta hasta que la red esté casi inactiva
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // **CORRECCIÓN:** Utiliza la función sleep de Node.js en lugar de la función de Puppeteer obsoleta.
        // Esto añade una pausa de 7 segundos para que los elementos dinámicos se rendericen.
        await new Promise(r => setTimeout(r, 7000));

        const screenshotBuffer = await page.screenshot({
            clip: { x: Number(x), y: Number(y), width: Number(width), height: Number(height) }
        });

        res.type('image/png').send(screenshotBuffer);
    } catch (error) {
        console.error('Error al tomar la captura de pantalla:', error);
        
        if (error.name === 'TimeoutError') {
             res.status(408).json({ error: 'La página tardó demasiado en cargar. Inténtalo de nuevo.' });
        } else {
             res.status(500).json({ error: 'Error interno del servidor al procesar la solicitud.', details: error.message, stack: error.stack });
        }
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

app.listen(port, () => {
    console.log(`Servicio de captura de pantalla iniciado en el puerto ${port}`);
});

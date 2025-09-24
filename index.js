const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = 3000;

app.use(express.json());

app.post('/screenshot', async (req, res) => {
    const { url, x, y, width, height, customSelector, waitFor, viewportWidth, viewportHeight } = req.body;

    // Validación más robusta de los datos de entrada
    if (!url || x === undefined || y === undefined || width === undefined || height === undefined) {
        return res.status(400).json({ error: 'URL y coordenadas de captura (x, y, width, height) son obligatorios.' });
    }

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new', // Usa el nuevo modo 'new' que es más rápido y estable
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-gpu',
                '--disable-dev-shm-usage'
            ]
        });
        const page = await browser.newPage();
        
        // Define el tamaño de la ventana (viewport)
        await page.setViewport({ width: viewportWidth || 1920, height: viewportHeight || 1080 });

        // Navega a la URL y espera a que la red se quede inactiva
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Espera de forma más inteligente a que un elemento esté disponible.
        if (customSelector) {
            await page.waitForSelector(customSelector, { timeout: 35000 }); // Aumenta el timeout a 15 segundos
        } else {
            await page.waitForSelector('body', { timeout: 35000 });
        }

        // Espera adicional si el contenido es muy dinámico
        if (waitFor) {
            await page.waitForTimeout(waitFor);
        }

        // Realiza la captura de pantalla
        const screenshotBuffer = await page.screenshot({
            clip: { x: Number(x), y: Number(y), width: Number(width), height: Number(height) }
        });

        res.type('image/png').send(screenshotBuffer);
    } catch (error) {
        console.error('Error al tomar la captura de pantalla:', error);
        // Si hay un timeout de Puppeteer, devuelve un error 408
        if (error.name === 'TimeoutError') {
             res.status(408).json({ error: 'La página tardó demasiado en cargar. Inténtalo de nuevo.' });
        } else {
             res.status(500).json({ error: 'Error interno del servidor al procesar la solicitud.', details: error.message });
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

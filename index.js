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
                '--disable-dev-shm-usage'
            ]
        });
        const page = await browser.newPage();
        
        await page.setViewport({ width: 1920, height: 1080 });

        // Navega a la URL y espera a que la red se quede inactiva
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        // Espera a que el cuerpo de la página esté disponible y completamente cargado
        // Aumenta el tiempo de espera por si la página es pesada
        await page.waitForSelector('body', { timeout: 15000 });

        // Espera a que el contenido dinámico termine de cargarse (ej. gráficos, tablas)
        // Puedes cambiar '1000' por un valor mayor si la página es muy lenta
        await page.waitForTimeout(1000);

        const screenshotBuffer = await page.screenshot({
            clip: { x: Number(x), y: Number(y), width: Number(width), height: Number(height) }
        });

        res.type('image/png').send(screenshotBuffer);
    } catch (error) {
        console.error('Error al tomar la captura de pantalla:', error);
        res.status(500).json({ error: 'Error interno del servidor al procesar la solicitud.', details: error.message });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

app.listen(port, () => {
    console.log(`Servicio de captura de pantalla iniciado en el puerto ${port}`);
});

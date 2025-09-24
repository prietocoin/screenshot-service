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
        // 2. Configuración de Puppeteer
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

        // 3. Navegación y espera robusta
        // Espera a que la página se cargue y que la red se mantenga inactiva por un tiempo.
        await page.goto(url, { waitUntil: 'networkidle0' });
        
        // Espera explícita para asegurar el renderizado
        // Se espera un tiempo prudente para que los elementos dinámicos (gráficos, tablas) se carguen
        await page.waitForTimeout(5000); 

        // 4. Captura de pantalla
        const screenshotBuffer = await page.screenshot({
            clip: { x: Number(x), y: Number(y), width: Number(width), height: Number(height) }
        });

        // 5. Envío de la respuesta
        res.type('image/png').send(screenshotBuffer);
    } catch (error) {
        console.error('Error al tomar la captura de pantalla:', error);
        res.status(500).json({ error: 'Error interno del servidor al procesar la solicitud.', details: error.message });
    } finally {
        // 6. Cierre del navegador
        if (browser) {
            await browser.close();
        }
    }
});

app.listen(port, () => {
    console.log(`Servicio de captura de pantalla iniciado en el puerto ${port}`);
});

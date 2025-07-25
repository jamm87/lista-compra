// --- Contenido de server.js actualizado ---
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer = require('multer'); // <-- NUEVA DEPENDENCIA
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// --- Configuración de Multer para manejar archivos en memoria ---
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(express.static('public'));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Endpoint de normalización de texto (sin cambios)
app.post('/api/normalize-list', async (req, res) => {
    // ... (el código de este endpoint no cambia)
    const { productList } = req.body;
    if (!productList || productList.length === 0) { return res.status(400).json({ error: 'La lista de productos está vacía.' }); }
    const prompt = `Eres un asistente experto en listas de la compra. Tu tarea es normalizar y completar una lista de productos abreviados o mal escritos. Devuelve el resultado ÚNICAMENTE como un array JSON de strings, sin texto adicional. Ejemplo: ["CHOC LECHE"] -> ["Chocolate con Leche"]. Lista a procesar: ${JSON.stringify(productList)}`;
    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        let text = response.text().replace('```json\n', '').replace('\n```', '').trim();
        const cleanedList = JSON.parse(text);
        res.json({ cleanedList });
    } catch (error) {
        console.error("Error en /api/normalize-list:", error);
        res.status(500).json({ error: 'Hubo un error al procesar la lista con la IA.' });
    }
});

// --- NUEVO ENDPOINT PARA OCR DE TICKETS ---
// `upload.single('receiptImage')` es el middleware de multer que procesa la imagen
app.post('/api/ocr-receipt', upload.single('receiptImage'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se ha subido ninguna imagen.' });
    }

    const prompt = `
        Eres un experto analizador de tickets de supermercado. Tu única tarea es extraer los nombres de los productos de la imagen de este ticket.
        - Ignora precios, fechas, totales, descuentos, el nombre del supermercado y cualquier otro texto que no sea un producto.
        - Devuelve el resultado ÚNICAMENTE como un array JSON de strings. No incluyas explicaciones, saludos ni formato markdown.
        - Si un producto aparece varias veces, inclúyelo solo una vez.
        
        Ejemplo de salida deseada: ["Tomate Pera", "Leche Entera 1.5L", "Pan de Molde sin corteza"]
    `;

    try {
        // Convierte la imagen del buffer a un formato que Gemini entiende
        const imagePart = {
            inlineData: {
                data: req.file.buffer.toString("base64"),
                mimeType: req.file.mimetype,
            },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = result.response;
        let text = response.text().replace('```json\n', '').replace('\n```', '').trim();
        
        const productList = JSON.parse(text);
        res.json({ productList });

    } catch (error) {
        console.error("Error en /api/ocr-receipt:", error);
        res.status(500).json({ error: 'Hubo un error al analizar la imagen con la IA.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});
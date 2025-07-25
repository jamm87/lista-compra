// --- Contenido de server.js ---
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config(); // Carga las variables del archivo .env

const app = express();
const port = 3000;

// Middleware para parsear JSON en las peticiones
app.use(express.json());
// Middleware para servir tus archivos estáticos (html, css, js)
app.use(express.static('public')); // ¡Importante! Mueve tus archivos a una carpeta "public"

// Inicializa el cliente de Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

// Define el endpoint de la API que tu frontend llamará
app.post('/api/normalize-list', async (req, res) => {
    const { productList } = req.body;

    if (!productList || productList.length === 0) {
        return res.status(400).json({ error: 'La lista de productos está vacía.' });
    }

    const prompt = `
        Eres un asistente experto en listas de la compra. Tu tarea es normalizar y completar una lista de productos abreviados o mal escritos de un ticket de supermercado.
        Corrige abreviaturas, errores tipográficos y formatea cada producto a un nombre claro y común.
        Devuelve el resultado ÚNICAMENTE como un array JSON de strings, sin texto adicional, explicaciones ni formato markdown.

        Ejemplo de entrada: ["CHOC LECHE", "P. MOLD", "YOG NAT"]
        Ejemplo de salida deseada: ["Chocolate con Leche", "Pan de Molde", "Yogur Natural"]

        Aquí está la lista a procesar:
        ${JSON.stringify(productList)}
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        let text = response.text();

        // Limpiar la respuesta para asegurar que es un JSON válido
        text = text.replace('```json\n', '').replace('\n```', '').trim();

        // Parsear el texto como JSON para enviarlo al cliente
        const cleanedList = JSON.parse(text);
        res.json({ cleanedList });

    } catch (error) {
        console.error("Error al llamar a la API de Gemini:", error);
        res.status(500).json({ error: 'Hubo un error al procesar la lista con la IA.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
// En app.js, dentro del evento 'DOMContentLoaded'

// --- (todo tu código anterior: referencias al DOM, funciones, etc.) ---

// --- NUEVAS REFERENCIAS AL DOM PARA LA MODAL ---
const openOcrModalBtn = document.getElementById('open-ocr-modal-btn');
const ocrModal = document.getElementById('ocr-modal');
const closeOcrModalBtn = document.getElementById('close-ocr-modal-btn');
const receiptUploadInput = document.getElementById('receipt-upload');
const imagePreview = document.getElementById('image-preview');
const analyzeImageBtn = document.getElementById('analyze-image-btn');
const ocrLoader = document.getElementById('ocr-loader');

// --- NUEVOS EVENTOS PARA LA MODAL ---
openOcrModalBtn.addEventListener('click', () => {
    ocrModal.style.display = 'flex';
});

closeOcrModalBtn.addEventListener('click', () => {
    ocrModal.style.display = 'none';
});

// Cierra la modal si se hace clic fuera de ella
ocrModal.addEventListener('click', (event) => {
    if (event.target === ocrModal) {
        ocrModal.style.display = 'none';
    }
});

// Cuando el usuario elige un archivo
receiptUploadInput.addEventListener('change', () => {
    const file = receiptUploadInput.files[0];
    if (file) {
        // Muestra la vista previa de la imagen
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
        // Habilita el botón de análisis
        analyzeImageBtn.disabled = false;
    }
});

// Cuando se hace clic en analizar
analyzeImageBtn.addEventListener('click', async () => {
    const file = receiptUploadInput.files[0];
    if (!file) return;

    // Mostrar estado de carga
    analyzeImageBtn.disabled = true;
    ocrLoader.style.display = 'block';

    // Usamos FormData para enviar el archivo
    const formData = new FormData();
    formData.append('receiptImage', file);

    try {
        const response = await fetch('/api/ocr-receipt', {
            method: 'POST',
            body: formData, // No se necesita 'Content-Type', el navegador lo pone solo
        });

        if (!response.ok) {
            throw new Error('La respuesta del servidor no fue exitosa.');
        }

        const data = await response.json();
        const detectedProducts = data.productList;
        
        // ¡Reutilizamos nuestra función de normalización!
        const normalizedProducts = await normalizarLista(detectedProducts);

        // Añadimos los productos detectados y normalizados a nuestra lista habitual
        // Primero, obtenemos la lista actual de productos habituales
        const productosActuales = JSON.parse(localStorage.getItem('miListaHabitual') || '[]');
        
        // Combinamos y eliminamos duplicados
        const listaCombinada = [...new Set([...productosActuales, ...normalizedProducts])];

        // Guardamos y recargamos la lista
        localStorage.setItem('miListaHabitual', JSON.stringify(listaCombinada));
        cargarProductosHabituales(listaCombinada);

        alert('¡Productos del ticket añadidos a la lista de habituales!');
        ocrModal.style.display = 'none'; // Cerrar la modal

    } catch (error) {
        console.error("Error al analizar el ticket:", error);
        alert("No se pudo analizar el ticket. Por favor, inténtalo de nuevo.");
    } finally {
        // Restaurar la modal a su estado inicial
        analyzeImageBtn.disabled = false;
        ocrLoader.style.display = 'none';
        receiptUploadInput.value = ''; // Limpiar el input
        imagePreview.style.display = 'none';
    }
});


// Función de normalización MODIFICADA para ser reutilizable
async function normalizarLista(listaSucia) {
    if (!listaSucia || listaSucia.length === 0) {
        return [];
    }
    
    try {
        const response = await fetch('/api/normalize-list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productList: listaSucia }),
        });
        if (!response.ok) throw new Error('Error en la normalización');
        const data = await response.json();
        return data.cleanedList;
    } catch (error) {
        console.error("Error al normalizar:", error);
        return listaSucia; // Devolver la lista original si falla la normalización
    }
}

// Función procesarListaPersonalizada MODIFICADA para usar la nueva normalización
async function procesarListaPersonalizada() {
    const texto = customProductsInput.value.trim();
    if (texto === '') return alert('Pega tu lista de productos.');

    // ... (Feedback visual)
    loadCustomListBtn.disabled = true;
    loadCustomListBtn.textContent = 'Procesando...';

    const listaSucia = texto.split(/\s*,\s*|\s*\n\s*/);
    const listaLimpia = await normalizarLista(listaSucia); // REUTILIZAMOS

    localStorage.setItem('miListaHabitual', JSON.stringify(listaLimpia));
    cargarProductosHabituales(listaLimpia);
    alert('¡Tu lista ha sido procesada y guardada!');

    // ... (Restaurar botón)
    loadCustomListBtn.disabled = false;
    loadCustomListBtn.textContent = 'Cargar mi Lista';
}
// --- app.js (versión corregida y reorganizada) ---

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. REFERENCIAS AL DOM ---
    // Referencias a los elementos del DOM principales
    const productosHabitualesUl = document.getElementById('productos-habituales');
    const listaHoyUl = document.getElementById('lista-hoy');
    const copiarListaBtn = document.getElementById('copiar-lista');
    const customProductsInput = document.getElementById('custom-products-input');
    const loadCustomListBtn = document.getElementById('load-custom-list-btn');
    const resetListBtn = document.getElementById('reset-list-btn');

    // Referencias a los elementos de la modal OCR
    const openOcrModalBtn = document.getElementById('open-ocr-modal-btn');
    const ocrModal = document.getElementById('ocr-modal');
    const closeOcrModalBtn = document.getElementById('close-ocr-modal-btn');
    const receiptUploadInput = document.getElementById('receipt-upload');
    const imagePreview = document.getElementById('image-preview');
    const analyzeImageBtn = document.getElementById('analyze-image-btn');
    const ocrLoader = document.getElementById('ocr-loader');
    
    // Lista por defecto
    const productosHabitualesDefault = ["Leche", "Pan de molde", "Huevos", "Yogur", "Pollo"];


    // --- 2. DEFINICIÓN DE FUNCIONES ---

    function categorizarProducto(producto) {
        const categorias = { 'Lácteos y Huevos': ['leche', 'yogur', 'huevo'], 'Carnicería': ['pollo', 'ternera'], 'Otros': [] };
        const productoLower = producto.toLowerCase();
        for (const categoria in categorias) {
            if (categorias[categoria].some(keyword => productoLower.includes(keyword))) {
                return categoria;
            }
        }
        return 'Otros';
    }

    function cargarProductosHabituales(productosArray) {
        productosHabitualesUl.innerHTML = '';
        const productosCategorizados = {};
        productosArray.forEach(producto => {
            if (producto.trim() === '') return;
            const categoria = categorizarProducto(producto);
            if (!productosCategorizados[categoria]) {
                productosCategorizados[categoria] = [];
            }
            productosCategorizados[categoria].push(producto);
        });
        Object.keys(productosCategorizados).sort().forEach(categoria => {
            const tituloLi = document.createElement('li');
            tituloLi.textContent = categoria;
            tituloLi.className = 'category-title';
            productosHabitualesUl.appendChild(tituloLi);
            productosCategorizados[categoria].sort().forEach(producto => {
                const li = document.createElement('li');
                const nombreProducto = document.createElement('span');
                nombreProducto.textContent = producto;
                const addButton = document.createElement('button');
                addButton.textContent = 'Añadir';
                addButton.classList.add('add-btn');
                addButton.addEventListener('click', () => añadirProductoAListaHoy(producto));
                li.appendChild(nombreProducto);
                li.appendChild(addButton);
                productosHabitualesUl.appendChild(li);
            });
        });
    }

    async function normalizarLista(listaSucia) {
        if (!listaSucia || listaSucia.length === 0) return [];
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
            return listaSucia;
        }
    }
    
    async function procesarListaPersonalizada() {
        const texto = customProductsInput.value.trim();
        if (texto === '') return alert('Pega tu lista de productos.');
        loadCustomListBtn.disabled = true;
        loadCustomListBtn.textContent = 'Procesando...';
        const listaSucia = texto.split(/\s*,\s*|\s*\n\s*/);
        const listaLimpia = await normalizarLista(listaSucia);
        localStorage.setItem('miListaHabitual', JSON.stringify(listaLimpia));
        cargarProductosHabituales(listaLimpia);
        alert('¡Tu lista ha sido procesada y guardada!');
        loadCustomListBtn.disabled = false;
        loadCustomListBtn.textContent = 'Cargar mi Lista';
    }
    
    function añadirProductoAListaHoy(nombreProducto) {
        // ... (código de esta función)
    }
    
    function copiarListaAlPortapapeles() {
        // ... (código de esta función)
    }

    function iniciarListaHabitual() {
        const listaGuardada = localStorage.getItem('miListaHabitual');
        if (listaGuardada) {
            cargarProductosHabituales(JSON.parse(listaGuardada));
        } else {
            cargarProductosHabituales(productosHabitualesDefault);
        }
    }

    function resetearAListaDefault() {
        // ... (código de esta función)
    }

    // --- 3. ASIGNACIÓN DE EVENTOS ---
    
    // Eventos principales
    loadCustomListBtn.addEventListener('click', procesarListaPersonalizada);
    resetListBtn.addEventListener('click', resetearAListaDefault);
    copiarListaBtn.addEventListener('click', copiarListaAlPortapapeles);

    // Eventos de la modal OCR
    openOcrModalBtn.addEventListener('click', () => ocrModal.style.display = 'flex');
    closeOcrModalBtn.addEventListener('click', () => ocrModal.style.display = 'none');
    ocrModal.addEventListener('click', (event) => {
        if (event.target === ocrModal) ocrModal.style.display = 'none';
    });
    
    receiptUploadInput.addEventListener('change', () => {
        const file = receiptUploadInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
            analyzeImageBtn.disabled = false;
        }
    });

    analyzeImageBtn.addEventListener('click', async () => {
        const file = receiptUploadInput.files[0];
        if (!file) return;

        analyzeImageBtn.disabled = true;
        ocrLoader.style.display = 'block';

        const formData = new FormData();
        formData.append('receiptImage', file);

        try {
            const response = await fetch('/api/ocr-receipt', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('La respuesta del servidor no fue exitosa.');

            const data = await response.json();
            const detectedProducts = data.productList;
            
            const normalizedProducts = await normalizarLista(detectedProducts);
            
            const productosActuales = JSON.parse(localStorage.getItem('miListaHabitual') || '[]');
            const listaCombinada = [...new Set([...productosActuales, ...normalizedProducts])];

            localStorage.setItem('miListaHabitual', JSON.stringify(listaCombinada));
            cargarProductosHabituales(listaCombinada); // <--- ESTA ES LA LÍNEA QUE DABA EL ERROR

            alert('¡Productos del ticket añadidos a la lista de habituales!');
            ocrModal.style.display = 'none';

        } catch (error) {
            console.error("Error al analizar el ticket:", error);
            alert("No se pudo analizar el ticket. Por favor, inténtalo de nuevo.");
        } finally {
            analyzeImageBtn.disabled = false;
            ocrLoader.style.display = 'none';
            receiptUploadInput.value = '';
            imagePreview.style.display = 'none';
        }
    });


    // --- 4. INICIALIZACIÓN ---
    iniciarListaHabitual();

});
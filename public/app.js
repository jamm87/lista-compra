// --- app.js (versión COMPLETA y corregida) ---

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. REFERENCIAS AL DOM ---
    const productosHabitualesUl = document.getElementById('productos-habituales');
    const listaHoyUl = document.getElementById('lista-hoy');
    const copiarListaBtn = document.getElementById('copiar-lista');
    const customProductsInput = document.getElementById('custom-products-input');
    const loadCustomListBtn = document.getElementById('load-custom-list-btn');
    const resetListBtn = document.getElementById('reset-list-btn');

    const openOcrModalBtn = document.getElementById('open-ocr-modal-btn');
    const ocrModal = document.getElementById('ocr-modal');
    const closeOcrModalBtn = document.getElementById('close-ocr-modal-btn');
    const receiptUploadInput = document.getElementById('receipt-upload');
    const imagePreview = document.getElementById('image-preview');
    const analyzeImageBtn = document.getElementById('analyze-image-btn');
    const ocrLoader = document.getElementById('ocr-loader');
    
    const productosHabitualesDefault = ["Leche", "Pan de molde", "Huevos", "Yogur", "Pollo"];
    const categorias = { 'Lácteos y Huevos': ['leche', 'yogur', 'huevo', 'queso', 'mantequilla'], 'Carnicería y Pescadería': ['pollo', 'ternera', 'cerdo', 'pavo', 'salchichas', 'pescado', 'atún', 'salmón'], 'Frutas y Verduras': ['tomate', 'lechuga', 'cebolla', 'patata', 'fruta', 'manzana', 'plátano', 'naranja', 'pimiento', 'pepino'], 'Panadería y Repostería': ['pan', 'galletas', 'bollería'], 'Despensa': ['aceite', 'sal', 'pasta', 'arroz', 'lentejas', 'garbanzos', 'harina', 'azúcar', 'conservas'], 'Bebidas': ['cerveza', 'vino', 'agua', 'refresco', 'zumo'], 'Higiene y Limpieza': ['papel higiénico', 'gel', 'champú', 'detergente', 'suavizante', 'lavavajillas'], };
    const CATEGORIA_OTROS = 'Otros';


    // --- 2. DEFINICIÓN DE FUNCIONES ---

    function categorizarProducto(producto) {
        const productoLower = producto.toLowerCase();
        for (const categoria in categorias) {
            if (categorias[categoria].some(keyword => productoLower.includes(keyword))) {
                return categoria;
            }
        }
        return CATEGORIA_OTROS;
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
    
    // --- ¡¡AQUÍ ESTÁ EL CÓDIGO QUE FALTABA!! ---
    function añadirProductoAListaHoy(nombreProducto) {
        const productosActuales = Array.from(listaHoyUl.querySelectorAll('li span.product-name'));
        const yaEstaEnLista = productosActuales.some(span => span.textContent === nombreProducto);

        if (yaEstaEnLista) {
            console.log(`El producto "${nombreProducto}" ya está en tu lista.`);
            return;
        }
        const li = document.createElement('li');
        const nombreSpan = document.createElement('span');
        nombreSpan.textContent = nombreProducto;
        nombreSpan.className = 'product-name';
        
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Quitar';
        removeButton.className = 'remove-btn';
        removeButton.addEventListener('click', () => {
            li.remove();
        });

        li.appendChild(nombreSpan);
        li.appendChild(removeButton);
        listaHoyUl.appendChild(li);
    }
    
    function copiarListaAlPortapapeles() {
        const productosSpans = Array.from(listaHoyUl.querySelectorAll('li span.product-name'));
        if (productosSpans.length === 0) {
            return alert('Tu lista de hoy está vacía.');
        }
        const productos = productosSpans.map(span => span.textContent);
        const productosCategorizados = {};
        productos.forEach(producto => {
            const categoria = categorizarProducto(producto);
            if (!productosCategorizados[categoria]) {
                productosCategorizados[categoria] = [];
            }
            productosCategorizados[categoria].push(producto);
        });
        let textoFormateado = '🛒 *Mi lista de la compra:*\n';
        Object.keys(productosCategorizados).sort().forEach(categoria => {
            textoFormateado += `\n*${categoria}:*\n`;
            productosCategorizados[categoria].sort().forEach(producto => {
                textoFormateado += `- ${producto}\n`;
            });
        });
        navigator.clipboard.writeText(textoFormateado).then(() => {
            alert('¡Lista categorizada copiada al portapapeles!');
        }).catch(err => {
            console.error('Error al copiar la lista: ', err);
            alert('No se pudo copiar la lista.');
        });
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
        localStorage.removeItem('miListaHabitual');
        customProductsInput.value = '';
        cargarProductosHabituales(productosHabitualesDefault);
        alert('La lista de productos ha sido restaurada.');
    }

    // --- 3. ASIGNACIÓN DE EVENTOS ---
    
    loadCustomListBtn.addEventListener('click', procesarListaPersonalizada);
    resetListBtn.addEventListener('click', resetearAListaDefault);
    copiarListaBtn.addEventListener('click', copiarListaAlPortapapeles);

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
            cargarProductosHabituales(listaCombinada);

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
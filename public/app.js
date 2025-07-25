// --- Contenido de app.js (versión para llamar a la API) ---

document.addEventListener('DOMContentLoaded', () => {

    // --- Se eliminan los diccionarios locales ---
    
    // --- Referencias al DOM (sin cambios) ---
    const productosHabitualesUl = document.getElementById('productos-habituales');
    const listaHoyUl = document.getElementById('lista-hoy');
    const copiarListaBtn = document.getElementById('copiar-lista');
    const customProductsInput = document.getElementById('custom-products-input');
    const loadCustomListBtn = document.getElementById('load-custom-list-btn');
    const resetListBtn = document.getElementById('reset-list-btn');

    // --- Lógica de la API ---

    /**
     * MODIFICADO: Llama al servidor para que Gemini normalice la lista.
     */
    async function procesarListaPersonalizada() {
        const texto = customProductsInput.value.trim();
        if (texto === '') {
            alert('Por favor, pega tu lista de productos.');
            return;
        }

        // Feedback visual para el usuario
        loadCustomListBtn.disabled = true;
        loadCustomListBtn.textContent = 'Procesando con IA...';

        const listaSucia = texto.split(/\s*,\s*|\s*\n\s*/);

        try {
            // Llamada al endpoint de nuestro servidor
            const response = await fetch('/api/normalize-list', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productList: listaSucia }),
            });

            if (!response.ok) {
                // Si la respuesta del servidor no es exitosa
                throw new Error('El servidor respondió con un error.');
            }

            const data = await response.json();
            const listaLimpia = data.cleanedList;

            localStorage.setItem('miListaHabitual', JSON.stringify(listaLimpia));
            cargarProductosHabituales(listaLimpia);
            alert('¡Lista procesada por IA y guardada!');

        } catch (error) {
            console.error("Error al normalizar la lista:", error);
            alert("No se pudo procesar la lista. Revisa la consola para más detalles.");
        } finally {
            // Restaurar el botón
            loadCustomListBtn.disabled = false;
            loadCustomListBtn.textContent = 'Cargar mi Lista';
        }
    }


    // El resto de funciones (categorizar, cargar, añadir, quitar, etc.)
    // no necesitan cambios, ya que trabajan con los datos ya limpios.
    // Pega aquí el resto de funciones de tu JS anterior.
    // ...
    const productosHabitualesDefault = ["Leche", "Pan de molde", "Huevos", "Yogur", "Pollo", "Ternera", "Pescado", "Tomates", "Lechuga", "Cebolla", "Patatas", "Fruta", "Manzanas", "Aceite", "Sal", "Pasta", "Arroz", "Lentejas", "Cerveza", "Vino", "Agua", "Refrescos", "Papel higiénico", "Gel de ducha", "Champú", "Detergente"];
    const categorias = { 'Lácteos y Huevos': ['leche', 'yogur', 'huevo', 'queso', 'mantequilla'], 'Carnicería y Pescadería': ['pollo', 'ternera', 'cerdo', 'pavo', 'salchichas', 'pescado', 'atún', 'salmón'], 'Frutas y Verduras': ['tomate', 'lechuga', 'cebolla', 'patata', 'fruta', 'manzana', 'plátano', 'naranja', 'pimiento', 'pepino'], 'Panadería y Repostería': ['pan', 'galletas', 'bollería'], 'Despensa': ['aceite', 'sal', 'pasta', 'arroz', 'lentejas', 'garbanzos', 'harina', 'azúcar', 'conservas'], 'Bebidas': ['cerveza', 'vino', 'agua', 'refresco', 'zumo'], 'Higiene y Limpieza': ['papel higiénico', 'gel', 'champú', 'detergente', 'suavizante', 'lavavajillas'], };
    const CATEGORIA_OTROS = 'Otros';
    iniciarListaHabitual();
    loadCustomListBtn.addEventListener('click', procesarListaPersonalizada);
    resetListBtn.addEventListener('click', resetearAListaDefault);
    copiarListaBtn.addEventListener('click', copiarListaAlPortapapeles);
    function añadirProductoAListaHoy(nombreProducto) { const productosActuales = Array.from(listaHoyUl.querySelectorAll('li span.product-name')); const yaEstaEnLista = productosActuales.some(span => span.textContent === nombreProducto); if (yaEstaEnLista) { console.log(`El producto "${nombreProducto}" ya está en tu lista.`); return; } const li = document.createElement('li'); const nombreSpan = document.createElement('span'); nombreSpan.textContent = nombreProducto; nombreSpan.className = 'product-name'; const removeButton = document.createElement('button'); removeButton.textContent = 'Quitar'; removeButton.className = 'remove-btn'; removeButton.addEventListener('click', () => { li.remove(); }); li.appendChild(nombreSpan); li.appendChild(removeButton); listaHoyUl.appendChild(li); }
    function copiarListaAlPortapapeles() { const productosSpans = Array.from(listaHoyUl.querySelectorAll('li span.product-name')); if (productosSpans.length === 0) { alert('Tu lista de hoy está vacía.'); return; } const productos = productosSpans.map(span => span.textContent); const productosCategorizados = {}; productos.forEach(producto => { const categoria = categorizarProducto(producto); if (!productosCategorizados[categoria]) { productosCategorizados[categoria] = []; } productosCategorizados[categoria].push(producto); }); let textoFormateado = '🛒 *Mi lista de la compra:*\n'; const categoriasOrdenadas = Object.keys(productosCategorizados).sort(); categoriasOrdenadas.forEach(categoria => { textoFormateado += `\n*${categoria}:*\n`; const productosOrdenados = productosCategorizados[categoria].sort(); productosOrdenados.forEach(producto => { textoFormateado += `- ${producto}\n`; }); }); navigator.clipboard.writeText(textoFormateado).then(() => { alert('¡Lista categorizada copiada! Ya puedes pegarla en WhatsApp.'); }).catch(err => { console.error('Error al copiar la lista: ', err); alert('No se pudo copiar la lista.'); }); }
    function categorizarProducto(producto) { const productoLower = producto.toLowerCase(); for (const categoria in categorias) { if (categorias[categoria].some(keyword => productoLower.includes(keyword))) { return categoria; } } return CATEGORIA_OTROS; }
    function cargarProductosHabituales(productosArray) { productosHabitualesUl.innerHTML = ''; const productosCategorizados = {}; productosArray.forEach(producto => { if (producto.trim() === '') return; const categoria = categorizarProducto(producto); if (!productosCategorizados[categoria]) { productosCategorizados[categoria] = []; } productosCategorizados[categoria].push(producto); }); const categoriasOrdenadas = Object.keys(productosCategorizados).sort(); categoriasOrdenadas.forEach(categoria => { const tituloLi = document.createElement('li'); tituloLi.textContent = categoria; tituloLi.className = 'category-title'; productosHabitualesUl.appendChild(tituloLi); const productosOrdenados = productosCategorizados[categoria].sort(); productosOrdenados.forEach(producto => { const li = document.createElement('li'); const nombreProducto = document.createElement('span'); nombreProducto.textContent = producto; const addButton = document.createElement('button'); addButton.textContent = 'Añadir'; addButton.classList.add('add-btn'); addButton.addEventListener('click', () => añadirProductoAListaHoy(producto)); li.appendChild(nombreProducto); li.appendChild(addButton); productosHabitualesUl.appendChild(li); }); }); }
    function iniciarListaHabitual() { const listaGuardada = localStorage.getItem('miListaHabitual'); if (listaGuardada) { cargarProductosHabituales(JSON.parse(listaGuardada)); } else { cargarProductosHabituales(productosHabitualesDefault); } }
    function resetearAListaDefault() { localStorage.removeItem('miListaHabitual'); customProductsInput.value = ''; cargarProductosHabituales(productosHabitualesDefault); alert('La lista de productos ha sido restaurada.'); }
});
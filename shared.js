// Función que se ejecuta al presionar el botón "BUSCAR"
function buscarPokemon() {
    const input = document.querySelector('.search-input');
    const valor = input.value;
    
    if(valor.trim() === "") {
        alert("Por favor escribe el nombre de un Pokémon.");
        return;
    }

    console.log(`Buscando Pokémon: ${valor}`);
    // Simulación de búsqueda
    alert(`Buscando datos de: ${valor.toUpperCase()}...`);
}

// Agregar lógica a las pestañas (Tabs)
document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll('.btn-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remover clase active de todos los botones
            tabs.forEach(t => t.classList.remove('active'));
            // Agregar clase active solo al que fue clickeado
            tab.classList.add('active');
        });
    });
});
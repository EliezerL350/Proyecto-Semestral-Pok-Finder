async function buscarPokemon() {
    const input = document.getElementById('pokemon-input');
    const container = document.getElementById('result-container');
    const valor = input.value.toLowerCase().trim();

    if (valor === "") {
        alert("Por favor escribe un nombre o ID.");
        return;
    }

    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${valor}`);
        
        if (!response.ok) throw new Error("No encontrado");

        const data = await response.json();

        // Creamos el HTML de la tarjeta basándonos en tu imagen 2
        container.innerHTML = `
            <div class="pokemon-card">
                <div style="font-weight: bold; margin-bottom: 10px;">
                    <span style="color: var(--cyan-accent)">#${data.id}</span> ${data.name.toUpperCase()}
                </div>
                
                <div class="image-bg">
                    <img src="${data.sprites.front_default}" alt="${data.name}">
                </div>

                <div style="display: flex; gap: 10px; margin: 15px 0;">
                    ${data.types.map(t => `<span style="background: black; color: white; padding: 5px 10px; font-size: 0.7rem;">${t.type.name.toUpperCase()}</span>`).join('')}
                </div>

                <div class="stats-grid">
                    ${data.stats.map(s => `
                        <div class="stat-row">
                            <span class="stat-name">${s.stat.name.toUpperCase()}</span>
                            <div class="stat-bar-outer">
                                <div class="stat-bar-inner" style="width: ${(s.base_stat / 150) * 100}%"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div style="text-align: center; margin-top: 10px;">
                     <button class="btn-tab"><i class="ri-heart-fill" style="color: red;"></i></button>
                </div>
            </div>
        `;

    } catch (error) {
        alert("¡Error! Pokémon no encontrado.");
    }
}

// Lógica de pestañas
document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll('.btn-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });
});
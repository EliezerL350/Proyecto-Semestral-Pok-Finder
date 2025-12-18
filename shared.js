// shared.js
const PokeFinderApp = (() => {

    const input = () => document.getElementById('pokemon-input');
    const container = () => document.getElementById('result-container');
    const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 horas

    const getFromCache = (key) => {
        const item = JSON.parse(localStorage.getItem(key));
        if (!item) return null;

        const isExpired = Date.now() - item.timestamp > CACHE_TTL;
        if (isExpired) {
            localStorage.removeItem(key);
            return null;
        }

        return item.data;
    };

    const saveToCache = (key, data) => {
        localStorage.setItem(key, JSON.stringify({
            data,
            timestamp: Date.now()
        }));
    };


    const buscarPokemon = async () => {
        const valor = input().value.toLowerCase().trim();

        if (valor === "") {
            alert("Por favor escribe un nombre o ID.");
            return;
        }

        container().innerHTML = "⏳ Buscando...";

    const cacheKey = `pokemon-${valor}`;

    try {
        let data = getFromCache(cacheKey);
        let source = "CACHÉ";

        if (!data) {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${valor}`);
            if (!response.ok) throw new Error("No encontrado");

            data = await response.json();
            saveToCache(cacheKey, data);
            source = "API";
        }

        renderPokemon(data, source);

    } catch (error) {
        container().innerHTML = `
            <div class="pokemon-card">
                ❌ Pokémon no encontrado
            </div>
        `;
    }
    };

    const renderPokemon = (data, source) => {
        container().innerHTML = `
            <div class="pokemon-card">
                <div style="font-weight: bold; margin-bottom: 10px; font-size: 1.2rem;">
                    <span style="color: var(--red-poke)">#${data.id}</span>
                    ${data.name.toUpperCase()}
                </div>

                <div style="margin-bottom: 8px;">
                    <span style="
                        padding: 4px 8px;
                        border: var(--border);
                        font-size: 0.7rem;
                        font-weight: bold;
                        background-color: ${source === "API" ? "var(--color-success)" : "var(--color-cache)"};
                    ">
                        ${source}
                    </span>
                </div>


                <div class="image-bg">
                    <img src="${data.sprites.front_default}" alt="${data.name}">
                </div>

                <div style="display: flex; gap: 10px; margin: 15px 0;">
                    ${data.types.map(t =>
                        `<span style="background: var(--stroke); color: white;
                        padding: 8px 12px; font-weight: bold; font-size: 0.8rem;">
                        ${t.type.name.toUpperCase()}</span>`
                    ).join('')}
                </div>

                <div class="stats-grid">
                    ${data.stats.map(s => `
                        <div class="stat-row">
                            <span class="stat-name">${s.stat.name.toUpperCase()}</span>
                            <div class="stat-bar-outer">
                                <div class="stat-bar-inner"
                                     style="width:${(s.base_stat / 150) * 100}%">
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    };

    const init = () => {
        document.querySelector('.btn-search')
            .addEventListener('click', buscarPokemon);

        input().addEventListener('keypress', (e) => {
            if (e.key === 'Enter') buscarPokemon();
        });

        // pestañas
        const tabs = document.querySelectorAll('.btn-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });
    };

    return { init };
})();

document.addEventListener("DOMContentLoaded", PokeFinderApp.init);

// shared.js
const PokeFinderApp = (() => {

    // Tiempo de vida del caché (24 horas)
    const CACHE_TTL = 1000 * 60 * 60 * 24;
    const HISTORY_KEY = "poke-history";
    let activeEvolution = null;

    // Elementos del HTML
    const htmlElements = {
        input: document.getElementById('pokemon-input'),
        container: document.getElementById('result-container'),
        searchType: document.getElementById("search-type"),
        historyList: document.getElementById("history-list"),
        clearHistoryBtn: document.getElementById("clear-history"),
        searchBtn: document.querySelector(".btn-search"),
        tabs: document.querySelectorAll(".btn-tab")
    };

    // Funciones de apoyo
    const utils = {

        // Obtener datos del caché
        getFromCache(key) {
            const item = JSON.parse(localStorage.getItem(key));
            if (!item) return null;

            if (Date.now() - item.timestamp > CACHE_TTL) {
                localStorage.removeItem(key);
                return null;
            }
            return item.data;
        },

        // Guardar datos en caché
        saveToCache(key, data) {
            localStorage.setItem(key, JSON.stringify({
                data,
                timestamp: Date.now()
            }));
        },

        // Obtener histórico
        getHistory() {
            return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
        },

        // Guardar búsqueda en histórico
        saveHistory(pokemon) {
            let history = utils.getHistory()
                .filter(p => p.id !== pokemon.id);

            history.unshift({ id: pokemon.id, name: pokemon.name });
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        },

        // Eliminar del histórico
        removeFromHistory(id) {
            const history = utils.getHistory()
                .filter(p => p.id !== id);

            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        },

        // Limpiar histórico y caché
        clearHistoryAndCache() {
            localStorage.removeItem(HISTORY_KEY);
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith("pokemon-")) {
                    localStorage.removeItem(key);
                }
            });
        }
    };

    // Función principal de búsqueda
    const buscar = async () => {
        const valor = htmlElements.input.value.toLowerCase().trim();
        const tipo = htmlElements.searchType?.value || "pokemon";

        if (!valor) {
            alert("Por favor escribe un nombre o ID.");
            return;
        }

        htmlElements.container.innerHTML = "⏳ Buscando...";

        try {
            if (tipo === "pokemon") {
                await buscarPokemon(valor);
            } else {
                await buscarHabilidad(valor);
            }
        } catch {
            htmlElements.container.innerHTML =
                `<div class="pokemon-card">❌ No encontrado</div>`;
        }
    };

    // Buscar Pokémon
    const buscarPokemon = async (valor) => {
        const cacheKey = `pokemon-${valor}`;
        let data = utils.getFromCache(cacheKey);
        let source = "CACHÉ";

        if (!data) {
            const response = await fetch(
                `https://pokeapi.co/api/v2/pokemon/${valor}`
            );
            if (!response.ok) throw new Error();

            data = await response.json();
            utils.saveToCache(cacheKey, data);
            source = "API";
        }

        activeEvolution = data.name;
        renderPokemon(data, source);
        utils.saveHistory(data);
        await renderEvolution(data.id);
    };

    // Mostrar Pokémon
    const renderPokemon = (data, source) => {
        htmlElements.container.innerHTML = `
            <div class="pokemon-card">
                <div style="font-weight:bold;font-size:1.2rem;margin-bottom:10px;">
                    <span style="color:var(--red-poke)">#${data.id}</span>
                    ${data.name.toUpperCase()}
                </div>

                <div style="margin-bottom:8px;">
                    <span style="
                        padding:4px 8px;
                        border:var(--border);
                        font-size:0.7rem;
                        font-weight:bold;
                        background:${source === "API"
                            ? "var(--cyan-accent)"
                            : "var(--yellow-accent)"};
                    ">
                        ${source}
                    </span>
                </div>

                <div class="image-bg">
                    <img src="${data.sprites.front_default}">
                </div>

                <div style="display:flex;gap:10px;margin:15px 0;">
                    ${data.types.map(t => `
                        <span style="background:var(--stroke);color:white;padding:8px 12px;font-weight:bold;">
                            ${t.type.name.toUpperCase()}
                        </span>
                    `).join("")}
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
                    `).join("")}
                </div>
            </div>
        `;
    };

    // Mostrar evolución
    const renderEvolution = async (pokemonId) => {
        const speciesRes = await fetch(
            `https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`
        );
        const speciesData = await speciesRes.json();

        const evoRes = await fetch(speciesData.evolution_chain.url);
        const evoData = await evoRes.json();

        const buildChain = async (node) => {
            const res = await fetch(
                `https://pokeapi.co/api/v2/pokemon/${node.species.name}`
            );
            const data = await res.json();

            let html = `
                <div class="evo-card ${node.species.name === activeEvolution ? "active" : ""}"
                     data-name="${node.species.name}">
                    <img src="${data.sprites.front_default}">
                    <div>${node.species.name.toUpperCase()}</div>
                </div>
            `;

            if (node.evolves_to.length) {
                html += `<div style="font-size:2rem;">→</div>`;
                html += await buildChain(node.evolves_to[0]);
            }
            return html;
        };

        const chainHTML = await buildChain(evoData.chain);

        htmlElements.container.innerHTML += `
            <div class="pokemon-card" style="margin-top:30px;">
                <h3 style="text-align:center;margin-bottom:20px;">
                    CADENA DE EVOLUCIÓN
                </h3>
                <div style="display:flex;justify-content:center;gap:20px;">
                    ${chainHTML}
                </div>
            </div>
        `;
    };

    // Buscar habilidad
    const buscarHabilidad = async (valor) => {
        const res = await fetch(
            `https://pokeapi.co/api/v2/ability/${valor}`
        );
        if (!res.ok) throw new Error();

        const data = await res.json();
        const desc =
            data.effect_entries.find(e => e.language.name === "es")
                ?.short_effect || "Descripción no disponible";

        htmlElements.container.innerHTML = `
            <div class="pokemon-card">
                <div style="font-weight:bold;font-size:1.2rem;">
                    ⚡ ${data.name.toUpperCase()}
                </div>
                <p style="margin:15px 0;">${desc}</p>
            </div>
        `;
    };

    // Mostrar histórico
    const renderHistory = () => {
        if (!htmlElements.historyList) return;

        const history = utils.getHistory();
        if (!history.length) {
            htmlElements.historyList.innerHTML =
                `<div class="pokemon-card">📭 No hay búsquedas todavía</div>`;
            return;
        }

        htmlElements.historyList.innerHTML = history.map(p => `
            <div class="pokemon-card" style="display:flex;align-items:center;gap:15px;">
                <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png" width="60">
                <div data-id="${p.id}" style="flex-grow:1;cursor:pointer;">
                    <strong>#${p.id} ${p.name.toUpperCase()}</strong>
                </div>
                <button data-remove="${p.id}">🗑</button>
            </div>
        `).join("");

        htmlElements.historyList.onclick = (e) => {
            if (e.target.dataset.id) {
                window.location.href =
                    `index.html?pokemon=${e.target.dataset.id}`;
            }
            if (e.target.dataset.remove) {
                utils.removeFromHistory(Number(e.target.dataset.remove));
                renderHistory();
            }
        };

        htmlElements.clearHistoryBtn?.addEventListener("click", () => {
            utils.clearHistoryAndCache();
            renderHistory();
        });
    };

    // Inicializar aplicación
    const init = () => {

        htmlElements.searchBtn?.addEventListener("click", buscar);

        htmlElements.input?.addEventListener("keypress", (e) => {
            if (e.key === "Enter") buscar();
        });

        htmlElements.container?.addEventListener("click", (e) => {
            const card = e.target.closest(".evo-card");
            if (!card) return;
            htmlElements.input.value = card.dataset.name;
            buscar();
        });

        htmlElements.tabs.forEach(tab => {
            tab.addEventListener("click", () => {
                if (tab.textContent.includes("HISTÓRICO"))
                    window.location.href = "historico.html";
                if (tab.textContent.includes("BUSCAR"))
                    window.location.href = "index.html";
            });
        });

        const params = new URLSearchParams(window.location.search);
        if (params.get("pokemon") && htmlElements.input) {
            htmlElements.input.value = params.get("pokemon");
            buscar();
        }

        renderHistory();
    };

    return { init };
})();

document.addEventListener("DOMContentLoaded", PokeFinderApp.init);

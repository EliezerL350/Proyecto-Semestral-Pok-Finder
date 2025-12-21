const PokeFinderApp = (() => {

    const CACHE_TTL = 1000 * 60 * 60 * 24;
    const HISTORY_KEY = "poke-history";
    const FAVORITES_KEY = "poke-favorites";

    let currentPokemon = null;

    const htmlElements = {
        input: document.getElementById('pokemon-input'),
        container: document.getElementById('result-container'),
        searchType: document.getElementById("search-type"),
        historyList: document.getElementById("history-list"),
        clearHistoryBtn: document.getElementById("clear-history"),
        searchBtn: document.querySelector(".btn-search"),
        tabs: document.querySelectorAll(".btn-tab")
    };

    const utils = {

        getFromCache(key) {
            const item = JSON.parse(localStorage.getItem(key));
            if (!item) return null;

            if (Date.now() - item.timestamp > CACHE_TTL) {
                localStorage.removeItem(key);
                return null;
            }
            return item.data;
        },

        saveToCache(key, data) {
            localStorage.setItem(key, JSON.stringify({
                data,
                timestamp: Date.now()
            }));
        },

        getHistory() {
            return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
        },

        saveHistory(pokemon) {
            let history = utils.getHistory()
                .filter(p => p.id !== pokemon.id);

            history.unshift({ id: pokemon.id, name: pokemon.name });
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        },

        removeFromHistory(id) {
            const history = utils.getHistory()
                .filter(p => p.id !== id);

            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        },

        clearHistoryAndCache() {
            localStorage.removeItem(HISTORY_KEY);
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith("pokemon-")) {
                    localStorage.removeItem(key);
                }
            });
        },

        //try catch de buscar pokemos
        async buscarPokemon() {
            const valor = htmlElements.input.value.toLowerCase().trim();
            const cacheKey = `pokemon-${valor}`;

            htmlElements.container.innerHTML = "⏳ Buscando...";

            try {
                let data = utils.getFromCache(cacheKey);
                let source = "CACHÉ";

                if (!data) {
                    const response = await fetch(
                        `https://pokeapi.co/api/v2/pokemon/${valor}`
                    );
                    if (!response.ok) throw new Error("No encontrado");

                    data = await response.json();
                    utils.saveToCache(cacheKey, data);
                    source = "API";
                }

                activeEvolution = data.name;
                renderPokemon(data, source);
                utils.saveHistory(data);
                await renderEvolution(data.id);

            } catch (error) {
                htmlElements.container.innerHTML =
                    `<div class="pokemon-card">❌ Pokémon no encontrado</div>`;
            }
        },


        async buscarHabilidad()
        {
            const valor = htmlElements.input.value.toLowerCase().trim();

            if (valor === "") {
                alert("Por favor escribe un nombre o ID.");
                return;
            }

            htmlElements.container.innerHTML = "⏳ Buscando...";

            try 
            {
                const response = await fetch(`https://pokeapi.co/api/v2/ability/${valor}`);
                if (!response.ok) throw new Error("No encontrado");
                data = await response.json();
            
               renderHabilidad(data);

            } catch (error) {
                htmlElements.container.innerHTML = `<div class="pokemon-card">❌ Habilidad no encontrado</div>`;
            }
        },

        //implementacion de favoritos
        getFavorites() {
            return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
        },

        isFavorite(id) {
            return utils.getFavorites().some(p => p.id === id);
        },

        toggleFavorite(pokemon) {
            let favorites = utils.getFavorites();

            if (utils.isFavorite(pokemon.id)) {
                favorites = favorites.filter(p => p.id !== pokemon.id);
            } else {
                favorites.push({
                    id: pokemon.id,
                    name: pokemon.name,
                    types: pokemon.types.map(t => t.type.name)
                });
            }

            localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        },

        removeFavorite(id) {
            const favorites = utils.getFavorites().filter(p => p.id !== id);
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        },

        clearFavorites() {
            localStorage.removeItem(FAVORITES_KEY);
        }

    };

    const renderHabilidad = (data) => {
        let descripcion = data.flavor_text_entries.find(flavor_text => flavor_text.language.name =="es");

        const pokemonList = data.pokemon.map(p => {
            const pokemonId = p.pokemon.url.split('/')[6];
            const isHidden = p.is_hidden ? "(oculta)" : "";
            const hiddenStyle = p.is_hidden ? "color: var(--red-poke); font-style: italic;" : "background-color: transparent;";
            
            return `
                <div class="pokemon-item-card" data-pokemon-name="${p.pokemon.name}">
                    <img class="pokemon-item-img" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png" alt="${p.pokemon.name}">
                    <div class="pokemon-item-info">
                        <span class="pokemon-item-name">${p.pokemon.name.toUpperCase()}</span>
                        <span class="pokemon-item-hidden" style="${hiddenStyle}">
                            ${isHidden}
                        </span>
                    </div>
                </div>
            `;
        }).join('');

        htmlElements.container.innerHTML = `
            <div class="pokemon-card">
                <div id="habilidad-title">
                    ✨ ${data.name.toUpperCase()}
                    <span style="
                    border: 2px solid black;
                    color: var(--color-primary);
                    background-color: var(--yellow-accent);
                    padding: 0px 10px;
                    ">
                    #${data.id}
                    </span>
                </div>

                <div id="habilidad-desc">
                        <span style="
                            font-weight: bold;
                            padding-bottom: 10px;">EFECTO
                        </span>
                        <span>${descripcion.flavor_text}</span>
                </div>

                <span style="font-weight: bold; display: block; margin: 15px 0 10px 0;">
                    POKÉMON CON ESTA HABILIDAD (${data.pokemon.length})
                </span>

                <div class="pokemonLista">
                    ${pokemonList}
                </div>
            </div>
        `

        htmlElements.container.querySelectorAll('.pokemon-item-card').forEach(item => {
            item.addEventListener('click', async () => {
                const pokemonName = item.dataset.pokemonName;
                htmlElements.input.value = pokemonName;
                await utils.buscarPokemon();
            });
        });
    }

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
                await utils.buscarPokemon();
            } else {
                await utils.buscarHabilidad();
            }
        } catch {
            htmlElements.container.innerHTML =
                `<div class="pokemon-card">❌ No encontrado</div>`;
        }
    };

    //Render, presentacion
    const renderPokemon = (data, source) => {
    currentPokemon = data;
    const isFav = utils.isFavorite(data.id);

    // Sección de habilidades (ya agregada antes)
    const abilitiesHTML = data.abilities.map(a => `
        <span style="background: ${a.is_hidden ? 'var(--yellow-accent)' : 'var(--color-success)'}; 
                     color: var(--color-primary); padding: 8px 12px; font-weight: bold; border: var(--border);">
            ${a.ability.name.toUpperCase()}${a.is_hidden ? ' (OCULTA)' : ''}
        </span>
    `).join('');

    // Renderiza la tarjeta principal
    htmlElements.container.innerHTML = `
        <div class="pokemon-card">
            <div style="font-weight:bold;font-size:1.4rem;margin-bottom:10px;">
                <span style="color:var(--red-poke)">#${data.id}</span>
                ${data.name.toUpperCase()}
                <!-- Agrega badge de origen aquí -->
                <span class="badge" style="background:${source === 'API' ? 'var(--color-api)' : 'var(--color-cache)'}; 
                        padding:4px 8px; margin-left:10px; border: var(--border); font-weight: bold;">
                    ${source}
                </span>
            </div>

            <div class="image-bg">
                <img src="${data.sprites.front_default}">
            </div>

            <div style="display:flex;gap:10px;margin:15px 0;">
                ${data.types.map(t => `
                    <span class="type-${t.type.name}" style="padding:8px 12px;font-weight:bold;">
                        ${t.type.name.toUpperCase()}
                    </span>
                `).join('')}
            </div>

            <div style="margin-bottom:15px;">
                <div style="font-weight:bold;margin-bottom:8px;">HABILIDADES</div>
                <div style="display:flex;gap:10px;flex-wrap:wrap;">
                    ${abilitiesHTML}
                </div>
            </div>

            <div class="stats-grid">
                ${data.stats.map(s => `
                    <div class="stat-row">
                        <span class="stat-name">${s.stat.name.toUpperCase()}:</span>
                        <div class="stat-bar-outer">
                            <div class="stat-bar-inner" style="width:${(s.base_stat / 255) * 100}%"></div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- Botón de favorito integrado -->
            <div style="margin-top:20px; text-align:center;">
                <button id="fav-btn" class="fav-btn" data-id="${data.id}">
                    ${isFav ? "❤️" : "🤍"}
                </button>
            </div>

            <!-- Sección de evolución (se appendeará aquí vía JS) -->
            <div id="evolution-section"></div>
        </div>
    `;

    // Llama a renderEvolution y append a #evolution-section dentro de la tarjeta
    renderEvolution(data.id);
};

    //mostrar evoluciones
    const renderEvolution = async (pokemonId) => {
        const evoContainer = document.getElementById("evolution-section");
        if (!evoContainer) return; 

        evoContainer.innerHTML = '<div style="text-align:center; padding:20px;">⏳ Cargando evoluciones...</div>';

        try {
            const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`);
            const speciesData = await speciesRes.json();
            const evoRes = await fetch(speciesData.evolution_chain.url);
            const evoData = await evoRes.json();

            // Función para obtener imagen y datos de cada pokemon en la cadena
            const getEvoData = async (speciesName) => {
                const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${speciesName}`);
                return await res.json();
            };

            //elementos
            const buildChainHTML = async (node) => {
                const data = await getEvoData(node.species.name);
                let isActive = node.species.name === currentPokemon.name ? "active" : "";

                // Iniciamos el nodo
                // Dentro de tu función buildChainHTML busca esta parte:
                let html = `
                    <div class="evo-node">
                        <div class="evo-card ${isActive}" data-name="${node.species.name}">
                            <div class="evo-img-container">
                                <img src="${data.sprites.front_default}">
                            </div>
                            <div>${node.species.name.toUpperCase()}</div>
                        </div>
                `;

                if (node.evolves_to.length > 0) {
                    // CASO LINEAL (Pikachu, Bulbasaur, etc.)
                    if (node.evolves_to.length === 1) {
                        html += `
                            <div class="evo-arrow">
                                → 
                                <span class="evo-condition">LVL</span>
                            </div>
                            ${await buildChainHTML(node.evolves_to[0])}
                        `;
                    } 
                    // CASO RAMIFICADO (Eevee, Tyrogue, etc.)
                    else {
                        html += `</div><div class="evo-grid">`; // Cerramos el nodo actual y abrimos la rejilla
                        for (const evo of node.evolves_to) {
                            html += await buildChainHTML(evo);
                        }
                        html += `</div>`;
                        return html;
                    }
                }

                html += `</div>`;
                return html;
            };

            const chainHTML = await buildChainHTML(evoData.chain);

            evoContainer.innerHTML = `
                <div style="border-top: 3px dashed var(--stroke); margin: 25px 0 15px 0; width: 100%;"></div>
                <h3 class="evo-title" style="text-align: center; margin-bottom: 20px;">CADENA DE EVOLUCIÓN</h3>
                <div class="evo-chain-wrapper" style="display: flex; flex-direction: column; align-items: center; overflow-x: auto; padding-bottom: 10px;">
                    ${chainHTML}
                </div>
            `;

        } catch (error) {
            console.error(error);
            evoContainer.innerHTML = '';
        }
    };


    //Favoritos
    const renderFavorites = () => {
        const container = document.getElementById("favorites-list");
        if (!container) return;

        const favorites = utils.getFavorites();

        if (!favorites.length) {
            container.innerHTML =
                `<div class="pokemon-card">💔 No tienes favoritos todavía</div>`;
            return;
        }

        container.innerHTML = favorites.map(p => `
            <div class="pokemon-card fav-card">

                <div class="fav-top">
                    <div class="fav-img-frame">
                        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png">
                    </div>

                    <button class="fav-remove" data-id="${p.id}">🗑</button>
                </div>

                <div class="fav-name">
                    ${p.name.toUpperCase()}
                </div>

                <div class="fav-id">
                    #${String(p.id).padStart(3, "0")}
                </div>

                <div class="fav-types">
                    ${p.types.map(t => `
                        <span class="fav-type type-${t}">
                            ${t.toUpperCase()}
                        </span>
                    `).join("")}
                </div>

            </div>
        `).join("");


        container.onclick = (e) => {
            if (e.target.classList.contains("fav-remove")) {
                utils.removeFavorite(Number(e.target.dataset.id));
                renderFavorites();
            }
        };
    };


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

    const init = () => {

        htmlElements.searchBtn?.addEventListener("click", () =>{
            if(document.querySelector('select').value == "Pokémon"){
                utils.buscarPokemon(); 
            }else if (document.querySelector('select').value == "Habilidad")
            {
                 utils.buscarHabilidad(); 
            }
        });

        htmlElements.input?.addEventListener("keypress", (e) => {
            if (e.key === 'Enter')
                {
                    if(document.querySelector('select').value == "Pokémon"){
                        utils.buscarPokemon(); 
                    }else if (document.querySelector('select').value == "Habilidad")
                        utils.buscarHabilidad();
                }
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
                if (tab.textContent.includes("FAVORITOS"))
                    window.location.href = "favoritos.html";
            });
        });

        const params = new URLSearchParams(window.location.search);
        if (params.get("pokemon") && htmlElements.input) {
            htmlElements.input.value = params.get("pokemon");
            buscar();
        }

        renderHistory();

        //favoritos y evoluciones
        htmlElements.container?.addEventListener("click", (e) => {
            // ❤️ FAVORITOS
            if (e.target.id === "fav-btn") {
                const pokemonId = Number(e.target.dataset.id);

                utils.toggleFavorite(currentPokemon);

                e.target.textContent =
                    utils.isFavorite(pokemonId) ? "❤️" : "🤍";
            }

            // 🔄 EVOLUCIONES
            const card = e.target.closest(".evo-card");
            if (card) {
                htmlElements.input.value = card.dataset.name;
                buscar();
            }
        });

        const clearFavBtn = document.getElementById("clear-favorites");
            clearFavBtn?.addEventListener("click", () => {
                utils.clearFavorites();
                renderFavorites();
            });


        // Si estamos en favoritos.html, renderizar favoritos
        if (document.getElementById("favorites-list")) {
            renderFavorites();
        }   

    };

    return { init };
})();

document.addEventListener("DOMContentLoaded", PokeFinderApp.init);

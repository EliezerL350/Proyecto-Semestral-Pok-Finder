const PokeFinderApp = (() => {

    const CACHE_TTL = 1000 * 60 * 60 * 24;
    const HISTORY_KEY = "poke-history";
    let activeEvolution = null;

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

        async buscarPokemon() {
            const valor = htmlElements.input.value.toLowerCase().trim();
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
                <div style="
                display: flex;
                justify-content: space-between;
                border-bottom: 4px solid black;
                font-weight: bolder;
                padding: 10px 0px;
                margin-bottom: 25px;
                font-size: 1.7rem;">
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

                <div style="margin-bottom: 8px;
                    display: flex;
                    flex-direction: column;
                    background-color: lightgrey;
                    border: 4px solid black;
                    padding: 20px;">
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

            if (node.evolves_to.length > 0) {
                html += `<div style="display:flex;gap:20px;align-items:center;">`;

                for(const evo of node.evolves_to) {
                    html += `<div style="font-size:2rem;">→</div>`;
                    html += await buildChain(evo);
                }

                html += `</div>`;
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

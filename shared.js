// shared.js
const PokeFinderApp = (() => {

    const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 horas
    let activeEvolution = null;

    /* =====================
       DATA STRUCTURE
    ===================== */
    class EvolutionNode {
        constructor(name, sprite) {
            this.name = name;
            this.sprite = sprite;
            this.next = null;
            this.branches = [];
        }
    }

    /* =====================
       DOM CACHE
    ===================== */
    const htmlElements = {
        input: document.getElementById('pokemon-input'),
        container: document.getElementById('result-container'),
        searchBtn: document.querySelector('.btn-search')
    };

    /* =====================
       TEMPLATES
    ===================== */
    const templates = {};

    templates.evolutionChain = (root) => {

        const renderNode = (node) => `
            <div class="evo-card ${node.name === activeEvolution ? 'active' : ''}"
                data-name="${node.name}"
                style="
                    border:4px solid black;
                    padding:10px;
                    cursor:pointer;
                    text-align:center;
                    width:120px;
                    box-shadow:6px 6px 0 black;">
                <img src="${node.sprite}" style="width:80px">
                <div style="font-weight:bold;margin-top:5px">
                    ${node.name.toUpperCase()}
                </div>
            </div>
        `;


        let html = `
            <div style="margin-top:30px">
                <hr style="border:2px dashed black;margin:20px 0;">
                <h3 style="text-align:center;margin-bottom:20px">
                    CADENA DE EVOLUCIÓN
                </h3>
                <div style="
                    display:flex;
                    justify-content:center;
                    flex-wrap:wrap;
                    gap:20px;
                    max-width:600px;
                    margin:0 auto;
                ">

        `;

        let current = root;
        html += renderNode(current);

        while (current.next) {
            html += `<div style="font-size:2rem;align-self:center">→</div>`;
            html += renderNode(current.next);
            current = current.next;
        }

        if (current.branches.length > 0) {
            html += `
                </div>
                <div style="display:flex;justify-content:center;gap:20px;margin-top:20px">
            `;
            current.branches.forEach(b => {
                html += renderNode(b);
            });
        }

        html += `</div></div>`;
        return html;
    };

    // UTILS
    
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

        async fetchEvolutionChain(pokemonId) {
            const speciesRes = await fetch(
                `https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`
            );
            const speciesData = await speciesRes.json();

            const evoRes = await fetch(speciesData.evolution_chain.url);
            const evoData = await evoRes.json();

            return evoData.chain;
        },

        async buildEvolutionTree(chain) {

            const createNode = async (species) => {
                const res = await fetch(
                    `https://pokeapi.co/api/v2/pokemon/${species.name}`
                );
                const data = await res.json();
                return new EvolutionNode(
                    species.name,
                    data.sprites.front_default
                );
            };

            const root = await createNode(chain.species);
            let current = root;
            let evolves = chain.evolves_to;

            while (evolves.length > 0) {
                if (evolves.length === 1) {
                    const nextNode = await createNode(evolves[0].species);
                    current.next = nextNode;
                    current = nextNode;
                    evolves = evolves[0].evolves_to;
                } else {
                    for (let evo of evolves) {
                        current.branches.push(
                            await createNode(evo.species)
                        );
                    }
                    break;
                }
            }
            return root;
        }
    };

    //handlers
    const handlers = {

        async onSearch() {
            const valor = htmlElements.input.value.toLowerCase().trim();
            if (!valor) return alert("Escribe un nombre o ID");

            // ✅ MARCAR ACTIVO AL BUSCAR ESCRIBIENDO
 
            htmlElements.container.innerHTML = "⏳ Buscando...";

            const cacheKey = `pokemon-${valor}`;

            try {
                let data = utils.getFromCache(cacheKey);
                let source = "CACHÉ";

                if (!data) {
                    const res = await fetch(
                        `https://pokeapi.co/api/v2/pokemon/${valor}`
                    );
                    if (!res.ok) throw new Error();
                    data = await res.json();
                    utils.saveToCache(cacheKey, data);
                    source = "API";
                }
                activeEvolution = data.name;

                renderPokemon(data, source);

                const chain = await utils.fetchEvolutionChain(data.id);
                const tree = await utils.buildEvolutionTree(chain);
                htmlElements.container.innerHTML +=
                    templates.evolutionChain(tree);

            } catch {
                htmlElements.container.innerHTML =
                    `<div class="pokemon-card">❌ Pokémon no encontrado</div>`;
            }
        },

        
        onEvolutionClick(e) {
            const card = e.target.closest('.evo-card');
            if (!card) return;

            activeEvolution = card.dataset.name;

            htmlElements.input.value = activeEvolution;
            handlers.onSearch();
        }


    };

    //RENDER
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
                        background:${source === 'API'
                            ? 'var(--color-success)'
                            : 'var(--color-cache)'};
                    ">
                        ${source}
                    </span>
                </div>

                <div class="image-bg">
                    <img src="${data.sprites.front_default}" alt="${data.name}">
                </div>

                <!-- TIPOS -->
                <div style="display:flex;gap:10px;margin:15px 0;">
                    ${data.types.map(t => `
                        <span style="
                            background:var(--stroke);
                            color:white;
                            padding:8px 12px;
                            font-weight:bold;
                            font-size:0.8rem;">
                            ${t.type.name.toUpperCase()}
                        </span>
                    `).join('')}
                </div>

                <!-- STATS -->
                <div class="stats-grid">
                    ${data.stats.map(s => `
                        <div class="stat-row">
                            <span class="stat-name">
                                ${s.stat.name.toUpperCase()}
                            </span>
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


    /* =====================
       INIT
    ===================== */
    const init = () => {
        htmlElements.searchBtn.addEventListener(
            'click', handlers.onSearch
        );

        htmlElements.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handlers.onSearch();
        });

        htmlElements.container.addEventListener(
            'click', handlers.onEvolutionClick
        );
    };

    return { init };
})();

document.addEventListener(
    "DOMContentLoaded",
    PokeFinderApp.init
);

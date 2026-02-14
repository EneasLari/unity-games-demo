async function loadGames() {
    const res = await fetch("./games.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Could not load games.json");
    return await res.json();
}

function qs(name) {
    const p = new URLSearchParams(location.search);
    return p.get(name);
}

function makeCard(g) {
    const playUrl = `play.html?game=${encodeURIComponent(g.id)}`;
    const directUrl = `games/${g.id}/index.html`;

    const tags = (g.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("");

    return `
    <article class="card">
      <img class="thumb" src="${g.thumb || "assets/default-thumb.png"}" alt="">
      <div class="cardbody">
        <h3 class="title">${escapeHtml(g.title || g.id)}</h3>
        <p class="desc">${escapeHtml(g.description || "")}</p>
        <div class="tags">${tags}</div>
        <div class="actions">
          <a class="btn primary" href="${playUrl}">Play</a>
          <a class="btn" href="${directUrl}" target="_blank" rel="noopener">Direct</a>
        </div>
      </div>
    </article>
  `;
}

function escapeHtml(s) {
    return String(s ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function initIndex() {
    const grid = document.getElementById("grid");
    const search = document.getElementById("search");
    if (!grid) return;

    const games = await loadGames();

    function render(filterText = "") {
        const f = filterText.trim().toLowerCase();
        const filtered = !f ? games : games.filter(g => {
            const hay = `${g.id} ${g.title} ${g.description} ${(g.tags || []).join(" ")}`.toLowerCase();
            return hay.includes(f);
        });

        grid.innerHTML = filtered.map(makeCard).join("") || `<p>No games found.</p>`;
    }

    render();
    if (search) search.addEventListener("input", () => render(search.value));
}

async function initPlay() {
    const frame = document.getElementById("frame");
    if (!frame) return;

    const gameId = qs("game");
    const title = document.getElementById("title");
    const desc = document.getElementById("desc");
    const fullscreenBtn = document.getElementById("fullscreenBtn");

    const games = await loadGames();
    const g = games.find(x => x.id === gameId) || games[0];

    if (!g) {
        if (title) title.textContent = "No games found";
        return;
    }

    const directUrl = `games/${g.id}/index.html`;
    if (title) title.textContent = g.title || g.id;
    if (desc) desc.textContent = g.description || "";
    frame.src = directUrl;


    if (fullscreenBtn) {
        const canFullscreen = !!document.fullscreenEnabled && typeof frame.requestFullscreen === "function";
        fullscreenBtn.disabled = !canFullscreen;

        const syncLabel = () => {
            const isFs = !!document.fullscreenElement;
            fullscreenBtn.textContent = isFs ? "Exit Fullscreen" : "Fullscreen";
        };

        syncLabel();
        document.addEventListener("fullscreenchange", syncLabel);

        fullscreenBtn.addEventListener("click", async () => {
            try {
                if (document.fullscreenElement) {
                    await document.exitFullscreen();
                } else {
                    await frame.requestFullscreen();
                }
            } catch (e) {
                console.warn("Fullscreen request failed", e);
            }
        });
    }
}

(async function boot() {
    try {
        await initIndex();
        await initPlay();
    } catch (e) {
        console.error(e);
        const grid = document.getElementById("grid");
        const title = document.getElementById("title");
        if (grid) grid.innerHTML = `<p>Failed to load. Check <code>games.json</code>.</p>`;
        if (title) title.textContent = "Failed to load game list";
    }
})();

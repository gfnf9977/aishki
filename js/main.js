function initTheme() {
    const savedTheme = localStorage.getItem('toolbox_theme');
    const themeBtn = document.getElementById('themeBtn');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeBtn.textContent = '☀️';
    }
}

function toggleTheme() {
    const root = document.documentElement;
    const themeBtn = document.getElementById('themeBtn');
    if (root.getAttribute('data-theme') === 'dark') {
        root.removeAttribute('data-theme');
        localStorage.setItem('toolbox_theme', 'light');
        themeBtn.textContent = '🌙';
    } else {
        root.setAttribute('data-theme', 'dark');
        localStorage.setItem('toolbox_theme', 'dark');
        themeBtn.textContent = '☀️';
    }
}

initTheme();

const categoryConfig = {
    "all": "Усі інструменти",
    "own_dev": "🚀 Власна розробка",
    "dev_tools": "💻 Розробка та Код",
    "frontend": "✨ Frontend та Дизайн",
    "visual_tools": "🎨 Дизайн, Фото та 3D",
    "text_bots": "🤖 Текст та Чат-боти",
    "media": "📥 Робота з контентом",
    "video_audio": "🎥 Відео та Аудіо",
    "edu_work": "🎓 Навчання та Документи",
    "lifestyle": "💡 Лайфстайл та Трекінг",
    "security": "🛡️ OSINT & Безпека",
    "games": "🎮 Ігри-таймкіллери",
    "tg_bots": "📱 Телеграм-боти",
    "trash": "🗑️ Смітник"
};

let toolsData = [];
let currentCategory = 'all';
let favorites = JSON.parse(localStorage.getItem('toolbox_favorites')) || [];
let usedTools = JSON.parse(localStorage.getItem('toolbox_used_tools')) || [];
let ratings = JSON.parse(localStorage.getItem('toolbox_ratings')) || {};
let trashedTools = JSON.parse(localStorage.getItem('toolbox_trashed')) || [];

function updateRating(id, value, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    ratings[id] = parseInt(value);
    localStorage.setItem('toolbox_ratings', JSON.stringify(ratings));
    document.getElementById(`rating-val-${id}`).textContent = value;
}

async function loadTools() {
    try {
        const response = await fetch('data/tools.json');
        if (!response.ok) throw new Error("Не вдалося завантажити tools.json");
        toolsData = await response.json();
        buildNavigation();
        filterAndRender();
    } catch (error) {
        document.getElementById('toolsContainer').innerHTML =
            `<p style="color:red; text-align:center; width:100%; font-weight:bold;">Помилка: ${error.message}</p>`;
    }
}

function buildNavigation() {
    const nav = document.getElementById('categoriesNav');
    nav.innerHTML = '';
    
    for (const [key, name] of Object.entries(categoryConfig)) {
        const btn = document.createElement('button');
        
        let specialClass = '';
        if (key === 'own_dev') specialClass = 'cat-btn-own';
        if (key === 'tg_bots') specialClass = 'cat-btn-tg';
        if (key === 'trash') specialClass = 'cat-btn-trash';

        btn.className = `cat-btn ${specialClass} ${key === currentCategory ? 'active' : ''}`;
        btn.textContent = name;
        
        btn.onclick = () => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = key;
            document.getElementById('toolSearch').value = '';
            filterAndRender();
        };
        nav.appendChild(btn);
    }
}

function toggleFavorite(id, event) {
    event.preventDefault();
    favorites = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    localStorage.setItem('toolbox_favorites', JSON.stringify(favorites));
    filterAndRender();
}

function toggleTrash(id, event) {
    event.preventDefault();
    event.stopPropagation();
    
    if (trashedTools.includes(id)) {
        trashedTools = trashedTools.filter(t => t !== id);
    } else {
        trashedTools.push(id);
    }
    
    localStorage.setItem('toolbox_trashed', JSON.stringify(trashedTools));
    filterAndRender();
}

function toggleUsed(id, event) {
    event.preventDefault();
    usedTools = usedTools.includes(id) ? usedTools.filter(u => u !== id) : [...usedTools, id];
    localStorage.setItem('toolbox_used_tools', JSON.stringify(usedTools));
    filterAndRender();
}

function getBadgeClass(str = "") {
    const lower = str.toLowerCase();
    if (lower.includes('free') && !lower.includes('freemium')) return 'free';
    if (lower.includes('freemium')) return 'freemium';
    if (lower.includes('paid')) return 'paid';
    if (lower.includes('open source')) return 'opensource';
    return '';
}

function renderTools(toolsToRender) {
    const container = document.getElementById('toolsContainer');
    container.innerHTML = '';

    if (toolsToRender.length === 0) {
        container.innerHTML = '<p style="text-align:center; width:100%; color:var(--text-muted); font-size:1.1rem; font-weight:500;">Нічого не знайдено за цими фільтрами.</p>';
        return;
    }

    toolsToRender.forEach((tool, index) => {
        const badgeClass = getBadgeClass(tool.monetization);
        const isFav = favorites.includes(tool.id);
        const isUsed = usedTools.includes(tool.id);
        const isTrashed = trashedTools.includes(tool.id);

        const card = document.createElement('a');
        card.href = tool.url;
        card.target = "_blank";
        card.className = 'tool-card';
        card.style.animationDelay = `${index * 0.04}s`;

        let visualElement = (tool.image && tool.image.trim() !== '') ?
            `<div class="tool-img-wrapper">
                <img src="${tool.image}" alt="${tool.name}" class="tool-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <div class="tool-icon" style="display:none;">${tool.icon || '🚀'}</div>
            </div>` :
            `<div class="tool-img-wrapper" style="background: var(--bg); border: none;">
                <div class="tool-icon">${tool.icon || '🚀'}</div>
            </div>`;

        let tagsHTML = '';
        if (tool.categories && tool.categories.length > 0) {
            tagsHTML = '<div class="tags-wrapper">';
            tool.categories.forEach(catKey => {
                tagsHTML += `<span class="category-tag">#${catKey}</span>`;
            });
            tagsHTML += '</div>';
        }

        let ratingHTML = '';
        if (isUsed) {
            const currentRating = ratings[tool.id] || 5;
            ratingHTML = `
                <div class="rating-wrapper" onclick="event.preventDefault(); event.stopPropagation();" onmousedown="event.stopPropagation();">
                    <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">Оцінка:</span>
                    <input type="range" min="1" max="10" value="${currentRating}" class="rating-slider" oninput="updateRating('${tool.id}', this.value, event)">
                    <span class="rating-value" id="rating-val-${tool.id}">${currentRating}</span>
                </div>`;
        }

        card.innerHTML = `
            <div class="card-top">
                ${visualElement}
                <div class="card-actions">
                    <button class="icon-btn trash-btn ${isTrashed ? 'active' : ''}" onclick="toggleTrash('${tool.id}', event)" title="${isTrashed ? 'Відновити' : 'У смітник'}">🗑️</button>
                    <button class="icon-btn fav-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite('${tool.id}', event)" title="В обране">${isFav ? '★' : '☆'}</button>
                </div>
            </div>
            <h2 class="tool-name">${tool.name}</h2>
            <p class="tool-desc">${tool.desc}</p>
            ${tagsHTML}
            <div class="badges-wrapper">
                <div class="badge ${badgeClass}">${tool.monetization || 'Інфо'}</div>
                <button class="used-btn ${isUsed ? 'active' : ''}" onclick="toggleUsed('${tool.id}', event)">${isUsed ? '✓ Протестовано' : '○ Не тестовано'}</button>
            </div>
            ${ratingHTML}
        `;

        container.appendChild(card);
    });
}

function filterAndRender() {
    const query = document.getElementById('toolSearch').value.toLowerCase();
    const usedFilter = document.getElementById('filterUsed').value;

    let filtered = toolsData;

    if (currentCategory === 'trash') {
        filtered = filtered.filter(t => trashedTools.includes(t.id));
    } else if (currentCategory === 'tg_bots') {
        filtered = filtered.filter(t => t.categories && t.categories.includes('tg_bots') && !trashedTools.includes(t.id));
    } else {
        filtered = filtered.filter(t => !trashedTools.includes(t.id));
        filtered = filtered.filter(t => !t.categories || !t.categories.includes('tg_bots'));
        
        if (currentCategory === 'own_dev') {
            filtered = filtered.filter(t => t.monetization && t.monetization.includes('Власна розробка'));
        } 
        else if (currentCategory !== 'all') {
            filtered = filtered.filter(t => t.categories && t.categories.includes(currentCategory));
        }
    }

    if (query.trim() !== '') {
        filtered = filtered.filter(t =>
            t.name.toLowerCase().includes(query) ||
            (t.desc && t.desc.toLowerCase().includes(query))
        );
    }

    const checkedMonetizations = Array.from(document.querySelectorAll('#filterMonetization input:checked')).map(cb => cb.value);

    if (checkedMonetizations.length === 0) {
        filtered = [];
    } else {
        filtered = filtered.filter(t => {
            const mon = t.monetization.toLowerCase();
            const isFreeOS = (mon.includes('free') && !mon.includes('freemium')) || mon.includes('open source');
            const isFreemium = mon.includes('freemium');
            const isPaid = mon.includes('paid');

            if (checkedMonetizations.includes('free') && isFreeOS) return true;
            if (checkedMonetizations.includes('freemium') && isFreemium) return true;
            if (checkedMonetizations.includes('paid') && isPaid) return true;
            return false;
        });
    }

    if (usedFilter === 'tested') filtered = filtered.filter(t => usedTools.includes(t.id));
    if (usedFilter === 'untested') filtered = filtered.filter(t => !usedTools.includes(t.id));

    filtered.sort((a, b) => (favorites.includes(b.id) ? 1 : 0) - (favorites.includes(a.id) ? 1 : 0));

    renderTools(filtered);
}

document.getElementById('toolSearch').addEventListener('input', filterAndRender);
document.querySelectorAll('#filterMonetization input').forEach(checkbox => {
    checkbox.addEventListener('change', filterAndRender);
});
document.getElementById('filterUsed').addEventListener('change', filterAndRender);

function toggleAiWidget() {
    const widget = document.getElementById('aiChatWindow');
    widget.classList.toggle('open');

    const tooltip = document.querySelector('.fab-tooltip');
    if (tooltip) {
        tooltip.style.opacity = '0';
        tooltip.style.animation = 'none';
    }
}

function getApiKey() {
    let key = localStorage.getItem('groq_api_key');
    if (!key) {
        key = prompt("Введіть ваш Groq API Key для роботи ШІ-Консьєржа:\n(Він безпечно збережеться локально у вашому браузері)");
        if (key && key.trim() !== "") {
            localStorage.setItem('groq_api_key', key.trim());
        } else {
            return null;
        }
    }
    return key;
}

async function analyzeTask() {
    const input = document.getElementById('taskInput').value.trim();
    const mode = document.querySelector('input[name="aiMode"]:checked').value;
    const responseBox = document.getElementById('aiResponse');

    if (input.length < 5) {
        alert("Опишіть задачу детальніше.");
        return;
    }
    if (toolsData.length === 0) {
        alert("База ще завантажується...");
        return;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
        alert("Без API ключа ШІ не зможе відповісти.");
        return;
    }

    responseBox.innerHTML = "<em>Аналізую запит...</em>";
    responseBox.style.display = 'block';

    const localContext = toolsData.map(t => `- ${t.name}: ${t.desc} (URL: ${t.url})`).join('\n');
    const formattingRule = "\nОБОВ'ЯЗКОВЕ ПРАВИЛО: Назви всіх інструментів ПОВИННІ бути оформлені як Markdown-посилання: [Назва інструменту](URL). Відповідай коротко українською.";

    let systemPrompt = "";
    if (mode === "global") {
        systemPrompt = `Ти експерт з цифрових інструментів. Запропонуй 1-3 найкращі варіанти з усього інтернету. Якщо береш з бази, бери URL звідти. База:\n${localContext}` + formattingRule;
    } else if (mode === "local") {
        systemPrompt = `Ти консьєрж каталогу. Запропонуй 1-3 варіанти ТІЛЬКИ З ЦЬОГО СПИСКУ. Обов'язково використовуй URL з бази:\n${localContext}` + formattingRule;
    } else if (mode === "exclude") {
        systemPrompt = `Ти експерт з софту. Запропонуй 1-3 НОВІ альтернативи з інтернету, вказуючи їхні офіційні сайти. УНИКАЙ бази:\n${localContext}` + formattingRule;
    }

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "system", content: systemPrompt }, { role: "user", content: input }],
                temperature: 0.6,
                max_tokens: 800
            })
        });

        if (response.status === 401) {
            localStorage.removeItem('groq_api_key');
            throw new Error("Недійсний API ключ. Спробуйте ще раз.");
        }
        if (!response.ok) throw new Error(`Помилка API: ${response.status}`);

        const data = await response.json();
        let aiText = data.choices[0]?.message?.content || "Помилка.";

        aiText = aiText
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" style="color: var(--primary); font-weight: 700; text-decoration: none; border-bottom: 1px dashed var(--primary);">$1</a>')
            .replace(/\n/g, '<br>');

        responseBox.innerHTML = aiText;
    } catch (err) {
        responseBox.innerHTML = `Помилка: ${err.message}`;
    }
}

function clearAssistant() {
    document.getElementById('taskInput').value = '';
    document.getElementById('aiResponse').style.display = 'none';
}

loadTools();
// --- ІНІЦІАЛІЗАЦІЯ SUPABASE ---
const SUPABASE_URL = 'https://vlhakekenojwkmbzvjtb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsaGFrZWtlbm9qd2ttYnp2anRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MjExNTYsImV4cCI6MjEwNjA5NzE1Nn0.h5ta8O6sc12U02U8M5TcbQTiRQS9WKT-c7i9PIbtY1k';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
// -----------------------------

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

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

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
    "tg_bots": "📱 Телеграм-боти"
};

let toolsData = [];
let currentCategory = 'all';

let userPreferences = JSON.parse(localStorage.getItem('toolbox_prefs')) || {};

function savePrefs() {
    localStorage.setItem('toolbox_prefs', JSON.stringify(userPreferences));
}

function initToolPref(id) {
    if (!userPreferences[id]) {
        userPreferences[id] = { fav: false, used: false, rating: 5 };
    }
}

function updateRating(id, value, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    initToolPref(id);
    userPreferences[id].rating = parseInt(value);
    savePrefs();
    document.getElementById(`rating-val-${id}`).textContent = value;
}

async function loadTools() {
    try {
        const { data, error } = await supabaseClient
            .from('tools')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        toolsData = data || [];

        toolsData = toolsData.map(t => ({
            id: t.id,
            name: t.name,
            url: t.url,
            image: t.image || '',
            desc: t.description || '',
            monetization: t.monetization || '',
            categories: t.categories || [],
            is_own: t.is_own || false
        }));

        buildNavigation();
        filterAndRender();
    } catch (error) {
        document.getElementById('toolsContainer').innerHTML =
            `<p style="color:red; text-align:center; width:100%; font-weight:bold;">Помилка БД: ${error.message}</p>`;
        console.error("Supabase error:", error);
    }
}

function buildNavigation() {
    const nav = document.getElementById('categoriesNav');
    nav.innerHTML = '';
    
    const allBtn = document.createElement('button');
    allBtn.className = `cat-btn ${currentCategory === 'all' ? 'active' : ''}`;
    allBtn.textContent = 'Усі інструменти';
    allBtn.onclick = () => {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        allBtn.classList.add('active');
        currentCategory = 'all';
        document.getElementById('toolSearch').value = '';
        filterAndRender();
    };
    nav.appendChild(allBtn);

    const dbCategories = new Set();
    toolsData.forEach(tool => {
        if (tool.categories) tool.categories.forEach(c => dbCategories.add(c));
    });

    dbCategories.forEach(cat => {
        const btn = document.createElement('button');
        
        let specialClass = '';
        if (cat === 'own_dev') specialClass = 'cat-btn-own';
        if (cat === 'tg_bots') specialClass = 'cat-btn-tg';

        btn.className = `cat-btn ${specialClass} ${cat === currentCategory ? 'active' : ''}`;
        
        const displayName = categoryConfig[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
        btn.textContent = displayName;
        
        btn.onclick = () => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = cat;
            document.getElementById('toolSearch').value = '';
            filterAndRender();
        };
        nav.appendChild(btn);
    });
}

function toggleFavorite(id, event) {
    event.preventDefault();
    initToolPref(id);
    userPreferences[id].fav = !userPreferences[id].fav;
    savePrefs();
    filterAndRender();
}

function toggleUsed(id, event) {
    event.preventDefault();
    initToolPref(id);
    userPreferences[id].used = !userPreferences[id].used;
    savePrefs();
    filterAndRender();
}

async function deleteTool(id, event) {
    event.preventDefault();
    event.stopPropagation();

    if (!confirm('Ти впевнений, що хочеш назавжди видалити цей інструмент з бази?')) {
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('tools')
            .delete()
            .eq('id', id);

        if (error) throw error;

        alert('✅ Інструмент видалено!');
        loadTools();
    } catch (error) {
        console.error("Помилка видалення:", error);
        alert(`Помилка: ${error.message}`);
    }
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

    const addCard = document.createElement('div');
    addCard.className = 'tool-card add-new-card';
    addCard.onclick = toggleAddModal;
    addCard.innerHTML = `
        <div class="add-new-card-icon">➕</div>
        <span>Створити новий</span>
    `;
    container.appendChild(addCard);

    if (toolsToRender.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.style.cssText = 'text-align:center; width:100%; color:var(--text-muted); font-size:1.1rem; font-weight:500;';
        emptyMsg.textContent = 'Нічого не знайдено за цими фільтрами.';
        container.appendChild(emptyMsg);
        return;
    }

    toolsToRender.forEach((tool, index) => {
        const badgeClass = getBadgeClass(tool.monetization);
        const prefs = userPreferences[tool.id] || { fav: false, used: false, rating: 5 };
        const isFav = prefs.fav;
        const isUsed = prefs.used;
        const currentRating = prefs.rating;

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
                    <button class="icon-btn" onclick="event.preventDefault(); toggleAddModal('${tool.id}')" title="Редагувати">✏️</button>
                    <button class="icon-btn trash-btn" onclick="deleteTool('${tool.id}', event)" title="Видалити">🗑️</button>
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

    if (currentCategory === 'tg_bots') {
        filtered = filtered.filter(t => t.categories && t.categories.includes('tg_bots'));
    } else {
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
            const mon = (t.monetization || '').toLowerCase();
            const isFreeOS = (mon.includes('free') && !mon.includes('freemium')) || mon.includes('open source');
            const isFreemium = mon.includes('freemium');
            const isPaid = mon.includes('paid');

            if (checkedMonetizations.includes('free') && isFreeOS) return true;
            if (checkedMonetizations.includes('freemium') && isFreemium) return true;
            if (checkedMonetizations.includes('paid') && isPaid) return true;
            return false;
        });
    }

    if (usedFilter === 'tested') filtered = filtered.filter(t => userPreferences[t.id] && userPreferences[t.id].used);
    if (usedFilter === 'untested') filtered = filtered.filter(t => !userPreferences[t.id] || !userPreferences[t.id].used);

    filtered.sort((a, b) => ((userPreferences[b.id] && userPreferences[b.id].fav) ? 1 : 0) - ((userPreferences[a.id] && userPreferences[a.id].fav) ? 1 : 0));

    renderTools(filtered);
}

const debouncedSearch = debounce(filterAndRender, 300);
document.getElementById('toolSearch').addEventListener('input', debouncedSearch);
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

let selectedCategoriesForNewTool = [];
let editingToolId = null;

function populateCategoriesModal() {
    const container = document.getElementById('modalCategoriesList');
    container.innerHTML = '';
    
    const allCategories = new Set(selectedCategoriesForNewTool); 
    toolsData.forEach(tool => {
        if (tool.categories) tool.categories.forEach(c => allCategories.add(c));
    });

    allCategories.forEach(cat => {
        const chip = document.createElement('div');
        chip.className = 'cat-chip';
        
        const displayName = categoryConfig[cat] || cat; 
        chip.textContent = displayName;
        
        if (selectedCategoriesForNewTool.includes(cat)) {
            chip.classList.add('selected');
        }

        chip.onclick = () => {
            chip.classList.toggle('selected');
            if (selectedCategoriesForNewTool.includes(cat)) {
                selectedCategoriesForNewTool = selectedCategoriesForNewTool.filter(c => c !== cat);
            } else {
                selectedCategoriesForNewTool.push(cat);
            }
        };
        container.appendChild(chip);
    });
}

function addNewCategoryToSelection() {
    const input = document.getElementById('newCategoryInput');
    const rawVal = input.value.trim();
    if (!rawVal) return;
    
    if (!selectedCategoriesForNewTool.includes(rawVal)) {
        selectedCategoriesForNewTool.push(rawVal);
        populateCategoriesModal();
    }
    input.value = '';
}

function toggleAddModal(toolId = null) {
    const modal = document.getElementById('addToolModal');
    const headerTitle = modal.querySelector('.modal-header h2');
    const submitBtn = modal.querySelector('.btn-submit-tool');

    if (!modal.classList.contains('active')) {
        editingToolId = typeof toolId === 'string' ? toolId : null;
        
        if (editingToolId) {
            headerTitle.textContent = '✏️ Редагувати інструмент';
            submitBtn.textContent = 'Оновити в базі';
            
            const tool = toolsData.find(t => t.id === editingToolId);
            if (tool) {
                document.getElementById('newToolName').value = tool.name || '';
                document.getElementById('newToolUrl').value = tool.url || '';
                document.getElementById('newToolImage').value = tool.image || '';
                document.getElementById('newToolDesc').value = tool.desc || '';
                document.getElementById('newToolMonetization').value = tool.monetization || '🆓 Free';
                document.getElementById('newToolIsOwn').checked = tool.is_own || false;
                
                selectedCategoriesForNewTool = [...(tool.categories || [])];
            }
        } else {
            headerTitle.textContent = '✨ Додати інструмент';
            submitBtn.textContent = 'Зберегти в базу';
            
            document.getElementById('newToolName').value = '';
            document.getElementById('newToolUrl').value = '';
            document.getElementById('newToolImage').value = '';
            document.getElementById('newToolDesc').value = '';
            document.getElementById('newToolIsOwn').checked = false;
            
            selectedCategoriesForNewTool = [];
        }
        
        populateCategoriesModal();
    }
    
    modal.classList.toggle('active');
}

async function saveNewTool() {
    const name = document.getElementById('newToolName').value.trim();
    const url = document.getElementById('newToolUrl').value.trim();
    const image = document.getElementById('newToolImage').value.trim();
    const desc = document.getElementById('newToolDesc').value.trim();
    const monetization = document.getElementById('newToolMonetization').value;
    const isOwn = document.getElementById('newToolIsOwn').checked;
    
    if (!name || !url || !desc) {
        alert('Будь ласка, заповніть обов\'язкові поля: Назва, Посилання та Опис.');
        return;
    }

    const toolDataToSave = {
        name: name,
        url: url,
        image: image,
        description: desc,
        monetization: monetization,
        categories: selectedCategoriesForNewTool,
        is_own: isOwn
    };

    try {
        if (editingToolId) {
            const { error } = await supabaseClient
                .from('tools')
                .update(toolDataToSave)
                .eq('id', editingToolId);

            if (error) throw error;
            alert('✅ Інструмент успішно оновлено!');
            
        } else {
            const newId = name.toLowerCase().replace(/[^a-z0-9а-яіїєґ]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);
            toolDataToSave.id = newId;

            const { error } = await supabaseClient
                .from('tools')
                .insert([toolDataToSave]);

            if (error) throw error;
            alert('✅ Інструмент успішно додано!');
        }

        toggleAddModal();
        loadTools(); 

    } catch (error) {
        console.error("Помилка при збереженні:", error);
        alert(`Помилка: ${error.message}`);
    }
}

loadTools();
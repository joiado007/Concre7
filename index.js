import { GoogleGenAI } from "@google/genai";

/**
 * CONCRE7 - CORE LOGIC (VANILLA JS)
 * Versão autônoma, sem dependências de frameworks ou ambientes internos.
 */

// 1. CONFIGURAÇÕES & MODELOS
const PAVER_MODELS = [
    { id: '16-faces', name: 'Paver 16 Faces', paversPerM2: 42, dimensions: '24x10x6 cm' },
    { id: 'tijolinho', name: 'Paver Tijolinho', paversPerM2: 50, dimensions: '20x10x6 cm' }
];

// 2. ESTADO INICIAL (PERSISTENTE)
let currentState = {
    selectedModelId: '16-faces',
    unitPrice: parseFloat(localStorage.getItem('concre7_unit_price') || '1.10'),
    history: JSON.parse(localStorage.getItem('concre7_history') || '[]')
};

// 3. INICIALIZAÇÃO DA IA
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// 4. FUNÇÕES DE UTILIDADE (UI)
const formatBRL = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const getAIProfessionalTip = async (area, total, modelName) => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Responda como um mestre de obras brasileiro experiente. O cliente orçou ${modelName} para ${area}m² (${total} unidades). Dê uma única dica técnica fundamental e curta de instalação. Máximo 12 palavras.`
        });
        return response.text;
    } catch (e) {
        return "Nivele bem a base com pó de pedra ou areia e use um compactador de placa vibratória.";
    }
};

// 5. RENDERIZAÇÃO DE COMPONENTES
function renderModelList() {
    const list = document.getElementById('model-list');
    if (!list) return;

    list.innerHTML = PAVER_MODELS.map(m => `
        <button data-model-id="${m.id}" class="model-card relative p-5 rounded-[2.5rem] border-2 transition-all flex flex-col items-center text-center gap-1 group
            ${currentState.selectedModelId === m.id ? 'border-orange-500 bg-orange-50/30 ring-8 ring-orange-500/5' : 'border-slate-50 bg-white hover:border-slate-200'}">
            <span class="text-[10px] font-black uppercase tracking-tighter ${currentState.selectedModelId === m.id ? 'text-orange-600' : 'text-slate-400'}">${m.name}</span>
            <span class="text-[9px] text-slate-300 font-bold mb-1">${m.dimensions}</span>
            <span class="text-[10px] font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl group-hover:bg-orange-100 transition-colors">${m.paversPerM2} PÇ/M²</span>
            ${currentState.selectedModelId === m.id ? '<div class="absolute -top-1 -right-1 bg-orange-500 text-white p-1 rounded-full shadow-lg"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><path d="M20 6 9 17l-5-5"/></svg></div>' : ''}
        </button>
    `).join('');

    // Re-adicionar listeners para seleção de modelo
    document.querySelectorAll('.model-card').forEach(card => {
        card.addEventListener('click', () => {
            currentState.selectedModelId = card.dataset.modelId;
            renderModelList();
        });
    });
}

function renderHistory() {
    const list = document.getElementById('history-items');
    if (!list) return;

    if (currentState.history.length === 0) {
        list.innerHTML = `
            <div class="py-24 text-center opacity-30 flex flex-col items-center gap-5">
                <div class="bg-slate-100 p-6 rounded-full">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
                </div>
                <p class="font-black text-xs uppercase tracking-[0.2em] text-slate-500">Histórico Limpo</p>
            </div>
        `;
        return;
    }

    list.innerHTML = currentState.history.map(item => `
        <div class="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-sm flex items-center justify-between animate-in">
            <div class="space-y-1">
                <div class="flex items-center gap-2">
                    <span class="text-base font-black text-slate-900">${item.area}m²</span>
                    <span class="text-[9px] font-black text-orange-500 uppercase bg-orange-50 px-2 py-0.5 rounded-lg">${item.modelName}</span>
                </div>
                <p class="text-[10px] text-slate-400 font-bold">${new Date(item.timestamp).toLocaleString('pt-BR', {day:'2-digit', month:'short'})} • ${item.total} un</p>
                <p class="text-sm font-black text-slate-800">${formatBRL(item.value)}</p>
            </div>
            <button onclick="window.deleteHistoryItem('${item.id}')" class="p-4 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all active:scale-90">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
        </div>
    `).join('');
}

// 6. LÓGICA DE CÁLCULO PRINCIPAL
async function performCalculation() {
    const areaVal = parseFloat(document.getElementById('area-input').value);
    const marginVal = parseInt(document.getElementById('margin-select').value);

    if (isNaN(areaVal) || areaVal <= 0) {
        alert("Ops! Informe o tamanho da área para calcular.");
        return;
    }

    const model = PAVER_MODELS.find(m => m.id === currentState.selectedModelId);
    const totalWithMargin = Math.ceil((areaVal * model.paversPerM2) * (1 + marginVal / 100));
    const finalValue = totalWithMargin * currentState.unitPrice;

    // Persistência
    const entry = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        area: areaVal,
        modelName: model.name,
        total: totalWithMargin,
        value: finalValue,
        margin: marginVal
    };

    currentState.history = [entry, ...currentState.history].slice(0, 20);
    localStorage.setItem('concre7_history', JSON.stringify(currentState.history));

    // UI Feedback
    const resultView = document.getElementById('result-view');
    resultView.classList.remove('hidden');
    resultView.innerHTML = `
        <div class="bg-slate-900 text-white rounded-[3rem] p-8 shadow-2xl relative overflow-hidden animate-in">
            <div class="absolute -right-8 -top-8 opacity-[0.03]">
                 <svg width="250" height="250" viewBox="0 0 24 24" fill="currentColor"><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z"/><path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"/></svg>
            </div>
            <div class="relative z-10 space-y-7">
                <div class="space-y-1">
                    <p class="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Quantidade Necessária</p>
                    <div class="flex items-baseline gap-2">
                        <h2 class="text-7xl font-black tracking-tighter">${totalWithMargin}</h2>
                        <span class="text-orange-500 font-black text-sm uppercase">Peças</span>
                    </div>
                    <p class="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Margem: +${marginVal}% para recortes</p>
                </div>
                <div class="pt-7 border-t border-slate-800 space-y-1">
                    <p class="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Orçamento Sugerido</p>
                    <p class="text-4xl font-black text-orange-400 tracking-tight">${formatBRL(finalValue)}</p>
                </div>
            </div>
        </div>
        
        <div class="bg-blue-50/50 border border-blue-100 p-6 rounded-[2rem] flex gap-4 items-center animate-in" style="animation-delay: 0.1s">
            <div class="bg-blue-500 text-white p-2.5 rounded-2xl shadow-lg shadow-blue-500/20">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div>
                <p class="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Dica do Especialista</p>
                <p id="ai-tip-text" class="text-xs font-bold text-blue-900 leading-snug">Sincronizando com a inteligência...</p>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-3 pb-8 animate-in" style="animation-delay: 0.2s">
             <button onclick="window.copyToClipboard('${totalWithMargin}', '${formatBRL(finalValue)}', '${model.name}')" class="flex items-center justify-center gap-2 py-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[10px] uppercase rounded-2xl active:scale-95 transition-all">
                Copiar Dados
             </button>
             <button onclick="window.sendToWhatsApp('${totalWithMargin}', '${formatBRL(finalValue)}', '${model.name}')" class="flex items-center justify-center gap-2 py-5 bg-green-500 hover:bg-green-600 text-white font-black text-[10px] uppercase rounded-2xl active:scale-95 shadow-xl shadow-green-500/20 transition-all">
                WhatsApp
             </button>
        </div>
    `;

    // Buscar dica AI
    const tip = await getAIProfessionalTip(areaVal, totalWithMargin, model.name);
    const tipEl = document.getElementById('ai-tip-text');
    if (tipEl) tipEl.innerText = tip;
}

// 7. FUNÇÕES GLOBAIS (DISPONÍVEIS NO WINDOW)
window.deleteHistoryItem = (id) => {
    currentState.history = currentState.history.filter(h => h.id !== id);
    localStorage.setItem('concre7_history', JSON.stringify(currentState.history));
    renderHistory();
};

window.copyToClipboard = (total, val, model) => {
    const text = `*Concre7 - Orçamento*\n\nModelo: ${model}\nQuantidade: ${total} peças\n*Valor Estimado: ${val}*\n\n_Calculado via Concre7 App_`;
    navigator.clipboard.writeText(text);
    alert('Dados copiados para a área de transferência!');
};

window.sendToWhatsApp = (total, val, model) => {
    const text = encodeURIComponent(`*Concre7 - Orçamento*\n\nModelo: ${model}\nQuantidade: ${total} peças\n*Valor Estimado: ${val}*`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
};

// 8. GERENCIAMENTO DE ABAS E EVENTOS
function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabs = document.querySelectorAll('.tab-content');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;
            
            // UI Toggle
            tabs.forEach(t => t.classList.remove('active'));
            document.getElementById(`${target}-tab`).classList.add('active');
            
            navBtns.forEach(b => {
                b.classList.remove('active');
                b.classList.add('text-slate-400');
            });
            btn.classList.add('active');
            btn.classList.remove('text-slate-400');

            // Refresh History if active
            if (target === 'history') renderHistory();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

// 9. EVENTOS DE CONFIGURAÇÃO
function initSettings() {
    const saveBtn = document.getElementById('save-price-btn');
    const priceInput = document.getElementById('settings-price-input');
    const display = document.getElementById('unit-price-display');

    saveBtn.addEventListener('click', () => {
        const val = parseFloat(priceInput.value);
        if (!isNaN(val) && val > 0) {
            currentState.unitPrice = val;
            localStorage.setItem('concre7_unit_price', val.toString());
            display.innerText = formatBRL(val);
            
            // Visual feedback
            saveBtn.innerText = "Salvo!";
            saveBtn.classList.replace('bg-slate-900', 'bg-green-500');
            setTimeout(() => {
                saveBtn.innerText = "Salvar";
                saveBtn.classList.replace('bg-green-500', 'bg-slate-900');
            }, 2000);
        }
    });

    document.getElementById('clear-history-btn').addEventListener('click', () => {
        if (confirm('Deseja realmente apagar todos os orçamentos salvos?')) {
            currentState.history = [];
            localStorage.setItem('concre7_history', '[]');
            renderHistory();
        }
    });
}

// 10. BOOTSTRAP DO APP
document.addEventListener('DOMContentLoaded', () => {
    renderModelList();
    initNavigation();
    initSettings();

    // Valores Iniciais na UI
    document.getElementById('unit-price-display').innerText = formatBRL(currentState.unitPrice);
    document.getElementById('settings-price-input').value = currentState.unitPrice;

    // Botão de Cálculo (Conexão Manual Robusta)
    const calcBtn = document.getElementById('calculate-btn');
    if (calcBtn) {
        calcBtn.onclick = performCalculation;
    }

    console.log("Concre7: Pronto para uso autônomo.");
});

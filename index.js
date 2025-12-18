
import { GoogleGenAI } from "@google/genai";

// 1. Definições Iniciais
const PAVER_MODELS = [
    { id: '16-faces', name: 'Paver 16 Faces', paversPerM2: 42, dimensions: '24x10x6 cm' },
    { id: 'tijolinho', name: 'Paver Tijolinho', paversPerM2: 50, dimensions: '20x10x6 cm' }
];

const DEFAULT_STATE = {
    selectedModelId: '16-faces',
    unitPrice: 1.10,
    history: []
};

// Variáveis de Estado (Iniciadas com localStorage se houver)
let currentState = {
    ...DEFAULT_STATE,
    history: JSON.parse(localStorage.getItem('concre7_history') || '[]'),
    unitPrice: parseFloat(localStorage.getItem('concre7_unit_price') || '1.10')
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// 2. Funções de Auxílio
const formatBRL = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const getConstructionTip = async (area, total, modelName) => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Responda como um engenheiro civil experiente. O cliente está orçando ${modelName} para ${area}m² (${total} peças). Dê uma única dica técnica de ouro para instalação desse paver. Máximo 12 palavras.`
        });
        return response.text;
    } catch (e) {
        return "Garanta a compactação da base e use areia fina para o rejunte.";
    }
};

// 3. Renderização Dinâmica do DOM
function renderModelList() {
    const list = document.getElementById('model-list');
    list.innerHTML = PAVER_MODELS.map(m => `
        <button data-model-id="${m.id}" class="model-card relative p-5 rounded-[2rem] border-2 transition-all flex flex-col items-center text-center gap-2 
            ${currentState.selectedModelId === m.id ? 'border-orange-500 bg-orange-50/50 ring-8 ring-orange-500/5' : 'border-slate-100 bg-white hover:border-slate-200'}">
            ${currentState.selectedModelId === m.id ? '<div class="absolute top-3 right-3 text-orange-500"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></div>' : ''}
            <span class="text-xs font-black uppercase tracking-tighter ${currentState.selectedModelId === m.id ? 'text-slate-900' : 'text-slate-400'}">${m.name}</span>
            <span class="text-[10px] text-slate-400 font-bold">${m.dimensions}</span>
            <span class="text-[9px] font-black text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full">${m.paversPerM2} PÇ/M²</span>
        </button>
    `).join('');

    // Rebind clicks
    document.querySelectorAll('.model-card').forEach(card => {
        card.addEventListener('click', () => {
            currentState.selectedModelId = card.dataset.modelId;
            renderModelList();
        });
    });
}

function renderHistory() {
    const list = document.getElementById('history-items');
    if (currentState.history.length === 0) {
        list.innerHTML = `
            <div class="py-20 text-center opacity-30 flex flex-col items-center gap-4">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
                <p class="font-black text-sm uppercase tracking-widest">Histórico Vazio</p>
            </div>
        `;
        return;
    }

    list.innerHTML = currentState.history.map(item => `
        <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group">
            <div class="space-y-1">
                <div class="flex items-center gap-2">
                    <span class="text-sm font-black text-slate-900">${item.area}m²</span>
                    <span class="text-[9px] font-black text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded-full">${item.modelName}</span>
                </div>
                <p class="text-[10px] text-slate-400 font-bold">${new Date(item.timestamp).toLocaleDateString()} • ${item.total} peças</p>
                <p class="text-sm font-black text-orange-500">${formatBRL(item.value)}</p>
            </div>
            <button onclick="window.deleteItem('${item.id}')" class="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
        </div>
    `).join('');
}

// 4. Lógica de Negócio (Cálculos)
async function performCalculation() {
    const areaVal = parseFloat(document.getElementById('area-input').value);
    const marginVal = parseInt(document.getElementById('margin-select').value);

    if (isNaN(areaVal) || areaVal <= 0) {
        alert("Por favor, informe uma área válida.");
        return;
    }

    const model = PAVER_MODELS.find(m => m.id === currentState.selectedModelId);
    const totalPieces = Math.ceil((areaVal * model.paversPerM2) * (1 + marginVal / 100));
    const totalValue = totalPieces * currentState.unitPrice;

    // Salvar no Histórico
    const result = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        area: areaVal,
        modelName: model.name,
        total: totalPieces,
        value: totalValue,
        margin: marginVal
    };

    currentState.history = [result, ...currentState.history].slice(0, 20);
    localStorage.setItem('concre7_history', JSON.stringify(currentState.history));

    // Exibir Resultado
    const resultView = document.getElementById('result-view');
    resultView.classList.remove('hidden');
    resultView.innerHTML = `
        <div class="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
            <div class="absolute -right-10 -top-10 opacity-5">
                <svg width="200" height="200" viewBox="0 0 24 24" fill="white"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
            </div>
            <div class="relative z-10 space-y-6">
                <div class="flex justify-between items-start">
                    <div class="space-y-1">
                        <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total de Peças</p>
                        <h2 class="text-6xl font-black tracking-tighter">${totalPieces}</h2>
                        <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Incluindo ${marginVal}% de perda</p>
                    </div>
                </div>
                <div class="pt-6 border-t border-slate-800 space-y-1">
                    <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Orçamento Estimado</p>
                    <p class="text-4xl font-black text-orange-400 tracking-tight">${formatBRL(totalValue)}</p>
                </div>
            </div>
        </div>
        
        <div id="ai-feedback" class="bg-blue-50 border border-blue-100 p-5 rounded-3xl flex gap-4 items-center">
            <div class="bg-blue-500 text-white p-2 rounded-xl">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <p id="ai-tip-text" class="text-xs font-bold text-blue-900 leading-snug">Consultando dicas técnicas do especialista...</p>
        </div>

        <div class="grid grid-cols-2 gap-3">
             <button onclick="window.copyBudget('${totalPieces}', '${formatBRL(totalValue)}', '${model.name}')" class="flex items-center justify-center gap-2 py-4 bg-slate-100 text-slate-700 font-black text-xs uppercase rounded-2xl active:scale-95 transition-all">
                Copiar
             </button>
             <button onclick="window.shareWhatsApp('${totalPieces}', '${formatBRL(totalValue)}', '${model.name}')" class="flex items-center justify-center gap-2 py-4 bg-green-500 text-white font-black text-xs uppercase rounded-2xl active:scale-95 shadow-lg shadow-green-500/20 transition-all">
                WhatsApp
             </button>
        </div>
    `;

    // Buscar dica AI
    const tip = await getConstructionTip(areaVal, totalPieces, model.name);
    const tipEl = document.getElementById('ai-tip-text');
    if (tipEl) tipEl.innerText = tip;
}

// 5. Funções Globais para o Window (chamadas pelo HTML inline)
window.deleteItem = (id) => {
    currentState.history = currentState.history.filter(h => h.id !== id);
    localStorage.setItem('concre7_history', JSON.stringify(currentState.history));
    renderHistory();
};

window.copyBudget = (total, val, model) => {
    const text = `*Orçamento Concre7*\n\nModelo: ${model}\nQtd: ${total} peças\n*Valor: ${val}*\n\n_Calculado profissionalmente._`;
    navigator.clipboard.writeText(text);
    alert('Copiado para a área de transferência!');
};

window.shareWhatsApp = (total, val, model) => {
    const text = encodeURIComponent(`*Orçamento Concre7*\n\nModelo: ${model}\nQtd: ${total} peças\n*Valor: ${val}*`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
};

// 6. Init e Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Configurações Iniciais
    renderModelList();
    document.getElementById('unit-price-display').innerText = formatBRL(currentState.unitPrice);
    document.getElementById('settings-price-input').value = currentState.unitPrice;

    // Botão Calcular
    document.getElementById('calculate-btn').addEventListener('click', performCalculation);

    // Salvar Novo Preço
    document.getElementById('save-price-btn').addEventListener('click', () => {
        const newVal = parseFloat(document.getElementById('settings-price-input').value);
        if (!isNaN(newVal) && newVal > 0) {
            currentState.unitPrice = newVal;
            localStorage.setItem('concre7_unit_price', newVal.toString());
            document.getElementById('unit-price-display').innerText = formatBRL(newVal);
            alert('Preço unitário atualizado com sucesso!');
        }
    });

    // Limpar Histórico
    document.getElementById('clear-history-btn').addEventListener('click', () => {
        if (confirm('Deseja apagar todo o histórico de orçamentos?')) {
            currentState.history = [];
            localStorage.setItem('concre7_history', '[]');
            renderHistory();
        }
    });

    // Tab Navigation Logic
    const tabs = document.querySelectorAll('.tab-content');
    const navBtns = document.querySelectorAll('.nav-btn');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;
            
            // UI Updates
            tabs.forEach(t => t.classList.remove('active'));
            document.getElementById(`${target}-tab`).classList.add('active');
            
            navBtns.forEach(b => b.classList.remove('active', 'text-slate-400'));
            navBtns.forEach(b => b.classList.add('text-slate-400'));
            btn.classList.add('active');
            btn.classList.remove('text-slate-400');

            // Tab Specific logic
            if (target === 'history') renderHistory();
        });
    });
});

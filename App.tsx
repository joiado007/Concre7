
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Calculator, 
  History, 
  Settings, 
  Share2, 
  Copy, 
  PlusCircle, 
  Trash2, 
  CheckCircle2,
  HardHat,
  ChevronRight,
  Info,
  Grid3X3,
  Square,
  DollarSign,
  Save
} from 'lucide-react';
import { AppTab, CalculationResult, PaverModel } from './types';
import { PAVER_MODELS, DEFAULT_UNIT_PRICE, DEFAULT_MARGIN } from './constants';
import { getConstructionTip } from './geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.CALCULATOR);
  const [selectedModel, setSelectedModel] = useState<PaverModel>(PAVER_MODELS[0]);
  const [area, setArea] = useState<string>('');
  const [margin, setMargin] = useState<number>(DEFAULT_MARGIN);
  const [unitPrice, setUnitPrice] = useState<number>(DEFAULT_UNIT_PRICE);
  const [history, setHistory] = useState<CalculationResult[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [currentResult, setCurrentResult] = useState<CalculationResult | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isPriceSaved, setIsPriceSaved] = useState(false);
  const [aiTip, setAiTip] = useState<string>('');
  const [isLoadingTip, setIsLoadingTip] = useState(false);

  // Load state from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('concre7_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const savedPrice = localStorage.getItem('concre7_unit_price');
    if (savedPrice) setUnitPrice(parseFloat(savedPrice));
  }, []);

  const saveUnitPrice = (value: number) => {
    setUnitPrice(value);
    localStorage.setItem('concre7_unit_price', value.toString());
    setIsPriceSaved(true);
    setTimeout(() => setIsPriceSaved(false), 2000);
  };

  const calculate = useCallback(async () => {
    const numArea = parseFloat(area);
    if (isNaN(numArea) || numArea <= 0) return;

    const baseCount = numArea * selectedModel.paversPerM2;
    const countWithMargin = Math.ceil(baseCount * (1 + margin / 100));
    const totalValue = countWithMargin * unitPrice;

    const result: CalculationResult = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      area: numArea,
      model: selectedModel,
      margin: margin,
      totalPavers: countWithMargin,
      totalValue: totalValue,
      unitPrice: unitPrice
    };

    setCurrentResult(result);
    setShowResult(true);
    
    setIsLoadingTip(true);
    const tip = await getConstructionTip(numArea, countWithMargin, selectedModel.name);
    setAiTip(tip || '');
    setIsLoadingTip(false);

    const newHistory = [result, ...history].slice(0, 20);
    setHistory(newHistory);
    localStorage.setItem('concre7_history', JSON.stringify(newHistory));
  }, [area, margin, history, selectedModel, unitPrice]);

  // Recalculate if critical values change and results are visible
  useEffect(() => {
    if (showResult && area && parseFloat(area) > 0) {
      const numArea = parseFloat(area);
      const baseCount = numArea * selectedModel.paversPerM2;
      const countWithMargin = Math.ceil(baseCount * (1 + margin / 100));
      const totalValue = countWithMargin * unitPrice;

      setCurrentResult(prev => prev ? {
        ...prev,
        area: numArea,
        model: selectedModel,
        margin: margin,
        totalPavers: countWithMargin,
        totalValue: totalValue,
        unitPrice: unitPrice
      } : null);
    }
  }, [selectedModel, margin, area, showResult, unitPrice]);

  const copyToClipboard = () => {
    if (!currentResult) return;
    const text = `*Orçamento Concre7*\n\nModelo: ${currentResult.model.name}\nÁrea: ${currentResult.area}m²\nQtd Total: ${currentResult.totalPavers} peças\nValor Total: R$ ${currentResult.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n_Gerado por Concre7 App_`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    if (!currentResult) return;
    const text = encodeURIComponent(`*Orçamento Concre7*\n\nModelo: ${currentResult.model.name}\nÁrea: ${currentResult.area}m²\nQtd Total: ${currentResult.totalPavers} peças\nValor Total: R$ ${currentResult.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const deleteHistoryItem = (id: string) => {
    const newHistory = history.filter(item => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem('concre7_history', JSON.stringify(newHistory));
  };

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-white shadow-xl">
      {/* Header */}
      <header className="bg-slate-900 text-white p-6 pb-8 rounded-b-[2rem] shadow-lg sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-orange-500 p-2 rounded-xl">
              <HardHat size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Concre7</h1>
          </div>
          <div className="bg-slate-800 text-xs px-3 py-1 rounded-full text-slate-400 font-medium">
            v1.2.0
          </div>
        </div>
        <p className="text-slate-400 text-sm">Calculadora profissional de pavers para obras.</p>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 -mt-6">
        {activeTab === AppTab.CALCULATOR && (
          <div className="space-y-6">
            
            {/* Model Selection Section */}
            <section className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Modelo de Paver</label>
              <div className="grid grid-cols-2 gap-3">
                {PAVER_MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model)}
                    className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center gap-2 ${
                      selectedModel.id === model.id 
                      ? 'border-orange-500 bg-orange-50/50 ring-4 ring-orange-500/10' 
                      : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    {selectedModel.id === model.id && (
                      <div className="absolute -top-2 -right-2 bg-orange-500 text-white p-1 rounded-full shadow-md">
                        <CheckCircle2 size={14} />
                      </div>
                    )}
                    <div className={`${selectedModel.id === model.id ? 'text-orange-500' : 'text-slate-400'} mb-1`}>
                      {model.id === '16-faces' ? <Grid3X3 size={32} /> : <Square size={32} />}
                    </div>
                    <span className={`text-sm font-bold ${selectedModel.id === model.id ? 'text-slate-900' : 'text-slate-600'}`}>
                      {model.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium leading-tight">
                      {model.length}x{model.width}x{model.thickness} cm<br/>
                      {model.paversPerM2} pç/m²
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Input Section */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Área Total (m²)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-4xl font-semibold p-4 pt-2 border-b-2 border-slate-200 focus:border-orange-500 outline-none transition-colors"
                  />
                  <span className="absolute right-4 bottom-4 text-slate-400 font-medium">m²</span>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Perda (%)</label>
                  <select 
                    value={margin}
                    onChange={(e) => setMargin(parseInt(e.target.value))}
                    className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none font-medium text-slate-700"
                  >
                    <option value={0}>0% (Exato)</option>
                    <option value={5}>5% (Padrão)</option>
                    <option value={10}>10% (Recortes)</option>
                    <option value={15}>15% (Curvas)</option>
                  </select>
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preço/Peça</label>
                  <div className="w-full p-3 bg-slate-50 rounded-xl font-medium text-slate-700">
                    R$ {unitPrice.toFixed(2)}
                  </div>
                </div>
              </div>

              <button
                onClick={calculate}
                disabled={!area || parseFloat(area) <= 0}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 text-white font-bold rounded-2xl shadow-lg shadow-orange-200 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <PlusCircle size={20} />
                Gerar Orçamento
              </button>
            </section>

            {/* Result Section */}
            {showResult && currentResult && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4 pb-12">
                <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Calculator size={120} />
                  </div>
                  
                  <div className="relative z-10 space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-slate-400 text-sm font-medium">Modelo: {currentResult.model.name}</h3>
                        <p className="text-5xl font-bold">{currentResult.totalPavers}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Base: {currentResult.model.paversPerM2} pç/m² + {currentResult.margin}% perda
                        </p>
                      </div>
                      <div className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        Total Peças
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex justify-between items-end">
                      <div>
                        <h3 className="text-slate-400 text-sm font-medium">Valor Total para o Cliente</h3>
                        <p className="text-3xl font-bold text-orange-400">
                          R$ {currentResult.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Tip Box */}
                {(isLoadingTip || aiTip) && (
                   <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3">
                      <div className="bg-blue-500/10 text-blue-600 p-2 rounded-lg h-fit">
                        <Info size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-900 uppercase">Dica Profissional</p>
                        <p className="text-sm text-blue-800 italic leading-snug">
                          {isLoadingTip ? "Consultando especialista..." : `"${aiTip}"`}
                        </p>
                      </div>
                   </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={copyToClipboard}
                    className="flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                  >
                    {isCopied ? <CheckCircle2 size={18} className="text-green-600" /> : <Copy size={18} />}
                    {isCopied ? "Copiado!" : "Copiar"}
                  </button>
                  <button 
                    onClick={shareWhatsApp}
                    className="flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all shadow-md shadow-green-100"
                  >
                    <Share2 size={18} />
                    WhatsApp
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === AppTab.HISTORY && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <History size={20} />
              Últimos Orçamentos
            </h2>
            {history.length === 0 ? (
              <div className="py-20 text-center space-y-4 opacity-40">
                <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <History size={32} />
                </div>
                <p className="font-medium text-slate-500">Nenhum cálculo salvo ainda.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div key={item.id} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex justify-between items-center group active:scale-[0.98] transition-transform">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{item.area}m²</span>
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 uppercase font-bold">{item.model.name}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(item.timestamp).toLocaleDateString('pt-BR')} • {item.totalPavers} peças
                      </p>
                      <p className="text-sm font-bold text-orange-500 mt-1">R$ {item.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <button 
                      onClick={() => deleteHistoryItem(item.id)}
                      className="p-3 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === AppTab.SETTINGS && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Settings size={20} />
              Configurações
            </h2>
            
            <div className="space-y-4">
              {/* Unit Price Editor */}
              <div className="p-5 bg-white rounded-2xl border-2 border-slate-100 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-slate-700">
                  <DollarSign size={18} className="text-orange-500" />
                  <h3 className="text-sm font-bold uppercase tracking-wide">Preço Unitário do Paver</h3>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                    <input 
                      type="number"
                      step="0.01"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none font-bold text-slate-800 transition-all"
                    />
                  </div>
                  <button 
                    onClick={() => saveUnitPrice(unitPrice)}
                    className={`px-4 rounded-xl font-bold flex items-center gap-2 transition-all ${
                      isPriceSaved 
                      ? 'bg-green-500 text-white' 
                      : 'bg-orange-500 text-white hover:bg-orange-600 active:scale-95'
                    }`}
                  >
                    {isPriceSaved ? <CheckCircle2 size={20} /> : <Save size={20} />}
                    {isPriceSaved ? 'Salvo!' : 'Salvar'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Este valor será aplicado automaticamente em todos os cálculos do aplicativo.</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Modelos Técnicos</h3>
                <div className="space-y-4">
                  {PAVER_MODELS.map(m => (
                    <div key={m.id} className="flex justify-between items-center border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{m.name}</p>
                        <p className="text-xs text-slate-500">{m.length}x{m.width}x{m.thickness}cm</p>
                      </div>
                      <span className="text-xs font-mono bg-white px-2 py-1 rounded border border-slate-100">{m.paversPerM2} pç/m²</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 text-center">
                <p className="text-[10px] text-orange-700 font-bold uppercase tracking-widest mb-1">Sobre Concre7</p>
                <p className="text-xs text-orange-800">Desenvolvido para agilizar o atendimento de vendedores e mestre de obras.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center sticky bottom-0 safe-area-bottom">
        <button 
          onClick={() => setActiveTab(AppTab.CALCULATOR)}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === AppTab.CALCULATOR ? 'text-orange-500' : 'text-slate-400'}`}
        >
          <Calculator size={22} fill={activeTab === AppTab.CALCULATOR ? "currentColor" : "none"} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Cálculo</span>
        </button>
        <button 
          onClick={() => setActiveTab(AppTab.HISTORY)}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === AppTab.HISTORY ? 'text-orange-500' : 'text-slate-400'}`}
        >
          <History size={22} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Histórico</span>
        </button>
        <button 
          onClick={() => setActiveTab(AppTab.SETTINGS)}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === AppTab.SETTINGS ? 'text-orange-500' : 'text-slate-400'}`}
        >
          <Settings size={22} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Opções</span>
        </button>
      </nav>
    </div>
  );
};

export default App;

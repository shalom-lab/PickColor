import React, { useState, useRef } from 'react';
import { 
  Pipette, 
  Plus, 
  Trash2, 
  Copy, 
  History as HistoryIcon, 
  Palette, 
  Check, 
  LayoutGrid,
  X,
  Github,
  Settings,
  Download,
  Languages
} from 'lucide-react';
import { useStorage } from './hooks/useStorage';
import { translations, supportedLanguages, defaultLanguage } from './i18n/translations';

// --- 工具函数 ---
const hexToRgb = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return { r, g, b };
};

const hexToHsl = (hex) => {
  let { r, g, b } = hexToRgb(hex);
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const App = () => {
  // --- 状态管理 ---
  const [currentColor, setCurrentColor] = useState('#6366f1');
  const [history, setHistory] = useStorage('colorHistory', ['#6366f1', '#ec4899', '#f59e0b']);
  const [palettes, setPalettes] = useStorage('palettes', [
    { id: 1, name: '极简办公', colors: ['#f8fafc', '#334155', '#1e293b', '#64748b'] },
    { id: 2, name: '夏日森林', colors: ['#065f46', '#059669', '#34d399', '#a7f3d0'] },
    { id: 3, name: '科学蓝调', colors: ['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'] },
    { id: 4, name: 'Nature经典', colors: ['#2c5282', '#3182ce', '#4299e1', '#63b3ed', '#90cdf4'] },
    { id: 5, name: '数据可视化', colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'] },
    { id: 6, name: '学术论文', colors: ['#4a5568', '#718096', '#a0aec0', '#cbd5e0', '#e2e8f0'] },
    { id: 7, name: '科学图表', colors: ['#1e40af', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'] },
    { id: 8, name: '实验室风格', colors: ['#0c4a6e', '#075985', '#0369a1', '#0284c7', '#0ea5e9'] }
  ]);
  const [language, setLanguage] = useStorage('language', defaultLanguage);
  const [activeTab, setActiveTab] = useState('home');
  
  const t = translations[language];
  const [copyFeedback, setCopyFeedback] = useState(null);
  const [paletteFeedback, setPaletteFeedback] = useState(null); // 存储最近添加颜色的色板ID
  const [paletteInput, setPaletteInput] = useState(''); // 色板输入框
  const [showCreateModal, setShowCreateModal] = useState(false); // 显示创建色板 modal
  const [newPaletteName, setNewPaletteName] = useState(''); // 新建色板名称
  const [tempColor, setTempColor] = useState(null); // 手动调色时的临时颜色（预览用）
  const [showColorPicker, setShowColorPicker] = useState(false); // 显示颜色选择器 modal
  const [deleteConfirm, setDeleteConfirm] = useState(null); // 删除确认：{ id, name }
  
  const colorInputRef = useRef(null);

  const cardStyle = 'bg-white shadow-sm border border-slate-200';

  // --- 逻辑操作 ---
  const updateColorState = (newColor) => {
    setCurrentColor(newColor);
    setHistory(prev => [newColor, ...prev.filter(c => c !== newColor).slice(0, 11)]);
  };

  // 确认手动调色，保存到历史记录
  const confirmManualColor = () => {
    if (tempColor !== null) {
      updateColorState(tempColor);
      setTempColor(null);
    }
  };

  // 处理手动调色颜色变化
  const handleManualColorChange = (newColor) => {
    setTempColor(newColor);
  };

  const handlePickColor = async () => {
    if (!window.EyeDropper) {
      colorInputRef.current?.click();
      return;
    }

    try {
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      updateColorState(result.sRGBHex);
    } catch (e) {
      console.log('取色被取消');
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(text);
      setTimeout(() => setCopyFeedback(null), 1500);
    } catch (err) {
      // 降级方案
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {
          setCopyFeedback(text);
          setTimeout(() => setCopyFeedback(null), 1500);
        }
      } catch (fallbackErr) {
        console.error('无法复制: ', fallbackErr);
      }
    }
  };

  // 解析单行色板输入格式：色板名称:hex,hex,hex
  const parsePaletteLine = (line) => {
    const trimmed = line.trim();
    if (!trimmed) return null;
    
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) return null;
    
    const name = trimmed.substring(0, colonIndex).trim();
    const colorsStr = trimmed.substring(colonIndex + 1).trim();
    
    if (!name || !colorsStr) return null;
    
    // 解析颜色列表，支持 hex 格式（带或不带 #）
    const colors = colorsStr
      .split(',')
      .map(c => c.trim())
      .filter(c => c)
      .map(c => {
        // 确保是有效的 hex 颜色
        if (c.startsWith('#')) {
          return c.length === 7 ? c : null;
        } else {
          return c.length === 6 ? `#${c}` : null;
        }
      })
      .filter(c => c !== null);
    
    if (colors.length === 0) return null;
    
    return { name, colors };
  };

  // 解析多行色板输入
  const parsePaletteInput = (input) => {
    const lines = input.split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length === 0) return { palettes: [], errors: [] };
    
    const palettes = [];
    const errors = [];
    
    lines.forEach((line, index) => {
      const parsed = parsePaletteLine(line);
      if (parsed) {
        palettes.push(parsed);
      } else {
        errors.push(t.formatErrorLine.replace('{line}', index + 1));
      }
    });
    
    return { palettes, errors };
  };

  const handleAddPalette = () => {
    const { palettes, errors } = parsePaletteInput(paletteInput);
    
    if (palettes.length === 0) {
      alert(`${t.formatError}\n${t.formatExample}`);
      return;
    }
    
    if (errors.length > 0 && palettes.length === 0) {
      alert(`${t.formatError}\n${errors.join('\n')}`);
      return;
    }
    
    // 批量添加色板
    const newPalettes = palettes.map((palette, index) => ({
      id: Date.now() + index,
      name: palette.name,
      colors: palette.colors
    }));
    
    setPalettes(prev => [...newPalettes, ...prev]);
    setPaletteInput(''); // 清空输入框
    
    // 如果有部分错误，提示用户
    if (errors.length > 0) {
      alert(t.addSuccessWithErrors.replace('{count}', palettes.length).replace('{errorCount}', errors.length) + '\n' + errors.join('\n'));
    }
  };

  // 复制色板（格式：色板名称:颜色1,颜色2,颜色3）
  const copyPalette = (palette) => {
    const colorsStr = palette.colors.join(',');
    const text = `${palette.name}:${colorsStr}`;
    copyToClipboard(text);
  };

  // 导出全部色板
  const exportAllPalettes = () => {
    try {
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        palettes: palettes.map(p => ({
          name: p.name,
          colors: p.colors
        }))
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pickcolor-palettes-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // 显示删除确认 modal
  const handleDeletePalette = (paletteId, paletteName) => {
    setDeleteConfirm({ id: paletteId, name: paletteName });
  };

  // 确认删除色板
  const confirmDeletePalette = () => {
    if (deleteConfirm) {
      setPalettes(prev => prev.filter(p => p.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    }
  };

  const createPalette = () => {
    setShowCreateModal(true);
    setNewPaletteName(t.newPalette);
  };

  const handleConfirmCreatePalette = () => {
    const name = newPaletteName.trim();
    if (!name) {
      alert(t.enterPaletteName);
      return;
    }
    
    setPalettes(prev => [{
      id: Date.now(),
      name,
      colors: [currentColor]
    }, ...prev]);
    
    setShowCreateModal(false);
    setNewPaletteName('');
  };

  const addToPalette = (paletteId, color) => {
    if (!color) return;
    
    setPalettes(prev => {
      return prev.map(p => {
        if (p.id === paletteId) {
          // 确保 colors 数组存在，去重，无限添加
          const existingColors = p.colors || [];
          const newColors = [...existingColors, color];
          // 使用 Set 去重，但保留顺序（最后添加的在最后）
          const uniqueColors = Array.from(new Set(newColors));
          return { ...p, colors: uniqueColors };
        }
        return p;
      });
    });
    
    // 添加反馈提示，记录色板ID
    setPaletteFeedback(paletteId);
    setTimeout(() => setPaletteFeedback(null), 1500);
  };

  // 计算颜色亮度，决定文字颜色
  const getTextColor = (hex) => {
    const { r, g, b } = hexToRgb(hex);
    // 计算相对亮度 (0-1)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  };

  // 颜色显示条组件（用于主区域和历史记录）
  const ColorBar = ({ color, height = 'h-9' }) => {
    const textColor = getTextColor(color);
    const rgb = hexToRgb(color);
    const hsl = hexToHsl(color);
    const rgbText = `RGB(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    const hslText = `HSL(${hsl.h}°, ${hsl.s}%, ${hsl.l}%)`;
    
    return (
      <div
        className={`w-full ${height} rounded-md flex items-center px-3 gap-2`}
        style={{ backgroundColor: color }}
      >
        <span 
          className="font-mono text-xs font-bold uppercase cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
          style={{ color: textColor }}
          onClick={(e) => {
            e.stopPropagation();
            copyToClipboard(color);
          }}
          title={t.clickToCopyHex}
        >
          {copyFeedback === color && <Check size={12} className="inline mr-1" />}
          {color}
        </span>
        <span 
          className="font-mono text-xs font-bold cursor-pointer hover:opacity-80 transition-opacity flex-1 text-right truncate"
          style={{ color: textColor }}
          onClick={(e) => {
            e.stopPropagation();
            copyToClipboard(rgbText);
          }}
          title={t.clickToCopyRgb}
        >
          {copyFeedback === rgbText && <Check size={12} className="inline mr-1" />}
          {rgbText}
        </span>
        <span 
          className="font-mono text-xs font-bold cursor-pointer hover:opacity-80 transition-opacity flex-1 text-right truncate"
          style={{ color: textColor }}
          onClick={(e) => {
            e.stopPropagation();
            copyToClipboard(hslText);
          }}
          title={t.clickToCopyHsl}
        >
          {copyFeedback === hslText && <Check size={12} className="inline mr-1" />}
          {hslText}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-3">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <header className="relative flex flex-col items-center mb-8 gap-4">
          <div className="flex items-center gap-3 w-full justify-center relative">
            <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center bg-white shadow-lg p-1.5">
              <img src="icons/logo.svg" alt="PickColor" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                {t.appName}
              </h1>
              <p className="text-xs opacity-60 font-medium">{t.appDesc}</p>
            </div>
            <a
              href="https://github.com/shalom-lab/PickColor"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute right-0 p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
              title="GitHub"
            >
              <Github size={20} />
            </a>
          </div>

          <div className="flex items-center justify-end p-1 rounded-xl bg-black/5 backdrop-blur-sm ml-auto">
            {[
              { id: 'home', icon: LayoutGrid, label: t.home },
              { id: 'palettes', icon: Palette, label: t.palettes },
              { id: 'settings', icon: Settings, label: t.settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.id 
                  ? 'bg-white shadow-sm text-indigo-500 font-bold' 
                  : 'opacity-60 hover:opacity-100 font-medium'
                }`}
              >
                <tab.icon size={18} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </header>

        {/* Main Content */}
        <main>
          {activeTab === 'home' && (
            <div className="space-y-4">
              {/* 操作按钮 */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button 
                    onClick={handlePickColor}
                    className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold transition-all transform active:scale-95 shadow-lg shadow-indigo-500/30 text-xs flex-1 justify-center"
                  >
                    <Pipette size={18} /> {t.screenPick}
                  </button>
                  <button 
                    onClick={() => {
                      setTempColor(currentColor);
                      setShowColorPicker(true);
                    }}
                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg font-bold transition-all transform active:scale-95 text-xs flex-1 justify-center"
                  >
                    <Palette size={18} /> {t.manualColor}
                  </button>
                </div>
                {tempColor !== null && tempColor !== currentColor && !showColorPicker && (
                  <div className="space-y-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <ColorBar color={tempColor} height="h-10" />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setTempColor(null)}
                        className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300 transition-colors text-xs"
                      >
                        {t.cancel}
                      </button>
                      <button
                        onClick={confirmManualColor}
                        className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-bold hover:bg-indigo-600 transition-colors text-xs"
                      >
                        {t.confirm}
                      </button>
                    </div>
                  </div>
                )}
                <input 
                  ref={colorInputRef}
                  type="color" 
                  value={tempColor !== null ? tempColor : currentColor}
                  onChange={(e) => handleManualColorChange(e.target.value)}
                  className="hidden"
                />
              </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <HistoryIcon size={16} className="text-indigo-500" /> {t.recentHistory}
                  </h3>
                  <button onClick={() => setHistory([])} className="text-xs font-bold opacity-40 hover:opacity-100 hover:text-red-500 transition-colors">{t.clearHistory}</button>
                </div>
                
                <div className="space-y-1.5">
                  {history.map((color, idx) => (
                    <ColorBar key={idx} color={color} />
                  ))}
                  {history.length === 0 && <div className="py-10 text-center opacity-40 italic">{t.startRecording}</div>}
                </div>

              {/* 快速存入库 */}
              <div className={`p-4 rounded-2xl ${cardStyle}`}>
                <h3 className="font-bold mb-4 flex items-center justify-between">
                  {t.quickSave}
                  <button 
                    onClick={createPalette} 
                    title={t.newPalette}
                    className="text-indigo-500 p-1 hover:bg-indigo-50 rounded transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </h3>
                <div className="space-y-3">
                  {palettes.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-500/5 hover:bg-slate-500/10 transition-colors border border-transparent hover:border-slate-200">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex -space-x-2 flex-shrink-0 w-[140px]">
                          {p.colors && p.colors.length > 0 ? (
                            <>
                              {p.colors.slice(0, 5).map((c, i) => (
                                <div key={i} className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: c }} />
                              ))}
                              {p.colors.length > 5 && (
                                <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm bg-slate-200 flex items-center justify-center text-xs font-bold">
                                  +{p.colors.length - 5}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-slate-300 border-dashed bg-slate-50"></div>
                          )}
                        </div>
                        <span className="text-sm font-bold truncate">{p.name}</span>
                        {paletteFeedback === p.id && (
                          <span className="text-xs text-green-500 font-bold animate-pulse">已添加</span>
                        )}
                      </div>
                      <button 
                        onClick={() => addToPalette(p.id, currentColor)}
                        disabled={!currentColor}
                        className="text-indigo-500 text-xs font-bold hover:bg-indigo-500 hover:text-white px-2 py-1 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                      >
                        {t.addCurrentColor}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'palettes' && (
            <div className="space-y-4">
              {/* 输入框区域 */}
              <div className="space-y-2">
                <textarea
                  value={paletteInput}
                  onChange={(e) => setPaletteInput(e.target.value)}
                  placeholder={t.placeholder}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm resize-y min-h-[80px]"
                  rows={3}
                />
                <button
                  onClick={handleAddPalette}
                  className="w-full bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 text-sm"
                >
                  <Plus size={16} /> {t.add}
                </button>
              </div>

              {/* 色板列表 */}
              <div className="space-y-2">
                {palettes.map(palette => (
                  <div key={palette.id} className={`p-3 rounded-lg ${cardStyle} transition-all hover:shadow-md`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">{palette.name}</span>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => copyPalette(palette)}
                          className="p-1 hover:bg-slate-500/10 rounded text-slate-600 opacity-60 hover:opacity-100 transition-all"
                          title={t.copy}
                        >
                          <Copy size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeletePalette(palette.id, palette.name)}
                          className="p-1 hover:bg-red-500/10 rounded text-red-500 opacity-60 hover:opacity-100 transition-all"
                          title={t.delete}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-0">
                      {palette.colors.map((c, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 cursor-pointer transition-all hover:scale-110 hover:z-10 relative"
                          style={{ backgroundColor: c }}
                          onClick={() => copyToClipboard(c)}
                          title={`${t.clickToCopy} ${c}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              {/* 语言设置 */}
              <div className={`p-4 rounded-2xl ${cardStyle}`}>
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <Languages size={18} className="text-indigo-500" /> {t.languageSettings}
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600">{t.language}:</span>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium"
                  >
                    {supportedLanguages.map(lang => (
                      <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 数据管理 */}
              <div className={`p-4 rounded-2xl ${cardStyle}`}>
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <Download size={18} className="text-indigo-500" /> {t.dataManagement}
                </h3>
                <button
                  onClick={exportAllPalettes}
                  className="w-full bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 text-sm"
                >
                  <Download size={16} /> {t.exportPalettes}
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Copy Notification Toast */}
      {copyFeedback && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 z-50 max-w-xs">
          <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: copyFeedback }} />
          <span className="font-bold tracking-tight truncate text-sm">{t.copied} {copyFeedback}</span>
          <Check size={18} className="text-green-400 flex-shrink-0" />
        </div>
      )}

      {/* 颜色选择器 Modal */}
      {showColorPicker && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => {
            setShowColorPicker(false);
            setTempColor(null);
          }}
        >
          <div 
            className={`${cardStyle} p-6 rounded-2xl shadow-2xl w-full max-w-lg mx-4`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{t.manualColor}</h3>
              <button
                onClick={() => {
                  setShowColorPicker(false);
                  setTempColor(null);
                }}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* 颜色选择器 - 与预览条宽度对齐 */}
              <div>
                <input
                  ref={colorInputRef}
                  type="color" 
                  value={tempColor !== null ? tempColor : currentColor}
                  onChange={(e) => handleManualColorChange(e.target.value)}
                  className="w-full h-24 rounded-lg cursor-pointer border-2 border-slate-300 shadow-lg"
                />
              </div>
              
              {/* 颜色预览 */}
              {tempColor && (
                <div>
                  <ColorBar color={tempColor} height="h-10" />
                </div>
              )}
              
              {/* 操作按钮 */}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowColorPicker(false);
                    setTempColor(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors font-medium"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={() => {
                    confirmManualColor();
                    setShowColorPicker(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors font-medium"
                >
                  {t.confirm}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认 Modal */}
      {deleteConfirm && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setDeleteConfirm(null)}
        >
          <div 
            className={`${cardStyle} p-6 rounded-2xl shadow-2xl w-full max-w-md mx-4`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{t.delete}</h3>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-slate-600">
                {t.confirmDelete} <span className="font-bold text-slate-900">"{deleteConfirm.name}"</span> {t.confirmDeleteQuestion}
              </p>
              
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors font-medium"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={confirmDeletePalette}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors font-medium"
                >
                  {t.delete}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新建色板 Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            className={`${cardStyle} p-6 rounded-2xl shadow-2xl w-full max-w-md mx-4`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{t.newPalette}</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t.paletteName}</label>
                <input
                  type="text"
                  value={newPaletteName}
                  onChange={(e) => setNewPaletteName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleConfirmCreatePalette();
                    } else if (e.key === 'Escape') {
                      setShowCreateModal(false);
                    }
                  }}
                  autoFocus
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={t.enterPaletteName}
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors font-medium"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleConfirmCreatePalette}
                  className="px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors font-medium"
                >
                  {t.create}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;


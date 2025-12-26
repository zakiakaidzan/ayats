
import React, { useState, useEffect, useRef } from 'react';
import { fetchSurahs, fetchVerse } from './services/quranService';
import { Surah, Verse, EditorSettings, ARABIC_FONTS, INDO_FONTS, SavedPreset } from './types';
import { toPng, toJpeg } from 'html-to-image';

const App: React.FC = () => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<number>(1);
  const [selectedVerse, setSelectedVerse] = useState<number>(1);
  const [verseData, setVerseData] = useState<Verse | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [presets, setPresets] = useState<SavedPreset[]>([]);
  const [presetName, setPresetName] = useState('');

  const [settings, setSettings] = useState<EditorSettings>({
    arabicFont: ARABIC_FONTS[0].family,
    arabicSize: 42,
    arabicColor: '#1a1a1a',
    arabicLineHeight: 1.6,
    arabicAlign: 'center',
    
    indoFont: INDO_FONTS[0].family,
    indoSize: 20,
    indoColor: '#374151',
    indoLineHeight: 1.5,
    indoAlign: 'center',
    
    backgroundColor: '#ffffff',
    isTransparent: false,
    showSurahInfo: true,
    showDivider: true,
    verticalPosition: 'center',
    contentGap: 32,
    horizontalPadding: 32,
  });

  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSurahs().then(setSurahs);
    const savedPresets = localStorage.getItem('quran_editor_presets');
    if (savedPresets) {
      setPresets(JSON.parse(savedPresets));
    }
  }, []);

  useEffect(() => {
    loadVerse();
  }, [selectedSurah, selectedVerse]);

  const loadVerse = async () => {
    setLoading(true);
    const data = await fetchVerse(selectedSurah, selectedVerse);
    setVerseData(data);
    setLoading(false);
  };

  const handleExport = async (format: 'png' | 'jpg') => {
    if (!canvasRef.current) return;
    setExporting(true);
    
    try {
      const scale = 3; 
      const options = {
        pixelRatio: scale,
        quality: 1,
        backgroundColor: settings.isTransparent ? null : settings.backgroundColor,
      };

      let dataUrl = '';
      if (format === 'png') {
        dataUrl = await toPng(canvasRef.current, options);
      } else {
        dataUrl = await toJpeg(canvasRef.current, options);
      }

      const link = document.createElement('a');
      link.download = `Quran-Ayat-${selectedSurah}-${selectedVerse}.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExporting(false);
    }
  };

  const savePreset = () => {
    if (!presetName.trim()) return;
    const newPreset: SavedPreset = {
      id: Date.now().toString(),
      name: presetName,
      settings: { ...settings },
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem('quran_editor_presets', JSON.stringify(updated));
    setPresetName('');
  };

  const loadPreset = (preset: SavedPreset) => {
    setSettings(preset.settings);
  };

  const deletePreset = (id: string) => {
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    localStorage.setItem('quran_editor_presets', JSON.stringify(updated));
  };

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  // Dynamic Styles for UI based on Dark Mode
  const uiBg = isDarkMode ? 'bg-gray-950' : 'bg-gray-100';
  const sidebarBg = isDarkMode ? 'bg-gray-900' : 'bg-white';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-800';
  const subTextColor = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const borderColor = isDarkMode ? 'border-gray-800' : 'border-gray-200';
  const inputBg = isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-800';

  const ExportButtons = () => (
    <div className="grid grid-cols-2 gap-4">
      <button 
        onClick={() => handleExport('png')}
        disabled={exporting}
        className="flex-1 py-4 bg-gray-900 dark:bg-emerald-600 text-white rounded-2xl font-black hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 text-sm shadow-xl shadow-black/10 dark:shadow-emerald-900/20"
      >
        {exporting ? 'Wait...' : 'Export PNG'}
      </button>
      <button 
        onClick={() => handleExport('jpg')}
        disabled={exporting}
        className={`flex-1 py-4 border-2 font-black rounded-2xl transition-all disabled:opacity-50 text-sm active:scale-95 hover:scale-[1.02] ${isDarkMode ? 'border-gray-700 text-white hover:bg-gray-800' : 'border-gray-900 text-gray-900 hover:bg-gray-50'}`}
      >
        Export JPG
      </button>
    </div>
  );

  return (
    <div className={`h-screen flex flex-col ${uiBg} transition-colors duration-300 overflow-hidden`}>
      {/* Universal Header - Fixed at Top */}
      <header className={`flex items-center justify-between px-6 py-4 border-b transition-colors duration-300 z-50 ${sidebarBg} ${borderColor} flex-shrink-0`}>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-lg shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className={`text-lg md:text-xl font-black tracking-tight ${textColor}`}>Quran Reel Editor</h1>
        </div>
        <button 
          onClick={toggleDarkMode}
          className={`p-2.5 rounded-full transition-all active:scale-90 ${isDarkMode ? 'bg-gray-800 text-yellow-400 border border-gray-700' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}
        >
          {isDarkMode ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
          )}
        </button>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Main Canvas Preview - Fixed area on Mobile top */}
        <main className={`flex-none md:flex-1 h-[60vh] md:h-full flex items-center justify-center overflow-hidden transition-colors duration-300 p-4 md:p-10 ${isDarkMode ? 'bg-gray-950' : 'bg-gray-200'}`}>
          <div 
            style={{
              transform: 'scale(var(--preview-scale, 1))',
              '--preview-scale': 'min(1, calc((60vh - 40px) / 640), calc((100vw - 40px) / 360))'
            } as any}
            className="flex-shrink-0 origin-center"
          >
            <div 
              ref={canvasRef}
              className="relative shadow-[0_50px_100px_rgba(0,0,0,0.3)] overflow-hidden transition-all rounded-sm flex-shrink-0"
              style={{
                width: '360px', 
                height: '640px', 
                backgroundColor: settings.isTransparent ? 'transparent' : settings.backgroundColor,
                backgroundImage: settings.isTransparent ? 'linear-gradient(45deg, #ddd 25%, transparent 25%), linear-gradient(-45deg, #ddd 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ddd 75%), linear-gradient(-45deg, transparent 75%, #ddd 75%)' : 'none',
                backgroundSize: settings.isTransparent ? '20px 20px' : 'auto',
              }}
            >
              {!settings.isTransparent && (
                 <div className="absolute inset-0 z-0" style={{ backgroundColor: settings.backgroundColor }} />
              )}

              <div className={`absolute inset-0 flex flex-col z-10 ${
                settings.verticalPosition === 'start' ? 'justify-start pt-24' : 
                settings.verticalPosition === 'center' ? 'justify-center' : 
                'justify-end pb-24'
              }`}
              style={{
                paddingLeft: `${settings.horizontalPadding}px`,
                paddingRight: `${settings.horizontalPadding}px`,
              }}>
                {loading ? (
                  <div className="flex justify-center w-full">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-600 border-t-transparent shadow-xl"></div>
                  </div>
                ) : verseData ? (
                  <>
                    <div 
                      className="w-full" 
                      style={{ 
                        fontFamily: settings.arabicFont,
                        fontSize: `${settings.arabicSize}px`,
                        color: settings.arabicColor,
                        lineHeight: settings.arabicLineHeight,
                        textAlign: settings.arabicAlign,
                        direction: 'rtl',
                        marginBottom: `${settings.contentGap}px`
                      }}
                    >
                      {verseData.teksArab}
                    </div>
                    
                    <div 
                      className="w-full"
                      style={{ 
                        fontFamily: settings.indoFont,
                        fontSize: `${settings.indoSize}px`,
                        color: settings.indoColor,
                        lineHeight: settings.indoLineHeight,
                        textAlign: settings.indoAlign,
                      }}
                    >
                      {verseData.teksIndonesia}
                    </div>

                    {settings.showSurahInfo && (
                      <div className={`mt-8 pt-5 w-full flex justify-between items-end opacity-50 text-[11px] uppercase tracking-widest font-black ${
                        settings.showDivider ? 'border-t border-current/20' : ''
                      } ${
                        settings.verticalPosition === 'end' ? 'order-first mb-8 mt-0 border-t-0 pb-5' : ''
                      } ${
                        settings.verticalPosition === 'end' && settings.showDivider ? 'border-b border-current/20' : ''
                      }`}
                        style={{ color: settings.indoColor }}
                      >
                        <span>QS. {surahs.find(s => s.nomor === selectedSurah)?.namaLatin}</span>
                        <span>Ayat {selectedVerse}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center w-full opacity-30 text-center space-y-4">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    <p className="font-black text-xs uppercase tracking-tighter">Pilih Ayat Untuk Memulai Edit</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Sidebar - Settings Panel */}
        <aside className={`w-full md:w-96 flex flex-col flex-1 md:flex-none transition-colors duration-300 ${sidebarBg} ${borderColor} border-t md:border-t-0 md:border-r overflow-hidden shadow-2xl z-20`}>
          <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
            
            {/* Presets Manager */}
            <section className="space-y-4">
              <h2 className={`text-xs font-black ${subTextColor} uppercase tracking-widest`}>Presets Pengaturan</h2>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Nama preset..."
                  className={`flex-1 p-2.5 text-sm rounded-xl outline-none transition-all focus:ring-2 focus:ring-emerald-500/50 ${inputBg}`}
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                />
                <button 
                  onClick={savePreset}
                  className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 active:scale-95 shadow-sm shadow-emerald-600/20"
                >
                  Simpan
                </button>
              </div>
              {presets.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {presets.map(p => (
                    <div key={p.id} className="flex items-center gap-1 group">
                      <button 
                        onClick={() => loadPreset(p)}
                        className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-all ${isDarkMode ? 'border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700' : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-300'}`}
                      >
                        {p.name}
                      </button>
                      <button 
                        onClick={() => deletePreset(p.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-500 transition-opacity"
                        title="Hapus preset"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <h2 className={`text-xs font-black ${subTextColor} uppercase tracking-widest`}>Pilih Ayat</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={`block text-[10px] font-bold ${subTextColor} uppercase px-1`}>Surah</label>
                  <select 
                    className={`w-full p-3 rounded-xl text-sm outline-none transition-all cursor-pointer ${inputBg}`}
                    value={selectedSurah}
                    onChange={(e) => {
                      setSelectedSurah(Number(e.target.value));
                      setSelectedVerse(1);
                    }}
                  >
                    {surahs.map(s => (
                      <option key={s.nomor} value={s.nomor}>{s.nomor}. {s.namaLatin}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={`block text-[10px] font-bold ${subTextColor} uppercase px-1`}>Ayat</label>
                  <select 
                    className={`w-full p-3 rounded-xl text-sm outline-none transition-all cursor-pointer ${inputBg}`}
                    value={selectedVerse}
                    onChange={(e) => setSelectedVerse(Number(e.target.value))}
                  >
                    {Array.from({ length: surahs.find(s => s.nomor === selectedSurah)?.jumlahAyat || 0 }, (_, i) => i + 1).map(v => (
                      <option key={v} value={v}>Ayat {v}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className={`text-xs font-black ${subTextColor} uppercase tracking-widest`}>Layout & Spasi</h2>
              <div className={`flex p-1 rounded-xl transition-colors ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                {(['start', 'center', 'end'] as const).map(pos => (
                  <button 
                    key={pos}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-[11px] font-black transition-all flex flex-col items-center gap-1.5 ${settings.verticalPosition === pos ? (isDarkMode ? 'bg-gray-700 text-emerald-400 shadow-lg' : 'bg-white text-emerald-600 shadow-md') : (isDarkMode ? 'text-gray-500' : 'text-gray-400')}`}
                    onClick={() => setSettings({...settings, verticalPosition: pos})}
                  >
                    <div className={`w-5 h-1.5 rounded-full ${settings.verticalPosition === pos ? 'bg-emerald-500' : (isDarkMode ? 'bg-gray-600' : 'bg-gray-300')}`} />
                    <span className="uppercase">{pos === 'start' ? 'Atas' : pos === 'center' ? 'Tengah' : 'Bawah'}</span>
                  </button>
                ))}
              </div>
              
              <div className="space-y-5 pt-2">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className={`text-[11px] font-bold ${subTextColor} uppercase`}>Jarak Antar Teks</label>
                    <span className={`text-[11px] font-black ${textColor}`}>{settings.contentGap}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="150" 
                    className="w-full h-2 bg-emerald-100/30 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    value={settings.contentGap}
                    onChange={(e) => setSettings({...settings, contentGap: Number(e.target.value)})}
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className={`text-[11px] font-bold ${subTextColor} uppercase`}>Padding Samping</label>
                    <span className={`text-[11px] font-black ${textColor}`}>{settings.horizontalPadding}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    className="w-full h-2 bg-emerald-100/30 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    value={settings.horizontalPadding}
                    onChange={(e) => setSettings({...settings, horizontalPadding: Number(e.target.value)})}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className={`text-xs font-black ${subTextColor} uppercase tracking-widest`}>Visibilitas Elemen</h2>
              <div className="space-y-3">
                <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-gray-50 border-gray-200/50'}`}>
                  <label htmlFor="showSurahInfo" className={`text-sm font-semibold ${textColor}`}>Info Surah & Ayat</label>
                  <input 
                    type="checkbox" 
                    id="showSurahInfo"
                    className="w-6 h-6 accent-emerald-600 rounded-lg cursor-pointer"
                    checked={settings.showSurahInfo}
                    onChange={(e) => setSettings({...settings, showSurahInfo: e.target.checked})}
                  />
                </div>
                
                <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-gray-50 border-gray-200/50'}`}>
                  <label htmlFor="showDivider" className={`text-sm font-semibold ${textColor}`}>Garis Pembatas</label>
                  <input 
                    type="checkbox" 
                    id="showDivider"
                    className="w-6 h-6 accent-emerald-600 rounded-lg cursor-pointer"
                    checked={settings.showDivider}
                    onChange={(e) => setSettings({...settings, showDivider: e.target.checked})}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex justify-between items-center">
                 <h2 className={`text-xs font-black ${subTextColor} uppercase tracking-widest`}>Teks Arab</h2>
                 <input 
                    type="color" 
                    className="w-10 h-10 rounded-full border-4 border-white dark:border-gray-700 shadow-xl cursor-pointer transition-transform hover:scale-110"
                    value={settings.arabicColor}
                    onChange={(e) => setSettings({...settings, arabicColor: e.target.value})}
                  />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select 
                  className={`p-3 rounded-xl text-sm outline-none cursor-pointer ${inputBg}`}
                  value={settings.arabicFont}
                  onChange={(e) => setSettings({...settings, arabicFont: e.target.value})}
                >
                  {ARABIC_FONTS.map(f => <option key={f.name} value={f.family}>{f.name}</option>)}
                </select>
                <div className="relative">
                  <input 
                    type="number" 
                    className={`w-full p-3 rounded-xl text-sm outline-none ${inputBg}`}
                    value={settings.arabicSize}
                    onChange={(e) => setSettings({...settings, arabicSize: Number(e.target.value)})}
                  />
                  <span className="absolute right-3 top-3.5 text-[10px] font-bold opacity-30">PX</span>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className={`text-xs font-black ${subTextColor} uppercase tracking-widest`}>Teks Terjemahan</h2>
                <input 
                    type="color" 
                    className="w-10 h-10 rounded-full border-4 border-white dark:border-gray-700 shadow-xl cursor-pointer transition-transform hover:scale-110"
                    value={settings.indoColor}
                    onChange={(e) => setSettings({...settings, indoColor: e.target.value})}
                  />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select 
                  className={`p-3 rounded-xl text-sm outline-none cursor-pointer ${inputBg}`}
                  value={settings.indoFont}
                  onChange={(e) => setSettings({...settings, indoFont: e.target.value})}
                >
                  {INDO_FONTS.map(f => <option key={f.name} value={f.family}>{f.name}</option>)}
                </select>
                <div className="relative">
                  <input 
                    type="number" 
                    className={`w-full p-3 rounded-xl text-sm outline-none ${inputBg}`}
                    value={settings.indoSize}
                    onChange={(e) => setSettings({...settings, indoSize: Number(e.target.value)})}
                  />
                  <span className="absolute right-3 top-3.5 text-[10px] font-bold opacity-30">PX</span>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className={`text-xs font-black ${subTextColor} uppercase tracking-widest`}>Latar Belakang</h2>
              <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isDarkMode ? 'bg-gray-800/30 border-gray-700/50' : 'bg-gray-50 border-gray-200/50'}`}>
                <label htmlFor="transparent" className={`text-sm font-semibold ${textColor}`}>Latar Transparan (PNG)</label>
                <input 
                  type="checkbox" 
                  id="transparent"
                  className="w-6 h-6 accent-emerald-600 rounded-lg cursor-pointer"
                  checked={settings.isTransparent}
                  onChange={(e) => setSettings({...settings, isTransparent: e.target.checked})}
                />
              </div>
              {!settings.isTransparent && (
                <div className="relative group">
                  <input 
                    type="color" 
                    className={`w-full h-14 p-1.5 rounded-2xl cursor-pointer transition-all ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} border-2`}
                    value={settings.backgroundColor}
                    onChange={(e) => setSettings({...settings, backgroundColor: e.target.value})}
                  />
                </div>
              )}
            </section>

            {/* Mobile Export Buttons - Part of the scroll area */}
            <section className="pt-4 pb-12 md:hidden">
              <ExportButtons />
            </section>
          </div>

          {/* Desktop Export Buttons - Fixed/Pinned at Bottom */}
          <div className={`hidden md:block px-6 py-6 border-t ${borderColor} ${sidebarBg} shadow-[0_-10px_30px_rgba(0,0,0,0.05)] transition-all flex-shrink-0`}>
            <ExportButtons />
          </div>
        </aside>

      </div>
    </div>
  );
};

export default App;

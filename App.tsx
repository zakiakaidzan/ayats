
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { fetchSurahs, fetchVerse } from './services/quranService';
import { Surah, Verse, EditorSettings, ARABIC_FONTS, INDO_FONTS, SavedPreset } from './types';
import { toPng, toJpeg } from 'html-to-image';

type MobileTab = 'verse' | 'style' | 'layout' | 'background' | 'presets' | 'export' | null;

const App: React.FC = () => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<number>(1);
  const [selectedVerse, setSelectedVerse] = useState<number>(1);
  const [verseData, setVerseData] = useState<Verse | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [presets, setPresets] = useState<SavedPreset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [activeTab, setActiveTab] = useState<MobileTab>(null); 

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
    backgroundImage: undefined,
    isTransparent: false,
    showSurahInfo: true,
    showDivider: true,
    showTranslation: true, // Default terjemahan ditampilkan
    verticalPosition: 'center',
    contentGap: 32,
    horizontalPadding: 32,

    showOverlay: true,
    overlayColor: '#000000',
    overlayOpacity: 40,
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSurahs().then(setSurahs);
    const savedPresets = localStorage.getItem('quran_editor_presets');
    if (savedPresets) {
      setPresets(JSON.parse(savedPresets));
    }
    // Auto-open panel on desktop
    if (window.innerWidth > 768) setActiveTab('verse');
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

  const filteredSurahs = useMemo(() => {
    return surahs.filter(s => 
      s.namaLatin.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.nomor.toString().includes(searchTerm)
    );
  }, [surahs, searchTerm]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSettings({ ...settings, backgroundImage: event.target?.result as string, isTransparent: false });
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSettings({ ...settings, backgroundImage: undefined });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExport = async (format: 'png' | 'jpg') => {
    if (!canvasRef.current) return;
    setExporting(true);
    
    try {
      const scale = 3; 
      const options = {
        pixelRatio: scale,
        quality: 1,
        backgroundColor: (settings.isTransparent && format === 'png') ? null : settings.backgroundColor,
        cacheBust: true,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
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

  // UI Colors - Fixed Contrast for Light Mode
  const uiBg = isDarkMode ? 'bg-gray-950' : 'bg-gray-100';
  const sidebarBg = isDarkMode ? 'bg-gray-900' : 'bg-white';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const subTextColor = isDarkMode ? 'text-gray-400' : 'text-gray-700';
  const borderColor = isDarkMode ? 'border-gray-800' : 'border-gray-200';
  const inputBg = isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900';

  const ExportButtons = () => (
    <div className="grid grid-cols-2 gap-4">
      <button 
        onClick={() => handleExport('png')}
        disabled={exporting}
        className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 text-sm shadow-lg shadow-emerald-900/20"
      >
        {exporting ? 'Wait...' : 'Export PNG'}
      </button>
      <button 
        onClick={() => handleExport('jpg')}
        disabled={exporting}
        className={`flex-1 py-4 border-2 font-black rounded-2xl transition-all disabled:opacity-50 text-sm active:scale-95 ${isDarkMode ? 'border-gray-700 text-white hover:bg-gray-800' : 'border-gray-400 text-gray-900 hover:bg-gray-100'}`}
      >
        Export JPG
      </button>
    </div>
  );

  const NavItem = ({ id, icon, label }: { id: MobileTab, icon: React.ReactNode, label: string }) => (
    <button 
      onClick={() => setActiveTab(prev => prev === id ? null : id)}
      className={`flex flex-col items-center justify-center gap-1 min-w-[60px] transition-all relative ${
        activeTab === id ? 'text-emerald-500 scale-110' : (isDarkMode ? 'text-gray-500' : 'text-gray-400')
      }`}
    >
      {icon}
      <span className={`text-[10px] font-bold uppercase tracking-tighter ${activeTab === id ? 'text-emerald-500' : (isDarkMode ? 'text-gray-500' : 'text-gray-400')}`}>
        {label}
      </span>
      {activeTab === id && <div className="absolute -bottom-2 w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
    </button>
  );

  return (
    <div className={`h-screen flex flex-col ${uiBg} transition-colors duration-300 overflow-hidden relative`}>
      {/* Header */}
      <header className={`flex items-center justify-between px-6 py-4 border-b transition-colors duration-300 z-50 ${sidebarBg} ${borderColor} flex-shrink-0`}>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-lg shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className={`text-lg md:text-xl font-black tracking-tight ${textColor}`}>Quran Reel</h1>
        </div>
        <button 
          onClick={toggleDarkMode}
          className={`p-2.5 rounded-full transition-all active:scale-90 ${isDarkMode ? 'bg-gray-800 text-yellow-400 border border-gray-700' : 'bg-gray-200 text-gray-700 border border-gray-300'}`}
        >
          {isDarkMode ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
          )}
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <main className={`flex-1 flex items-center justify-center overflow-hidden transition-colors duration-300 p-4 md:p-10 ${isDarkMode ? 'bg-gray-950' : 'bg-gray-200'}`}>
          <div 
            style={{
              transform: 'scale(var(--preview-scale, 1))',
              '--preview-scale': 'min(1, calc((100% - 100px) / 640), calc((100% - 40px) / 360))'
            } as any}
            className="flex-shrink-0 origin-center relative"
          >
            {/* Checkerboard for Transparency */}
            <div 
              className="absolute inset-0 shadow-[0_50px_100px_rgba(0,0,0,0.3)] rounded-sm overflow-hidden pointer-events-none"
              style={{
                backgroundColor: '#ffffff',
                backgroundImage: settings.isTransparent ? 'linear-gradient(45deg, #ddd 25%, transparent 25%), linear-gradient(-45deg, #ddd 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ddd 75%), linear-gradient(-45deg, transparent 75%, #ddd 75%)' : 'none',
                backgroundSize: '20px 20px',
              }}
            />

            <div 
              ref={canvasRef}
              className="relative overflow-hidden transition-all rounded-sm flex-shrink-0 z-10"
              style={{
                width: '360px', 
                height: '640px', 
                backgroundColor: settings.isTransparent ? 'transparent' : settings.backgroundColor,
              }}
            >
              {settings.backgroundImage && (
                <div className="absolute inset-0 z-0">
                  <img src={settings.backgroundImage} className="w-full h-full object-cover" alt="Background" />
                  {settings.showOverlay && (
                    <div 
                      className="absolute inset-0 z-0 transition-all"
                      style={{ 
                        backgroundColor: settings.overlayColor,
                        opacity: settings.overlayOpacity / 100
                      }}
                    />
                  )}
                </div>
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
                        marginBottom: settings.showTranslation ? `${settings.contentGap}px` : '0px',
                        textShadow: settings.backgroundImage ? '0 2px 10px rgba(0,0,0,0.5)' : 'none'
                      }}
                    >
                      {verseData.teksArab}
                    </div>
                    
                    {settings.showTranslation && (
                      <div 
                        className="w-full"
                        style={{ 
                          fontFamily: settings.indoFont,
                          fontSize: `${settings.indoSize}px`,
                          color: settings.indoColor,
                          lineHeight: settings.indoLineHeight,
                          textAlign: settings.indoAlign,
                          textShadow: settings.backgroundImage ? '0 2px 10px rgba(0,0,0,0.5)' : 'none'
                        }}
                      >
                        {verseData.teksIndonesia}
                      </div>
                    )}

                    {settings.showSurahInfo && (
                      <div className={`mt-8 pt-5 w-full flex justify-between items-end opacity-70 text-[11px] uppercase tracking-widest font-black ${
                        settings.showDivider ? 'border-t border-current/20' : ''
                      } ${
                        settings.verticalPosition === 'end' ? 'order-first mb-8 mt-0 border-t-0 pb-5' : ''
                      } ${
                        settings.verticalPosition === 'end' && settings.showDivider ? 'border-b border-current/20' : ''
                      }`}
                        style={{ 
                          color: settings.indoColor,
                          textShadow: settings.backgroundImage ? '0 2px 10px rgba(0,0,0,0.5)' : 'none'
                        }}
                      >
                        <span>QS. {surahs.find(s => s.nomor === selectedSurah)?.namaLatin}</span>
                        <span>Ayat {selectedVerse}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className={`text-center space-y-4 ${subTextColor}`}>
                    <svg className="w-16 h-16 mx-auto opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    <p className="font-black uppercase text-[10px] tracking-widest">Pilih Ayat Untuk Memulai</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Sidebar / Bottom Drawer */}
        <aside className={`w-full md:w-96 flex flex-col transition-all duration-500 ease-in-out ${sidebarBg} ${borderColor} border-t md:border-t-0 md:border-r shadow-2xl z-40 ${
          activeTab === null ? 'translate-y-full md:translate-y-0 opacity-0 md:opacity-100' : 'translate-y-0 opacity-100'
        } absolute md:relative bottom-[75px] md:bottom-0 left-0 right-0 h-[450px] md:h-full`}>
          
          {/* Mobile Handle / Close */}
          <div className="md:hidden flex justify-center py-3 border-b border-gray-100 dark:border-gray-800">
             <button onClick={() => setActiveTab(null)} className="w-16 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full hover:bg-emerald-500 transition-colors" />
          </div>

          <div className={`flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth pb-20 ${textColor}`}>
            
            {/* VERSES TAB */}
            {activeTab === 'verse' && (
              <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  <h2 className={`text-xs font-black uppercase tracking-widest ${subTextColor}`}>Pilih & Edit Ayat</h2>
                </div>
                <div className="space-y-4">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Cari Surah..."
                      className={`w-full p-3 pl-10 rounded-xl text-sm outline-none transition-all ${inputBg}`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <svg className="w-4 h-4 absolute left-3.5 top-3.5 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className={`text-[10px] font-bold opacity-70 px-1 uppercase ${subTextColor}`}>Surah</label>
                      <select 
                        className={`w-full p-3 rounded-xl text-sm outline-none cursor-pointer ${inputBg}`}
                        value={selectedSurah}
                        onChange={(e) => { setSelectedSurah(Number(e.target.value)); setSelectedVerse(1); }}
                      >
                        {filteredSurahs.map(s => <option key={s.nomor} value={s.nomor}>{s.nomor}. {s.namaLatin}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className={`text-[10px] font-bold opacity-70 px-1 uppercase ${subTextColor}`}>Ayat</label>
                      <select 
                        className={`w-full p-3 rounded-xl text-sm outline-none cursor-pointer ${inputBg}`}
                        value={selectedVerse}
                        onChange={(e) => setSelectedVerse(Number(e.target.value))}
                      >
                        {Array.from({ length: surahs.find(s => s.nomor === selectedSurah)?.jumlahAyat || 0 }, (_, i) => i + 1).map(v => (
                          <option key={v} value={v}>Ayat {v}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {verseData && !loading && (
                    <div className="space-y-4 pt-2">
                      <div className="space-y-1.5">
                        <label className={`block text-[10px] font-bold uppercase px-1 ${subTextColor}`}>Teks Arab</label>
                        <textarea 
                          className={`w-full p-3 rounded-xl text-lg outline-none transition-all resize-none min-h-[80px] leading-relaxed text-right ${inputBg}`}
                          style={{ fontFamily: settings.arabicFont }}
                          value={verseData.teksArab}
                          onChange={(e) => setVerseData({...verseData, teksArab: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className={`block text-[10px] font-bold uppercase px-1 ${subTextColor}`}>Terjemahan</label>
                        <textarea 
                          className={`w-full p-3 rounded-xl text-sm outline-none transition-all resize-none min-h-[80px] leading-relaxed ${inputBg}`}
                          style={{ fontFamily: settings.indoFont }}
                          value={verseData.teksIndonesia}
                          onChange={(e) => setVerseData({...verseData, teksIndonesia: e.target.value})}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* STYLE TAB */}
            {activeTab === 'style' && (
              <section className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                  <h2 className={`text-xs font-black uppercase tracking-widest ${subTextColor}`}>Tipografi & Warna</h2>
                </div>
                
                <div className="space-y-6">
                  {/* Arab Style */}
                  <div className={`p-4 rounded-2xl border ${borderColor} ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-black uppercase text-emerald-600">Font Arab</span>
                      <input type="color" className="w-8 h-8 rounded-full border-2 border-white shadow-sm cursor-pointer" value={settings.arabicColor} onChange={(e) => setSettings({...settings, arabicColor: e.target.value})} />
                    </div>
                    <select className={`w-full p-2.5 rounded-xl text-xs mb-4 ${inputBg}`} value={settings.arabicFont} onChange={(e) => setSettings({...settings, arabicFont: e.target.value})}>
                      {ARABIC_FONTS.map(f => <option key={f.name} value={f.family}>{f.name}</option>)}
                    </select>
                    <div className="space-y-1">
                      <div className={`flex justify-between text-[9px] font-black uppercase opacity-60 ${textColor}`}>
                        <span>Ukuran</span><span>{settings.arabicSize}px</span>
                      </div>
                      <input type="range" min="20" max="150" className="w-full h-2 rounded-lg appearance-none bg-gray-200 dark:bg-gray-700 accent-emerald-500" value={settings.arabicSize} onChange={(e) => setSettings({...settings, arabicSize: Number(e.target.value)})} />
                    </div>
                  </div>

                  {/* Indo Style */}
                  <div className={`p-4 rounded-2xl border ${borderColor} ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <span className={`text-[10px] font-black uppercase opacity-60 ${textColor}`}>Terjemahan</span>
                      <input type="color" className="w-8 h-8 rounded-full border-2 border-white shadow-sm cursor-pointer" value={settings.indoColor} onChange={(e) => setSettings({...settings, indoColor: e.target.value})} />
                    </div>
                    <select className={`w-full p-2.5 rounded-xl text-xs mb-4 ${inputBg}`} value={settings.indoFont} onChange={(e) => setSettings({...settings, indoFont: e.target.value})}>
                      {INDO_FONTS.map(f => <option key={f.name} value={f.family}>{f.name}</option>)}
                    </select>
                    <div className="space-y-1">
                      <div className={`flex justify-between text-[9px] font-black uppercase opacity-60 ${textColor}`}>
                        <span>Ukuran</span><span>{settings.indoSize}px</span>
                      </div>
                      <input type="range" min="10" max="80" className="w-full h-2 rounded-lg appearance-none bg-gray-200 dark:bg-gray-700 accent-emerald-500" value={settings.indoSize} onChange={(e) => setSettings({...settings, indoSize: Number(e.target.value)})} />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* LAYOUT TAB */}
            {activeTab === 'layout' && (
              <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h7" /></svg>
                  <h2 className={`text-xs font-black uppercase tracking-widest ${subTextColor}`}>Format & Posisi</h2>
                </div>
                <div className="space-y-6">
                  <div className={`flex p-1 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                    {(['start', 'center', 'end'] as const).map(pos => (
                      <button 
                        key={pos}
                        className={`flex-1 py-3 rounded-lg text-[10px] font-black transition-all ${settings.verticalPosition === pos ? 'bg-emerald-500 text-white shadow-lg scale-105' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setSettings({...settings, verticalPosition: pos})}
                      >
                        {pos === 'start' ? 'ATAS' : pos === 'center' ? 'TENGAH' : 'BAWAH'}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <div className={`flex justify-between text-[9px] font-black opacity-60 uppercase ${textColor}`}><span>Spasi Teks</span><span>{settings.contentGap}px</span></div>
                      <input type="range" min="0" max="150" className="w-full h-2 rounded-lg appearance-none bg-gray-200 dark:bg-gray-700 accent-emerald-500" value={settings.contentGap} onChange={(e) => setSettings({...settings, contentGap: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <div className={`flex justify-between text-[9px] font-black uppercase opacity-60 uppercase ${textColor}`}><span>Margin Samping</span><span>{settings.horizontalPadding}px</span></div>
                      <input type="range" min="0" max="100" className="w-full h-2 rounded-lg appearance-none bg-gray-200 dark:bg-gray-700 accent-emerald-500" value={settings.horizontalPadding} onChange={(e) => setSettings({...settings, horizontalPadding: Number(e.target.value)})} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className={`flex items-center justify-between p-4 rounded-xl border ${borderColor}`}>
                      <span className={`text-xs font-bold ${textColor}`}>Tampilkan Terjemahan</span>
                      <input type="checkbox" className="w-6 h-6 accent-emerald-600 rounded" checked={settings.showTranslation} onChange={(e) => setSettings({...settings, showTranslation: e.target.checked})} />
                    </div>
                    <div className={`flex items-center justify-between p-4 rounded-xl border ${borderColor}`}>
                      <span className={`text-xs font-bold ${textColor}`}>Informasi Surat</span>
                      <input type="checkbox" className="w-6 h-6 accent-emerald-600 rounded" checked={settings.showSurahInfo} onChange={(e) => setSettings({...settings, showSurahInfo: e.target.checked})} />
                    </div>
                    <div className={`flex items-center justify-between p-4 rounded-xl border ${borderColor}`}>
                      <span className={`text-xs font-bold ${textColor}`}>Garis Pemisah</span>
                      <input type="checkbox" className="w-6 h-6 accent-emerald-600 rounded" checked={settings.showDivider} onChange={(e) => setSettings({...settings, showDivider: e.target.checked})} />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* BACKGROUND TAB */}
            {activeTab === 'background' && (
              <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <h2 className={`text-xs font-black uppercase tracking-widest ${subTextColor}`}>Kanvas Latar</h2>
                </div>
                <div className="space-y-6">
                  <div className={`flex items-center justify-between p-4 rounded-xl border ${borderColor}`}>
                    <span className={`text-xs font-bold ${textColor}`}>Mode Transparan</span>
                    <input type="checkbox" className="w-6 h-6 accent-emerald-600 rounded" checked={settings.isTransparent} onChange={(e) => setSettings({...settings, isTransparent: e.target.checked})} />
                  </div>
                  
                  {!settings.isTransparent && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <span className={`text-[10px] font-black opacity-50 uppercase px-1 ${textColor}`}>Warna Solid</span>
                          <input type="color" className="w-full h-12 rounded-xl cursor-pointer shadow-sm border border-gray-200" value={settings.backgroundColor} onChange={(e) => setSettings({...settings, backgroundColor: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <span className={`text-[10px] font-black opacity-50 uppercase px-1 ${textColor}`}>Unggah Foto</span>
                          <button onClick={() => fileInputRef.current?.click()} className={`w-full h-12 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 border ${inputBg}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            {settings.backgroundImage ? 'Ganti' : 'Pilih'}
                          </button>
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </div>
                      </div>
                      
                      {settings.backgroundImage && (
                        <div className={`p-5 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'} space-y-5 border ${borderColor}`}>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-black uppercase ${textColor}`}>Lapisan Overlay</span>
                            <input type="checkbox" className="w-6 h-6 accent-emerald-600 rounded" checked={settings.showOverlay} onChange={(e) => setSettings({...settings, showOverlay: e.target.checked})} />
                          </div>
                          {settings.showOverlay && (
                            <div className="grid grid-cols-1 gap-4">
                              <div className="space-y-2">
                                <label className={`text-[9px] font-black opacity-50 uppercase ${textColor}`}>Warna Overlay</label>
                                <input type="color" className="w-full h-8 rounded-lg shadow-sm" value={settings.overlayColor} onChange={(e) => setSettings({...settings, overlayColor: e.target.value})} />
                              </div>
                              <div className="space-y-2">
                                <label className={`text-[9px] font-black opacity-50 uppercase ${textColor}`}>Intensitas: {settings.overlayOpacity}%</label>
                                <input type="range" min="0" max="100" className="w-full h-2 rounded-lg appearance-none bg-gray-300 dark:bg-gray-600 accent-emerald-500" value={settings.overlayOpacity} onChange={(e) => setSettings({...settings, overlayOpacity: Number(e.target.value)})} />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* PRESETS TAB */}
            {activeTab === 'presets' && (
              <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                  <h2 className={`text-xs font-black uppercase tracking-widest ${subTextColor}`}>Simpan Gaya</h2>
                </div>
                <div className="space-y-5">
                  <div className="flex gap-2">
                    <input type="text" placeholder="Nama preset..." className={`flex-1 p-3 text-sm rounded-xl outline-none shadow-sm ${inputBg}`} value={presetName} onChange={(e) => setPresetName(e.target.value)} />
                    <button onClick={savePreset} className="px-5 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-tighter active:scale-95 transition-all shadow-lg hover:bg-emerald-700">Simpan</button>
                  </div>
                  <div className="flex flex-wrap gap-3 pt-2">
                    {presets.length === 0 && <p className="text-[10px] opacity-40 italic w-full text-center">Belum ada gaya tersimpan.</p>}
                    {presets.map(p => (
                      <div key={p.id} className="group relative">
                        <button onClick={() => loadPreset(p)} className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase border tracking-widest transition-all shadow-sm ${isDarkMode ? 'border-gray-700 bg-gray-800 text-gray-200' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}>{p.name}</button>
                        <button onClick={() => deletePreset(p.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-xl opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110">×</button>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* EXPORT TAB */}
            {activeTab === 'export' && (
              <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  <h2 className={`text-xs font-black uppercase tracking-widest ${subTextColor}`}>Hasil Akhir</h2>
                </div>
                <div className={`p-6 rounded-2xl border ${borderColor} ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'} space-y-6`}>
                   <ExportButtons />
                   <div className={`text-[10px] text-center space-y-2 opacity-60 font-black uppercase tracking-widest ${textColor}`}>
                     <p className="flex items-center justify-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"/> Rasio: 9:16 (High-Res)</p>
                     <p className="flex items-center justify-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"/> Kualitas: 3x Supersampling</p>
                   </div>
                </div>
              </section>
            )}

          </div>
        </aside>
      </div>

      {/* BOTTOM NAVIGATION */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 h-[75px] z-[100] border-t backdrop-blur-2xl flex items-center justify-around px-2 transition-all duration-300 ${
        isDarkMode ? 'bg-gray-950/90 border-gray-800' : 'bg-white/95 border-gray-200 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]'
      }`}>
        <NavItem id="verse" label="Ayat" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>} />
        <NavItem id="style" label="Gaya" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>} />
        <NavItem id="layout" label="Format" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h7" /></svg>} />
        <NavItem id="background" label="Kanvas" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
        <NavItem id="presets" label="Favorit" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>} />
        <NavItem id="export" label="Selesai" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>} />
      </nav>
    </div>
  );
};

export default App;


import React, { useState, useEffect, useRef, useMemo } from 'react';
import { fetchSurahs, fetchVerse } from './services/quranService';
import { Surah, Verse, EditorSettings, ARABIC_FONTS, INDO_FONTS, SavedPreset } from './types';
import { toPng, toJpeg } from 'html-to-image';

type TabId = 'verse' | 'style' | 'layout' | 'background' | 'presets' | 'export';
type ActiveTab = TabId | null;

const App: React.FC = () => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<number>(1);
  const [selectedVerse, setSelectedVerse] = useState<number>(1);
  const [verseData, setVerseData] = useState<Verse | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [presets, setPresets] = useState<SavedPreset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('verse');

  const [settings, setSettings] = useState<EditorSettings>({
    arabicFont: ARABIC_FONTS[0].family,
    arabicSize: 42,
    arabicColor: '#1a1a1a',
    arabicLineHeight: 1.8,
    arabicAlign: 'center',
    
    indoFont: INDO_FONTS[0].family,
    indoSize: 18,
    indoColor: '#374151',
    indoLineHeight: 1.5,
    indoAlign: 'center',
    
    backgroundColor: '#ffffff',
    backgroundImage: undefined,
    isTransparent: false,
    showSurahInfo: true,
    showDivider: true,
    showTranslation: true,
    verticalPosition: 'center',
    contentGap: 40,
    horizontalPadding: 40,

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
    if (window.innerWidth <= 768) {
        setActiveTab(null);
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

  const filteredSurahs = useMemo(() => {
    return surahs.filter(s => 
      s.namaLatin.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.nomor.toString().includes(searchTerm)
    );
  }, [surahs, searchTerm]);

  const handleSurahChange = (num: number) => {
    setSelectedSurah(num);
    setSelectedVerse(1);
    setSearchTerm(''); // Clear search on selection for better UX
  };

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
        style: { transform: 'scale(1)', transformOrigin: 'top left' }
      };
      let dataUrl = await (format === 'png' ? toPng(canvasRef.current, options) : toJpeg(canvasRef.current, options));
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
    const newPreset: SavedPreset = { id: Date.now().toString(), name: presetName, settings: { ...settings } };
    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem('quran_editor_presets', JSON.stringify(updated));
    setPresetName('');
  };

  const loadPreset = (preset: SavedPreset) => setSettings(preset.settings);
  const deletePreset = (id: string) => {
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    localStorage.setItem('quran_editor_presets', JSON.stringify(updated));
  };

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  // UI Colors
  const uiBg = isDarkMode ? 'bg-black' : 'bg-gray-50';
  const sidebarBg = isDarkMode ? 'bg-[#0f1115]' : 'bg-white';
  const previewContainerBg = isDarkMode ? 'bg-black' : 'bg-gray-100';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const subTextColor = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const borderColor = isDarkMode ? 'border-gray-800' : 'border-gray-200';
  const inputBg = isDarkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-gray-50 border-gray-200 text-gray-900';

  const icons = {
    verse: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
    style: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>,
    layout: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h7" /></svg>,
    background: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    presets: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>,
    export: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
  };

  const labels: Record<TabId, string> = {
    verse: 'Ayat', style: 'Gaya', layout: 'Format', background: 'Kanvas', presets: 'Favorit', export: 'Selesai'
  };

  const NavItem = ({ id, desktop = false }: { id: TabId, desktop?: boolean }) => {
    const isActive = activeTab === id;
    return (
      <button 
        onClick={() => setActiveTab(prev => (prev === id && !desktop) ? null : id)}
        className={`flex flex-col items-center justify-center gap-1.5 transition-all relative ${
          isActive ? 'text-emerald-500 scale-105' : (isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600')
        } ${desktop ? 'w-full py-5' : 'min-w-[60px]'}`}
      >
        <div className={`p-2.5 rounded-2xl transition-all ${isActive ? 'bg-emerald-500/10' : 'bg-transparent'}`}>
          {icons[id]}
        </div>
        <span className="text-[10px] font-black uppercase tracking-tighter">{labels[id]}</span>
        {isActive && desktop && <div className="absolute right-0 top-1/4 bottom-1/4 w-1 bg-emerald-500 rounded-l-full shadow-[0_0_10px_#10b981]" />}
      </button>
    );
  };

  return (
    <div className={`h-screen flex flex-col ${uiBg} transition-colors duration-300 overflow-hidden relative`}>
      {/* INFO MODAL */}
      {showInfoModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`w-full max-w-md p-8 rounded-[40px] shadow-2xl transition-all ${sidebarBg} ${textColor} border ${borderColor}`}>
            <div className="flex justify-between items-start mb-6">
              <div className="bg-emerald-600/10 p-3 rounded-2xl text-emerald-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <button onClick={() => setShowInfoModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-black tracking-tight">Tentang Aplikasi</h3>
              <p className={`text-sm leading-relaxed ${subTextColor}`}>
                Quran Reel Editor adalah alat bantu untuk membuat visual kutipan ayat Al-Qur'an yang estetis. Dirancang khusus for konten media sosial seperti Instagram Reels, YouTube Shorts, dan TikTok.
              </p>
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Dibuat Oleh</p>
                <p className="text-lg font-black">Zaki Kaidzan</p>
              </div>
              <div className="pt-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Hubungkan</p>
                <div className="flex flex-wrap gap-3">
                  <a href="#" className="p-3 bg-gray-100 dark:bg-white/5 rounded-2xl hover:text-emerald-500 transition-all flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.336 3.608 1.31.974.974 1.248 2.242 1.31 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.336 2.633-1.31 3.608-.974.974-2.242 1.248-3.608 1.31-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.336-3.608-1.31-.974-.974-1.248-2.242-1.31-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.336-2.633 1.31-3.608.974-.974 2.242-1.248 3.608-1.31 1.266-.058-1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.358-.2 6.78-2.618 6.98-6.98.058-1.28.072-1.689.072-4.948s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98-1.28-.058-1.689-.072-4.948-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    <span className="text-xs font-bold">Instagram</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className={`flex items-center justify-between px-6 py-4 border-b transition-colors duration-300 z-50 ${sidebarBg} ${borderColor} flex-shrink-0`}>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-lg shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </div>
          <h1 className={`text-lg md:text-xl font-black tracking-tight ${textColor}`}>Quran Reel</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowInfoModal(true)} 
            className={`p-2.5 rounded-full transition-all active:scale-90 ${isDarkMode ? 'bg-gray-800 text-gray-400 border border-gray-700' : 'bg-gray-200 text-gray-600 border border-gray-300'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </button>
          <button onClick={toggleDarkMode} className={`p-2.5 rounded-full transition-all active:scale-90 ${isDarkMode ? 'bg-gray-800 text-yellow-400 border border-gray-700' : 'bg-gray-200 text-gray-700 border border-gray-300'}`}>
            {isDarkMode ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" /></svg> : <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>}
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* SIDEBAR DENGAN LAYOUT PRO EDITOR (DESKTOP DI KIRI) */}
        <aside className={`w-full md:w-[460px] flex transition-all duration-500 ease-in-out ${sidebarBg} ${borderColor} border-t md:border-t-0 md:border-r shadow-2xl z-40 ${
          activeTab === null ? 'translate-y-full md:translate-y-0 opacity-0 md:opacity-100' : 'translate-y-0 opacity-100'
        } absolute md:relative bottom-[75px] md:bottom-0 left-0 right-0 h-[500px] md:h-full`}>
          
          {/* 1. RAIL IKON (Desktop Only) */}
          <div className={`hidden md:flex flex-col w-24 border-r border-gray-100 dark:border-gray-800 flex-shrink-0 transition-colors ${isDarkMode ? 'bg-[#0a0c10]' : 'bg-white'}`}>
            <NavItem id="verse" desktop />
            <NavItem id="style" desktop />
            <NavItem id="layout" desktop />
            <NavItem id="background" desktop />
            <NavItem id="presets" desktop />
            <NavItem id="export" desktop />
          </div>

          {/* 2. PANEL KONTEN (Desktop & Mobile) */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Mobile Handle */}
            <div className="md:hidden flex justify-center py-3 border-b border-gray-100 dark:border-gray-800">
               <button onClick={() => setActiveTab(null)} className="w-16 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
            </div>

            <div className={`flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scroll-smooth pb-20 ${textColor}`}>
              
              {activeTab && (
                <div className="mb-6 animate-in fade-in duration-500">
                   <h2 className="text-xl md:text-2xl font-black tracking-tight">{labels[activeTab]}</h2>
                   <p className={`text-[10px] md:text-xs uppercase font-bold tracking-widest mt-1 ${subTextColor}`}>Konfigurasi {labels[activeTab]}</p>
                </div>
              )}

              {activeTab === 'verse' && (
                <section className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="space-y-4">
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Cari Surah..." 
                        className={`w-full p-3.5 pl-11 rounded-2xl text-sm outline-none transition-all ${inputBg}`} 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                      />
                      <svg className="w-4 h-4 absolute left-4 top-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      
                      {/* Search Suggestions */}
                      {searchTerm && filteredSurahs.length > 0 && (
                        <div className={`absolute left-0 right-0 mt-2 p-2 rounded-2xl border shadow-2xl z-50 max-h-60 overflow-y-auto ${sidebarBg} ${borderColor}`}>
                          {filteredSurahs.map(s => (
                            <button 
                              key={s.nomor} 
                              onClick={() => handleSurahChange(s.nomor)}
                              className={`w-full text-left p-3 rounded-xl text-sm transition-all hover:bg-emerald-500 hover:text-white flex justify-between items-center group`}
                            >
                              <span>{s.nomor}. {s.namaLatin}</span>
                              <span className="text-[10px] opacity-50 group-hover:opacity-100">{s.jumlahAyat} Ayat</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase px-1 opacity-50">Surah</label>
                        <select 
                          className={`w-full p-3 rounded-2xl text-sm outline-none cursor-pointer ${inputBg}`} 
                          value={selectedSurah} 
                          onChange={(e) => handleSurahChange(Number(e.target.value))}
                        >
                          {surahs.map(s => <option key={s.nomor} value={s.nomor}>{s.nomor}. {s.namaLatin}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase px-1 opacity-50">Ayat</label>
                        <select 
                          className={`w-full p-3 rounded-2xl text-sm outline-none cursor-pointer ${inputBg}`} 
                          value={selectedVerse} 
                          onChange={(e) => setSelectedVerse(Number(e.target.value))}
                        >
                          {Array.from({ length: surahs.find(s => s.nomor === selectedSurah)?.jumlahAyat || 0 }, (_, i) => i + 1).map(v => (<option key={v} value={v}>Ayat {v}</option>))}
                        </select>
                      </div>
                    </div>
                    {verseData && !loading && (
                      <div className="space-y-5 pt-4">
                        <div className="space-y-2"><label className="block text-[10px] font-black uppercase px-1 opacity-50">Teks Arab</label><textarea className={`w-full p-4 rounded-2xl text-xl outline-none transition-all resize-none min-h-[100px] leading-relaxed text-right ${inputBg}`} style={{ fontFamily: settings.arabicFont }} value={verseData.teksArab} onChange={(e) => setVerseData({...verseData, teksArab: e.target.value})} /></div>
                        <div className="space-y-2"><label className="block text-[10px] font-black uppercase px-1 opacity-50">Terjemahan</label><textarea className={`w-full p-4 rounded-2xl text-sm outline-none transition-all resize-none min-h-[100px] leading-relaxed ${inputBg}`} style={{ fontFamily: settings.indoFont }} value={verseData.teksIndonesia} onChange={(e) => setVerseData({...verseData, teksIndonesia: e.target.value})} /></div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {activeTab === 'style' && (
                <section className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="space-y-6">
                    {/* Arabic Style Section */}
                    <div className={`p-5 rounded-3xl border ${borderColor} ${isDarkMode ? 'bg-white/5 shadow-[0_0_20px_rgba(0,0,0,0.5)]' : 'bg-white shadow-sm'}`}>
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-black uppercase text-emerald-600">Tipografi Al-Qur'an</span>
                          <span className="text-[9px] opacity-40 uppercase font-bold tracking-widest mt-0.5">Edit Gaya Teks Arab</span>
                        </div>
                        <input type="color" className="w-10 h-10 rounded-xl border-4 border-white shadow-xl cursor-pointer" value={settings.arabicColor} onChange={(e) => setSettings({...settings, arabicColor: e.target.value})} />
                      </div>
                      
                      <div className="space-y-4">
                        <select className={`w-full p-3.5 rounded-2xl text-sm ${inputBg}`} value={settings.arabicFont} onChange={(e) => setSettings({...settings, arabicFont: e.target.value})}>
                          {ARABIC_FONTS.map(f => <option key={f.name} value={f.family}>{f.name}</option>)}
                        </select>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-black uppercase opacity-60"><span>Ukuran Font</span><span>{settings.arabicSize}px</span></div>
                          <input type="range" min="20" max="150" className="w-full h-2 rounded-lg appearance-none bg-gray-200 dark:bg-gray-700 accent-emerald-500" value={settings.arabicSize} onChange={(e) => setSettings({...settings, arabicSize: Number(e.target.value)})} />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-black uppercase opacity-60"><span>Spasi Baris Arab</span><span>{settings.arabicLineHeight}</span></div>
                          <input type="range" min="1" max="3" step="0.1" className="w-full h-2 rounded-lg appearance-none bg-gray-200 dark:bg-gray-700 accent-emerald-500" value={settings.arabicLineHeight} onChange={(e) => setSettings({...settings, arabicLineHeight: Number(e.target.value)})} />
                        </div>
                      </div>
                    </div>

                    {/* Translation Style Section */}
                    <div className={`p-5 rounded-3xl border ${borderColor} ${isDarkMode ? 'bg-white/5' : 'bg-white shadow-sm'}`}>
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-black uppercase opacity-60">Tipografi Terjemahan</span>
                          <span className="text-[9px] opacity-40 uppercase font-bold tracking-widest mt-0.5">Edit Gaya Teks Indonesia</span>
                        </div>
                        <input type="color" className="w-10 h-10 rounded-xl border-4 border-white shadow-xl cursor-pointer" value={settings.indoColor} onChange={(e) => setSettings({...settings, indoColor: e.target.value})} />
                      </div>
                      
                      <div className="space-y-4">
                        <select className={`w-full p-3.5 rounded-2xl text-sm ${inputBg}`} value={settings.indoFont} onChange={(e) => setSettings({...settings, indoFont: e.target.value})}>
                          {INDO_FONTS.map(f => <option key={f.name} value={f.family}>{f.name}</option>)}
                        </select>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-black uppercase opacity-60"><span>Ukuran Font</span><span>{settings.indoSize}px</span></div>
                          <input type="range" min="10" max="80" className="w-full h-2 rounded-lg appearance-none bg-gray-200 dark:bg-gray-700 accent-emerald-500" value={settings.indoSize} onChange={(e) => setSettings({...settings, indoSize: Number(e.target.value)})} />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-black uppercase opacity-60"><span>Spasi Baris Terjemahan</span><span>{settings.indoLineHeight}</span></div>
                          <input type="range" min="1" max="2.5" step="0.1" className="w-full h-2 rounded-lg appearance-none bg-gray-200 dark:bg-gray-700 accent-emerald-500" value={settings.indoLineHeight} onChange={(e) => setSettings({...settings, indoLineHeight: Number(e.target.value)})} />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {activeTab === 'layout' && (
                <section className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className={`flex p-1.5 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200 shadow-inner'}`}>
                    {(['start', 'center', 'end'] as const).map(pos => (<button key={pos} className={`flex-1 py-3.5 rounded-xl text-[10px] font-black transition-all ${settings.verticalPosition === pos ? 'bg-emerald-500 text-white shadow-xl scale-105' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setSettings({...settings, verticalPosition: pos})}>{pos === 'start' ? 'ATAS' : pos === 'center' ? 'TENGAH' : 'BAWAH'}</button>))}
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-black opacity-60 uppercase">
                        <span>Jarak Arab ke Terjemahan</span>
                        <span>{settings.contentGap}px</span>
                      </div>
                      <input type="range" min="0" max="150" className="w-full h-2 rounded-lg appearance-none bg-gray-200 dark:bg-gray-700 accent-emerald-500" value={settings.contentGap} onChange={(e) => setSettings({...settings, contentGap: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-black uppercase">
                        <span>Padding Horizontal</span>
                        <span>{settings.horizontalPadding}px</span>
                      </div>
                      <input type="range" min="0" max="100" className="w-full h-2 rounded-lg appearance-none bg-gray-200 dark:bg-gray-700 accent-emerald-500" value={settings.horizontalPadding} onChange={(e) => setSettings({...settings, horizontalPadding: Number(e.target.value)})} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className={`flex items-center justify-between p-5 rounded-2xl border ${borderColor} ${isDarkMode ? 'bg-white/5' : 'bg-white shadow-sm'}`}><span className="text-sm font-bold">Tampilkan Terjemahan</span><input type="checkbox" className="w-6 h-6 accent-emerald-600 rounded-lg" checked={settings.showTranslation} onChange={(e) => setSettings({...settings, showTranslation: e.target.checked})} /></div>
                    <div className={`flex items-center justify-between p-5 rounded-2xl border ${borderColor} ${isDarkMode ? 'bg-white/5' : 'bg-white shadow-sm'}`}><span className="text-sm font-bold">Info Surat & Ayat</span><input type="checkbox" className="w-6 h-6 accent-emerald-600 rounded-lg" checked={settings.showSurahInfo} onChange={(e) => setSettings({...settings, showSurahInfo: e.target.checked})} /></div>
                    <div className={`flex items-center justify-between p-5 rounded-2xl border ${borderColor} ${isDarkMode ? 'bg-white/5' : 'bg-white shadow-sm'}`}><span className="text-sm font-bold">Garis Pembatas</span><input type="checkbox" className="w-6 h-6 accent-emerald-600 rounded-lg" checked={settings.showDivider} onChange={(e) => setSettings({...settings, showDivider: e.target.checked})} /></div>
                  </div>
                </section>
              )}

              {activeTab === 'background' && (
                <section className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className={`flex items-center justify-between p-5 rounded-2xl border ${borderColor} ${isDarkMode ? 'bg-white/5' : 'bg-white shadow-sm'}`}><span className="text-sm font-bold">Latar Belakang Transparan</span><input type="checkbox" className="w-6 h-6 accent-emerald-600 rounded-lg" checked={settings.isTransparent} onChange={(e) => setSettings({...settings, isTransparent: e.target.checked})} /></div>
                  {!settings.isTransparent && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><label className="text-[10px] font-black opacity-50 uppercase px-1">Warna Kanvas</label><input type="color" className="w-full h-14 rounded-2xl cursor-pointer shadow-lg border-4 border-white" value={settings.backgroundColor} onChange={(e) => setSettings({...settings, backgroundColor: e.target.value})} /></div>
                        <div className="space-y-2"><label className="text-[10px] font-black opacity-50 uppercase px-1">Unggah Foto</label><button onClick={() => fileInputRef.current?.click()} className={`w-full h-14 rounded-2xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 border shadow-sm ${inputBg}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>{settings.backgroundImage ? 'Ganti Foto' : 'Pilih Foto'}</button><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} /></div>
                      </div>
                      {settings.backgroundImage && (
                        <div className={`p-6 rounded-3xl ${isDarkMode ? 'bg-white/5' : 'bg-white border shadow-sm'} space-y-6`}>
                          <div className="flex items-center justify-between"><span className="text-xs font-black uppercase">Efek Overlay Gelap</span><input type="checkbox" className="w-6 h-6 accent-emerald-600 rounded-lg" checked={settings.showOverlay} onChange={(e) => setSettings({...settings, showOverlay: e.target.checked})} /></div>
                          {settings.showOverlay && (
                            <div className="space-y-5">
                              <div className="space-y-2"><label className="text-[10px] font-black opacity-50 uppercase">Warna Overlay</label><input type="color" className="w-full h-10 rounded-xl shadow-inner" value={settings.overlayColor} onChange={(e) => setSettings({...settings, overlayColor: e.target.value})} /></div>
                              <div className="space-y-2"><label className="text-[10px] font-black opacity-50 uppercase">Opasitas: {settings.overlayOpacity}%</label><input type="range" min="0" max="100" className="w-full h-2 rounded-lg appearance-none bg-gray-200 dark:bg-gray-700 accent-emerald-500" value={settings.overlayOpacity} onChange={(e) => setSettings({...settings, overlayOpacity: Number(e.target.value)})} /></div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}

              {activeTab === 'presets' && (
                <section className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="space-y-5">
                    <div className="flex gap-3"><input type="text" placeholder="Beri nama gaya ini..." className={`flex-1 p-4 text-sm rounded-2xl outline-none shadow-sm ${inputBg}`} value={presetName} onChange={(e) => setPresetName(e.target.value)} /><button onClick={savePreset} className="px-6 py-4 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase active:scale-95 transition-all shadow-xl hover:bg-emerald-700">Simpan</button></div>
                    <div className="grid grid-cols-1 gap-3 pt-4">
                      {presets.length === 0 && <div className="p-10 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl opacity-40 italic text-sm">Belum ada gaya favorit.</div>}
                      {presets.map(p => (
                        <div key={p.id} className="group relative flex items-center gap-3 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-emerald-500/50 transition-all bg-white dark:bg-white/5 shadow-sm">
                          <button onClick={() => loadPreset(p)} className="flex-1 text-left font-bold text-sm tracking-tight">{p.name}</button>
                          <button onClick={() => deletePreset(p.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {activeTab === 'export' && (
                <section className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className={`p-8 rounded-[40px] border-2 border-emerald-500/20 ${isDarkMode ? 'bg-emerald-500/5' : 'bg-white shadow-2xl shadow-emerald-500/10'} space-y-8`}>
                     <div className="grid grid-cols-1 gap-5">
                       <button onClick={() => handleExport('png')} disabled={exporting} className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black text-lg hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 shadow-2xl shadow-emerald-900/30">DOWNLOAD PNG</button>
                       <button onClick={() => handleExport('jpg')} disabled={exporting} className={`w-full py-5 border-4 rounded-3xl font-black text-lg active:scale-95 transition-all ${isDarkMode ? 'border-gray-800 text-white hover:bg-gray-800' : 'border-gray-200 text-gray-900 hover:bg-gray-50'}`}>DOWNLOAD JPG</button>
                     </div>
                     <div className={`text-[10px] text-center space-y-3 opacity-60 font-black uppercase tracking-[0.2em] ${textColor}`}>
                       <p className="flex items-center justify-center gap-2">Format: Vertikal 9:16 (Story)</p>
                       <p className="flex items-center justify-center gap-2">Resolusi: 1080 x 1920 (HD+)</p>
                     </div>
                  </div>
                </section>
              )}
            </div>
          </div>
        </aside>

        {/* MAIN PREVIEW AREA */}
        <main className={`flex-1 flex items-center justify-center overflow-hidden transition-colors duration-300 p-4 md:p-10 ${previewContainerBg}`}>
          <div style={{ transform: 'scale(var(--preview-scale, 1))', '--preview-scale': 'min(1, calc((100% - 100px) / 640), calc((100% - 40px) / 360))' } as any} className="flex-shrink-0 origin-center relative">
            <div className="absolute inset-0 shadow-[0_50px_100px_rgba(0,0,0,0.3)] rounded-sm overflow-hidden pointer-events-none" style={{ backgroundColor: '#ffffff', backgroundImage: settings.isTransparent ? 'linear-gradient(45deg, #ddd 25%, transparent 25%), linear-gradient(-45deg, #ddd 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ddd 75%), linear-gradient(-45deg, transparent 75%, #ddd 75%)' : 'none', backgroundSize: '20px 20px' }} />
            <div ref={canvasRef} className="relative overflow-hidden transition-all rounded-sm flex-shrink-0 z-10" style={{ width: '360px', height: '640px', backgroundColor: settings.isTransparent ? 'transparent' : settings.backgroundColor }}>
              {settings.backgroundImage && <div className="absolute inset-0 z-0"><img src={settings.backgroundImage} className="w-full h-full object-cover" alt="Background" />{settings.showOverlay && <div className="absolute inset-0 z-0 transition-all" style={{ backgroundColor: settings.overlayColor, opacity: settings.overlayOpacity / 100 }} />}</div>}
              <div className={`absolute inset-0 flex flex-col z-10 ${settings.verticalPosition === 'start' ? 'justify-start pt-24' : settings.verticalPosition === 'center' ? 'justify-center' : 'justify-end pb-24'}`} style={{ paddingLeft: `${settings.horizontalPadding}px`, paddingRight: `${settings.horizontalPadding}px` }}>
                {loading ? <div className="flex justify-center w-full"><div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-600 border-t-transparent shadow-xl"></div></div> : verseData ? <>
                  <div className="w-full" style={{ fontFamily: settings.arabicFont, fontSize: `${settings.arabicSize}px`, color: settings.arabicColor, lineHeight: settings.arabicLineHeight, textAlign: settings.arabicAlign, direction: 'rtl', marginBottom: settings.showTranslation ? `${settings.contentGap}px` : '0px', textShadow: settings.backgroundImage ? '0 2px 10px rgba(0,0,0,0.5)' : 'none' }}>{verseData.teksArab}</div>
                  {settings.showTranslation && <div className="w-full" style={{ fontFamily: settings.indoFont, fontSize: `${settings.indoSize}px`, color: settings.indoColor, lineHeight: settings.indoLineHeight, textAlign: settings.indoAlign, textShadow: settings.backgroundImage ? '0 2px 10px rgba(0,0,0,0.5)' : 'none' }}>{verseData.teksIndonesia}</div>}
                  {settings.showSurahInfo && <div className={`mt-8 pt-5 w-full flex justify-between items-end opacity-70 text-[11px] uppercase tracking-widest font-black ${settings.showDivider ? 'border-t border-current/20' : ''} ${settings.verticalPosition === 'end' ? 'order-first mb-8 mt-0 border-t-0 pb-5' : ''} ${settings.verticalPosition === 'end' && settings.showDivider ? 'border-b border-current/20' : ''}`} style={{ color: settings.indoColor, textShadow: settings.backgroundImage ? '0 2px 10px rgba(0,0,0,0.5)' : 'none' }}><span>QS. {surahs.find(s => s.nomor === selectedSurah)?.namaLatin}</span><span>Ayat {selectedVerse}</span></div>}
                </> : <div className={`text-center space-y-4 ${subTextColor}`}><svg className="w-16 h-16 mx-auto opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg><p className="font-black uppercase text-[10px] tracking-widest">Pilih Ayat Untuk Memulai</p></div>}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* BOTTOM NAVIGATION (Mobile Only) */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 h-[75px] z-[100] border-t backdrop-blur-3xl flex items-center justify-around px-2 transition-all duration-300 ${isDarkMode ? 'bg-black/90 border-gray-800 text-white' : 'bg-white/95 border-gray-200 shadow-[0_-5px_25px_rgba(0,0,0,0.08)] text-gray-900'}`}>
        <NavItem id="verse" />
        <NavItem id="style" />
        <NavItem id="layout" />
        <NavItem id="background" />
        <NavItem id="presets" />
        <NavItem id="export" />
      </nav>
    </div>
  );
};

export default App;

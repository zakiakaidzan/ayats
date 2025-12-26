
export interface Surah {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
}

export interface Verse {
  nomorAyat: number;
  teksArab: string;
  teksLatin: string;
  teksIndonesia: string;
}

export interface EditorSettings {
  arabicFont: string;
  arabicSize: number;
  arabicColor: string;
  arabicLineHeight: number;
  arabicAlign: 'left' | 'center' | 'right';
  
  indoFont: string;
  indoSize: number;
  indoColor: string;
  indoLineHeight: number;
  indoAlign: 'left' | 'center' | 'right';
  
  backgroundColor: string;
  isTransparent: boolean;
  showSurahInfo: boolean;
  showDivider: boolean; // Menampilkan/menyembunyikan garis pembatas
  verticalPosition: 'start' | 'center' | 'end';
  contentGap: number; // Jarak antara ayat dan terjemahan
  horizontalPadding: number; // Jarak kanan-kiri (padding)
}

export interface SavedPreset {
  id: string;
  name: string;
  settings: EditorSettings;
}

export const ARABIC_FONTS = [
  { name: 'Amiri', family: "'Amiri', serif" },
  { name: 'Scheherazade', family: "'Scheherazade New', serif" },
  { name: 'Lateef', family: "'Lateef', cursive" },
  { name: 'System Serif', family: 'serif' }
];

export const INDO_FONTS = [
  { name: 'Inter', family: "'Inter', sans-serif" },
  { name: 'Playfair Display', family: "'Playfair Display', serif" },
  { name: 'Sans Serif', family: 'sans-serif' },
  { name: 'Monospace', family: 'monospace' }
];

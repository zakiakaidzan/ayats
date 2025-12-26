
import { Surah, Verse } from '../types';

const API_BASE = 'https://equran.id/api/v2';

export const fetchSurahs = async (): Promise<Surah[]> => {
  try {
    const response = await fetch(`${API_BASE}/surat`);
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching surahs:', error);
    return [];
  }
};

export const fetchVerse = async (surahNumber: number, verseNumber: number): Promise<Verse | null> => {
  try {
    const response = await fetch(`${API_BASE}/surat/${surahNumber}`);
    const data = await response.json();
    const verse = data.data.ayat.find((a: any) => a.nomorAyat === verseNumber);
    return verse || null;
  } catch (error) {
    console.error('Error fetching verse:', error);
    return null;
  }
};

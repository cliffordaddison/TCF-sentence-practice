import * as XLSX from 'xlsx';
import { Island, Sentence } from '../types';
import { translateToEnglish } from './translator';

export async function autoTranslateIslandSentences(island: Island): Promise<Island> {
  const updatedSentences = await Promise.all(
    island.sentences.map(async (s) => {
      if (!s.native || s.native === s.target) {
        const translated = await translateToEnglish(s.target);
        return { ...s, native: translated };
      }
      return s;
    })
  );
  return { ...island, sentences: updatedSentences };
}

export async function parseExcelFile(file: File): Promise<Island[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const importedIslands: Island[] = [];

        workbook.SheetNames.forEach((sheetName, sheetIdx) => {
          const worksheet = workbook.Sheets[sheetName];
          const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

          const sentences: Sentence[] = [];

          rawRows.forEach((row, rowIdx) => {
            if (!row || row.length === 0) return;

            const colA = row[0] ? String(row[0]).trim() : '';
            const colB = row[1] ? String(row[1]).trim() : '';

            // Ignore header row if it contains keywords like "target", "french", "english", "sentence"
            if (
              rowIdx === 0 &&
              (colA.toLowerCase().includes('target') ||
                colA.toLowerCase().includes('french') ||
                colA.toLowerCase().includes('phrase') ||
                colA.toLowerCase().includes('english'))
            ) {
              return;
            }

            if (colA || colB) {
              sentences.push({
                id: `s-excel-${sheetIdx}-${rowIdx}-${Date.now()}`,
                target: colA || colB,
                native: colB || colA,
                rating: 0,
                reps: 0,
                practiced: false,
                mastered: false,
              });
            }
          });

          if (sentences.length > 0) {
            importedIslands.push({
              id: `island-excel-${sheetIdx}-${Date.now()}`,
              name: sheetName || `Imported Sheet ${sheetIdx + 1}`,
              description: `Imported from Excel file (${sentences.length} sentences)`,
              category: 'Excel Import',
              iconName: 'FileSpreadsheet',
              createdAt: Date.now() + sheetIdx,
              sentences,
            });
          }
        });

        resolve(importedIslands);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

export function parseRawTextToIsland(
  islandName: string,
  rawText: string,
  importType: 'Sentences' | 'Narrations' | 'Dialogues' = 'Sentences'
): Island {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const sentences: Sentence[] = [];

  lines.forEach((line, idx) => {
    // Check if line contains tab separator (\t) or pipe (|)
    let target = line;
    let native = '';

    if (line.includes('\t')) {
      const parts = line.split('\t');
      target = parts[0].trim();
      native = parts.slice(1).join(' ').trim();
    } else if (line.includes('|')) {
      const parts = line.split('|');
      target = parts[0].trim();
      native = parts.slice(1).join(' ').trim();
    }

    if (!native) {
      native = target; // Fallback if no separate native line
    }

    sentences.push({
      id: `s-text-${idx}-${Date.now()}`,
      target,
      native,
      rating: 0,
      reps: 0,
      practiced: false,
      mastered: false,
    });
  });

  return {
    id: `island-custom-${Date.now()}`,
    name: islandName.trim() || 'Custom Imported Island',
    description: `Manual ${importType.toLowerCase()} import (${sentences.length} sentences)`,
    category: importType,
    iconName: 'BookOpen',
    createdAt: Date.now(),
    sentences,
  };
}

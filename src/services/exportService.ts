import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';
import { TranscriptionRecord } from '../types';

export class ExportService {
  public static exportToTxt(record: TranscriptionRecord): void {
    const text = `TWI ASR TRANSCRIPT\nTitle: ${record.title}\nDate: ${new Date(record.createdAt).toLocaleString()}\nDialect: ${record.dialect.toUpperCase()}\nConfidence: ${(record.confidenceScore * 100).toFixed(1)}%\n\n${record.twiText}`;
    void Share.share({ message: text, title: record.title });
  }

  public static exportToJson(record: TranscriptionRecord): void {
    const jsonStr = JSON.stringify(record, null, 2);
    void Share.share({ message: jsonStr, title: `${record.title}.json` });
  }

  public static exportToSrt(record: TranscriptionRecord): void {
    const words = record.twiText.split(' ');
    let srt = '';
    const interval = Math.max(1.2, record.audioDurationSeconds / Math.max(1, Math.ceil(words.length / 4)));

    let lineIndex = 1;
    for (let i = 0; i < words.length; i += 4) {
      const chunk = words.slice(i, i + 4).join(' ');
      const startSec = (lineIndex - 1) * interval;
      const endSec = Math.min(record.audioDurationSeconds, lineIndex * interval);

      srt += `${lineIndex}\n`;
      srt += `${this.formatSrtTime(startSec)} --> ${this.formatSrtTime(endSec)}\n`;
      srt += `${chunk}\n\n`;
      lineIndex += 1;
    }

    void Share.share({ message: srt, title: `${record.title}.srt` });
  }

  public static async copyToClipboard(text: string): Promise<boolean> {
    try {
      await Clipboard.setStringAsync(text);
      return true;
    } catch {
      return false;
    }
  }

  public static async shareTranscript(record: TranscriptionRecord): Promise<boolean> {
    try {
      await Share.share({
        message: `Twi ASR Transcript: "${record.twiText}"\nTranslation: "${record.englishTranslation || ''}"`,
        title: record.title,
      });
      return true;
    } catch {
      return false;
    }
  }

  private static formatSrtTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    const pad = (num: number, size = 2) => String(num).padStart(size, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(ms, 3)}`;
  }
}

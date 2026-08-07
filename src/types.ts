export type ThemeMode = 'light' | 'dark' | 'system';

export type TwiDialect = 'asante' | 'akuapem' | 'fante' | 'general';

export interface User {
  id: string;
  name: string;
  email: string;
  pinCode?: string;
  useBiometrics?: boolean;
  createdAt: string;
}

export interface TranscriptionRecord {
  id: string;
  title: string;
  audioFileName: string;
  audioUrl?: string; // blob URL or base64 mock
  audioDurationSeconds: number;
  twiText: string;
  englishTranslation?: string;
  confidenceScore: number; // 0.0 to 1.0
  dialect: TwiDialect;
  createdAt: string;
  updatedAt: string;
  userId: string;
  isBookmarked: boolean;
  tags: string[];
  fileSizeFormatted: string;
  sourceType: 'microphone' | 'file_upload';
  modelVersion: string;
  rawTokens?: string[];
  timestamps?: { start: number; end: number; word: string }[];
}

export interface AsrModelInfo {
  name: string;
  fileVersion: string;
  binFileName: string;
  isModelLoaded: boolean;
  architecture: string;
  vocabularySize: number;
  sampleRate: number;
  supportedDialects: TwiDialect[];
}

export interface SqliteTableColumn {
  name: string;
  type: string;
  primaryKey?: boolean;
  notNull?: boolean;
  defaultValue?: string;
}

export interface SqliteTableSchema {
  tableName: string;
  columns: SqliteTableColumn[];
}

export interface AsrStreamChunk {
  text: string;
  isFinal: boolean;
  confidence: number;
  wordTokens: string[];
  timestampMs: number;
}

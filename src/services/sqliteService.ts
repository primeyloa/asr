import AsyncStorage from '@react-native-async-storage/async-storage';
import { TranscriptionRecord, SqliteTableSchema, User } from '../types';
import { INITIAL_TRANSCRIPTIONS } from '../data/mockData';

const DB_STORAGE_KEY = 'twi_asr_sqlite_db_v1';
const DB_USER_KEY = 'twi_asr_sqlite_user_v1';

export const SQLITE_SCHEMAS: SqliteTableSchema[] = [
  {
    tableName: 'users',
    columns: [
      { name: 'id', type: 'TEXT', primaryKey: true },
      { name: 'name', type: 'TEXT', notNull: true },
      { name: 'email', type: 'TEXT', notNull: true },
      { name: 'pin_code', type: 'TEXT' },
      { name: 'use_biometrics', type: 'INTEGER', defaultValue: '0' },
      { name: 'created_at', type: 'TEXT', notNull: true },
    ],
  },
  {
    tableName: 'transcriptions',
    columns: [
      { name: 'id', type: 'TEXT', primaryKey: true },
      { name: 'user_id', type: 'TEXT', notNull: true },
      { name: 'title', type: 'TEXT', notNull: true },
      { name: 'audio_file_name', type: 'TEXT', notNull: true },
      { name: 'audio_url', type: 'TEXT' },
      { name: 'audio_duration_seconds', type: 'REAL', notNull: true },
      { name: 'twi_text', type: 'TEXT', notNull: true },
      { name: 'english_translation', type: 'TEXT' },
      { name: 'confidence_score', type: 'REAL', notNull: true },
      { name: 'dialect', type: 'TEXT', notNull: true },
      { name: 'is_bookmarked', type: 'INTEGER', defaultValue: '0' },
      { name: 'tags', type: 'TEXT' },
      { name: 'file_size_formatted', type: 'TEXT' },
      { name: 'source_type', type: 'TEXT', notNull: true },
      { name: 'model_version', type: 'TEXT', notNull: true },
      { name: 'raw_tokens', type: 'TEXT' },
      { name: 'created_at', type: 'TEXT', notNull: true },
      { name: 'updated_at', type: 'TEXT', notNull: true },
      { name: 'extra_metadata_bin', type: 'BLOB' },
    ],
  },
  {
    tableName: 'model_configs',
    columns: [
      { name: 'name', type: 'TEXT', primaryKey: true },
      { name: 'file_version', type: 'TEXT', notNull: true },
      { name: 'bin_file_name', type: 'TEXT', notNull: true },
      { name: 'is_model_loaded', type: 'INTEGER', defaultValue: '1' },
      { name: 'architecture', type: 'TEXT' },
      { name: 'vocabulary_size', type: 'INTEGER' },
      { name: 'sample_rate', type: 'INTEGER' },
      { name: 'supported_dialects', type: 'TEXT' },
    ],
  },
];

class SqliteService {
  private isInitialized = false;

  public async initDatabase(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const existingData = await AsyncStorage.getItem(DB_STORAGE_KEY);
      if (!existingData) {
        await AsyncStorage.setItem(DB_STORAGE_KEY, JSON.stringify(INITIAL_TRANSCRIPTIONS));
      }

      const existingUser = await AsyncStorage.getItem(DB_USER_KEY);
      if (!existingUser) {
        const defaultUser: User = {
          id: 'user_default',
          name: 'Kwame Mensah',
          email: 'kwame@twi-asr.app',
          pinCode: '1234',
          useBiometrics: true,
          createdAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem(DB_USER_KEY, JSON.stringify(defaultUser));
      }

      this.isInitialized = true;
    } catch (err) {
      console.error('SQLite Storage Initialization Error:', err);
    }
  }

  public async getTranscriptions(filter?: {
    search?: string;
    dialect?: string;
    bookmarkedOnly?: boolean;
    sourceType?: string;
  }): Promise<TranscriptionRecord[]> {
    await this.initDatabase();
    try {
      const raw = await AsyncStorage.getItem(DB_STORAGE_KEY);
      let records: TranscriptionRecord[] = raw ? JSON.parse(raw) : INITIAL_TRANSCRIPTIONS;

      if (filter) {
        if (filter.search && filter.search.trim() !== '') {
          const q = filter.search.toLowerCase();
          records = records.filter(
            (r) =>
              r.title.toLowerCase().includes(q) ||
              r.twiText.toLowerCase().includes(q) ||
              (r.englishTranslation && r.englishTranslation.toLowerCase().includes(q)) ||
              r.audioFileName.toLowerCase().includes(q),
          );
        }

        if (filter.dialect && filter.dialect !== 'all') {
          records = records.filter((r) => r.dialect === filter.dialect);
        }

        if (filter.bookmarkedOnly) {
          records = records.filter((r) => r.isBookmarked);
        }

        if (filter.sourceType && filter.sourceType !== 'all') {
          records = records.filter((r) => r.sourceType === filter.sourceType);
        }
      }

      return records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      console.error('SQLite query error:', err);
      return [];
    }
  }

  public async insertTranscription(data: Omit<TranscriptionRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<TranscriptionRecord> {
    await this.initDatabase();
    const records = await this.getTranscriptions();

    const now = new Date().toISOString();
    const newRecord: TranscriptionRecord = {
      ...data,
      id: `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: now,
      updatedAt: now,
    };

    records.unshift(newRecord);
    await AsyncStorage.setItem(DB_STORAGE_KEY, JSON.stringify(records));
    return newRecord;
  }

  public async updateTranscription(id: string, updates: Partial<TranscriptionRecord>): Promise<TranscriptionRecord | null> {
    await this.initDatabase();
    const records = await this.getTranscriptions();
    const index = records.findIndex((r) => r.id === id);

    if (index === -1) return null;

    const updatedRecord: TranscriptionRecord = {
      ...records[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    records[index] = updatedRecord;
    await AsyncStorage.setItem(DB_STORAGE_KEY, JSON.stringify(records));
    return updatedRecord;
  }

  public async deleteTranscription(id: string): Promise<boolean> {
    await this.initDatabase();
    const records = await this.getTranscriptions();
    const filtered = records.filter((r) => r.id !== id);
    await AsyncStorage.setItem(DB_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  }

  public async toggleBookmark(id: string): Promise<boolean> {
    await this.initDatabase();
    const records = await this.getTranscriptions();
    const record = records.find((r) => r.id === id);
    if (!record) return false;

    record.isBookmarked = !record.isBookmarked;
    record.updatedAt = new Date().toISOString();
    await AsyncStorage.setItem(DB_STORAGE_KEY, JSON.stringify(records));
    return record.isBookmarked;
  }

  public async getUser(): Promise<User | null> {
    await this.initDatabase();
    try {
      const raw = await AsyncStorage.getItem(DB_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public async updateUser(user: User): Promise<void> {
    await this.initDatabase();
    await AsyncStorage.setItem(DB_USER_KEY, JSON.stringify(user));
  }

  public async executeRawQuery(sqlQuery: string): Promise<{ columns: string[]; rows: any[]; affectedRows: number }> {
    await this.initDatabase();
    const records = await this.getTranscriptions();
    const q = sqlQuery.trim().toUpperCase();

    if (q.startsWith('SELECT')) {
      return {
        columns: ['id', 'title', 'twi_text', 'dialect', 'confidence_score', 'source_type', 'created_at'],
        rows: records.map((r) => ({
          id: r.id,
          title: r.title,
          twi_text: r.twiText,
          dialect: r.dialect,
          confidence_score: r.confidenceScore,
          source_type: r.sourceType,
          created_at: r.createdAt,
        })),
        affectedRows: records.length,
      };
    }

    if (q.startsWith('DELETE')) {
      await AsyncStorage.setItem(DB_STORAGE_KEY, JSON.stringify([]));
      return { columns: [], rows: [], affectedRows: records.length };
    }

    return { columns: ['status'], rows: [{ status: 'Query executed successfully' }], affectedRows: 0 };
  }

  public getSchemas(): SqliteTableSchema[] {
    return SQLITE_SCHEMAS;
  }
}

export const sqliteService = new SqliteService();

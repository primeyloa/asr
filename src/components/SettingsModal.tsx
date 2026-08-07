import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { X, Database, Cpu, Terminal, Download, Play, HardDrive } from 'lucide-react-native';
import { SqliteTableSchema } from '../types';
import { sqliteService } from '../services/sqliteService';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'model' | 'sqlite' | 'query'>('model');
  const [schemas, setSchemas] = useState<SqliteTableSchema[]>([]);
  const [queryInput, setQueryInput] = useState('SELECT id, title, twi_text, dialect, confidence_score FROM transcriptions LIMIT 5;');
  const [queryResult, setQueryResult] = useState<{ columns: string[]; rows: any[]; affectedRows: number } | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  useEffect(() => {
    setSchemas(sqliteService.getSchemas());
    void handleRunQuery();
  }, []);

  const handleRunQuery = async () => {
    try {
      setQueryError(null);
      const res = await sqliteService.executeRawQuery(queryInput);
      setQueryResult(res);
    } catch (err: any) {
      setQueryError(err.message || 'SQL execution failed');
    }
  };

  const handleExportDbDump = async () => {
    const data = await sqliteService.getTranscriptions();
    const dump = { database: 'twi_asr_sqlite.db', version: '1.4.0', exportedAt: new Date().toISOString(), schemas: sqliteService.getSchemas(), tables: { transcriptions: data } };
    console.log(JSON.stringify(dump, null, 2));
    Alert.alert('SQLite backup', 'Database backup data was logged for inspection.');
  };

  return (
    <Modal transparent animationType="slide" visible={true} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Cpu size={16} color="#34d399" />
              <Text style={styles.headerTitle}>System Architecture & SQLite Console</Text>
            </View>
            <Pressable onPress={onClose}><X size={16} color="#94a3b8" /></Pressable>
          </View>

          <View style={styles.tabs}>
            {['model','sqlite','query'].map((tab) => (
              <Pressable key={tab} onPress={() => setActiveTab(tab as any)} style={[styles.tab, activeTab === tab && styles.tabActive]}>
                {tab === 'model' ? <Cpu size={14} color={activeTab === tab ? '#34d399' : '#94a3b8'} /> : tab === 'sqlite' ? <Database size={14} color={activeTab === tab ? '#34d399' : '#94a3b8'} /> : <Terminal size={14} color={activeTab === tab ? '#34d399' : '#94a3b8'} />}
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab === 'model' ? 'Model .bin Specs' : tab === 'sqlite' ? 'SQLite Schema' : 'SQL Console'}</Text>
              </Pressable>
            ))}
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {activeTab === 'model' ? (
              <View style={styles.stack}>
                <View style={styles.panel}>
                  <View style={styles.rowBetween}><Text style={styles.panelTitle}>ASR Model Binary File</Text><Text style={styles.badge}>Offline Loaded</Text></View>
                  <View style={styles.grid}>
                    {[
                      ['Binary File', 'twi_conformer_ctc_quantized.bin'],
                      ['Model Architecture', 'Conformer-CTC + Wav2Vec2'],
                      ['Audio Sample Rate', '16,000 Hz (16kHz PCM)'],
                      ['Vocabulary Size', '4,096 Akan Subwords'],
                    ].map(([label, value]) => (
                      <View key={label} style={styles.gridItem}>
                        <Text style={styles.gridLabel}>{label}</Text>
                        <Text style={styles.gridValue}>{value}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={styles.panel}>
                  <Text style={styles.panelTitle}>Supported Akan Dialects</Text>
                  <View style={styles.grid}>
                    {[
                      ['Asante Twi', 'Kumasi & Ashanti Region'],
                      ['Akuapem Twi', 'Eastern Region highlands'],
                      ['Fante', 'Cape Coast & Coastal Central'],
                      ['General Akan', 'Unified Standard Orthography'],
                    ].map(([dialect, desc]) => (
                      <View key={dialect} style={styles.dialectCard}><Text style={styles.dialectName}>{dialect}</Text><Text style={styles.dialectDesc}>{desc}</Text></View>
                    ))}
                  </View>
                </View>
              </View>
            ) : null}

            {activeTab === 'sqlite' ? (
              <View style={styles.stack}>
                <View style={styles.rowBetween}><Text style={styles.panelTitle}>SQLite Database Schemas</Text><Pressable onPress={handleExportDbDump} style={styles.primaryButton}><Download size={12} color="#052e16" /><Text style={styles.primaryButtonText}>Export Backup</Text></Pressable></View>
                {schemas.map((table) => (
                  <View key={table.tableName} style={styles.panel}>
                    <View style={styles.rowBetween}><View style={styles.rowGap}><HardDrive size={14} color="#34d399" /><Text style={styles.panelTitle}>{table.tableName}</Text></View><Text style={styles.metaText}>{table.columns.length} columns</Text></View>
                    {table.columns.map((col) => (
                      <View key={col.name} style={styles.rowBetween}><Text style={styles.columnName}>{col.name}</Text><Text style={styles.columnType}>{col.type}</Text></View>
                    ))}
                  </View>
                ))}
              </View>
            ) : null}

            {activeTab === 'query' ? (
              <View style={styles.stack}>
                <Text style={styles.panelTitle}>Run SQL Query</Text>
                <TextInput multiline value={queryInput} onChangeText={setQueryInput} style={styles.textarea} />
                <Pressable onPress={() => void handleRunQuery()} style={styles.primaryButton}><Play size={12} color="#052e16" /><Text style={styles.primaryButtonText}>Execute SQL Query</Text></Pressable>
                {queryError ? <Text style={styles.errorText}>{queryError}</Text> : null}
                {queryResult ? <View style={styles.resultBox}>{queryResult.rows.slice(0, 4).map((row, idx) => <Text key={idx} style={styles.resultText}>{JSON.stringify(row)}</Text>)}</View> : null}
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(2,6,23,0.8)', justifyContent: 'center', padding: 16 },
  card: { backgroundColor: '#0f172a', borderRadius: 24, borderWidth: 1, borderColor: '#1f2937', overflow: 'hidden', maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#020617', borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: '#f8fafc', fontSize: 13, fontWeight: '700' },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#020617', paddingHorizontal: 10, paddingVertical: 6, gap: 6 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: '#111827' },
  tabActive: { backgroundColor: 'rgba(52,211,153,0.16)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.35)' },
  tabText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  tabTextActive: { color: '#34d399' },
  body: { padding: 14, gap: 12 },
  stack: { gap: 12 },
  panel: { backgroundColor: '#020617', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#1f2937', gap: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  panelTitle: { color: '#f8fafc', fontSize: 12, fontWeight: '700' },
  badge: { color: '#34d399', fontSize: 11, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridItem: { width: '48%', backgroundColor: '#111827', borderRadius: 10, padding: 8, borderWidth: 1, borderColor: '#374151' },
  gridLabel: { color: '#64748b', fontSize: 10, marginBottom: 4 },
  gridValue: { color: '#e2e8f0', fontSize: 11 },
  dialectCard: { width: '48%', backgroundColor: '#111827', borderRadius: 10, padding: 8, borderWidth: 1, borderColor: '#374151' },
  dialectName: { color: '#34d399', fontSize: 11, fontWeight: '700' },
  dialectDesc: { color: '#94a3b8', fontSize: 10, marginTop: 4 },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: '#34d399' },
  primaryButtonText: { color: '#052e16', fontSize: 12, fontWeight: '700' },
  metaText: { color: '#64748b', fontSize: 10 },
  columnName: { color: '#f8fafc', fontSize: 10 },
  columnType: { color: '#34d399', fontSize: 10 },
  textarea: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1f2937', borderRadius: 12, padding: 10, minHeight: 100, color: '#34d399', fontSize: 11 },
  errorText: { color: '#f87171', fontSize: 11 },
  resultBox: { backgroundColor: '#020617', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#1f2937', gap: 4 },
  resultText: { color: '#cbd5e1', fontSize: 10 },
});

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  X,
  Database,
  Cpu,
  Terminal,
  Download,
  Play,
  HardDrive,
  Globe,
  User as UserIcon,
  Lock,
  ChevronRight,
  Check,
  SlidersHorizontal,
} from 'lucide-react-native';
import { TwiDialect, User, SqliteTableSchema } from '../types';
import { sqliteService } from '../services/sqliteService';

interface RightSidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDialect: TwiDialect;
  onDialectChange: (dialect: TwiDialect) => void;
  user: User | null;
  onLockClick: () => void;
  onOpenProfile: () => void;
}

export const RightSidebarDrawer: React.FC<RightSidebarDrawerProps> = ({
  isOpen,
  onClose,
  selectedDialect,
  onDialectChange,
  user,
  onLockClick,
  onOpenProfile,
}) => {
  const [activeSection, setActiveSection] = useState<'menu' | 'sqlite' | 'sql_console' | 'model_info'>('menu');
  const [schemas, setSchemas] = useState<SqliteTableSchema[]>([]);
  const [queryInput, setQueryInput] = useState(
    'SELECT id, title, twi_text, dialect, confidence_score FROM transcriptions LIMIT 5;'
  );
  const [queryResult, setQueryResult] = useState<{ columns: string[]; rows: any[]; affectedRows: number } | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSchemas(sqliteService.getSchemas());
      void handleRunQuery();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRunQuery = async () => {
    try {
      setQueryError(null);
      const res = await sqliteService.executeRawQuery(queryInput);
      setQueryResult(res);
    } catch (err: any) {
      setQueryError(err.message || 'SQL execution error');
    }
  };

  const handleExportDbDump = async () => {
    const data = await sqliteService.getTranscriptions();
    const dump = {
      database: 'twi_asr_sqlite.db',
      version: '1.4.0',
      exportedAt: new Date().toISOString(),
      schemas: sqliteService.getSchemas(),
      tables: {
        transcriptions: data,
      },
    };
    console.log(JSON.stringify(dump, null, 2));
    setCopiedStatus('SQLite database exported successfully');
    setTimeout(() => setCopiedStatus(null), 2500);
  };

  return (
    <Modal transparent animationType="slide" visible={isOpen} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPress} onPress={onClose} />
        <View style={styles.drawer}>
          {/* Drawer Header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              {activeSection !== 'menu' && (
                <Pressable onPress={() => setActiveSection('menu')} style={styles.backButton}>
                  <Text style={styles.backButtonText}>← Back</Text>
                </Pressable>
              )}
              <SlidersHorizontal size={16} color="#34d399" />
              <Text style={styles.headerTitle}>
                {activeSection === 'menu' && 'App Menu & Tools'}
                {activeSection === 'sqlite' && 'SQLite Offline Database'}
                {activeSection === 'sql_console' && 'SQL Terminal Console'}
                {activeSection === 'model_info' && 'Conformer Model Specs'}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeIconButton}>
              <X size={16} color="#94a3b8" />
            </Pressable>
          </View>

          {/* Drawer Body */}
          <ScrollView contentContainerStyle={styles.body}>
            {activeSection === 'menu' && (
              <View style={styles.stack}>
                {/* User Account Card */}
                <View style={styles.cardBox}>
                  <View style={styles.rowAlign}>
                    <View style={styles.avatarBox}>
                      {user?.name ? (
                        <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
                      ) : (
                        <UserIcon size={16} color="#34d399" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{user?.name || 'Local User'}</Text>
                      <Text style={styles.cardSub}>{user?.email || 'Offline Session'}</Text>
                    </View>
                  </View>
                  <Pressable onPress={onOpenProfile} style={styles.accountBtn}>
                    <Text style={styles.accountBtnText}>Account</Text>
                  </Pressable>
                </View>

                {/* Dialect Quick Picker */}
                <View style={styles.cardBox}>
                  <View style={styles.rowBetween}>
                    <View style={styles.rowAlign}>
                      <Globe size={14} color="#34d399" />
                      <Text style={styles.labelMedium}>Selected Dialect</Text>
                    </View>
                    <View style={styles.dialectPill}>
                      <Text style={styles.dialectPillText}>{selectedDialect}</Text>
                    </View>
                  </View>
                  <View style={styles.dialectGrid}>
                    {(['asante', 'akuapem', 'fante', 'general'] as TwiDialect[]).map((d) => (
                      <Pressable
                        key={d}
                        onPress={() => onDialectChange(d)}
                        style={[
                          styles.dialectChip,
                          selectedDialect === d && styles.dialectChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dialectChipText,
                            selectedDialect === d && styles.dialectChipTextActive,
                          ]}
                        >
                          {d} Twi
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Navigation Menu Options */}
                <View style={styles.stack}>
                  <Text style={styles.sectionHeader}>Database & System Tools</Text>

                  <Pressable
                    onPress={() => setActiveSection('sqlite')}
                    style={styles.menuItem}
                  >
                    <View style={styles.rowAlign}>
                      <View style={[styles.menuIcon, { backgroundColor: 'rgba(99, 102, 241, 0.16)' }]}>
                        <Database size={16} color="#818cf8" />
                      </View>
                      <View>
                        <Text style={styles.menuTitle}>SQLite Database</Text>
                        <Text style={styles.menuSub}>View live tables, schemas & records</Text>
                      </View>
                    </View>
                    <ChevronRight size={16} color="#64748b" />
                  </Pressable>

                  <Pressable
                    onPress={() => setActiveSection('sql_console')}
                    style={styles.menuItem}
                  >
                    <View style={styles.rowAlign}>
                      <View style={[styles.menuIcon, { backgroundColor: 'rgba(45, 212, 191, 0.16)' }]}>
                        <Terminal size={16} color="#2dd4bf" />
                      </View>
                      <View>
                        <Text style={styles.menuTitle}>Raw SQL Terminal</Text>
                        <Text style={styles.menuSub}>Execute query statements directly</Text>
                      </View>
                    </View>
                    <ChevronRight size={16} color="#64748b" />
                  </Pressable>

                  <Pressable
                    onPress={() => setActiveSection('model_info')}
                    style={styles.menuItem}
                  >
                    <View style={styles.rowAlign}>
                      <View style={[styles.menuIcon, { backgroundColor: 'rgba(52, 211, 153, 0.16)' }]}>
                        <Cpu size={16} color="#34d399" />
                      </View>
                      <View>
                        <Text style={styles.menuTitle}>Conformer Model (.bin)</Text>
                        <Text style={styles.menuSub}>Acoustic model specs & weights file</Text>
                      </View>
                    </View>
                    <ChevronRight size={16} color="#64748b" />
                  </Pressable>

                  <Pressable
                    onPress={onLockClick}
                    style={styles.menuItem}
                  >
                    <View style={styles.rowAlign}>
                      <View style={[styles.menuIcon, { backgroundColor: 'rgba(251, 191, 36, 0.16)' }]}>
                        <Lock size={16} color="#fbbf24" />
                      </View>
                      <View>
                        <Text style={styles.menuTitle}>Lock Privacy PIN</Text>
                        <Text style={styles.menuSub}>Secure session with passkey</Text>
                      </View>
                    </View>
                    <ChevronRight size={16} color="#64748b" />
                  </Pressable>
                </View>

                {/* Version Banner */}
                <View style={styles.versionBanner}>
                  <Text style={styles.versionTitle}>Twi ASR Mobile Studio v1.4.0</Text>
                  <Text style={styles.versionSub}>SQLite Local Engine • Conformer CTC Quantized</Text>
                </View>
              </View>
            )}

            {activeSection === 'sqlite' && (
              <View style={styles.stack}>
                <View style={styles.rowBetween}>
                  <Text style={styles.labelMedium}>Database Tables</Text>
                  <Pressable onPress={handleExportDbDump} style={styles.primaryBtn}>
                    <Download size={12} color="#052e16" />
                    <Text style={styles.primaryBtnText}>Backup JSON</Text>
                  </Pressable>
                </View>

                {schemas.map((table) => (
                  <View key={table.tableName} style={styles.cardBox}>
                    <View style={styles.rowBetween}>
                      <View style={styles.rowAlign}>
                        <HardDrive size={14} color="#34d399" />
                        <Text style={styles.tableTitle}>{table.tableName}</Text>
                      </View>
                      <Text style={styles.metaText}>{table.columns.length} columns</Text>
                    </View>

                    <View style={styles.stackSmall}>
                      {table.columns.map((col) => (
                        <View key={col.name} style={styles.columnRow}>
                          <Text style={styles.columnName}>
                            {col.name}
                            {col.primaryKey && <Text style={styles.pkText}> PK</Text>}
                          </Text>
                          <Text style={styles.columnType}>{col.type}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {activeSection === 'sql_console' && (
              <View style={styles.stack}>
                <View style={styles.stackSmall}>
                  <Text style={styles.labelMedium}>Run Raw SQL Query</Text>
                  <TextInput
                    multiline
                    value={queryInput}
                    onChangeText={setQueryInput}
                    style={styles.textarea}
                  />
                </View>

                <Pressable onPress={handleRunQuery} style={styles.primaryBtnFull}>
                  <Play size={14} color="#052e16" />
                  <Text style={styles.primaryBtnText}>Execute SQL</Text>
                </Pressable>

                {queryError ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{queryError}</Text>
                  </View>
                ) : null}

                {queryResult && (
                  <View style={styles.cardBox}>
                    <Text style={styles.metaText}>Rows affected: {queryResult.affectedRows}</Text>
                    <ScrollView horizontal>
                      <View style={styles.stackSmall}>
                        <View style={styles.columnRow}>
                          {queryResult.columns.map((col) => (
                            <Text key={col} style={[styles.columnType, { minWidth: 90 }]}>
                              {col}
                            </Text>
                          ))}
                        </View>
                        {queryResult.rows.map((row, idx) => (
                          <View key={idx} style={styles.columnRow}>
                            {queryResult.columns.map((col) => (
                              <Text key={col} style={[styles.columnName, { minWidth: 90 }]} numberOfLines={1}>
                                {String(row[col] ?? '')}
                              </Text>
                            ))}
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}
              </View>
            )}

            {activeSection === 'model_info' && (
              <View style={styles.stack}>
                <View style={styles.cardBox}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.tableTitle}>ASR Binary File</Text>
                    <View style={styles.offlinePill}>
                      <Text style={styles.offlinePillText}>Offline</Text>
                    </View>
                  </View>

                  <View style={styles.stackSmall}>
                    <View style={styles.specBox}>
                      <Text style={styles.specLabel}>File Name:</Text>
                      <Text style={styles.specValue}>twi_conformer_v1.4.bin</Text>
                    </View>
                    <View style={styles.specBox}>
                      <Text style={styles.specLabel}>Architecture:</Text>
                      <Text style={styles.specValue}>Conformer CTC + Subwords</Text>
                    </View>
                    <View style={styles.specBox}>
                      <Text style={styles.specLabel}>Sampling Rate:</Text>
                      <Text style={styles.specValue}>16,000 Hz (PCM)</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Drawer Toast */}
          {copiedStatus && (
            <View style={styles.toast}>
              <Check size={14} color="#052e16" />
              <Text style={styles.toastText}>{copiedStatus}</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { marginTop: 5, flex: 1, flexDirection: 'row', justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  backdropPress: { flex: 1 },
  drawer: { marginTop: 35, width: 340, height: '100%', backgroundColor: '#0f172a', borderLeftWidth: 1, borderLeftColor: '#1f2937', zIndex: 10 },
  header: { paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#020617', borderBottomWidth: 1, borderBottomColor: '#1f2937', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backButton: { marginRight: 4 },
  backButtonText: { color: '#34d399', fontSize: 11, fontWeight: '600' },
  headerTitle: { color: '#f8fafc', fontSize: 12, fontWeight: '700' },
  closeIconButton: { padding: 4 },
  body: { padding: 14, gap: 12 },
  stack: { gap: 10 },
  stackSmall: { gap: 6 },
  cardBox: { backgroundColor: '#020617', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#1f2937', gap: 8 },
  rowAlign: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatarBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(52,211,153,0.16)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#34d399', fontSize: 13, fontWeight: '700' },
  cardTitle: { color: '#f8fafc', fontSize: 12, fontWeight: '700' },
  cardSub: { color: '#94a3b8', fontSize: 10, fontFamily: 'monospace', marginTop: 2 },
  accountBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#111827', borderRadius: 8, borderWidth: 1, borderColor: '#374151' },
  accountBtnText: { color: '#cbd5e1', fontSize: 11, fontWeight: '600' },
  labelMedium: { color: '#cbd5e1', fontSize: 11, fontWeight: '600' },
  dialectPill: { paddingHorizontal: 8, paddingVertical: 2, backgroundColor: 'rgba(52,211,153,0.16)', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)' },
  dialectPillText: { color: '#34d399', fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', fontWeight: '700' },
  dialectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  dialectChip: { width: '48%', paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#111827', borderRadius: 10, borderWidth: 1, borderColor: '#374151' },
  dialectChipActive: { backgroundColor: 'rgba(52,211,153,0.16)', borderColor: 'rgba(52,211,153,0.4)' },
  dialectChipText: { color: '#94a3b8', fontSize: 11, textTransform: 'capitalize', fontWeight: '500' },
  dialectChipTextActive: { color: '#34d399', fontWeight: '700' },
  sectionHeader: { color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginTop: 4, paddingHorizontal: 2 },
  menuItem: { padding: 12, backgroundColor: '#020617', borderRadius: 14, borderWidth: 1, borderColor: '#1f2937', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuTitle: { color: '#f8fafc', fontSize: 12, fontWeight: '600' },
  menuSub: { color: '#94a3b8', fontSize: 10, marginTop: 2 },
  versionBanner: { padding: 12, backgroundColor: '#020617', borderRadius: 14, borderWidth: 1, borderColor: '#1f2937', alignItems: 'center', gap: 2 },
  versionTitle: { color: '#cbd5e1', fontSize: 10, fontFamily: 'monospace', fontWeight: '700' },
  versionSub: { color: '#64748b', fontSize: 9 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#34d399', borderRadius: 8 },
  primaryBtnFull: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, backgroundColor: '#34d399', borderRadius: 10 },
  primaryBtnText: { color: '#052e16', fontSize: 11, fontWeight: '700' },
  tableTitle: { color: '#f8fafc', fontSize: 12, fontFamily: 'monospace', fontWeight: '700' },
  metaText: { color: '#64748b', fontSize: 10, fontFamily: 'monospace' },
  columnRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#111827' },
  columnName: { color: '#e2e8f0', fontSize: 10, fontFamily: 'monospace' },
  pkText: { color: '#fbbf24', fontWeight: '700' },
  columnType: { color: '#34d399', fontSize: 10, fontFamily: 'monospace' },
  textarea: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1f2937', borderRadius: 10, padding: 10, minHeight: 80, color: '#34d399', fontFamily: 'monospace', fontSize: 11 },
  errorBox: { padding: 8, backgroundColor: 'rgba(239, 68, 68, 0.16)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  errorText: { color: '#f87171', fontSize: 10, fontFamily: 'monospace' },
  specBox: { backgroundColor: '#111827', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#374151' },
  specLabel: { color: '#64748b', fontSize: 10, fontFamily: 'monospace' },
  specValue: { color: '#34d399', fontSize: 11, fontFamily: 'monospace', marginTop: 2 },
  toast: { position: 'absolute', bottom: 20, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#34d399', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  toastText: { color: '#052e16', fontSize: 11, fontWeight: '700' },
  offlinePill: { paddingHorizontal: 6, paddingVertical: 2, backgroundColor: 'rgba(52,211,153,0.16)', borderRadius: 4, borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)' },
  offlinePillText: { color: '#34d399', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
});

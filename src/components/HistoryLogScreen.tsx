import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Bookmark, Share2, Download, Trash2, Mic, FileAudio, Clock, Check, Volume2 } from 'lucide-react-native';
import { TranscriptionRecord } from '../types';
import { sqliteService } from '../services/sqliteService';
import { ExportService } from '../services/exportService';

interface HistoryLogScreenProps {
  onSelectRecord: (record: TranscriptionRecord) => void;
  refreshTrigger: number;
}

export const HistoryLogScreen: React.FC<HistoryLogScreenProps> = ({ onSelectRecord, refreshTrigger }) => {
  const [records, setRecords] = useState<TranscriptionRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDialectFilter, setSelectedDialectFilter] = useState<string>('all');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('all');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    const data = await sqliteService.getTranscriptions({
      search: searchQuery,
      dialect: selectedDialectFilter,
      sourceType: selectedSourceFilter,
      bookmarkedOnly: onlyBookmarked,
    });
    setRecords(data);
  };

  useEffect(() => {
    void loadData();
  }, [searchQuery, selectedDialectFilter, selectedSourceFilter, onlyBookmarked, refreshTrigger]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleToggleBookmark = async (id: string) => {
    await sqliteService.toggleBookmark(id);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete record', 'Delete this transcription from local storage?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await sqliteService.deleteTranscription(id);
        await loadData();
        showToast('Record deleted from SQLite');
      } },
    ]);
  };

  const handleExportTxt = (record: TranscriptionRecord) => {
    ExportService.exportToTxt(record);
    showToast('Exported TXT transcript file');
  };

  const handleShare = async (record: TranscriptionRecord) => {
    const ok = await ExportService.shareTranscript(record);
    if (ok) showToast('Shared or copied to clipboard!');
  };

  const handlePlaySimulatedAudio = (id: string) => {
    if (playingId === id) {
      setPlayingId(null);
      return;
    }

    setPlayingId(id);
    setTimeout(() => setPlayingId(null), 1500);
  };

  return (
    <View style={styles.container}>
      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search Twi text, translation, title..."
        placeholderTextColor="#64748b"
        style={styles.searchInput}
      />

      <View style={styles.filterRow}>
        <Pressable onPress={() => setOnlyBookmarked((prev) => !prev)} style={[styles.filterChip, onlyBookmarked && styles.filterChipActive]}>
          <Bookmark size={14} color={onlyBookmarked ? '#fbbf24' : '#94a3b8'} />
          <Text style={[styles.filterText, onlyBookmarked && styles.filterTextActive]}>Saved</Text>
        </Pressable>
        {['all', 'asante', 'akuapem', 'fante'].map((d) => (
          <Pressable key={d} onPress={() => setSelectedDialectFilter(d)} style={[styles.filterChip, selectedDialectFilter === d && styles.filterChipActive]}>
            <Text style={[styles.filterText, selectedDialectFilter === d && styles.filterTextActive]}>{d}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.counterRow}>
        <Text style={styles.counterText}>Showing {records.length} transcript records</Text>
        <Text style={styles.counterMeta}>Local storage</Text>
      </View>

      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable onPress={() => onSelectRecord(item)} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.titleWrap}>
                <View style={styles.iconBadge}>
                  {item.sourceType === 'microphone' ? <Mic size={14} color="#34d399" /> : <FileAudio size={14} color="#818cf8" />}
                </View>
                <Text style={styles.title}>{item.title}</Text>
              </View>
              <View style={styles.badgeWrap}>
                <View style={styles.dialectBadge}>
                  <Text style={styles.dialectText}>{item.dialect}</Text>
                </View>
                <Pressable onPress={() => handleToggleBookmark(item.id)}>
                  <Bookmark size={16} color={item.isBookmarked ? '#fbbf24' : '#64748b'} />
                </Pressable>
              </View>
            </View>

            <Text style={styles.transcriptText} numberOfLines={2}>{item.twiText}</Text>
            {item.englishTranslation ? <Text style={styles.translationText} numberOfLines={1}>{item.englishTranslation}</Text> : null}

            <View style={styles.cardFooter}>
              <Text style={styles.metaText}>{item.audioDurationSeconds}s • {(item.confidenceScore * 100).toFixed(0)}% • {new Date(item.createdAt).toLocaleDateString()}</Text>
              <View style={styles.actions}>
                <Pressable onPress={() => handlePlaySimulatedAudio(item.id)} style={[styles.smallButton, playingId === item.id && styles.activeButton]}>
                  <Volume2 size={14} color={playingId === item.id ? '#052e16' : '#f8fafc'} />
                </Pressable>
                <Pressable onPress={() => handleShare(item)} style={styles.smallButton}>
                  <Share2 size={14} color="#f8fafc" />
                </Pressable>
                <Pressable onPress={() => handleExportTxt(item)} style={styles.smallButton}>
                  <Download size={14} color="#f8fafc" />
                </Pressable>
                <Pressable onPress={() => handleDelete(item.id)} style={styles.smallButton}>
                  <Trash2 size={14} color="#fda4af" />
                </Pressable>
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Clock size={28} color="#475569" />
            <Text style={styles.emptyText}>No matching Twi transcriptions found</Text>
          </View>
        }
      />

      {toastMessage ? (
        <View style={styles.toast}>
          <Check size={14} color="#052e16" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617', padding: 12 },
  searchInput: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1f2937', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: '#f8fafc' },
  filterRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#111827', borderWidth: 1, borderColor: '#374151' },
  filterChipActive: { backgroundColor: 'rgba(52, 211, 153, 0.16)', borderColor: 'rgba(52, 211, 153, 0.35)' },
  filterText: { color: '#94a3b8', fontSize: 11, textTransform: 'capitalize' },
  filterTextActive: { color: '#34d399', fontWeight: '700' },
  counterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 8 },
  counterText: { color: '#cbd5e1', fontSize: 11 },
  counterMeta: { color: '#64748b', fontSize: 10 },
  listContent: { paddingBottom: 24, gap: 10 },
  card: { backgroundColor: '#0f172a', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#1f2937' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  iconBadge: { width: 28, height: 28, borderRadius: 10, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#f8fafc', fontSize: 13, fontWeight: '700', flex: 1 },
  badgeWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dialectBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(52, 211, 153, 0.16)', borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.35)' },
  dialectText: { color: '#34d399', fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  transcriptText: { color: '#f8fafc', fontSize: 12, marginTop: 8 },
  translationText: { color: '#94a3b8', fontSize: 11, marginTop: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  metaText: { color: '#64748b', fontSize: 10, flex: 1 },
  actions: { flexDirection: 'row', gap: 6 },
  smallButton: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' },
  activeButton: { backgroundColor: '#34d399' },
  emptyState: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { color: '#64748b', fontSize: 12, textAlign: 'center' },
  toast: { position: 'absolute', bottom: 20, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#34d399', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  toastText: { color: '#052e16', fontSize: 12, fontWeight: '700' },
});

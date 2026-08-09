import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Bookmark, Share2, Download, Trash2, Mic, FileAudio, Clock, Check, Volume2, Search } from 'lucide-react-native';
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
      <View style={styles.pageHeader}>
        <View style={styles.pageTitleBlock}>
          <Text style={styles.pageTitle}>History</Text>
          <Text style={styles.pageSubtitle}>All saved Twi transcripts and uploaded recordings.</Text>
        </View>
        <View style={styles.statsBadge}>
          <Text style={styles.statsLabel}>Records</Text>
          <Text style={styles.statsValue}>{records.length}</Text>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color="#6366f1" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search Twi text, translation, title..."
          placeholderTextColor="#9ca3af"
          style={styles.searchInput}
        />
      </View>

      <View style={styles.filterRow}>
        <Pressable
          onPress={() => setOnlyBookmarked((prev) => !prev)}
          style={[styles.filterChip, onlyBookmarked && styles.filterChipActive]}
          accessibilityRole="button"
          accessibilityLabel="Toggle bookmarked items"
        >
          <Bookmark size={14} color={onlyBookmarked ? '#6366f1' : '#64748b'} />
          <Text style={[styles.filterText, onlyBookmarked && styles.filterTextActive]}>Saved</Text>
        </Pressable>
        {['all', 'asante', 'akuapem', 'fante'].map((d) => (
          <Pressable
            key={d}
            onPress={() => setSelectedDialectFilter(d)}
            style={[styles.filterChip, selectedDialectFilter === d && styles.filterChipActive]}
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${d} dialect`}
          >
            <Text style={[styles.filterText, selectedDialectFilter === d && styles.filterTextActive]}>{d}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>{records.length} transcripts</Text>
        <Text style={styles.summaryMeta}>Local device storage</Text>
      </View>

      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable onPress={() => onSelectRecord(item)} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <View style={styles.sourceIcon}>{item.sourceType === 'microphone' ? <Mic size={16} color="#6366f1" /> : <FileAudio size={16} color="#818cf8" />}</View>
                <View style={styles.titleMeta}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.sourceLabel}>{item.sourceType === 'microphone' ? 'Live recording' : 'File upload'}</Text>
                </View>
              </View>
              <Pressable onPress={() => handleToggleBookmark(item.id)} style={styles.bookmarkTouch} accessibilityRole="button" accessibilityLabel={item.isBookmarked ? 'Unsave record' : 'Save record'}>
                <Bookmark size={18} color={item.isBookmarked ? '#6366f1' : '#94a3b8'} />
              </Pressable>
            </View>

            <Text style={styles.transcriptText} numberOfLines={2}>{item.twiText}</Text>
            {item.englishTranslation ? <Text style={styles.translationText} numberOfLines={1}>{item.englishTranslation}</Text> : null}

            <View style={styles.cardFooter}>
              <View style={styles.tagPill}>
                <Text style={styles.tagText}>{item.dialect}</Text>
              </View>
              <Text style={styles.metaText}>{item.audioDurationSeconds}s • {(item.confidenceScore * 100).toFixed(0)}%</Text>
            </View>
            <View style={styles.actionRow}>
              <Pressable
                onPress={() => handlePlaySimulatedAudio(item.id)}
                style={[styles.iconButton, playingId === item.id && styles.iconButtonActive]}
                accessibilityRole="button"
                accessibilityLabel={playingId === item.id ? 'Stop playback' : 'Play transcript preview'}
              >
                <Volume2 size={14} color={playingId === item.id ? '#ffffff' : '#475569'} />
              </Pressable>
              <Pressable onPress={() => handleShare(item)} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Share transcript">
                <Share2 size={14} color="#475569" />
              </Pressable>
              <Pressable onPress={() => handleExportTxt(item)} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Export transcript">
                <Download size={14} color="#475569" />
              </Pressable>
              <Pressable onPress={() => handleDelete(item.id)} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Delete transcript">
                <Trash2 size={14} color="#ef4444" />
              </Pressable>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Clock size={36} color="#cbd5e1" />
            <Text style={styles.emptyText}>No matching Twi transcriptions found.</Text>
            <Text style={styles.emptySubtext}>Try a different search or remove filters.</Text>
          </View>
        }
      />

      {toastMessage ? (
        <View style={styles.toast}>
          <Check size={14} color="#111827" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  pageTitleBlock: { flex: 1, paddingRight: 10 },
  pageTitle: { color: '#111827', fontSize: 24, fontWeight: '800', marginBottom: 4 },
  pageSubtitle: { color: '#4b5563', fontSize: 14, lineHeight: 20 },
  statsBadge: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, backgroundColor: '#eef2ff', borderWidth: 1, borderColor: '#e0e7ff' },
  statsLabel: { color: '#6366f1', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  statsValue: { color: '#111827', fontSize: 18, fontWeight: '800' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ffffff', borderRadius: 18, borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12 },
  searchInput: { flex: 1, color: '#111827', fontSize: 14, minHeight: 20 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 999, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb' },
  filterChipActive: { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' },
  filterText: { color: '#475569', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  filterTextActive: { color: '#6366f1' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  summaryText: { color: '#0f172a', fontSize: 13, fontWeight: '700' },
  summaryMeta: { color: '#64748b', fontSize: 12 },
  listContent: { paddingBottom: 24, gap: 14 },
  card: { backgroundColor: '#ffffff', borderRadius: 24, padding: 18, borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  sourceIcon: { width: 36, height: 36, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eef2ff' },
  titleMeta: { flex: 1 },
  title: { color: '#0f172a', fontSize: 16, fontWeight: '800', marginBottom: 4 },
  sourceLabel: { color: '#64748b', fontSize: 12 },
  bookmarkTouch: { padding: 8, borderRadius: 12, backgroundColor: '#f8fafc' },
  transcriptText: { color: '#334155', fontSize: 14, lineHeight: 20, marginBottom: 8 },
  translationText: { color: '#64748b', fontSize: 13, marginBottom: 14 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  tagPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#eef2ff' },
  tagText: { color: '#6366f1', fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  metaText: { color: '#94a3b8', fontSize: 12 },
  actionRow: { flexDirection: 'row', gap: 10 },
  iconButton: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  iconButtonActive: { backgroundColor: '#6366f1' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, backgroundColor: '#ffffff', borderRadius: 24, borderWidth: 1, borderColor: '#e5e7eb' },
  emptyText: { color: '#0f172a', fontSize: 16, fontWeight: '700' },
  emptySubtext: { color: '#64748b', fontSize: 13, marginTop: 6, textAlign: 'center', maxWidth: 240 },
  toast: { position: 'absolute', bottom: 24, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#dbeafe', borderRadius: 999, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: '#c7d2fe' },
  toastText: { color: '#1e293b', fontSize: 13, fontWeight: '700' },
});

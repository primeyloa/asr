import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { X, Download, Share2, Copy, Bookmark, Volume2, Check, FileText, Code, Clock, Edit2 } from 'lucide-react-native';
import { TranscriptionRecord } from '../types';
import { ExportService } from '../services/exportService';
import { sqliteService } from '../services/sqliteService';

interface TranscriptDetailModalProps {
  record: TranscriptionRecord | null;
  onClose: () => void;
  onUpdate: () => void;
}

export const TranscriptDetailModal: React.FC<TranscriptDetailModalProps> = ({ record, onClose, onUpdate }) => {
  const [twiText, setTwiText] = useState(record?.twiText ?? '');
  const [englishTranslation, setEnglishTranslation] = useState(record?.englishTranslation || '');
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  if (!record) return null;

  const handleSaveEdits = async () => {
    await sqliteService.updateTranscription(record.id, { twiText, englishTranslation });
    setIsEditing(false);
    onUpdate();
  };

  const handleCopy = async () => {
    const text = `${twiText}\n\nEnglish: ${englishTranslation}`;
    const ok = await ExportService.copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleBookmark = async () => {
    await sqliteService.toggleBookmark(record.id);
    onUpdate();
  };

  const handlePlayAudio = () => {
    setIsPlaying((prev) => !prev);
    setTimeout(() => setIsPlaying(false), 1200);
    Alert.alert('Playback', 'Audio playback is simulated in this build.');
  };

  return (
    <Modal transparent animationType="slide" visible={true} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{record.title}</Text>
            <View style={styles.headerActions}>
              <Pressable onPress={handleToggleBookmark} style={[styles.iconButton, record.isBookmarked && styles.iconButtonActive]}><Bookmark size={16} color={record.isBookmarked ? '#fbbf24' : '#94a3b8'} /></Pressable>
              <Pressable onPress={onClose} style={styles.iconButton}><X size={16} color="#94a3b8" /></Pressable>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            <View style={styles.metaCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.metaFile}>{record.audioFileName}</Text>
                <Text style={styles.metaText}>{record.audioDurationSeconds}s duration • {record.dialect} Twi • {(record.confidenceScore * 100).toFixed(1)}% match</Text>
              </View>
              <Pressable onPress={handlePlayAudio} style={[styles.playButton, isPlaying && styles.playButtonActive]}><Volume2 size={18} color={isPlaying ? '#fff' : '#052e16'} /></Pressable>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>Twi (Akan) Speech Text</Text>
                <Pressable onPress={() => setIsEditing((prev) => !prev)}><Text style={styles.editText}>{isEditing ? 'Cancel Edit' : 'Edit Text'}</Text></Pressable>
              </View>
              {isEditing ? <TextInput multiline value={twiText} onChangeText={setTwiText} style={styles.textarea} /> : <View style={styles.textBox}><Text style={styles.textBoxText}>{twiText}</Text></View>}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>English Translation</Text>
              {isEditing ? <TextInput multiline value={englishTranslation} onChangeText={setEnglishTranslation} style={styles.textarea} /> : <View style={styles.textBox}><Text style={styles.textBoxText}>{englishTranslation || 'No English translation available.'}</Text></View>}
            </View>

            {isEditing ? <Pressable onPress={handleSaveEdits} style={styles.saveButton}><Text style={styles.saveButtonText}>Save Changes to SQLite</Text></Pressable> : null}

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Export & Share Formats</Text>
              <View style={styles.buttonGrid}>
                <Pressable onPress={() => ExportService.exportToTxt(record)} style={styles.exportButton}><FileText size={16} color="#34d399" /><Text style={styles.exportText}>Text (.txt)</Text></Pressable>
                <Pressable onPress={() => ExportService.exportToSrt(record)} style={styles.exportButton}><Clock size={16} color="#818cf8" /><Text style={styles.exportText}>Subtitle (.srt)</Text></Pressable>
                <Pressable onPress={() => ExportService.exportToJson(record)} style={styles.exportButton}><Code size={16} color="#fbbf24" /><Text style={styles.exportText}>JSON Data</Text></Pressable>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable onPress={handleCopy} style={styles.footerButton}>
              {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} color="#f8fafc" />}
              <Text style={styles.footerButtonText}>{copied ? 'Copied!' : 'Copy Transcript'}</Text>
            </Pressable>
            <Pressable onPress={() => ExportService.shareTranscript(record)} style={styles.footerButtonPrimary}>
              <Share2 size={14} color="#052e16" />
              <Text style={styles.footerButtonPrimaryText}>Share</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(2,6,23,0.75)', justifyContent: 'center', padding: 16 },
  card: { backgroundColor: '#0f172a', borderRadius: 24, borderWidth: 1, borderColor: '#1f2937', overflow: 'hidden', maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#020617', borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  title: { color: '#f8fafc', fontSize: 14, fontWeight: '700', flex: 1 },
  headerActions: { flexDirection: 'row', gap: 6 },
  iconButton: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' },
  iconButtonActive: { backgroundColor: 'rgba(251,191,36,0.16)' },
  body: { padding: 14, gap: 12 },
  metaCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#020617', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#1f2937' },
  metaFile: { color: '#f8fafc', fontSize: 12, fontWeight: '600' },
  metaText: { color: '#64748b', fontSize: 11, marginTop: 4 },
  playButton: { width: 40, height: 40, borderRadius: 999, backgroundColor: '#34d399', alignItems: 'center', justifyContent: 'center' },
  playButtonActive: { backgroundColor: '#dc2626' },
  section: { gap: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { color: '#cbd5e1', fontSize: 12, fontWeight: '700' },
  editText: { color: '#34d399', fontSize: 11, fontWeight: '600' },
  textarea: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1f2937', borderRadius: 12, minHeight: 90, padding: 10, color: '#f8fafc' },
  textBox: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1f2937', borderRadius: 12, padding: 10 },
  textBoxText: { color: '#f8fafc', fontSize: 12 },
  saveButton: { backgroundColor: '#34d399', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  saveButtonText: { color: '#052e16', fontSize: 12, fontWeight: '700' },
  buttonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  exportButton: { width: '31%', backgroundColor: '#111827', borderWidth: 1, borderColor: '#374151', borderRadius: 12, paddingVertical: 10, alignItems: 'center', gap: 4 },
  exportText: { color: '#f8fafc', fontSize: 10, fontWeight: '600' },
  footer: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 14, paddingTop: 8, backgroundColor: '#020617', borderTopWidth: 1, borderTopColor: '#1f2937' },
  footerButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: '#111827' },
  footerButtonText: { color: '#f8fafc', fontSize: 12, fontWeight: '600' },
  footerButtonPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: '#34d399' },
  footerButtonPrimaryText: { color: '#052e16', fontSize: 12, fontWeight: '700' },
});

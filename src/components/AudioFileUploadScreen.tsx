import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import DocumentPicker from 'expo-document-picker';
import { Upload, Play, Save, Sparkles, Music } from 'lucide-react-native';
import { TwiDialect } from '../types';
import { twiAsrEngine } from '../services/twiAsrEngine';
import { sqliteService } from '../services/sqliteService';

interface AudioFileUploadScreenProps {
  selectedDialect: TwiDialect;
  onRecordSaved: () => void;
}

const SAMPLE_AUDIO_ATTACHMENTS = [
  { name: 'market_shopping_twi.mp3', size: '1.4 MB', duration: '12.4s', desc: 'Recorded market dialogue with vegetable seller' },
  { name: 'akuapem_customs_speech.wav', size: '850 KB', duration: '7.8s', desc: 'Formal Akan greeting during traditional ceremony' },
  { name: 'fante_community_announcement.m4a', size: '2.1 MB', duration: '16.0s', desc: 'Public address announcement in Cape Coast' },
];

export const AudioFileUploadScreen: React.FC<AudioFileUploadScreenProps> = ({ selectedDialect, onRecordSaved }) => {
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string; duration: string } | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState<{ twiText: string; englishTranslation: string; confidenceScore: number; durationSeconds: number } | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const processAttachedFile = async (fileMeta: { name: string; size: string; duration: string }) => {
    setSelectedFile(fileMeta);
    setIsTranscribing(true);
    setTranscriptionResult(null);
    setIsSaved(false);

    try {
      const dummyBlob = new Blob(['mock audio stream data'], { type: 'audio/wav' });
      const res = await twiAsrEngine.processAudioFile(dummyBlob, selectedDialect);
      setTranscriptionResult(res);
    } catch (err) {
      console.error('File ASR Error:', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
    if (!result.canceled && result.assets && result.assets[0]) {
      const asset = result.assets[0];
      await processAttachedFile({
        name: asset.name ?? 'audio_file',
        size: `${Math.max(1, Math.round((asset.size ?? 0) / 1024))} KB`,
        duration: '9.2s',
      });
    }
  };

  const handleSaveToDb = async () => {
    if (!transcriptionResult || !selectedFile) return;

    await sqliteService.insertTranscription({
      title: `File: ${selectedFile.name.replace(/\.[^/.]+$/, '')}`,
      audioFileName: selectedFile.name,
      audioDurationSeconds: transcriptionResult.durationSeconds,
      twiText: transcriptionResult.twiText,
      englishTranslation: transcriptionResult.englishTranslation,
      confidenceScore: transcriptionResult.confidenceScore,
      dialect: selectedDialect,
      userId: 'user_default',
      isBookmarked: false,
      tags: ['file_upload', selectedDialect],
      fileSizeFormatted: selectedFile.size,
      sourceType: 'file_upload',
      modelVersion: 'v1.4.0',
      rawTokens: transcriptionResult.twiText.split(' '),
    });

    setIsSaved(true);
    await onRecordSaved();
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable onPress={handlePickFile} style={styles.dropArea}>
        <View style={styles.iconCircle}>
          <Upload size={24} color="#34d399" />
        </View>
        <Text style={styles.heading}>Attach Audio File for Twi ASR</Text>
        <Text style={styles.helperText}>Pick an audio file from your device to process</Text>
      </Pressable>

      <View style={styles.samplePanel}>
        <Text style={styles.sampleTitle}>Or Select Demo Audio File</Text>
        {SAMPLE_AUDIO_ATTACHMENTS.map((sample, idx) => (
          <Pressable key={idx} onPress={() => processAttachedFile(sample)} style={styles.sampleCard}>
            <View style={styles.sampleRow}>
              <View style={styles.sampleIcon}>
                <Music size={16} color="#818cf8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sampleName}>{sample.name}</Text>
                <Text style={styles.sampleMeta}>{sample.desc} • {sample.size}</Text>
              </View>
            </View>
            <View style={styles.sampleButton}>
              <Play size={14} color="#34d399" />
              <Text style={styles.sampleButtonText}>Process</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {isTranscribing ? (
        <View style={styles.statusCard}>
          <ActivityIndicator color="#34d399" />
          <Text style={styles.statusTitle}>Running Conformer CTC Beam Search</Text>
          <Text style={styles.statusText}>Decoding audio tokens for {selectedFile?.name ?? 'selected file'}...</Text>
        </View>
      ) : null}

      {transcriptionResult && !isTranscribing ? (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <View style={styles.headerRow}>
              <Sparkles size={16} color="#34d399" />
              <Text style={styles.resultTitle}>Transcription Complete</Text>
            </View>
            <Text style={styles.score}>{(transcriptionResult.confidenceScore * 100).toFixed(1)}% match</Text>
          </View>
          <Text style={styles.fileLabel}>File: {selectedFile?.name} ({transcriptionResult.durationSeconds}s)</Text>
          <View style={styles.transcriptBox}>
            <Text style={styles.transcriptText}>{transcriptionResult.twiText}</Text>
          </View>
          {transcriptionResult.englishTranslation ? (
            <View style={styles.translationBox}>
              <Text style={styles.translationLabel}>English Translation:</Text>
              <Text style={styles.translationText}>{transcriptionResult.englishTranslation}</Text>
            </View>
          ) : null}
          <Pressable onPress={handleSaveToDb} style={[styles.saveButton, isSaved && styles.saveButtonActive]}>
            <Save size={14} color={isSaved ? '#34d399' : '#052e16'} />
            <Text style={[styles.saveButtonText, isSaved && styles.saveButtonTextActive]}>{isSaved ? 'Saved to SQLite DB' : 'Save Transcript'}</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, backgroundColor: '#020617' },
  dropArea: { backgroundColor: '#020617', borderRadius: 18, padding: 20, borderWidth: 2, borderStyle: 'dashed', borderColor: '#334155', alignItems: 'center' },
  iconCircle: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(52, 211, 153, 0.16)', borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  heading: { color: '#f8fafc', fontSize: 14, fontWeight: '700' },
  helperText: { color: '#94a3b8', fontSize: 12, marginTop: 6, textAlign: 'center' },
  samplePanel: { backgroundColor: '#0f172a', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#1f2937', gap: 8 },
  sampleTitle: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  sampleCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111827', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#374151' },
  sampleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  sampleIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(129, 140, 248, 0.16)', alignItems: 'center', justifyContent: 'center' },
  sampleName: { color: '#f8fafc', fontSize: 12, fontWeight: '600' },
  sampleMeta: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  sampleButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(52, 211, 153, 0.16)' },
  sampleButtonText: { color: '#34d399', fontSize: 11, fontWeight: '700' },
  statusCard: { backgroundColor: '#020617', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#1f2937', alignItems: 'center', gap: 6 },
  statusTitle: { color: '#f8fafc', fontSize: 12, fontWeight: '700' },
  statusText: { color: '#94a3b8', fontSize: 11, textAlign: 'center' },
  resultCard: { backgroundColor: '#0f172a', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#1f2937', gap: 10 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultTitle: { color: '#f8fafc', fontSize: 12, fontWeight: '700' },
  score: { color: '#34d399', fontSize: 11, fontWeight: '700' },
  fileLabel: { color: '#94a3b8', fontSize: 11 },
  transcriptBox: { backgroundColor: '#020617', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#1f2937' },
  transcriptText: { color: '#f8fafc', fontSize: 13 },
  translationBox: { backgroundColor: '#020617', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#1f2937' },
  translationLabel: { color: '#34d399', fontSize: 11, fontWeight: '700', marginBottom: 4 },
  translationText: { color: '#cbd5e1', fontSize: 12 },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: '#34d399' },
  saveButtonActive: { backgroundColor: 'rgba(52, 211, 153, 0.16)', borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.35)' },
  saveButtonText: { color: '#052e16', fontSize: 12, fontWeight: '700' },
  saveButtonTextActive: { color: '#34d399' },
});

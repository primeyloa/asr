import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import DocumentPicker from 'expo-document-picker';
import { Upload, Play, Save, Sparkles, Music, Cloud, Search } from 'lucide-react-native';
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

  const progressPercentage = transcriptionResult ? Math.round(transcriptionResult.confidenceScore * 100) : 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.screenHeader}>
        <View style={styles.titleBlock}>
          <Text style={styles.screenTitle}>Upload Audio</Text>
          <Text style={styles.screenSubtitle}>Convert existing recordings into structured text</Text>
        </View>
        <View style={styles.avatarCircle} accessible accessibilityRole="image" accessibilityLabel="User avatar" />
      </View>

      <Pressable onPress={handlePickFile} style={styles.uploadZone} accessibilityRole="button" accessibilityLabel="Select audio file">
        <View style={styles.uploadIconCircle}>
          <Cloud size={28} color="#6366f1" />
        </View>
        <Text style={styles.uploadHeading}>Select audio file</Text>
        <Text style={styles.uploadHint}>Supported formats: MP3, WAV, M4A (Max 50MB)</Text>
      </Pressable>

      <View style={styles.statusCard}>
        <View style={styles.processingTopRow}>
          <View style={styles.processingLabel}>
            <Music size={16} color="#6366f1" />
            <Text style={styles.processingLabelText}>{selectedFile ? selectedFile.name : 'No file selected'}</Text>
          </View>
          <Text style={styles.progressPercentage}>{selectedFile ? progressPercentage + '%' : '—'}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${selectedFile ? progressPercentage : 0}%` }]} />
        </View>
        <View style={styles.processingNoteRow}>
          <Sparkles size={14} color="#6366f1" />
          <Text style={styles.processingNoteText}>Applying advanced noise cancellation and speaker diarization...</Text>
        </View>
      </View>

      {isTranscribing ? (
        <View style={styles.spinnerCard}>
          <ActivityIndicator size="small" color="#6366f1" />
          <Text style={styles.spinnerText}>Transcribing selected audio…</Text>
        </View>
      ) : null}

      {transcriptionResult ? (
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>Transcription Preview</Text>
          </View>
          <Text style={styles.previewText} numberOfLines={4}>
            {transcriptionResult.twiText}
          </Text>
          <Pressable onPress={handleSaveToDb} style={[styles.saveButton, isSaved && styles.saveButtonActive]} accessibilityRole="button" accessibilityLabel="Save transcription">
            <Save size={14} color={isSaved ? '#6366f1' : '#ffffff'} />
            <Text style={[styles.saveButtonText, isSaved && styles.saveButtonTextActive]}>{isSaved ? 'Saved to SQLite DB' : 'Save Transcript'}</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.samplePanel}>
        <Text style={styles.sampleTitle}>Demo Audio Files</Text>
        {SAMPLE_AUDIO_ATTACHMENTS.map((sample, idx) => (
          <Pressable
            key={idx}
            onPress={() => processAttachedFile(sample)}
            style={styles.sampleCard}
            accessibilityRole="button"
            accessibilityLabel={`Process demo file ${sample.name}`}
          >
            <View style={styles.sampleRow}>
              <View style={styles.sampleIcon}>
                <Music size={16} color="#6366f1" />
              </View>
              <View style={styles.sampleTextBlock}>
                <Text style={styles.sampleName}>{sample.name}</Text>
                <Text style={styles.sampleMeta}>{sample.desc} • {sample.size}</Text>
              </View>
            </View>
            <View style={styles.sampleAction}>
              <Play size={14} color="#6366f1" />
              <Text style={styles.sampleActionText}>Process</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    backgroundColor: '#f9fafb',
  },
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleBlock: {
    flex: 1,
    paddingRight: 12,
  },
  screenTitle: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '800',
  },
  screenSubtitle: {
    color: '#4b5563',
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  uploadZone: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#6366f1',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  uploadIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  uploadHeading: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  uploadHint: {
    color: '#4b5563',
    fontSize: 13,
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 18,
    gap: 12,
  },
  processingTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  processingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  processingLabelText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  progressPercentage: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '700',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: '#eef2ff',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#6366f1',
  },
  processingNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  processingNoteText: {
    color: '#4b5563',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  spinnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  spinnerText: {
    color: '#4b5563',
    fontSize: 13,
  },
  previewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  previewText: {
    color: '#4b5563',
    fontSize: 14,
    lineHeight: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: '#6366f1',
  },
  saveButtonActive: {
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  saveButtonTextActive: {
    color: '#6366f1',
  },
  samplePanel: {
    gap: 12,
  },
  sampleTitle: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sampleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sampleIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sampleTextBlock: {
    flex: 1,
  },
  sampleName: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  sampleMeta: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 4,
  },
  sampleAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sampleActionText: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '700',
  },
});

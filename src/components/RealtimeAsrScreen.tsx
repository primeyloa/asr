import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Mic, MicOff, Save, Copy, Download, Sparkles, Volume2, Globe, Check } from 'lucide-react-native';
import { TwiDialect, TranscriptionRecord } from '../types';
import { twiAsrEngine } from '../services/twiAsrEngine';
import { audioRecorderService } from '../services/audioRecorderService';
import { sqliteService } from '../services/sqliteService';
import { ExportService } from '../services/exportService';
import { TWI_MOCK_PROMPTS } from '../data/mockData';

interface RealtimeAsrScreenProps {
  selectedDialect: TwiDialect;
  onRecordSaved: () => void;
}

export const RealtimeAsrScreen: React.FC<RealtimeAsrScreenProps> = ({ selectedDialect, onRecordSaved }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [englishTranslation, setEnglishTranslation] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [frequencies, setFrequencies] = useState<number[]>([0.2, 0.4, 0.7, 0.3, 0.5, 0.8, 0.2, 0.6]);
  const [selectedWordToken, setSelectedWordToken] = useState<string | null>(null);
  const [showEnglish, setShowEnglish] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [savedRecord, setSavedRecord] = useState<TranscriptionRecord | null>(null);

  const stopStreamRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (stopStreamRef.current) {
        stopStreamRef.current();
      }
    };
  }, []);

  const handleStartRecording = async () => {
    setStreamText('');
    setEnglishTranslation('');
    setConfidence(0);
    setIsSaved(false);
    setSavedRecord(null);
    setIsRecording(true);

    await audioRecorderService.startMicRecording((freqs) => {
      setFrequencies(freqs);
    });

    stopStreamRef.current = twiAsrEngine.simulateAudioStream(
      (chunk) => {
        setStreamText(chunk.text);
        setConfidence(chunk.confidence);
        setFrequencies(Array.from({ length: 12 }, () => 0.15 + Math.random() * 0.85));
      },
      (finalText, finalTranslation, finalConfidence) => {
        setStreamText(finalText);
        setEnglishTranslation(finalTranslation);
        setConfidence(finalConfidence);
        setIsRecording(false);
        void audioRecorderService.stopMicRecording();
      },
    );
  };

  const handleStopRecording = async () => {
    if (stopStreamRef.current) {
      stopStreamRef.current();
      stopStreamRef.current = null;
    }
    await audioRecorderService.stopMicRecording();
    setIsRecording(false);
  };

  const handleSaveToDatabase = async () => {
    if (!streamText) return;

    const newRecord = await sqliteService.insertTranscription({
      title: `${streamText.split(' ').slice(0, 3).join(' ')}...`,
      audioFileName: `mic_recording_${Date.now()}.wav`,
      audioDurationSeconds: Math.max(3.0, streamText.split(' ').length * 0.5),
      twiText: streamText,
      englishTranslation,
      confidenceScore: confidence || 0.94,
      dialect: selectedDialect,
      userId: 'user_default',
      isBookmarked: false,
      tags: ['microphone', selectedDialect, 'realtime'],
      fileSizeFormatted: '420 KB',
      sourceType: 'microphone',
      modelVersion: 'v1.4.0',
      rawTokens: streamText.split(' '),
    });

    setSavedRecord(newRecord);
    setIsSaved(true);
    await onRecordSaved();
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleCopy = async () => {
    if (!streamText) return;
    const full = showEnglish && englishTranslation ? `${streamText}\n\nTranslation: ${englishTranslation}` : streamText;
    const ok = await ExportService.copyToClipboard(full);
    if (ok) {
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2000);
    }
  };

  const handleTestSamplePrompt = (promptIndex: number) => {
    void handleStopRecording();
    setStreamText('');
    setEnglishTranslation('');
    setConfidence(0);
    setIsRecording(true);

    stopStreamRef.current = twiAsrEngine.simulateAudioStream(
      (chunk) => {
        setStreamText(chunk.text);
        setConfidence(chunk.confidence);
        setFrequencies(Array.from({ length: 12 }, () => 0.2 + Math.random() * 0.8));
      },
      (finalText, finalTranslation, finalConfidence) => {
        setStreamText(finalText);
        setEnglishTranslation(finalTranslation);
        setConfidence(finalConfidence);
        setIsRecording(false);
      },
      promptIndex,
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.banner}>
        <View style={styles.bannerRow}>
          <Globe size={16} color="#34d399" />
          <Text style={styles.bannerLabel}>Target Dialect:</Text>
          <Text style={styles.badge}>{selectedDialect} Twi</Text>
        </View>
        {confidence > 0 && (
          <View style={styles.confidenceWrap}>
            <Text style={styles.confidenceLabel}>Confidence:</Text>
            <Text style={[styles.confidenceValue, confidence > 0.9 ? styles.good : styles.warn]}>
              {(confidence * 100).toFixed(0)}%
            </Text>
          </View>
        )}
      </View>

      <View style={styles.visualizer}>
        <View style={styles.barRow}>
          {frequencies.slice(0, 14).map((val, idx) => (
            <View
              key={idx}
              style={[
                styles.bar,
                { height: isRecording ? Math.max(12, val * 60) : 8 },
                isRecording ? styles.barActive : styles.barInactive,
              ]}
            />
          ))}
        </View>

        <Pressable onPress={isRecording ? handleStopRecording : handleStartRecording} style={[styles.micButton, isRecording ? styles.micButtonActive : styles.micButtonIdle]}>
          {isRecording ? <MicOff size={32} color="#fff" /> : <Mic size={32} color="#052e16" />}
        </Pressable>

        <Text style={styles.helperText}>{isRecording ? 'Listening & processing Twi speech stream...' : 'Tap to start real-time Twi microphone ASR'}</Text>
      </View>

      <View style={styles.transcriptPanel}>
        <View style={styles.transcriptHeader}>
          <View style={styles.headerRow}>
            <Sparkles size={16} color="#34d399" />
            <Text style={styles.transcriptTitle}>Real-Time Twi Transcription</Text>
          </View>
          {streamText ? (
            <Pressable onPress={() => setShowEnglish((prev) => !prev)}>
              <Text style={styles.toggleText}>{showEnglish ? 'Hide Translation' : 'Show Translation'}</Text>
            </Pressable>
          ) : null}
        </View>

        {streamText ? (
          <View style={styles.transcriptBody}>
            <View style={styles.tokenRow}>
              {streamText.split(' ').map((word, idx) => (
                <Pressable key={idx} onPress={() => setSelectedWordToken(word)} style={styles.tokenChip}>
                  <Text style={styles.tokenText}>{word}</Text>
                </Pressable>
              ))}
            </View>
            {showEnglish && englishTranslation ? (
              <View style={styles.translationBox}>
                <Text style={styles.translationLabel}>English Translation:</Text>
                <Text style={styles.translationText}>{englishTranslation}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Volume2 size={28} color="#64748b" />
            <Text style={styles.emptyStateText}>Speak into microphone or select a demo Twi phrase below</Text>
          </View>
        )}

        {selectedWordToken ? (
          <View style={styles.wordHint}>
            <Text style={styles.wordHintText}>
              “{selectedWordToken}” {twiAsrEngine.getAkanVocabularyHelper(selectedWordToken)}
            </Text>
            <Pressable onPress={() => setSelectedWordToken(null)}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>
        ) : null}

        {streamText ? (
          <View style={styles.actions}>
            <View style={styles.actionGroup}>
              <Pressable onPress={handleCopy} style={styles.actionButton}>
                {copiedNotification ? <Check size={14} color="#34d399" /> : <Copy size={14} color="#fff" />}
                <Text style={styles.actionButtonText}>{copiedNotification ? 'Copied' : 'Copy'}</Text>
              </Pressable>
              <Pressable onPress={() => savedRecord && ExportService.exportToTxt(savedRecord)} style={styles.actionButton}>
                <Download size={14} color="#fff" />
                <Text style={styles.actionButtonText}>Export</Text>
              </Pressable>
            </View>
            <Pressable onPress={handleSaveToDatabase} style={[styles.saveButton, isSaved && styles.saveButtonActive]}>
              {isSaved ? <Check size={14} color="#34d399" /> : <Save size={14} color="#052e16" />}
              <Text style={[styles.saveButtonText, isSaved && styles.saveButtonTextActive]}>{isSaved ? 'Saved' : 'Save Record'}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.promptPanel}>
        <Text style={styles.promptTitle}>Demo Twi Speech Test Prompts</Text>
        {TWI_MOCK_PROMPTS.slice(0, 4).map((prompt, idx) => (
          <Pressable key={idx} onPress={() => handleTestSamplePrompt(idx)} style={styles.promptCard}>
            <Text style={styles.promptText}>{prompt.twi}</Text>
            <Text style={styles.promptEnglish}>{prompt.english}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, backgroundColor: '#020617' },
  banner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#1f2937' },
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bannerLabel: { color: '#cbd5e1', fontSize: 12 },
  badge: { color: '#34d399', fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  confidenceWrap: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  confidenceLabel: { color: '#cbd5e1', fontSize: 12 },
  confidenceValue: { fontSize: 12, fontWeight: '700' },
  good: { color: '#34d399' },
  warn: { color: '#fbbf24' },
  visualizer: { backgroundColor: '#020617', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#1f2937', alignItems: 'center' },
  barRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 70, marginBottom: 16 },
  bar: { width: 6, borderRadius: 999 },
  barActive: { backgroundColor: '#34d399' },
  barInactive: { backgroundColor: '#334155' },
  micButton: { width: 72, height: 72, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  micButtonIdle: { backgroundColor: '#34d399' },
  micButtonActive: { backgroundColor: '#dc2626' },
  helperText: { color: '#94a3b8', fontSize: 12, textAlign: 'center' },
  transcriptPanel: { backgroundColor: '#0f172a', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#1f2937' },
  transcriptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  transcriptTitle: { color: '#f8fafc', fontSize: 12, fontWeight: '700' },
  toggleText: { color: '#34d399', fontSize: 11 },
  transcriptBody: { gap: 8 },
  tokenRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tokenChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: '#111827' },
  tokenText: { color: '#f8fafc', fontSize: 13 },
  translationBox: { backgroundColor: '#020617', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#1f2937' },
  translationLabel: { color: '#34d399', fontSize: 11, fontWeight: '700', marginBottom: 4 },
  translationText: { color: '#cbd5e1', fontSize: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 18, gap: 8 },
  emptyStateText: { color: '#64748b', fontSize: 12, textAlign: 'center' },
  wordHint: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#052e16', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.35)' },
  wordHintText: { color: '#bbf7d0', fontSize: 12, flex: 1 },
  closeText: { color: '#f8fafc', fontSize: 14, marginLeft: 8 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  actionGroup: { flexDirection: 'row', gap: 8 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: '#1f2937' },
  actionButtonText: { color: '#f8fafc', fontSize: 12, fontWeight: '600' },
  saveButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#34d399' },
  saveButtonActive: { backgroundColor: 'rgba(52, 211, 153, 0.16)', borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.35)' },
  saveButtonText: { color: '#052e16', fontSize: 12, fontWeight: '700' },
  saveButtonTextActive: { color: '#34d399' },
  promptPanel: { backgroundColor: '#0f172a', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#1f2937', gap: 8 },
  promptTitle: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  promptCard: { backgroundColor: '#111827', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#374151' },
  promptText: { color: '#f8fafc', fontSize: 12, fontWeight: '600' },
  promptEnglish: { color: '#94a3b8', fontSize: 11, marginTop: 3 },
});

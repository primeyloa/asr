import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Mic, MicOff, Pause, Check, Copy, Download, Sparkles, Volume2, Globe } from 'lucide-react-native';
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
        setFrequencies(Array.from({ length: 16 }, () => 0.2 + Math.random() * 0.8));
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
        setFrequencies(Array.from({ length: 16 }, () => 0.2 + Math.random() * 0.8));
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

  const timerText = streamText ? '04:12' : '00:00';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.pageHeader}>
        <View style={styles.pageHeaderText}>
          <Text style={styles.screenTitle}>Transcribe Live</Text>
          <Text style={styles.screenSubtitle}>Realtime Twi speech recognition with instant captions</Text>
        </View>
        <View style={styles.avatarPill} accessible accessibilityRole="image" accessibilityLabel="Current user avatar" />
      </View>

      <View style={styles.waveformCard}>
        <View style={styles.waveformBars}>
          {frequencies.slice(0, 16).map((val, idx) => (
            <View
              key={idx}
              style={[
                styles.waveformBar,
                { height: isRecording ? Math.max(12, val * 68) : 10 },
                isRecording ? styles.waveformBarActive : styles.waveformBarInactive,
              ]}
            />
          ))}
        </View>
        <View style={styles.timerRow}>
          <View style={styles.recordDot} />
          <Text style={styles.timerText}>{timerText}</Text>
        </View>
      </View>

      <View style={styles.transcriptSection}>
        <Text style={styles.sectionLabel}>REAL-TIME TRANSCRIPT</Text>
        <View style={styles.transcriptBox}>
          <Text style={styles.transcriptCopy} numberOfLines={5}>
            {streamText || 'We are demonstrating the live automatic speech recognition feed. As I speak, words are finalized instantly on screen with high precision formatting. Next tokens streaming in...'}
          </Text>
        </View>
      </View>

      <View style={styles.controlsRow}>
        <Pressable
          onPress={handleStopRecording}
          style={[styles.controlButton, styles.actionButton]}
          accessibilityRole="button"
          accessibilityLabel="Pause recording"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Pause size={20} color="#4b5563" />
        </Pressable>
        <Pressable
          onPress={isRecording ? handleStopRecording : handleStartRecording}
          style={[styles.controlButton, styles.mainMicButton, isRecording ? styles.mainMicActive : styles.mainMicIdle]}
          accessibilityRole="button"
          accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          {isRecording ? <MicOff size={28} color="#ffffff" /> : <Mic size={28} color="#6366f1" />}
        </Pressable>
        <Pressable
          onPress={handleSaveToDatabase}
          style={[styles.controlButton, styles.actionButton]}
          accessibilityRole="button"
          accessibilityLabel="Finish recording and save"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Check size={20} color="#4b5563" />
        </Pressable>
      </View>

      <View style={styles.statusStrip}>
        <Text style={styles.statusStripLabel}>Target Dialect</Text>
        <View style={styles.statusChip}>
          <Globe size={12} color="#6366f1" />
          <Text style={styles.statusChipText}>{selectedDialect} Twi</Text>
        </View>
      </View>

      <View style={styles.primaryCard}>
        <View style={styles.transcriptHeaderCard}>
          <View style={styles.transcriptHeaderRow}>
            <Sparkles size={16} color="#6366f1" />
            <Text style={styles.transcriptTitle}>Realtime transcript</Text>
          </View>
          {streamText ? (
            <Pressable onPress={() => setShowEnglish((prev) => !prev)} accessibilityRole="button" accessibilityLabel={showEnglish ? 'Hide translation' : 'Show translation'}>
              <Text style={styles.toggleText}>{showEnglish ? 'Hide translation' : 'Show translation'}</Text>
            </Pressable>
          ) : null}
        </View>
        {streamText ? (
          <View style={styles.transcriptContent}>
            <View style={styles.tokenRow}>
              {streamText.split(' ').map((word, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => setSelectedWordToken(word)}
                  style={styles.tokenChip}
                  accessibilityRole="button"
                  accessibilityLabel={`Show meaning for ${word}`}
                >
                  <Text style={styles.tokenText}>{word}</Text>
                </Pressable>
              ))}
            </View>
            {showEnglish && englishTranslation ? (
              <View style={styles.translationBox}>
                <Text style={styles.translationLabel}>English</Text>
                <Text style={styles.translationText}>{englishTranslation}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Volume2 size={28} color="#64748b" />
            <Text style={styles.emptyStateText}>Speak into the microphone or use a demo prompt below</Text>
          </View>
        )}
        {selectedWordToken ? (
          <View style={styles.wordHint}>
            <Text style={styles.wordHintText}>“{selectedWordToken}” {twiAsrEngine.getAkanVocabularyHelper(selectedWordToken)}</Text>
            <Pressable onPress={() => setSelectedWordToken(null)} accessibilityRole="button" accessibilityLabel="Close token hint">
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>
        ) : null}
        {streamText ? (
          <View style={styles.controlsRowSecondary}>
            <Pressable
              onPress={handleCopy}
              style={styles.secondaryButton}
              accessibilityRole="button"
              accessibilityLabel="Copy transcript"
            >
              <Copy size={14} color="#6366f1" />
              <Text style={styles.secondaryButtonText}>{copiedNotification ? 'Copied' : 'Copy'}</Text>
            </Pressable>
            <Pressable
              onPress={() => savedRecord && ExportService.exportToTxt(savedRecord)}
              style={styles.secondaryButton}
              accessibilityRole="button"
              accessibilityLabel="Export transcript"
            >
              <Download size={14} color="#6366f1" />
              <Text style={styles.secondaryButtonText}>Export</Text>
            </Pressable>
            <Pressable
              onPress={handleSaveToDatabase}
              style={[styles.savePill, isSaved && styles.savePillActive]}
              accessibilityRole="button"
              accessibilityLabel="Save transcript"
            >
              <Check size={14} color={isSaved ? '#6366f1' : '#ffffff'} />
              <Text style={[styles.savePillText, isSaved && styles.savePillTextActive]}>{isSaved ? 'Saved' : 'Save'}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.promptPanel}>
        <Text style={styles.promptTitle}>Demo Twi Speech Test Prompts</Text>
        {TWI_MOCK_PROMPTS.slice(0, 4).map((prompt, idx) => (
          <Pressable
            key={idx}
            onPress={() => handleTestSamplePrompt(idx)}
            style={styles.promptCard}
            accessibilityRole="button"
            accessibilityLabel={`Use demo prompt ${prompt.english}`}
          >
            <Text style={styles.promptText}>{prompt.twi}</Text>
            <Text style={styles.promptEnglish}>{prompt.english}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 14,
    backgroundColor: '#f9fafb',
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageHeaderText: {
    flex: 1,
    paddingRight: 10,
  },
  screenTitle: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  screenSubtitle: {
    color: '#4b5563',
    fontSize: 14,
    lineHeight: 20,
  },
  avatarPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  waveformCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    gap: 18,
  },
  waveformBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: 80,
  },
  waveformBar: {
    width: 6,
    borderRadius: 4,
  },
  waveformBarActive: {
    backgroundColor: '#6366f1',
  },
  waveformBarInactive: {
    backgroundColor: '#dbeafe',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#ef4444',
  },
  timerText: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  transcriptSection: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionLabel: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  transcriptBox: {
    minHeight: 140,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    padding: 16,
    justifyContent: 'center',
  },
  transcriptCopy: {
    color: '#111827',
    fontSize: 15,
    lineHeight: 22,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingVertical: 12,
  },
  controlButton: {
    width: 58,
    height: 58,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    backgroundColor: '#ffffff',
  },
  mainMicButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    padding: 6,
  },
  mainMicIdle: {
    backgroundColor: '#eef2ff',
  },
  mainMicActive: {
    backgroundColor: '#6366f1',
  },
  actionButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusStripLabel: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusChipText: {
    color: '#4f46e5',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  primaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 14,
  },
  transcriptHeaderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transcriptHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  transcriptTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  toggleText: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '700',
  },
  transcriptContent: {
    gap: 10,
  },
  tokenRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tokenChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#eef2ff',
  },
  tokenText: {
    color: '#111827',
    fontSize: 13,
  },
  translationBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  translationLabel: {
    color: '#4f46e5',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  translationText: {
    color: '#4b5563',
    fontSize: 13,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 92,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
  },
  emptyStateText: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  wordHint: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eef2ff',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  wordHintText: {
    color: '#111827',
    fontSize: 13,
    flex: 1,
  },
  closeText: {
    color: '#6b7280',
    fontSize: 16,
    marginLeft: 12,
  },
  controlsRowSecondary: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryButtonText: {
    color: '#4f46e5',
    fontSize: 12,
    fontWeight: '700',
  },
  savePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#6366f1',
  },
  savePillActive: {
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  savePillText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  savePillTextActive: {
    color: '#6366f1',
  },
  promptPanel: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  promptTitle: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  promptCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  promptText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  promptEnglish: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
  },
});

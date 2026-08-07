import React, { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Lock, ShieldCheck, Key, X } from 'lucide-react-native';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthModalProps {
  user: User | null;
  isLocked: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
  onUserUpdated: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ user, isLocked, onClose, onAuthenticated, onUserUpdated }) => {
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [newPin, setNewPin] = useState('');
  const [activeView, setActiveView] = useState<'lock' | 'profile' | 'pin_settings'>(isLocked ? 'lock' : 'profile');

  const handleKeyPress = (digit: string) => {
    if (pinInput.length < 4) {
      const updated = pinInput + digit;
      setPinInput(updated);
      setPinError(false);
      if (updated.length === 4) {
        const ok = authService.verifyPin(updated);
        if (ok) {
          onAuthenticated();
          setPinInput('');
        } else {
          setPinError(true);
          setTimeout(() => setPinInput(''), 600);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setPinError(false);
  };

  const handleSaveProfile = async () => {
    if (emailInput.trim()) {
      await authService.loginWithEmail(emailInput, nameInput);
      onUserUpdated();
      onClose();
    }
  };

  const handleUpdatePinCode = async () => {
    if (newPin.length === 4) {
      await authService.updatePin(newPin);
      onUserUpdated();
      setActiveView('profile');
    }
  };

  return (
    <Modal transparent animationType="slide" visible={true} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <ShieldCheck size={16} color="#34d399" />
              <Text style={styles.headerTitle}>{activeView === 'lock' ? 'Privacy PIN Protection' : 'User Security & Privacy'}</Text>
            </View>
            {!isLocked ? <Pressable onPress={onClose}><X size={16} color="#94a3b8" /></Pressable> : null}
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {activeView === 'lock' ? (
              <View style={styles.centered}>
                <View style={styles.iconBadge}>
                  <Lock size={24} color="#fbbf24" />
                </View>
                <Text style={styles.title}>Enter Security PIN</Text>
                <Text style={styles.subtitle}>Default Demo PIN is 1234</Text>
                <View style={styles.dotsRow}>
                  {[0, 1, 2, 3].map((index) => (
                    <View key={index} style={[styles.dot, pinInput.length > index ? (pinError ? styles.dotError : styles.dotFilled) : styles.dotEmpty]} />
                  ))}
                </View>
                {pinError ? <Text style={styles.errorText}>Incorrect PIN code. Try 1234.</Text> : null}
                <View style={styles.keypad}>
                  {['1','2','3','4','5','6','7','8','9'].map((num) => (
                    <Pressable key={num} onPress={() => handleKeyPress(num)} style={styles.keyButton}><Text style={styles.keyText}>{num}</Text></Pressable>
                  ))}
                  <Pressable onPress={() => { authService.verifyPin('1234'); onAuthenticated(); }} style={styles.keyButtonAlt}><Text style={styles.keyTextAlt}>Bypass</Text></Pressable>
                  <Pressable onPress={() => handleKeyPress('0')} style={styles.keyButton}><Text style={styles.keyText}>0</Text></Pressable>
                  <Pressable onPress={handleBackspace} style={styles.keyButtonAlt}><Text style={styles.keyTextAlt}>⌫</Text></Pressable>
                </View>
              </View>
            ) : null}

            {activeView === 'profile' ? (
              <View style={styles.stack}>
                <View style={styles.profileCard}>
                  <View style={styles.avatarCircle}><Text style={styles.avatarText}>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.profileName}>{user?.name || 'Local User'}</Text>
                    <Text style={styles.profileEmail}>{user?.email || 'Offline Session'}</Text>
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Display Name</Text>
                  <TextInput value={nameInput} onChangeText={setNameInput} style={styles.input} />
                  <Text style={styles.fieldLabel}>User Email</Text>
                  <TextInput value={emailInput} onChangeText={setEmailInput} style={styles.input} keyboardType="email-address" />
                </View>

                <View style={styles.infoBox}>
                  <View style={styles.infoHeader}>
                    <ShieldCheck size={14} color="#34d399" />
                    <Text style={styles.infoTitle}>SQLite Offline Storage Encrypted</Text>
                  </View>
                  <Text style={styles.infoText}>All Twi transcripts are stored on-device in your local SQLite table database.</Text>
                </View>

                <Pressable onPress={() => setActiveView('pin_settings')} style={styles.secondaryButton}>
                  <Key size={14} color="#f8fafc" />
                  <Text style={styles.secondaryButtonText}>Change 4-Digit Security PIN</Text>
                </Pressable>
                <Pressable onPress={handleSaveProfile} style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Save Profile Settings</Text>
                </Pressable>
              </View>
            ) : null}

            {activeView === 'pin_settings' ? (
              <View style={styles.stack}>
                <Text style={styles.title}>Set New Security PIN</Text>
                <Text style={styles.subtitle}>Enter a 4-digit numerical passcode to unlock offline transcript access.</Text>
                <TextInput value={newPin} onChangeText={setNewPin} style={styles.pinInput} keyboardType="number-pad" maxLength={4} secureTextEntry />
                <View style={styles.row}>
                  <Pressable onPress={() => setActiveView('profile')} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable>
                  <Pressable onPress={handleUpdatePinCode} disabled={newPin.length !== 4} style={[styles.primaryButton, newPin.length !== 4 && styles.primaryButtonDisabled]}><Text style={styles.primaryButtonText}>Save PIN</Text></Pressable>
                </View>
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
  card: { backgroundColor: '#0f172a', borderRadius: 24, borderWidth: 1, borderColor: '#1f2937', overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#020617', borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: '#f8fafc', fontSize: 13, fontWeight: '700' },
  body: { padding: 16, gap: 12 },
  centered: { alignItems: 'center', gap: 12 },
  iconBadge: { width: 56, height: 56, borderRadius: 999, backgroundColor: 'rgba(251,191,36,0.16)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#f8fafc', fontSize: 14, fontWeight: '700' },
  subtitle: { color: '#94a3b8', fontSize: 12, textAlign: 'center' },
  dotsRow: { flexDirection: 'row', gap: 10 },
  dot: { width: 14, height: 14, borderRadius: 999, borderWidth: 1 },
  dotFilled: { backgroundColor: '#34d399', borderColor: '#a7f3d0' },
  dotError: { backgroundColor: '#f87171', borderColor: '#fecaca' },
  dotEmpty: { backgroundColor: '#111827', borderColor: '#374151' },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, width: '100%', maxWidth: 240 },
  keyButton: { width: 56, height: 48, borderRadius: 12, backgroundColor: '#111827', borderWidth: 1, borderColor: '#374151', alignItems: 'center', justifyContent: 'center' },
  keyButtonAlt: { width: 56, height: 48, borderRadius: 12, backgroundColor: '#020617', borderWidth: 1, borderColor: '#374151', alignItems: 'center', justifyContent: 'center' },
  keyText: { color: '#f8fafc', fontSize: 16, fontWeight: '700' },
  keyTextAlt: { color: '#34d399', fontSize: 12, fontWeight: '700' },
  errorText: { color: '#f87171', fontSize: 12 },
  stack: { gap: 12 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#020617', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#1f2937' },
  avatarCircle: { width: 40, height: 40, borderRadius: 999, backgroundColor: 'rgba(52,211,153,0.18)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.35)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#34d399', fontSize: 14, fontWeight: '700' },
  profileName: { color: '#f8fafc', fontSize: 13, fontWeight: '700' },
  profileEmail: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  fieldGroup: { gap: 8 },
  fieldLabel: { color: '#cbd5e1', fontSize: 12 },
  input: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1f2937', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: '#f8fafc' },
  infoBox: { backgroundColor: 'rgba(52,211,153,0.12)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.24)', borderRadius: 12, padding: 10, gap: 4 },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoTitle: { color: '#34d399', fontSize: 12, fontWeight: '700' },
  infoText: { color: '#cbd5e1', fontSize: 11 },
  secondaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: '#111827', borderWidth: 1, borderColor: '#374151' },
  secondaryButtonText: { color: '#f8fafc', fontSize: 12, fontWeight: '600' },
  primaryButton: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: '#34d399' },
  primaryButtonDisabled: { opacity: 0.5 },
  primaryButtonText: { color: '#052e16', fontSize: 12, fontWeight: '700' },
  pinInput: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1f2937', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, color: '#34d399', textAlign: 'center', fontSize: 18, letterSpacing: 8 },
  row: { flexDirection: 'row', gap: 8 },
  cancelButton: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: '#111827', borderWidth: 1, borderColor: '#374151' },
  cancelText: { color: '#f8fafc', fontSize: 12, fontWeight: '600' },
});

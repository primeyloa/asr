import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type DeviceMode = 'iphone' | 'android' | 'fullscreen';

interface MobileFrameProps {
  children: React.ReactNode;
  deviceMode: DeviceMode;
  setDeviceMode: (mode: DeviceMode) => void;
  isDarkMode: boolean;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  children,
  isDarkMode,
}) => {
  return (
    <View style={[styles.container, isDarkMode ? styles.dark : styles.light]}>
      <View style={styles.toolbar}>
        <View style={styles.row}>
          <Text style={styles.titleGreen}>React Native Preview Shell</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.titleSub}>Twi ASR Mobile App</Text>
        </View>
      </View>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  dark: { backgroundColor: '#020617' },
  light: { backgroundColor: '#f8fafc' },
  toolbar: { paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1f2937', backgroundColor: '#0f172a' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  titleGreen: { color: '#34d399', fontSize: 11, fontWeight: '700' },
  dot: { color: '#64748b', fontSize: 11 },
  titleSub: { color: '#94a3b8', fontSize: 11 },
  content: { flex: 1 },
});

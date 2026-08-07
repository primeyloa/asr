import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Cpu, Moon, Sun, SlidersHorizontal, User as UserIcon } from 'lucide-react-native';
import { TwiDialect, User } from '../types';

interface HeaderBarProps {
  user: User | null;
  selectedDialect: TwiDialect;
  onDialectChange: (dialect: TwiDialect) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onLockClick: () => void;
  onOpenProfile: () => void;
  onOpenModelInfo: () => void;
  onOpenRightSidebar: () => void;
}

const dialectOrder: TwiDialect[] = ['asante', 'akuapem', 'fante', 'general'];

export const HeaderBar: React.FC<HeaderBarProps> = ({
  user,
  selectedDialect,
  onDialectChange,
  isDarkMode,
  onToggleDarkMode,
  onOpenProfile,
  onOpenModelInfo,
  onOpenRightSidebar,
}) => {
  const cycleDialect = () => {
    const currentIndex = dialectOrder.indexOf(selectedDialect);
    const next = dialectOrder[(currentIndex + 1) % dialectOrder.length];
    onDialectChange(next);
  };

  return (
    <View style={[styles.header, isDarkMode ? styles.dark : styles.light]}>
      <View style={styles.titleWrap}>
        <Text style={styles.title}>Twi ASR</Text>
        <Pressable onPress={onOpenModelInfo} style={styles.tag}>
          <Cpu size={14} color="#34d399" />
          <Text style={styles.tagText}>v1.4</Text>
        </Pressable>
      </View>

      <View style={styles.controls}>
        <Pressable onPress={cycleDialect} style={styles.dialectChip}>
          <Text style={styles.dialectText}>{selectedDialect}</Text>
        </Pressable>
        <Pressable onPress={onToggleDarkMode} style={styles.iconButton}>
          {isDarkMode ? <Sun size={18} color="#fbbf24" /> : <Moon size={18} color="#818cf8" />}
        </Pressable>
        <Pressable onPress={onOpenProfile} style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</Text>
        </Pressable>
        <Pressable onPress={onOpenRightSidebar} style={styles.iconButton}>
          <SlidersHorizontal size={18} color="#34d399" />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  dark: { backgroundColor: '#020617' },
  light: { backgroundColor: '#f8fafc' },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10},
  title: { color: '#f8fafc', fontSize: 16, fontWeight: '700' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(52,211,153,0.16)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)' },
  tagText: { color: '#34d399', fontSize: 10, fontWeight: '700' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dialectChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#111827', borderWidth: 1, borderColor: '#374151' },
  dialectText: { color: '#f3f4f6', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  iconButton: { padding: 7, borderRadius: 10, backgroundColor: '#111827', borderWidth: 1, borderColor: '#374151' },
  avatar: { width: 32, height: 32, borderRadius: 999, backgroundColor: 'rgba(52,211,153,0.18)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.35)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#34d399', fontSize: 12, fontWeight: '700' },
});

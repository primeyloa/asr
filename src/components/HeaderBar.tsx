import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Cpu, Moon, Sun, SlidersHorizontal } from 'lucide-react-native';
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
    <View style={[styles.header, isDarkMode ? styles.darkHeader : styles.lightHeader]}>
      <View style={styles.titleWrap}>
        <Text style={[styles.title, isDarkMode ? styles.titleDark : styles.titleLight]}>Twi ASR</Text>
        <Pressable onPress={onOpenModelInfo} style={styles.tag} accessibilityRole="button" accessibilityLabel="Model version information">
          <Cpu size={14} color="#6366f1" />
          <Text style={styles.tagText}>v1.4</Text>
        </Pressable>
      </View>

      <View style={styles.controls}>
        <Pressable onPress={cycleDialect} style={[styles.dialectChip, isDarkMode ? styles.dialectChipDark : styles.dialectChipLight]} accessibilityRole="button" accessibilityLabel={`Switch dialect from ${selectedDialect}`}>
          <Text style={[styles.dialectText, isDarkMode ? styles.dialectTextDark : styles.dialectTextLight]}>{selectedDialect}</Text>
        </Pressable>
        <Pressable onPress={onToggleDarkMode} style={[styles.iconButton, isDarkMode ? styles.iconButtonDark : styles.iconButtonLight]} accessibilityRole="button" accessibilityLabel="Toggle theme">
          {isDarkMode ? <Sun size={18} color="#fbbf24" /> : <Moon size={18} color="#4b5563" />}
        </Pressable>
        <Pressable onPress={onOpenProfile} style={[styles.avatar, isDarkMode ? styles.avatarDark : styles.avatarLight]} accessibilityRole="button" accessibilityLabel="Open profile">
          <Text style={[styles.avatarText, isDarkMode ? styles.avatarTextDark : styles.avatarTextLight]}>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</Text>
        </Pressable>
        <Pressable onPress={onOpenRightSidebar} style={[styles.iconButton, isDarkMode ? styles.iconButtonDark : styles.iconButtonLight]} accessibilityRole="button" accessibilityLabel="Open settings drawer">
          <SlidersHorizontal size={18} color="#6366f1" />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  lightHeader: {
    backgroundColor: '#f9fafb',
    borderBottomColor: '#e5e7eb',
  },
  darkHeader: {
    backgroundColor: '#020617',
    borderBottomColor: '#111827',
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  titleLight: {
    color: '#111827',
  },
  titleDark: {
    color: '#f8fafc',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(99,102,241,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.18)',
  },
  tagText: {
    color: '#6366f1',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dialectChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  dialectChipLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
  },
  dialectChipDark: {
    backgroundColor: '#111827',
    borderColor: '#334155',
  },
  dialectText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  dialectTextLight: {
    color: '#111827',
  },
  dialectTextDark: {
    color: '#f8fafc',
  },
  iconButton: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconButtonLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
  },
  iconButtonDark: {
    backgroundColor: '#111827',
    borderColor: '#334155',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatarLight: {
    backgroundColor: '#eef2ff',
    borderColor: '#e5e7eb',
  },
  avatarDark: {
    backgroundColor: '#1f2937',
    borderColor: '#334155',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '800',
  },
  avatarTextLight: {
    color: '#4f46e5',
  },
  avatarTextDark: {
    color: '#a5b4fc',
  },
});

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Mic, FileAudio, History, Lock } from 'lucide-react-native';

export type NavTab = 'realtime' | 'upload' | 'history';

interface NavigationTabBarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  recordCount: number;
  isLocked: boolean;
  onUnlockClick: () => void;
}

export const NavigationTabBar: React.FC<NavigationTabBarProps> = ({
  activeTab,
  setActiveTab,
  recordCount,
  isLocked,
  onUnlockClick,
}) => {
  if (isLocked) {
    return (
      <View style={styles.lockBar}>
        <Pressable onPress={onUnlockClick} style={styles.lockButton}>
          <Lock size={16} color="#fbbf24" />
          <Text style={styles.lockText}>App Locked • Tap to Unlock</Text>
        </Pressable>
      </View>
    );
  }

  const tabs: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'realtime', label: 'Live Speech', icon: <Mic size={20} color="#34d399" /> },
    { id: 'upload', label: 'Attach File', icon: <FileAudio size={20} color="#34d399" /> },
    { id: 'history', label: 'History', icon: <History size={20} color="#34d399" />, badge: recordCount },
  ];

  return (
    <View style={styles.bar}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <Pressable key={tab.id} onPress={() => setActiveTab(tab.id)} style={[styles.tab, isActive && styles.activeTab]}>
            <View style={styles.iconWrap}>
              {tab.icon}
              {tab.badge !== undefined && tab.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.badge}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, isActive && styles.activeLabel]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  lockBar: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#020617',
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    alignItems: 'center',
  },
  lockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(251, 191, 36, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  lockText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '600',
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#020617',
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 16,
  },
  activeTab: {
    backgroundColor: 'rgba(52, 211, 153, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  iconWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    right: -8,
    top: -6,
    backgroundColor: '#34d399',
    borderRadius: 999,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#020617',
    fontSize: 10,
    fontWeight: '700',
  },
  tabLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
  activeLabel: {
    color: '#34d399',
    fontWeight: '700',
  },
});

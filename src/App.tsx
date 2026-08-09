import React, { useEffect, useState } from 'react';
import { Modal, SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { TwiDialect, TranscriptionRecord, User } from './types';
import { sqliteService } from './services/sqliteService';
import { authService } from './services/authService';
import { HeaderBar } from './components/HeaderBar';
import { NavigationTabBar, NavTab } from './components/NavigationTabBar';
import { RealtimeAsrScreen } from './components/RealtimeAsrScreen';
import { AudioFileUploadScreen } from './components/AudioFileUploadScreen';
import { HistoryLogScreen } from './components/HistoryLogScreen';
import { TranscriptDetailModal } from './components/TranscriptDetailModal';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { RightSidebarDrawer } from './components/RightSidebarDrawer';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('realtime');
  const [selectedDialect, setSelectedDialect] = useState<TwiDialect>('asante');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [recordCount, setRecordCount] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState<TranscriptionRecord | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const initApp = async () => {
      await sqliteService.initDatabase();
      const loadedUser = await authService.init();
      setUser(loadedUser);
      await updateRecordCount();
    };

    initApp();
  }, []);

  const updateRecordCount = async () => {
    const list = await sqliteService.getTranscriptions();
    setRecordCount(list.length);
  };

  const handleRecordSaved = async () => {
    await updateRecordCount();
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleLockClick = () => {
    authService.lockApp();
    setIsAppLocked(true);
    setShowAuthModal(true);
  };

  return (
    <SafeAreaView style={[styles.container, isDarkMode ? styles.dark : styles.light]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={isDarkMode ? '#020617' : '#f9fafb'} />

      <HeaderBar
        user={user}
        selectedDialect={selectedDialect}
        onDialectChange={setSelectedDialect}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
        onLockClick={handleLockClick}
        onOpenProfile={() => setShowAuthModal(true)}
        onOpenModelInfo={() => setShowSettingsModal(true)}
        onOpenRightSidebar={() => setShowRightSidebar(true)}
      />

      <View style={styles.content}>
        {activeTab === 'realtime' && (
          <RealtimeAsrScreen selectedDialect={selectedDialect} onRecordSaved={handleRecordSaved} />
        )}
        {activeTab === 'upload' && (
          <AudioFileUploadScreen selectedDialect={selectedDialect} onRecordSaved={handleRecordSaved} />
        )}
        {activeTab === 'history' && (
          <HistoryLogScreen onSelectRecord={(record) => setSelectedRecord(record)} refreshTrigger={refreshTrigger} />
        )}
      </View>

      <NavigationTabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        recordCount={recordCount}
        isLocked={isAppLocked}
        onUnlockClick={() => setShowAuthModal(true)}
      />

      <RightSidebarDrawer
        isOpen={showRightSidebar}
        onClose={() => setShowRightSidebar(false)}
        selectedDialect={selectedDialect}
        onDialectChange={setSelectedDialect}
        user={user}
        onLockClick={() => {
          setShowRightSidebar(false);
          handleLockClick();
        }}
        onOpenProfile={() => {
          setShowRightSidebar(false);
          setShowAuthModal(true);
        }}
      />

      <TranscriptDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onUpdate={handleRecordSaved}
      />

      <Modal transparent animationType="slide" visible={showAuthModal} onRequestClose={() => setShowAuthModal(false)}>
        <AuthModal
          user={user}
          isLocked={isAppLocked}
          onClose={() => setShowAuthModal(false)}
          onAuthenticated={() => {
            setIsAppLocked(false);
            setShowAuthModal(false);
          }}
          onUserUpdated={async () => {
            const updatedUser = await authService.init();
            setUser(updatedUser);
          }}
        />
      </Modal>

      <Modal transparent animationType="slide" visible={showSettingsModal} onRequestClose={() => setShowSettingsModal(false)}>
        <SettingsModal onClose={() => setShowSettingsModal(false)} />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dark: {
    backgroundColor: '#020617',
  },
  light: {
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
  },
});

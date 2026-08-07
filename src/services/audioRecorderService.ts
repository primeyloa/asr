import { Audio } from 'expo-av';

export class AudioRecorderService {
  private recording: Audio.Recording | null = null;

  public async startMicRecording(
    _onFrequencyUpdate?: (frequencies: number[]) => void,
  ): Promise<boolean> {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        return false;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await newRecording.startAsync();
      this.recording = newRecording;
      return true;
    } catch (err) {
      console.warn('Microphone permission or hardware access note:', err);
      return false;
    }
  }

  public async stopMicRecording(): Promise<Blob | null> {
    if (!this.recording) {
      return null;
    }

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;
      if (!uri) {
        return null;
      }
      return new Blob([uri], { type: 'text/plain' });
    } catch (err) {
      console.warn('Unable to stop recording', err);
      return null;
    }
  }
}

export const audioRecorderService = new AudioRecorderService();

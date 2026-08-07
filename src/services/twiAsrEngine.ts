import { AsrModelInfo, TwiDialect, AsrStreamChunk } from '../types';
import { INITIAL_MODEL_INFO, TWI_MOCK_PROMPTS } from '../data/mockData';

export class TwiAsrEngine {
  private modelInfo: AsrModelInfo = { ...INITIAL_MODEL_INFO };
  private isProcessing = false;

  public getModelInfo(): AsrModelInfo {
    return { ...this.modelInfo };
  }

  public setDialect(dialect: TwiDialect): void {
    // Allows switching dialect weights (e.g., Asante Twi vs Akuapem vs Fante)
  }

  /**
   * Simulates streaming transcription tokens from microphone or audio buffer
   */
  public simulateAudioStream(
    onChunk: (chunk: AsrStreamChunk) => void,
    onComplete: (finalText: string, translation: string, confidence: number) => void,
    customTextIndex?: number
  ): () => void {
    this.isProcessing = true;
    
    // Select a phrase from sample prompts or generate one
    const promptObj =
      typeof customTextIndex === 'number' && TWI_MOCK_PROMPTS[customTextIndex]
        ? TWI_MOCK_PROMPTS[customTextIndex]
        : TWI_MOCK_PROMPTS[Math.floor(Math.random() * TWI_MOCK_PROMPTS.length)];

    const words = promptObj.twi.split(' ');
    let currentWords: string[] = [];
    let step = 0;

    const interval = setInterval(() => {
      if (!this.isProcessing) {
        clearInterval(interval);
        return;
      }

      if (step < words.length) {
        currentWords.push(words[step]);
        const isFinal = step === words.length - 1;
        const confidence = 0.88 + Math.random() * 0.1;

        onChunk({
          text: currentWords.join(' '),
          isFinal,
          confidence,
          wordTokens: [...currentWords],
          timestampMs: step * 400,
        });

        step++;
      } else {
        clearInterval(interval);
        this.isProcessing = false;
        const finalConfidence = 0.92 + Math.random() * 0.06;
        onComplete(promptObj.twi, promptObj.english, finalConfidence);
      }
    }, 450);

    // Return cancellation trigger function
    return () => {
      this.isProcessing = false;
      clearInterval(interval);
    };
  }

  /**
   * Process uploaded audio file and return transcription
   */
  public async processAudioFile(
    file: File | Blob,
    dialect: TwiDialect
  ): Promise<{
    twiText: string;
    englishTranslation: string;
    confidenceScore: number;
    rawTokens: string[];
    durationSeconds: number;
  }> {
    // Simulate processing delay of 1.5s for audio file decoding & CTC beam search
    await new Promise((resolve) => setTimeout(resolve, 1800));

    // Dialect specific mock responses
    let twiText = '';
    let englishTranslation = '';

    if (dialect === 'fante') {
      twiText = 'Kasa a yɛka yi yɛ Fante kasa a yɛpɛ n’asɛm papaapa wɔ Mfantseman mu.';
      englishTranslation = 'This language we speak is Fante which we love deeply in Fanteland.';
    } else if (dialect === 'akuapem') {
      twiText = 'Akuapem Twi kasa yɛ bokɔɔ, ɛyɛ kasa dɛ fɛfɛɛfɛ ma obiara.';
      englishTranslation = 'Akuapem Twi is gentle and sweet for everyone to hear.';
    } else {
      twiText = 'Medaase pii sɛ wode Twi ASR mobile app yi redi adwuma. Wo ho bɛtɔ wo.';
      englishTranslation = 'Thank you very much for using this Twi ASR mobile app. You will be satisfied.';
    }

    const words = twiText.split(' ');
    const durationSeconds = Math.max(3.5, Math.round((words.length * 0.6) * 10) / 10);
    const confidenceScore = 0.93 + (Math.random() * 0.05);

    return {
      twiText,
      englishTranslation,
      confidenceScore: Math.min(0.99, confidenceScore),
      rawTokens: words,
      durationSeconds,
    };
  }

  public getAkanVocabularyHelper(word: string): string {
    const dict: Record<string, string> = {
      akwaaba: 'Welcome / Greeting of arrival',
      daase: 'Thank you / Gratitude',
      adwuma: 'Work / Job / Task',
      fie: 'Home / House',
      kasa: 'Language / Speech / Talk',
      krowa: 'Smoothly / Peacefully',
      onyankopon: 'God / Supreme Being',
      aborɔbɛ: 'Pineapple',
      nkontomire: 'Cocoyam leaves',
      amango: 'Mango',
    };
    const clean = word.toLowerCase().replace(/[^a-zɔɛ]/g, '');
    return dict[clean] || 'Twi vocabulary token';
  }
}

export const twiAsrEngine = new TwiAsrEngine();

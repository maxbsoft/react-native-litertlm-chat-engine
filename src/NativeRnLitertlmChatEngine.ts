import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  // Test function
  testCFunction(): Promise<number>;

  // Engine lifecycle
  createEngine(
    modelPath: string,
    backendType: number,
    maxTokens: number,
    temperature: number,
    numThreads: number
  ): Promise<void>;
  destroyEngine(): Promise<void>;
  isReady(): Promise<boolean>;

  // Generation
  generateAsync(inputText: string): Promise<void>;
  stopGeneration(): Promise<void>;
  isGenerating(): Promise<boolean>;

  // History management
  clearHistory(): Promise<void>;

  // Model information
  getModelInfo(): Promise<string>;

  // Debug functions
  getDebugMessage(): Promise<string>;
  getDebugHistory(): Promise<string>;
  logFromSwift(message: string): Promise<void>;
  clearDebugHistory(): Promise<void>;

  // Event emitter methods required for TurboModule events
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RnLitertlmChatEngine');

import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { ChatEngineConfig } from './types';

export interface Spec extends TurboModule {
  // Test function
  testCFunction(): Promise<number>;

  // Engine lifecycle
  createEngine(config: ChatEngineConfig): Promise<void>;
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
}

export default TurboModuleRegistry.getEnforcing<Spec>('RnLitertlmChatEngine');

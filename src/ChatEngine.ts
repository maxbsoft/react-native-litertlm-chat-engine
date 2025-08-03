import RnLitertlmChatEngine from './NativeRnLitertlmChatEngine';
import type { ChatEngineConfig, ChatEngineError } from './types';
import { validateChatEngineConfig, validateInputText } from './validation';
import { NativeEventEmitter, NativeModules } from 'react-native';

export class ChatEngine {
  private isInitialized = false;
  private isDestroyed = false;
  private eventEmitter: NativeEventEmitter;

  constructor() {
    console.log(
      'ChatEngine constructor - Setting up NativeEventEmitter for Turbo Module'
    );

    // For TurboModules with events, we need to use the module from NativeModules
    // but first check if it's properly available
    console.log(
      'Available modules in NativeModules:',
      Object.keys(NativeModules)
    );
    const nativeModule = NativeModules.RnLitertlmChatEngine;
    console.log('Native module from NativeModules:', nativeModule);

    if (!nativeModule) {
      console.error('RnLitertlmChatEngine module not found in NativeModules!');
      throw new Error(
        'RnLitertlmChatEngine module not found - ensure it is properly registered'
      );
    }

    this.eventEmitter = new NativeEventEmitter(nativeModule);
    console.log('NativeEventEmitter created successfully');
  }

  /**
   * Initialize the chat engine with configuration
   * @param config - Engine configuration
   * @throws {Error} If validation fails or initialization fails
   */
  async initialize(config: ChatEngineConfig): Promise<void> {
    if (this.isInitialized) {
      throw new Error('ChatEngine is already initialized');
    }

    if (this.isDestroyed) {
      throw new Error(
        'ChatEngine has been destroyed and cannot be reinitialized'
      );
    }

    // Validate configuration
    const validationErrors = validateChatEngineConfig(config);
    if (validationErrors.length > 0) {
      const errorMessage = validationErrors
        .map((err) => `${err.field}: ${err.message}`)
        .join(', ');
      throw new Error(`Configuration validation failed: ${errorMessage}`);
    }

    try {
      await RnLitertlmChatEngine.createEngine(
        config.modelPath,
        config.backendType,
        config.maxTokens,
        config.temperature,
        config.numThreads
      );
      this.isInitialized = true;
    } catch (error) {
      const chatError: ChatEngineError = {
        code: 'INITIALIZATION_FAILED',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to initialize chat engine',
        details: error,
      };
      throw new Error(`Failed to initialize chat engine: ${chatError.message}`);
    }
  }

  /**
   * Check if the engine is ready
   * @returns Promise<boolean>
   */
  async isReady(): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      return await RnLitertlmChatEngine.isReady();
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate response asynchronously with streaming
   * @param inputText - Input text for generation
   * @throws {Error} If validation fails or generation fails
   */
  async generateAsync(inputText: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error(
        'ChatEngine must be initialized before generating responses'
      );
    }

    if (this.isDestroyed) {
      throw new Error('ChatEngine has been destroyed');
    }

    // Validate input text
    const validationErrors = validateInputText(inputText);
    if (validationErrors.length > 0) {
      const errorMessage = validationErrors
        .map((err) => `${err.message}`)
        .join(', ');
      throw new Error(`Input validation failed: ${errorMessage}`);
    }

    try {
      await RnLitertlmChatEngine.generateAsync(inputText);
    } catch (error) {
      const chatError: ChatEngineError = {
        code: 'GENERATION_FAILED',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to generate response',
        details: error,
      };
      throw new Error(`Failed to generate response: ${chatError.message}`);
    }
  }

  /**
   * Stop current generation
   */
  async stopGeneration(): Promise<void> {
    if (!this.isInitialized || this.isDestroyed) {
      return;
    }

    try {
      await RnLitertlmChatEngine.stopGeneration();
    } catch (error) {
      // Silent fail for stop generation
    }
  }

  /**
   * Check if currently generating
   * @returns Promise<boolean>
   */
  async isGenerating(): Promise<boolean> {
    if (!this.isInitialized || this.isDestroyed) {
      return false;
    }

    try {
      return await RnLitertlmChatEngine.isGenerating();
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear conversation history
   */
  async clearHistory(): Promise<void> {
    if (!this.isInitialized || this.isDestroyed) {
      return;
    }

    try {
      await RnLitertlmChatEngine.clearHistory();
    } catch (error) {
      // Silent fail for clear history
    }
  }

  /**
   * Get model information
   * @returns Promise<string> Model information
   */
  async getModelInfo(): Promise<string> {
    if (!this.isInitialized) {
      throw new Error(
        'ChatEngine must be initialized before getting model info'
      );
    }

    if (this.isDestroyed) {
      throw new Error('ChatEngine has been destroyed');
    }

    try {
      return await RnLitertlmChatEngine.getModelInfo();
    } catch (error) {
      const chatError: ChatEngineError = {
        code: 'GET_MODEL_INFO_FAILED',
        message:
          error instanceof Error ? error.message : 'Failed to get model info',
        details: error,
      };
      throw new Error(`Failed to get model info: ${chatError.message}`);
    }
  }

  /**
   * Get debug message
   * @returns Promise<string> Debug message
   */
  async getDebugMessage(): Promise<string> {
    if (!this.isInitialized || this.isDestroyed) {
      return '';
    }

    try {
      return await RnLitertlmChatEngine.getDebugMessage();
    } catch (error) {
      return '';
    }
  }

  /**
   * Get debug history
   * @returns Promise<string> Debug history
   */
  async getDebugHistory(): Promise<string> {
    if (!this.isInitialized || this.isDestroyed) {
      return '';
    }

    try {
      return await RnLitertlmChatEngine.getDebugHistory();
    } catch (error) {
      return '';
    }
  }

  /**
   * Log message from Swift
   * @param message - Message to log
   */
  async logFromSwift(message: string): Promise<void> {
    if (!this.isInitialized || this.isDestroyed) {
      return;
    }

    try {
      await RnLitertlmChatEngine.logFromSwift(message);
    } catch (error) {
      // Silent fail for logging
    }
  }

  /**
   * Clear debug history
   */
  async clearDebugHistory(): Promise<void> {
    if (!this.isInitialized || this.isDestroyed) {
      return;
    }

    try {
      await RnLitertlmChatEngine.clearDebugHistory();
    } catch (error) {
      // Silent fail for clear debug history
    }
  }

  /**
   * Test C function connectivity
   * @returns Promise<number> Test result
   */
  async testCFunction(): Promise<number> {
    try {
      return await RnLitertlmChatEngine.testCFunction();
    } catch (error) {
      const chatError: ChatEngineError = {
        code: 'TEST_C_FUNCTION_FAILED',
        message:
          error instanceof Error ? error.message : 'Failed to test C function',
        details: error,
      };
      throw new Error(`Failed to test C function: ${chatError.message}`);
    }
  }

  /**
   * Clean up resources and destroy the engine
   */
  async destroy(): Promise<void> {
    if (this.isDestroyed) {
      return;
    }

    try {
      if (this.isInitialized) {
        await RnLitertlmChatEngine.destroyEngine();
      }
      this.isInitialized = false;
      this.isDestroyed = true;
    } catch (error) {
      // Silent fail for destroy
    }
  }

  /**
   * Event emitter methods - using NativeEventEmitter properly
   */
  addListener(eventName: string, listener: (event: any) => void) {
    console.log(
      `ChatEngine addListener - Adding listener for event: ${eventName}`
    );
    console.log('Event emitter instance:', this.eventEmitter);

    // For TurboModules, we need to call the native addListener method first
    try {
      RnLitertlmChatEngine.addListener(eventName);
      console.log('Native addListener called successfully');
    } catch (error) {
      console.log('Native addListener call failed:', error);
    }

    const subscription = this.eventEmitter.addListener(eventName, listener);
    console.log('ChatEngine addListener - Subscription created:', subscription);

    return subscription;
  }

  removeAllListeners(eventName: string) {
    return this.eventEmitter.removeAllListeners(eventName);
  }

  removeSubscription(subscription: any) {
    if (subscription && subscription.remove) {
      subscription.remove();
    }
  }
}

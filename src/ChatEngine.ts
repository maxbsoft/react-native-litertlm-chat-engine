import { EventEmitter } from 'events';
import RnLitertlmChatEngine from './NativeRnLitertlmChatEngine';
import type {
  ChatEngineConfig,
  ChatEngineError,
  ChatEngineEvents,
} from './types';
import { validateChatEngineConfig, validateInputText } from './validation';

export class ChatEngine extends EventEmitter {
  private isInitialized = false;
  private isDestroyed = false;

  constructor() {
    super();
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
      await RnLitertlmChatEngine.createEngine(config);
      this.isInitialized = true;
      this.emit('ready');
    } catch (error) {
      const chatError: ChatEngineError = {
        code: 'INITIALIZATION_FAILED',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to initialize chat engine',
        details: error,
      };
      this.emit('error', chatError);
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
      const chatError: ChatEngineError = {
        code: 'READY_CHECK_FAILED',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to check engine readiness',
        details: error,
      };
      this.emit('error', chatError);
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
      this.emit('generating', true);
      await RnLitertlmChatEngine.generateAsync(inputText);
    } catch (error) {
      this.emit('generating', false);
      const chatError: ChatEngineError = {
        code: 'GENERATION_FAILED',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to generate response',
        details: error,
      };
      this.emit('error', chatError);
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
      this.emit('generating', false);
    } catch (error) {
      const chatError: ChatEngineError = {
        code: 'STOP_GENERATION_FAILED',
        message:
          error instanceof Error ? error.message : 'Failed to stop generation',
        details: error,
      };
      this.emit('error', chatError);
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
      const chatError: ChatEngineError = {
        code: 'GENERATION_STATUS_CHECK_FAILED',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to check generation status',
        details: error,
      };
      this.emit('error', chatError);
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
      const chatError: ChatEngineError = {
        code: 'CLEAR_HISTORY_FAILED',
        message:
          error instanceof Error ? error.message : 'Failed to clear history',
        details: error,
      };
      this.emit('error', chatError);
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
      this.emit('error', chatError);
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
      const chatError: ChatEngineError = {
        code: 'GET_DEBUG_MESSAGE_FAILED',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to get debug message',
        details: error,
      };
      this.emit('error', chatError);
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
      const chatError: ChatEngineError = {
        code: 'GET_DEBUG_HISTORY_FAILED',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to get debug history',
        details: error,
      };
      this.emit('error', chatError);
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
      const chatError: ChatEngineError = {
        code: 'LOG_FROM_SWIFT_FAILED',
        message:
          error instanceof Error ? error.message : 'Failed to log from Swift',
        details: error,
      };
      this.emit('error', chatError);
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
      const chatError: ChatEngineError = {
        code: 'CLEAR_DEBUG_HISTORY_FAILED',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to clear debug history',
        details: error,
      };
      this.emit('error', chatError);
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
      this.emit('error', chatError);
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
      this.removeAllListeners();
    } catch (error) {
      const chatError: ChatEngineError = {
        code: 'DESTROY_FAILED',
        message:
          error instanceof Error ? error.message : 'Failed to destroy engine',
        details: error,
      };
      this.emit('error', chatError);
    }
  }

  /**
   * Type-safe event listener registration
   */
  on<K extends keyof ChatEngineEvents>(
    event: K,
    listener: ChatEngineEvents[K]
  ): this {
    return super.on(event, listener as any);
  }

  /**
   * Type-safe event listener removal
   */
  off<K extends keyof ChatEngineEvents>(
    event: K,
    listener: ChatEngineEvents[K]
  ): this {
    return super.off(event, listener as any);
  }
}

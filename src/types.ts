// TypeScript interfaces matching the C API from ChatEngineWrapper.h

export interface ChatEngineConfig {
  modelPath: string;
  backendType: number; // 0 = CPU, 1 = GPU
  maxTokens: number;
  temperature: number;
  numThreads: number;
}

export interface ChatResponse {
  response: string;
}

export interface MetricsData {
  totalTimeMs: number;
  prefillTimeMs: number;
  decodeTimeMs: number;
  tokensPerSecond: number;
  prefillTokens: number;
  decodeTokens: number;
}

export interface ChatEngineError {
  code: string;
  message: string;
  details?: any;
}

// Event types for streaming
export interface ChatEngineEvents {
  response: (data: ChatResponse) => void;
  metrics: (data: MetricsData) => void;
  error: (error: ChatEngineError) => void;
  ready: () => void;
  generating: (isGenerating: boolean) => void;
}

// Validation error types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

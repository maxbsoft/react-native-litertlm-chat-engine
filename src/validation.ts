import type { ChatEngineConfig, ValidationError } from './types';

export function validateChatEngineConfig(
  config: ChatEngineConfig
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate modelPath
  if (!config.modelPath || typeof config.modelPath !== 'string') {
    errors.push({
      field: 'modelPath',
      message: 'Model path must be a non-empty string',
      value: config.modelPath,
    });
  }

  // Validate backendType
  if (
    typeof config.backendType !== 'number' ||
    config.backendType < 0 ||
    config.backendType > 1
  ) {
    errors.push({
      field: 'backendType',
      message: 'Backend type must be 0 (CPU) or 1 (GPU)',
      value: config.backendType,
    });
  }

  // Validate maxTokens
  if (typeof config.maxTokens !== 'number' || config.maxTokens <= 0) {
    errors.push({
      field: 'maxTokens',
      message: 'Max tokens must be a positive number',
      value: config.maxTokens,
    });
  }

  // Validate temperature
  if (
    typeof config.temperature !== 'number' ||
    config.temperature < 0 ||
    config.temperature > 2
  ) {
    errors.push({
      field: 'temperature',
      message: 'Temperature must be between 0 and 2',
      value: config.temperature,
    });
  }

  // Validate numThreads
  if (typeof config.numThreads !== 'number' || config.numThreads <= 0) {
    errors.push({
      field: 'numThreads',
      message: 'Number of threads must be a positive number',
      value: config.numThreads,
    });
  }

  return errors;
}

export function validateInputText(inputText: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!inputText || typeof inputText !== 'string') {
    errors.push({
      field: 'inputText',
      message: 'Input text must be a non-empty string',
      value: inputText,
    });
  }

  return errors;
}

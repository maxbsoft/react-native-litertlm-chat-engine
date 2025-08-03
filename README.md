# React Native LiteRT-LM Chat Engine

A React Native Turbo Module that provides a TypeScript wrapper for the LiteRT-LM Chat Engine, enabling AI text generation capabilities in React Native applications.

## Features

- **Full C API Wrapper**: Complete integration with ChatEngineWrapper.xcframework
- **TypeScript Support**: Fully typed API with comprehensive interfaces
- **Event-Driven Architecture**: Real-time streaming responses via event emitters
- **Validation**: Input validation for all configuration parameters
- **Error Handling**: Comprehensive error handling with detailed error messages
- **Debug Support**: Built-in logging and debug functionality
- **Memory Management**: Explicit cleanup methods for proper resource management
- **React Native 0.80.2+ Support**: Compatible with the new architecture (TurboModules)

## Installation

### iOS

1. Install the package:
```bash
npm install react-native-rn-litertlm-chat-engine
# or
yarn add react-native-rn-litertlm-chat-engine
```

2. If cloning from source, ensure Git LFS is installed:
```bash
# Install Git LFS if not already installed
git lfs install

# Pull LFS files
git lfs pull
```

3. Install iOS dependencies:
```bash
cd ios && pod install
```

### Android

Android support is planned but not yet implemented. The module will throw appropriate errors on Android platforms.

## Model Download

The module requires a LiteRT model file. You can download compatible models from Hugging Face:

### Download via Terminal

```bash
# Download Gemma 3n E2B model (smaller, faster)
wget https://huggingface.co/google/gemma-3n-E2B-it-litert-preview/resolve/main/gemma-3n-E2B-it-int4.litertlm

# Or download Gemma 3n E4B model (larger, more capable)
wget https://huggingface.co/google/gemma-3n-E4B-it-litert-preview/resolve/main/gemma-3n-E4B-it-int4.litertlm
```

### Manual Download

1. Visit [Gemma 3n E2B](https://huggingface.co/google/gemma-3n-E2B-it-litert-preview) or [Gemma 3n E4B](https://huggingface.co/google/gemma-3n-E4B-it-litert-preview)
2. **Accept Google's usage license** (required to access model files)
3. Download the `.litertlm` file
4. Place it in your app's bundle or documents directory

**Note**: Model files are large (2-4GB) and not included in the repository. You must download them separately.

**Important**: The `ChatEngineWrapper.xcframework` is tracked with Git LFS. If you're cloning from source, ensure Git LFS is installed and run `git lfs pull` to download the framework files.

### License Requirements

The Gemma models require acceptance of Google's usage license. When downloading from Hugging Face, you must:

1. Log in to your Hugging Face account
2. Review and accept Google's Gemma usage license
3. Agree to the model terms before downloading

For commercial use, please review Google's [Gemma Prohibited Use Policy](https://ai.google.dev/gemma/docs/prohibited_use) and ensure compliance with the license terms.

## Usage

### Basic Setup

```typescript
import { ChatEngine, ChatEngineConfig } from 'react-native-rn-litertlm-chat-engine';

// Create engine instance
const chatEngine = new ChatEngine();

// Configure the engine
const config: ChatEngineConfig = {
  modelPath: '/path/to/your/model.bin',
  backendType: 0, // 0 = CPU, 1 = GPU
  maxTokens: 2048,
  temperature: 0.7,
  numThreads: 4,
};

// Initialize the engine
try {
  await chatEngine.initialize(config);
  console.log('Engine initialized successfully');
} catch (error) {
  console.error('Failed to initialize engine:', error);
}
```

### Event Listeners

```typescript
// Listen for responses
const responseSubscription = chatEngine.addListener('response', (data) => {
  console.log('Received response:', data.response);
  // data.response contains the full accumulated response (previous tokens + new token)
  // data.done indicates when streaming is complete
});

// Listen for metrics
const metricsSubscription = chatEngine.addListener('metrics', (metrics) => {
  console.log('Generation metrics:', {
    tokensPerSecond: metrics.tokensPerSecond,
    totalTimeMs: metrics.totalTimeMs,
    prefillTokens: metrics.prefillTokens,
    decodeTokens: metrics.decodeTokens,
  });
});

// Listen for errors
const errorSubscription = chatEngine.addListener('error', (error) => {
  console.error('Engine error:', error);
});

// Listen for ready state
const readySubscription = chatEngine.addListener('ready', () => {
  console.log('Engine is ready');
});

// Listen for generation status
const generatingSubscription = chatEngine.addListener('generating', (isGenerating) => {
  console.log('Generation status:', isGenerating);
});

// Clean up subscriptions
responseSubscription.remove();
metricsSubscription.remove();
errorSubscription.remove();
readySubscription.remove();
generatingSubscription.remove();
```

### Text Generation

```typescript
// Generate text asynchronously
try {
  await chatEngine.generateAsync('Hello, how are you?');
} catch (error) {
  console.error('Generation failed:', error);
}

// Stop generation
await chatEngine.stopGeneration();

// Check if generating
const isGenerating = await chatEngine.isGenerating();
```

### Engine Management

```typescript
// Check if engine is ready
const isReady = await chatEngine.isReady();

// Get model information
const modelInfo = await chatEngine.getModelInfo();
console.log('Model info:', modelInfo);

// Clear conversation history
await chatEngine.clearHistory();

// Clean up resources
await chatEngine.destroy();
```

### Debug Functions

```typescript
// Get debug message
const debugMessage = await chatEngine.getDebugMessage();

// Get debug history
const debugHistory = await chatEngine.getDebugHistory();

// Log from Swift
await chatEngine.logFromSwift('Debug message from Swift');

// Clear debug history
await chatEngine.clearDebugHistory();

// Test C function connectivity
const testResult = await chatEngine.testCFunction();
console.log('C function test result:', testResult);
```

### Complete Example

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, ScrollView } from 'react-native';
import { ChatEngine, ChatEngineConfig } from 'react-native-rn-litertlm-chat-engine';

const ChatApp = () => {
  const [chatEngine, setChatEngine] = useState<ChatEngine | null>(null);
  const [inputText, setInputText] = useState('');
  const [responses, setResponses] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const engine = new ChatEngine();
    
    // Set up event listeners
    const responseSubscription = engine.addListener('response', (data) => {
      // data.response contains the full accumulated response
      setResponses(prev => [...prev, data.response]);
      
      // Check if streaming is complete
      if (data.done) {
        console.log('Streaming completed');
      }
    });

    const errorSubscription = engine.addListener('error', (error) => {
      console.error('Engine error:', error);
    });

    const generatingSubscription = engine.addListener('generating', (generating) => {
      setIsGenerating(generating);
    });

    setChatEngine(engine);

    // Initialize engine
    const initializeEngine = async () => {
      try {
        const config: ChatEngineConfig = {
          modelPath: '/path/to/your/model.bin',
          backendType: 0,
          maxTokens: 2048,
          temperature: 0.7,
          numThreads: 4,
        };
        
        await engine.initialize(config);
      } catch (error) {
        console.error('Failed to initialize engine:', error);
      }
    };

    initializeEngine();

    // Cleanup on unmount
    return () => {
      responseSubscription.remove();
      errorSubscription.remove();
      generatingSubscription.remove();
      engine.destroy();
    };
  }, []);

  const handleGenerate = async () => {
    if (!chatEngine || !inputText.trim()) return;

    try {
      await chatEngine.generateAsync(inputText);
    } catch (error) {
      console.error('Generation failed:', error);
    }
  };

  const handleStop = async () => {
    if (!chatEngine) return;
    await chatEngine.stopGeneration();
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <TextInput
        value={inputText}
        onChangeText={setInputText}
        placeholder="Enter your message..."
        multiline
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button
          title={isGenerating ? "Stop" : "Generate"}
          onPress={isGenerating ? handleStop : handleGenerate}
        />
      </View>

      <ScrollView style={{ flex: 1, marginTop: 20 }}>
        {responses.map((response, index) => (
          <Text key={index} style={{ marginBottom: 10 }}>
            {response}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

export default ChatApp;
```

## API Reference

### ChatEngineConfig

```typescript
interface ChatEngineConfig {
  modelPath: string;      // Path to the model file
  backendType: number;    // 0 = CPU, 1 = GPU
  maxTokens: number;      // Maximum tokens to generate
  temperature: number;    // Sampling temperature (0-2)
  numThreads: number;     // Number of threads to use
}
```

### Events

- `response`: Fired when a response is received (contains full accumulated response)
- `metrics`: Fired with generation metrics
- `error`: Fired when an error occurs
- `ready`: Fired when the engine is ready
- `generating`: Fired when generation status changes

### Methods

- `initialize(config)`: Initialize the engine
- `isReady()`: Check if engine is ready
- `generateAsync(inputText)`: Generate text asynchronously
- `stopGeneration()`: Stop current generation
- `isGenerating()`: Check if currently generating
- `clearHistory()`: Clear conversation history
- `getModelInfo()`: Get model information
- `testCFunction()`: Test C function connectivity
- `destroy()`: Clean up resources

### Event Handling

- `addListener(eventName, listener)`: Add event listener
- `removeAllListeners(eventName)`: Remove all listeners for an event
- `removeSubscription(subscription)`: Remove specific subscription

## Error Handling

The module provides comprehensive error handling with detailed error messages. All errors include:

- `code`: Error code for programmatic handling
- `message`: Human-readable error message
- `details`: Additional error details when available

## Platform Support

- **iOS**: Full support with ChatEngineWrapper.xcframework
- **Android**: Placeholder implementation (not yet supported)

## Requirements

- React Native 0.80.2+ with new architecture (TurboModules) enabled
- iOS 12.0+
- Xcode 14.0+

**Note**: This module uses TurboModules and requires the new React Native architecture to be enabled in your project.

## License

MIT

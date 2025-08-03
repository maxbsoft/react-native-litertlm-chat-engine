import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import {
  ChatEngine,
  ChatEngineConfig,
} from 'react-native-rn-litertlm-chat-engine';

const App = () => {
  const [chatEngine, setChatEngine] = useState<ChatEngine | null>(null);
  const [inputText, setInputText] = useState('');
  const [responses, setResponses] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const engine = new ChatEngine();

    // Set up event listeners
    engine.on('response', (data) => {
      setResponses((prev) => [...prev, data.response]);
    });

    engine.on('metrics', (metrics) => {
      console.log('Generation metrics:', {
        tokensPerSecond: metrics.tokensPerSecond,
        totalTimeMs: metrics.totalTimeMs,
        prefillTokens: metrics.prefillTokens,
        decodeTokens: metrics.decodeTokens,
      });
    });

    engine.on('error', (error) => {
      console.error('Engine error:', error);
      Alert.alert('Error', error.message);
    });

    engine.on('ready', () => {
      console.log('Engine is ready');
      setIsReady(true);
    });

    engine.on('generating', (generating) => {
      console.log('Generation status:', generating);
      setIsGenerating(generating);
    });

    setChatEngine(engine);

    // Initialize engine
    const initializeEngine = async () => {
      try {
        const config: ChatEngineConfig = {
          modelPath: '/path/to/your/model.bin', // Update with actual model path
          backendType: 0, // CPU
          maxTokens: 2048,
          temperature: 0.7,
          numThreads: 4,
        };

        await engine.initialize(config);
      } catch (error) {
        console.error('Failed to initialize engine:', error);
        Alert.alert(
          'Initialization Error',
          'Failed to initialize chat engine. Please check your model path.'
        );
      }
    };

    initializeEngine();

    // Cleanup on unmount
    return () => {
      engine.destroy();
    };
  }, []);

  const handleGenerate = async () => {
    if (!chatEngine || !inputText.trim()) return;

    try {
      setResponses((prev) => [...prev, `User: ${inputText}`]);
      await chatEngine.generateAsync(inputText);
      setInputText('');
    } catch (error) {
      console.error('Generation failed:', error);
      Alert.alert('Generation Error', 'Failed to generate response.');
    }
  };

  const handleStop = async () => {
    if (!chatEngine) return;
    await chatEngine.stopGeneration();
  };

  const handleClear = () => {
    setResponses([]);
    chatEngine?.clearHistory();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.title}>LiteRT-LM Chat Engine</Text>
        <Text style={styles.status}>
          Status: {isReady ? 'Ready' : 'Initializing...'}
        </Text>
      </View>

      <ScrollView style={styles.chatContainer}>
        {responses.map((response, index) => (
          <View key={index} style={styles.messageContainer}>
            <Text style={styles.messageText}>{response}</Text>
          </View>
        ))}
        {isGenerating && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>Generating...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Enter your message..."
          multiline
          style={styles.textInput}
          editable={isReady && !isGenerating}
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.generateButton]}
            onPress={handleGenerate}
            disabled={!isReady || isGenerating || !inputText.trim()}
          >
            <Text style={styles.buttonText}>
              {isGenerating ? 'Generating...' : 'Generate'}
            </Text>
          </TouchableOpacity>

          {isGenerating && (
            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={handleStop}
            >
              <Text style={styles.buttonText}>Stop</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={handleClear}
            disabled={!isReady}
          >
            <Text style={styles.buttonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  status: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  chatContainer: {
    flex: 1,
    padding: 20,
  },
  messageContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  inputContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    minHeight: 50,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  generateButton: {
    backgroundColor: '#007AFF',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  clearButton: {
    backgroundColor: '#8E8E93',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default App;

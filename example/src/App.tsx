import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Alert,
} from 'react-native';
import {
  ChatEngine,
} from 'react-native-rn-litertlm-chat-engine';

const App = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [inputText, setInputText] = useState<string>('');
  const [generatedText, setGeneratedText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [engine, setEngine] = useState<ChatEngine | null>(null);

  const testBasicFunctionality = async () => {
    try {
      const chatEngine = new ChatEngine();
      
      // Test basic C function
      const result = await chatEngine.testCFunction();
      setTestResult(`Test C function result: ${result}`);
      
      // Test event emitter
      chatEngine.addListener('error', (error) => {
        console.log('Error event received:', error);
      });
      
      // Test engine initialization with model
      setTestResult(`C function test passed! Now testing engine initialization...`);
      
      const config = {
        modelPath: 'gemma-3n-E2B-it-int4.litertlm',
        backendType: 0, // CPU
        maxTokens: 512,
        temperature: 0.7,
        numThreads: 4
      };
      
      await chatEngine.initialize(config);
      setEngine(chatEngine);
      setTestResult(`✅ Engine initialized successfully with model! C function result: ${result}`);
      
    } catch (error) {
      console.error('Test failed:', error);
      setTestResult(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const generateText = async () => {
    if (!engine || !inputText.trim()) {
      Alert.alert('Error', 'Please initialize engine first and enter some text');
      return;
    }

    let subscription: any = null;

    try {
      console.log('Starting generation with text:', inputText);
      setIsGenerating(true);
      setGeneratedText('');

      // Listen for streaming responses FIRST
      let previousResponse = '';
      
      // Set up event listener BEFORE starting generation
      subscription = engine.addListener('response', (data) => {
        console.log('Received response event:', data);
        if (data.done) {
          // Streaming is complete
          setIsGenerating(false);
          console.log('Streaming completed, final response:', previousResponse);
          if (subscription) {
            subscription.remove();
            subscription = null;
          }
        } else {
          const newToken = data.response.slice(previousResponse.length);
          // Add token to response (real-time streaming)
          setGeneratedText(data.response);
          console.log('New token:', newToken);
          previousResponse = data.response;
        }
      });

      console.log('Listener set up, now starting generation...');
      
      // Small delay to ensure listener is fully registered
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Start generation AFTER listener is set up
      await engine.generateAsync(inputText);
      
    } catch (error) {
      console.error('Generation failed:', error);
      setGeneratedText(`Generation failed: ${error instanceof Error ? error.message : String(error)}`);
      setIsGenerating(false);
      
      // Clean up subscription on error
      if (subscription) {
        subscription.remove();
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.scrollView}>
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>React Native LiteRT-LM Chat Engine</Text>
          <Text style={styles.sectionDescription}>
            Basic module functionality test
          </Text>
          
          <TouchableOpacity style={styles.button} onPress={testBasicFunctionality}>
            <Text style={styles.buttonText}>Initialize Engine</Text>
          </TouchableOpacity>
          
          {testResult ? (
            <View style={styles.resultContainer}>
              <Text style={styles.resultText}>{testResult}</Text>
            </View>
          ) : null}

          {engine && (
            <View style={styles.chatContainer}>
              <Text style={styles.sectionTitle}>Chat with AI</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Enter your message..."
                value={inputText}
                onChangeText={setInputText}
                multiline
                numberOfLines={3}
              />
              
              <TouchableOpacity 
                style={[styles.button, isGenerating && styles.buttonDisabled]} 
                onPress={generateText}
                disabled={isGenerating}
              >
                <Text style={styles.buttonText}>
                  {isGenerating ? 'Generating...' : 'Generate Response'}
                </Text>
              </TouchableOpacity>
              
              {generatedText && (
                <View style={styles.responseContainer}>
                  <Text style={styles.responseTitle}>AI Response:</Text>
                  <Text style={styles.responseText}>{generatedText}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  sectionContainer: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: '#E8F4FD',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  resultText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  chatContainer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#FFF',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonDisabled: {
    backgroundColor: '#CCC',
  },
  responseContainer: {
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  responseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  responseText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});

export default App;

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../src/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

// Sample quick questions
const QUICK_QUESTIONS = [
  'What should I do in case of fire?',
  'Where are the emergency exits?',
  'How do I report an incident?',
  'Where are the fire extinguishers?',
];

// Sample initial messages
const INITIAL_MESSAGES = [
  {
    id: '1',
    text: 'Hello! I am your Fire Safety Assistant. How can I help you today?',
    sender: 'assistant',
    timestamp: new Date().toISOString(),
  },
];

export default function AssistantScreen() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];

  const handleSendMessage = () => {
    if (inputText.trim() === '') return;
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputText('');
    
    // Simulate assistant response (in a real app, this would call an API)
    setTimeout(() => {
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        text: 'I understand you need help with "' + inputText + '". This is a placeholder response. In the actual application, this will provide helpful safety information based on your question.',
        sender: 'assistant',
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
    }, 1000);
  };

  const handleQuickQuestion = (question) => {
    setInputText(question);
  };

  const renderMessage = ({ item }) => (
    <View 
      style={[
        styles.messageContainer,
        item.sender === 'user' ? styles.userMessageContainer : styles.assistantMessageContainer,
        { 
          backgroundColor: item.sender === 'user' 
            ? colors.primary 
            : colorScheme === 'dark' ? colors.card : colors.surface,
        }
      ]}
    >
      <Text 
        style={[
          styles.messageText,
          { 
            color: item.sender === 'user' ? '#ffffff' : colors.text 
          }
        ]}
      >
        {item.text}
      </Text>
      <Text 
        style={[
          styles.messageTimestamp,
          { 
            color: item.sender === 'user' ? 'rgba(255,255,255,0.7)' : colors.textMuted 
          }
        ]}
      >
        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  const renderQuickQuestion = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.quickQuestionButton,
        { 
          backgroundColor: colorScheme === 'dark' ? colors.card : colors.surface,
          borderColor: colors.border,
        }
      ]}
      onPress={() => handleQuickQuestion(item)}
    >
      <Text style={[styles.quickQuestionText, { color: colors.text }]}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Assistant</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Get help with fire safety and emergency procedures
        </Text>
      </View>
      
      <View style={styles.quickQuestionsContainer}>
        <Text style={[styles.quickQuestionsTitle, { color: colors.text }]}>
          Quick Questions
        </Text>
        <FlatList
          data={QUICK_QUESTIONS}
          renderItem={renderQuickQuestion}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickQuestionsList}
        />
      </View>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.messagesContainer}
        keyboardVerticalOffset={100}
      >
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          inverted={false}
        />
        
        <View style={[styles.inputContainer, { borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colorScheme === 'dark' ? colors.card : colors.surface }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your question..."
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, { backgroundColor: colors.primary }]}
            onPress={handleSendMessage}
            disabled={inputText.trim() === ''}
          >
            <Ionicons name="send" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  quickQuestionsContainer: {
    paddingHorizontal: 20,
  },
  quickQuestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickQuestionsList: {
    paddingBottom: 12,
  },
  quickQuestionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  quickQuestionText: {
    fontSize: 14,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messagesList: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  messageContainer: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantMessageContainer: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  messageTimestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '../../src/constants/Colors';
import Card from '../../src/components/ui/Card';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' },
  { code: 'zh', name: '中文' },
  { code: 'ar', name: 'العربية' },
];

export default function LanguageSettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  // Default to English - in a real app, get this from a language context
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const handleLanguageChange = (langCode: string) => {
    setSelectedLanguage(langCode);
    // In a real app, update language context and reload UI
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack.Screen
        options={{
          title: 'Language',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={styles.content}>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Select your preferred language. Changes will be applied immediately.
        </Text>
        
        <Card style={styles.card}>
          {LANGUAGES.map(language => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageItem,
                language.code !== LANGUAGES[LANGUAGES.length - 1].code && styles.borderBottom,
              ]}
              onPress={() => handleLanguageChange(language.code)}
            >
              <Text style={[styles.languageName, { color: colors.text }]}>
                {language.name}
              </Text>
              {selectedLanguage === language.code && (
                <Feather name="check" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </Card>
        
        <Text style={[styles.note, { color: colors.textSecondary }]}>
          Note: Some alert content may still appear in English for safety reasons.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  description: {
    fontSize: 16,
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  languageName: {
    fontSize: 16,
  },
  note: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});
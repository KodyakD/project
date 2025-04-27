import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '../../src/constants/Colors';
import Card from '../../src/components/ui/Card';

interface Contact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

export default function EmergencyContactsSettings() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Mock emergency contacts
  const [contacts, setContacts] = useState<Contact[]>([
    { id: '1', name: 'John Doe', phone: '+33 6 12 34 56 78', relation: 'Manager' },
    { id: '2', name: 'Jane Smith', phone: '+33 6 98 76 54 32', relation: 'Security Officer' },
  ]);
  
  const addContact = () => {
    // In a real app, this would open a form to add a contact
    Alert.alert('Add Contact', 'This would open a contact picker or form in a real app.');
  };
  
  const editContact = (contact: Contact) => {
    // In a real app, this would open a form to edit the contact
    Alert.alert('Edit Contact', `You would be able to edit ${contact.name}'s information.`);
  };
  
  const deleteContact = (id: string) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to remove this emergency contact?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setContacts(contacts.filter(contact => contact.id !== id));
          },
        },
      ]
    );
  };
  
  const renderContact = ({ item }: { item: Contact }) => (
    <View style={styles.contactItem}>
      <View style={styles.contactInfo}>
        <Text style={[styles.contactName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.contactPhone, { color: colors.textSecondary }]}>{item.phone}</Text>
        <Text style={[styles.contactRelation, { color: colors.textSecondary }]}>{item.relation}</Text>
      </View>
      <View style={styles.contactActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => editContact(item)}>
          <Feather name="edit" size={18} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => deleteContact(item.id)}>
          <Feather name="trash-2" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Emergency Contacts',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <View style={styles.content}>
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Your Emergency Contacts</Text>
        <Card style={styles.card}>
          <FlatList
            data={contacts}
            renderItem={renderContact}
            keyExtractor={item => item.id}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  No emergency contacts added yet
                </Text>
              </View>
            }
          />
        </Card>
        
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={addContact}
        >
          <Feather name="plus" size={18} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Emergency Contact</Text>
        </TouchableOpacity>
        
        <Text style={[styles.helpText, { color: colors.textSecondary }]}>
          Emergency contacts will be notified automatically in case you report a critical incident.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  card: {
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
  },
  contactPhone: {
    fontSize: 14,
    marginTop: 2,
  },
  contactRelation: {
    fontSize: 14,
    marginTop: 2,
    fontStyle: 'italic',
  },
  contactActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 8,
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
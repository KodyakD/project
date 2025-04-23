import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Service for handling local storage operations using AsyncStorage
 */
const storageService = {
  /**
   * Store a string value in AsyncStorage
   * @param key - Storage key
   * @param value - String value to store
   */
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error storing data for key ${key}:`, error);
      throw error;
    }
  },

  /**
   * Get a string value from AsyncStorage
   * @param key - Storage key
   * @returns The stored string value or null if not found
   */
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`Error retrieving data for key ${key}:`, error);
      throw error;
    }
  },

  /**
   * Remove an item from AsyncStorage
   * @param key - Storage key to remove
   */
  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing data for key ${key}:`, error);
      throw error;
    }
  },

  /**
   * Store an object value in AsyncStorage (serialized as JSON)
   * @param key - Storage key
   * @param value - Object to store
   */
  setObject: async (key: string, value: any): Promise<void> => {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error storing object for key ${key}:`, error);
      throw error;
    }
  },

  /**
   * Get an object from AsyncStorage (parsed from JSON)
   * @param key - Storage key
   * @returns The parsed object or null if not found
   */
  getObject: async <T>(key: string): Promise<T | null> => {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Error retrieving object for key ${key}:`, error);
      throw error;
    }
  },

  /**
   * Check if a key exists in AsyncStorage
   * @param key - Storage key to check
   * @returns Boolean indicating if the key exists
   */
  hasKey: async (key: string): Promise<boolean> => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value !== null;
    } catch (error) {
      console.error(`Error checking for key ${key}:`, error);
      throw error;
    }
  },

  /**
   * Get all keys stored in AsyncStorage
   * @returns Array of keys
   */
  getAllKeys: async (): Promise<string[]> => {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys:', error);
      throw error;
    }
  },

  /**
   * Clear all data from AsyncStorage
   */
  clear: async (): Promise<void> => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  },

  /**
   * Get multiple items from AsyncStorage
   * @param keys - Array of keys to retrieve
   * @returns Array of [key, value] pairs
   */
  multiGet: async (keys: string[]): Promise<[string, string | null][]> => {
    try {
      return await AsyncStorage.multiGet(keys);
    } catch (error) {
      console.error('Error retrieving multiple items:', error);
      throw error;
    }
  },

  /**
   * Set multiple items in AsyncStorage
   * @param keyValuePairs - Array of [key, value] pairs to store
   */
  multiSet: async (keyValuePairs: [string, string][]): Promise<void> => {
    try {
      await AsyncStorage.multiSet(keyValuePairs);
    } catch (error) {
      console.error('Error storing multiple items:', error);
      throw error;
    }
  },

  /**
   * Remove multiple items from AsyncStorage
   * @param keys - Array of keys to remove
   */
  multiRemove: async (keys: string[]): Promise<void> => {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Error removing multiple items:', error);
      throw error;
    }
  }
};

export default storageService; 
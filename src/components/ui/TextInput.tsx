import React from 'react';
import { 
  TextInput as RNTextInput, 
  TextInputProps as RNTextInputProps, 
  StyleSheet, 
  View,
  useColorScheme,
} from 'react-native';
import { Colors } from '../../constants/Colors';

interface TextInputProps extends RNTextInputProps {
  variant?: 'outlined' | 'filled';
  error?: boolean;
}

export const TextInput = React.forwardRef<RNTextInput, TextInputProps>(
  ({ 
    variant = 'outlined', 
    error = false, 
    style, 
    ...props 
  }, ref) => {
    const colorScheme = useColorScheme() || 'light';
    const colors = Colors[colorScheme];

    const getVariantStyle = () => {
      if (variant === 'filled') {
        return {
          backgroundColor: colorScheme === 'dark' ? colors.card : colors.input,
          borderWidth: 0,
        };
      }
      return {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: error ? colors.error : colors.border,
      };
    };

    return (
      <View style={styles.container}>
        <RNTextInput
          ref={ref}
          style={[
            styles.input,
            getVariantStyle(),
            { color: colors.text },
            style,
          ]}
          placeholderTextColor={colors.textMuted}
          {...props}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    width: '100%',
  },
});
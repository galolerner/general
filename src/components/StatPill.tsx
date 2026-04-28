import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';

type Props = {
  label: string;
  value: string | number;
  accent?: string;
};

export const StatPill = ({ label, value, accent }: Props) => {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
      ]}
    >
      <Text
        style={[
          theme.typography.title,
          { color: accent ?? theme.colors.text, fontSize: 24 },
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          theme.typography.caption,
          { color: theme.colors.textMuted, marginTop: 2 },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'flex-start',
  },
});

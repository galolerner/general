import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';

type Props = {
  emoji: string;
  title: string;
  subtitle: string;
};

export const EmptyState = ({ emoji, title, subtitle }: Props) => {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[theme.typography.heading, { color: theme.colors.text, marginTop: 10 }]}>
        {title}
      </Text>
      <Text
        style={[
          theme.typography.body,
          { color: theme.colors.textMuted, marginTop: 6, textAlign: 'center' },
        ]}
      >
        {subtitle}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', padding: 24, marginTop: 60 },
  emoji: { fontSize: 56 },
});

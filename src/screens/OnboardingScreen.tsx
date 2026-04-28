import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useHabits } from '@/store/habitsStore';
import { PrimaryButton } from '@/components/PrimaryButton';
import {
  ensurePermissions,
  ensureAndroidChannel,
} from '@/services/notifications';

export const OnboardingScreen = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const finish = useHabits((s) => s.finishOnboarding);

  const onContinue = async () => {
    await ensureAndroidChannel();
    await ensurePermissions();
    finish();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.bg,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      <View style={styles.heroWrap}>
        <Text style={styles.bigEmoji}>🔥</Text>
        <Text style={[theme.typography.title, { color: theme.colors.text, fontSize: 32 }]}>
          Construí hábitos que duran
        </Text>
        <Text
          style={[
            theme.typography.body,
            { color: theme.colors.textMuted, marginTop: 12, textAlign: 'center', lineHeight: 22 },
          ]}
        >
          Marca tu día, mantén la racha y revisa tu progreso de un vistazo.
        </Text>
      </View>

      <View style={styles.features}>
        <Feature emoji="✅" title="Toggle diario" desc="Un toque para marcar el hábito como hecho." />
        <Feature emoji="🔥" title="Sistema de rachas" desc="Racha actual, mejor racha y % de cumplimiento." />
        <Feature emoji="🔔" title="Recordatorios inteligentes" desc="Aprenden de cuándo completas tus hábitos." />
        <Feature emoji="📈" title="Dashboard" desc="Progreso semanal y mensual al instante." />
      </View>

      <PrimaryButton label="Empezar" onPress={onContinue} style={{ marginHorizontal: 20 }} />
    </View>
  );
};

const Feature = ({
  emoji,
  title,
  desc,
}: {
  emoji: string;
  title: string;
  desc: string;
}) => {
  const theme = useTheme();
  return (
    <View style={styles.feature}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={[theme.typography.subheading, { color: theme.colors.text }]}>
          {title}
        </Text>
        <Text style={[theme.typography.caption, { color: theme.colors.textMuted, marginTop: 2 }]}>
          {desc}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between' },
  heroWrap: { paddingHorizontal: 28, alignItems: 'center', marginTop: 20 },
  bigEmoji: { fontSize: 64, marginBottom: 12 },
  features: { paddingHorizontal: 24, gap: 16 },
  feature: { flexDirection: 'row', alignItems: 'flex-start' },
});

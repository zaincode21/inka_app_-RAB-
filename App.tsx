import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Logo from './components/Logo';

export default function App() {
  return (
    <View style={styles.container}>
      <View style={styles.backdropTop} />
      <View style={styles.backdropGlow} />
      <View style={styles.backdropBottom} />

      <View style={styles.overlay} />

      <View style={styles.content}>
        <View style={styles.logoFrame}>
          <Logo width={150} height={150} />
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>
            Inka <Text style={styles.titleAccent}>App</Text>
          </Text>
          <View style={styles.subtitleBlock}>
            <Text style={styles.subtitle}>Your Smart Dairy & Beef</Text>
            <Text style={styles.subtitle}>Farming Companion.</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}>
            <Text style={styles.primaryButtonText}>Sign in</Text>
          </Pressable>

          <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}>
            <Text style={styles.secondaryButtonText}>Create account</Text>
          </Pressable>
        </View>
      </View>

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111316',
  },
  backdropTop: {
    position: 'absolute',
    top: -120,
    left: -60,
    right: -60,
    height: 260,
    borderBottomLeftRadius: 180,
    borderBottomRightRadius: 180,
    backgroundColor: '#1F2529',
    opacity: 0.95,
  },
  backdropGlow: {
    position: 'absolute',
    top: 150,
    alignSelf: 'center',
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: '#2E3438',
    opacity: 0.28,
  },
  backdropBottom: {
    position: 'absolute',
    bottom: -60,
    left: -20,
    right: -20,
    height: 240,
    borderTopLeftRadius: 180,
    borderTopRightRadius: 180,
    backgroundColor: '#1A1A1A',
    opacity: 0.9,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.34)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 96,
    paddingBottom: 36,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoFrame: {
    width: 190,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 190,
    backgroundColor: 'rgba(14, 16, 18, 0.18)',
  },
  titleBlock: {
    alignItems: 'center',
    marginTop: 36,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 54,
    lineHeight: 58,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -1.3,
  },
  titleAccent: {
    color: '#E6B86F',
  },
  subtitle: {
    color: '#F6F3ED',
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitleBlock: {
    marginTop: 18,
    gap: 2,
    alignItems: 'center',
  },
  actions: {
    width: '100%',
    gap: 16,
    paddingBottom: 14,
  },
  primaryButton: {
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D8A8D',
  },
  secondaryButton: {
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6B86F',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});

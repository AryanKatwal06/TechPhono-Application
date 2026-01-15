import { Skeleton } from '@/components/Skeleton';
import { WhatsAppFAB } from '@/components/WhatsAppFAB';
import { services } from '@/constants/services';
import { borderRadius, colors, shadows, spacing } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    ChevronRight,
    Clock,
    MapPin,
    Phone,
    Search,
    User,
    Wrench,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Image,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
export default function HomeScreen() {
  const router = useRouter();
  const [jobId, setJobId] = useState('');
  const [authReady, setAuthReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setAuthReady(true), 1500);
    return () => clearTimeout(timer);
  }, []);
  const handleCall = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Linking.openURL('tel:8527361011');
  };
  const handleBookRepair = () => {
    router.push('/booking');
  };
  const handleTrackRepair = () => {
    if (jobId.trim()) {
      router.push(`/track-repair?jobId=${jobId}`);
    }
  };
  const handleService = (serviceName: string) => {
    router.push({
      pathname: '/booking',
      params: { service: serviceName },
    });
  };
  const handleQuickAction = (action: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    switch (action) {
      case 'book':
        router.push('/booking');
        break;
      case 'track':
        router.push('/track-repair');
        break;
      case 'shop':
        router.push('/(tabs)/shop');
        break;
      case 'services':
        router.push('/(tabs)/services');
        break;
    }
  };
  if (!authReady) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: 20, paddingTop: 60 }}>
        <StatusBar style="dark" />
        <Skeleton height={32} width={150} style={{ marginBottom: 20 }} />
        <Skeleton height={180} style={{ marginBottom: 24, borderRadius: 28 }} />
        <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
             <Skeleton height={100} style={{ flex: 1, borderRadius: 18 }} />
             <Skeleton height={100} style={{ flex: 1, borderRadius: 18 }} />
        </View>
        <Skeleton height={32} width={200} style={{ marginBottom: 16 }} />
        <Skeleton height={80} style={{ marginBottom: 12 }} />
        <Skeleton height={80} style={{ marginBottom: 12 }} />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.headerGradient}
      >
        <View style={styles.headerTop}>
          <View style={styles.brandContainer}>
            <Image
              source={require('@/assets/logo.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.brandText}>TechPhono</Text>
              <Text style={styles.tagline}>
                Gadgets ka Doctor, Aapke Darwaze Pe
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/repair-history')}
          >
            <User size={22} color={colors.card} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerActions}>
           <TouchableOpacity onPress={handleBookRepair} style={{ flex: 1 }} activeOpacity={0.9}>
            <View style={styles.primaryButton}>
                <Wrench size={18} color={colors.primary} />
                <Text style={styles.primaryButtonText}>Book Repair</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCall} style={{ flex: 1 }} activeOpacity={0.9}>
            <View style={[styles.primaryButton, styles.secondaryButton]}>
                <Phone size={18} color="#fff" />
                <Text style={[styles.primaryButtonText, { color: '#fff' }]}>Call Now</Text>
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.trackCard}>
          <Text style={styles.trackTitle}>Track Your Repair</Text>
          <View style={styles.searchContainer}>
            <Search size={20} color={colors.textLight} />
            <TextInput
              style={styles.searchInput}
              placeholder="Enter Job ID"
              placeholderTextColor={colors.textLight}
              value={jobId}
              onChangeText={setJobId}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.trackButton,
              !jobId.trim() && styles.trackButtonDisabled,
            ]}
            onPress={handleTrackRepair}
            disabled={!jobId.trim()}
          >
            <Text style={styles.trackButtonText}>Track Status</Text>
            <ChevronRight size={20} color={colors.card} />
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {[
            { key: 'book', icon: Wrench, label: 'Book Repair' },
            { key: 'track', icon: MapPin, label: 'Track Status' },
            { key: 'shop', icon: Clock, label: 'Shop' },
            { key: 'services', icon: Wrench, label: 'Services' },
          ].map(({ key, icon: Icon, label }) => (
            <TouchableOpacity
              key={key}
              activeOpacity={0.8}
              onPress={() => handleQuickAction(key)}
              style={styles.actionCardWrapper}
            >
              <View style={styles.actionCard}>
                <Icon size={24} color={colors.primary} />
                <Text style={styles.actionText}>{label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.sectionTitle}>Popular Services</Text>
        {services.slice(0, 4).map(service => (
          <TouchableOpacity
            key={service.id}
            activeOpacity={0.7}
            onPress={() => handleService(service.name)}
          >
            <View style={styles.serviceCard}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.serviceTitle}>{service.name}</Text>
                <Text style={styles.serviceSub} numberOfLines={1}>
                    {service.description}
                </Text>
              </View>
              <ChevronRight color="#9CA3AF" size={20} />
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 120 }} />
      </ScrollView>
      <WhatsAppFAB />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerGradient: {
    paddingTop: 56,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandLogo: {
    width: 34,
    height: 34,
  },
  brandText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 34,
  },
  tagline: { fontSize: 14, color: colors.card, opacity: 0.9 },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: { 
    flexDirection: 'row', 
    gap: 12 
  },
  primaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  content: { padding: spacing.lg, paddingTop: 24 },
  trackCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  trackTitle: { fontSize: 20, fontWeight: '700', marginBottom: spacing.sm },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchInput: { flex: 1, paddingVertical: spacing.md },
  trackButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  trackButtonDisabled: { opacity: 0.5 },
  trackButtonText: { color: colors.card, fontWeight: '600' },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  quickActions: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between',
    marginBottom: spacing.xl
  },
  actionCardWrapper: {
    width: '47%',
    marginBottom: spacing.md,
  },
  actionCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  actionText: { 
    marginTop: 12, 
    fontWeight: '600',
    color: colors.text,
    fontSize: 14
  },
  serviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    ...shadows.sm,
    shadowOpacity: 0.03,
  },
  serviceTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: colors.text,
    marginBottom: 4 
  },
  serviceSub: { 
    fontSize: 13, 
    color: '#6B7280', 
    lineHeight: 18 
  },
});
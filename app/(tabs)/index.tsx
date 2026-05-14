import { Skeleton } from '@/components/Skeleton';
import { WhatsAppFAB } from '@/components/WhatsAppFAB';
import { borderRadius, colors, shadows, spacing } from '@/constants/theme';
import { db } from '@/services/firebaseClient';
import { collection, query, where, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import LinearGradient from 'react-native-linear-gradient';
import { useRouter } from '@/navigation/router';
import {
  ChevronRight,
  Phone,
  Search,
  User,
  Wrench,
  AlertCircle,
  RefreshCw,
  ClipboardList,
  ShoppingBag,
} from 'lucide-react-native';
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
  Platform,
  useWindowDimensions,
  StatusBar,
} from 'react-native';


type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
};

export default function HomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [jobId, setJobId] = useState('');
  const [authReady, setAuthReady] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  // Determine screen type
  const isMobile = width < 600;
  const isTablet = width >= 600 && width < 1024;
  const isDesktop = width >= 1024;
  const isLandscape = height < width;

  const fetchServices = async () => {
    try {
      setError(false);
      const q = query(
        collection(db, 'services'),
        where('is_deleted', '==', false),
        orderBy('created_at', 'asc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({
        id: d.id,
        name: d.data().name,
        description: d.data().description,
        price: d.data().price,
      }));
      setServices(data);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchServices();
  }, []);

  useEffect(() => {
    fetchServices();

    const q = query(
      collection(db, 'services'),
      where('is_deleted', '==', false),
      orderBy('created_at', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({
        id: d.id,
        name: d.data().name,
        description: d.data().description,
        price: d.data().price,
      }));
      setServices(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleCall = () => Linking.openURL('tel:8527361011');
  const handleBookRepair = () => router.push('/booking');
  const handleTrackRepair = () => jobId.trim() && router.push(`/track-repair?jobId=${jobId}`);
  const handleService = (service: Service) => {
    router.push({ pathname: '/booking', params: { service: service.name, price: service.price.toString() } });
  };

  if (!authReady) {
    return (
      <View style={styles.skeletonContainer}>
        <StatusBar barStyle="dark-content" />
        <Skeleton height={32} width={150} style={{ marginBottom: spacing.lg }} />
        <Skeleton height={48} style={{ marginBottom: spacing.lg, borderRadius: borderRadius.lg }} />
        <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
          <Skeleton height={100} style={{ flex: 1, borderRadius: borderRadius.md }} />
          <Skeleton height={100} style={{ flex: 1, borderRadius: borderRadius.md }} />
        </View>
        <Skeleton height={32} width={200} style={{ marginBottom: spacing.md }} />
        <Skeleton height={80} style={{ marginBottom: spacing.sm }} />
        <Skeleton height={80} style={{ marginBottom: spacing.sm }} />
      </View>
    );
  }

  const logoSize = isDesktop ? 48 : isTablet ? 42 : 34;
  const iconSize = isDesktop ? 24 : 20;
  const fabSize = isDesktop ? 80 : 60;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient 
        colors={['#3B82F6', '#2563EB', '#1E40AF']} 
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.header,
          {
            paddingTop: isLandscape ? spacing.xxxl : spacing.xxxl + 20,
            paddingBottom: spacing.xl,
            paddingHorizontal: spacing.lg,
          }
        ]}
      >
        {/* Header Top */}
        <View style={styles.headerTop}>
          <View style={styles.brandContainer}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={{ width: logoSize, height: logoSize }} 
            />
            <View>
              <Text style={styles.brandText}>TechPhono</Text>
              <Text style={styles.tagline}>Gadgets ka Doctor</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.profileButton,
              {
                width: fabSize * 0.65,
                height: fabSize * 0.65,
                borderRadius: (fabSize * 0.65) / 2,
              },
            ]}
            onPress={() => router.push('/repair-history')}
          >
            <User size={iconSize} color={colors.card} />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleBookRepair} style={{ flex: 1 }} activeOpacity={0.9}>
            <View style={styles.primaryButton}>
              <Wrench size={iconSize} color={colors.primary} />
              <Text style={styles.primaryButtonText}>Book Repair</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCall} style={{ flex: 1 }} activeOpacity={0.9}>
            <View style={[styles.primaryButton, styles.secondaryButton]}>
              <Phone size={iconSize} color="#fff" />
              <Text style={[styles.primaryButtonText, { color: '#fff' }]}>Call Now</Text>
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[
          styles.content, 
          {
            flexGrow: 1,
            justifyContent: 'center',
            paddingBottom: isLandscape ? spacing.xl : spacing.xl,
            minHeight: height - 200 // Ensure minimum height for centering
          }
        ]}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ right: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Track Card - Enhanced */}
        <View style={[
          styles.trackCard,
          {
            minHeight: isDesktop ? 140 : isTablet ? 120 : 110,
            marginHorizontal: isDesktop ? spacing.xl : spacing.md,
          }
        ]}>
          <View style={styles.trackHeader}>
            <View style={styles.trackTitleContainer}>
              <Text style={styles.trackTitle}>Track Your Repair</Text>
              <Text style={styles.trackSubtitle}>Enter your Job ID to get real-time updates</Text>
            </View>
            <View style={styles.trackIconContainer}>
              <Search size={24} color={colors.card} />
            </View>
          </View>
          
          <View style={styles.searchContainer}>
            <Search size={iconSize} color={colors.primary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Enter Job ID"
              value={jobId}
              onChangeText={setJobId}
              placeholderTextColor={colors.textLight}
            />
          </View>
          
          <TouchableOpacity
            style={[styles.trackButton, !jobId.trim() && styles.trackButtonDisabled]}
            onPress={handleTrackRepair}
            disabled={!jobId.trim()}
            activeOpacity={0.9}
          >
            <Text style={styles.trackButtonText}>Track Status</Text>
            <ChevronRight size={iconSize} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Quick Actions - 2x2 Grid */}
        <View style={styles.quickActionsContainer}>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={[styles.quickActionCard, styles.quickActionCardEnhanced]}
              onPress={() => router.push('/track-repair')}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIconContainer}>
                <Wrench size={28} color={colors.primary} />
              </View>
              <Text style={styles.quickActionText}>Track Repair</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, styles.quickActionCardEnhanced]}
              onPress={handleBookRepair}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIconContainer}>
                <ClipboardList size={28} color={colors.primary} />
              </View>
              <Text style={styles.quickActionText}>Book Repair</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={[styles.quickActionCard, styles.quickActionCardEnhanced]}
              onPress={() => router.push('/(tabs)/shop')}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIconContainer}>
                <ShoppingBag size={28} color={colors.primary} />
              </View>
              <Text style={styles.quickActionText}>Shop</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, styles.quickActionCardEnhanced]}
              onPress={handleCall}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIconContainer}>
                <Phone size={28} color="#2563EB" />
              </View>
              <Text style={styles.quickActionText}>Call Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Popular Services Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Services</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/services')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.lg }} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <AlertCircle size={32} color={colors.danger} />
            <Text style={styles.errorText}>Failed to load services</Text>
            <TouchableOpacity onPress={fetchServices} style={styles.retryBtn}>
              <RefreshCw size={16} color={colors.primary} />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : services.length === 0 ? (
          <Text style={styles.emptyText}>No services available currently.</Text>
        ) : (
          services.slice(0, 4).map(service => (
            <TouchableOpacity key={service.id} activeOpacity={0.7} onPress={() => handleService(service)}>
              <View style={styles.serviceCard}>
                <View style={{ flex: 1 }}>
                  <View style={styles.serviceHeaderRow}>
                    <Text style={styles.serviceTitle} numberOfLines={2}>
                      {service.name}
                    </Text>
                    {service.price > 0 && (
                      <View style={styles.priceBadge}>
                        <Text style={styles.priceText}>₹{service.price}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.serviceSub} numberOfLines={2}>
                    {service.description}
                  </Text>
                </View>
                <ChevronRight color="#9CA3AF" size={iconSize} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      <WhatsAppFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  skeletonContainer: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  header: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tagline: {
    fontSize: 12,
    color: colors.card,
    opacity: 0.8,
  },
  profileButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  primaryButton: {
    backgroundColor: '#fff',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    elevation: 4,
    minHeight: 48,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    elevation: 0,
  },
  primaryButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.lg,
    flexGrow: 1,
  },
  trackCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.lg,
    borderWidth: 0,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  trackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  trackTitleContainer: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: spacing.xs,
    color: colors.card,
    letterSpacing: -0.5,
  },
  trackSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.card,
    opacity: 0.9,
    lineHeight: 20,
  },
  trackIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    height: 56,
    ...shadows.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  trackButton: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 56,
    ...shadows.md,
  },
  trackButtonDisabled: {
    opacity: 0.5,
  },
  trackButtonText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: -0.3,
  },
  quickActionsContainer: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  quickActionCardEnhanced: {
    borderWidth: 1,
    borderColor: colors.primary + '20',
    backgroundColor: colors.card,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    transform: [{ scale: 1 }],
  },
  quickActionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  seeAll: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.primary + '08',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  serviceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  priceBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  priceText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  serviceSub: {
    fontSize: 12,
    color: colors.textLight,
  },
  errorContainer: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    fontSize: 14,
    color: colors.danger,
    marginVertical: spacing.md,
    fontWeight: '500',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary + '20',
    borderRadius: borderRadius.md,
  },
  retryText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginVertical: spacing.lg,
  },
});

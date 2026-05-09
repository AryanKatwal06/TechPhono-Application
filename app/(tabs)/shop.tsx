import type { Product } from '@/constants/products';
import { borderRadius, colors, shadows, spacing } from '@/constants/theme';
import { useTechPhono } from '@/context/TechPhonoContext';
import { db } from '@/services/firebaseClient';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import type { CartItem } from '@/types/cart';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ArrowLeft, Minus, Plus, ShoppingCart } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

interface ProductCardProps {
  product: Product;
  quantity: number;
  onAdd: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
  columnWidth: number;
}

function ProductCard({
  product,
  quantity,
  onAdd,
  onIncrease,
  onDecrease,
  columnWidth,
}: ProductCardProps) {
  const badgeAnim = useRef(new Animated.Value(0)).current;
  const quantityAnim = useRef(new Animated.Value(1)).current;
  const cardWidth = columnWidth - spacing.md;

  useEffect(() => {
    Animated.spring(badgeAnim, {
      toValue: quantity > 0 ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [quantity, badgeAnim]);

  useEffect(() => {
    if (quantity > 0) {
      Animated.sequence([
        Animated.timing(quantityAnim, {
          toValue: 1.2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(quantityAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [quantity, quantityAnim]);

  const buttonSize = 24;

  return (
    <View style={[styles.card, { width: cardWidth, marginRight: spacing.md, marginBottom: spacing.md }]}>
      {product.image_url || product.image ? (
        <Image
          source={{ uri: product.image_url || product.image }}
          style={{ width: '100%', height: cardWidth - spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.sm }}
          resizeMode="cover"
        />
      ) : (
        <View style={{ width: '100%', height: cardWidth - spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.sm, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' }}>
          <ShoppingCart size={24} color="#ccc" />
        </View>
      )}

      {quantity > 0 && (
        <Animated.View
          style={[
            styles.badge,
            {
              transform: [{ scale: badgeAnim }],
              opacity: badgeAnim,
            },
          ]}
        >
          <Text style={styles.badgeText}>{quantity}</Text>
        </Animated.View>
      )}
      
      <Text style={styles.productName} numberOfLines={1}>
        {product.name}
      </Text>
      <Text style={styles.productDescription} numberOfLines={2}>
        {product.description}
      </Text>
      
      <View style={styles.productFooter}>
        <Text style={styles.productPrice}>₹{product.price}</Text>
      </View>
      
      {quantity > 0 ? (
        <View style={styles.quantityControl}>
          <TouchableOpacity onPress={onDecrease} style={[styles.ctrlBtn, { width: buttonSize, height: buttonSize }]}>
            <Minus size={14} color={colors.primary} />
          </TouchableOpacity>
          <Animated.Text style={[styles.quantityText, { transform: [{ scale: quantityAnim }] }]}>
            {quantity}
          </Animated.Text>
          <TouchableOpacity onPress={onIncrease} style={[styles.ctrlBtn, { width: buttonSize, height: buttonSize }]}>
            <Plus size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.addButton, { height: buttonSize + 8 }]}
          onPress={onAdd}
          activeOpacity={0.8}
        >
          <Plus size={16} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ShopScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { addToCart, cart, updateCartQuantity, removeFromCart } = useTechPhono();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Determine columns
  const isMobile = width < 600;
  const isTablet = width >= 600;
  const columns = isMobile ? 2 : isTablet && width < 1024 ? 3 : 4;
  const columnWidth = (width - spacing.lg * 2 - spacing.md * (columns - 1)) / columns;

  const getCreatedAtMs = (value: unknown) => {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    if (typeof value === 'object' && value !== null) {
      const timestamp = value as { toMillis?: () => number; seconds?: number; nanoseconds?: number };
      if (typeof timestamp.toMillis === 'function') return timestamp.toMillis();
      if (typeof timestamp.seconds === 'number') {
        return timestamp.seconds * 1000 + Math.floor((timestamp.nanoseconds || 0) / 1_000_000);
      }
    }
    return 0;
  };

  useEffect(() => {
    const q = query(
      collection(db, 'items'),
      where('is_deleted', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mappedData = snapshot.docs
        .map((docSnap) => {
          const item = docSnap.data();
          return {
            id: docSnap.id,
            createdAtMs: getCreatedAtMs(item.created_at),
            name: item.name,
            description: item.description,
            price: item.price,
            image: item.image_url || '',
            image_url: item.image_url,
            category: 'Accessories' as const,
            inStock: true,
          };
        })
        .sort((left, right) => right.createdAtMs - left.createdAtMs)
        .map(({ createdAtMs, ...item }) => item);

      setItems(mappedData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching items:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const backAction = () => {
      router.back();
      return true;
    };
    const handler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => handler.remove();
  }, [router]);

  const getQuantity = (productId: string) =>
    cart.find((i) => i.product.id === productId)?.quantity || 0;

  const add = (product: Product) => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addToCart({ product, quantity: 1 });
  };

  const increase = (item: CartItem) => updateCartQuantity(item.product.id, item.quantity + 1);
  const decrease = (item: CartItem) => {
    if (item.quantity <= 1) {
      removeFromCart(item.product.id);
    } else {
      updateCartQuantity(item.product.id, item.quantity - 1);
    }
  };

  const renderItem = ({ item }: { item: Product }) => {
    const qty = getQuantity(item.id);
    const cartItem = cart.find((i) => i.product.id === item.id);
    return (
      <ProductCard
        product={item}
        quantity={qty}
        onAdd={() => add(item)}
        onIncrease={() => cartItem && increase(cartItem)}
        onDecrease={() => cartItem && decrease(cartItem)}
        columnWidth={columnWidth}
      />
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Shop</Text>
            <Text style={styles.headerSubtitle}>Accessories & Parts</Text>
          </View>
        </View>
        <Text style={{ textAlign: 'center', marginTop: 40, color: colors.textLight }}>
          No products available
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.selectionAsync();
            router.back();
          }}
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
        >
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>Shop</Text>
          <Text style={styles.headerSubtitle}>Accessories & Parts</Text>
        </View>
      </View>
      <FlatList
        data={items}
        numColumns={columns}
        columnWrapperStyle={{
          justifyContent: 'space-between',
          gap: spacing.md,
          paddingHorizontal: spacing.lg,
        }}
        contentContainerStyle={{
          paddingBottom: 120,
          paddingTop: spacing.md,
        }}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ right: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 40 : spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.primary + '20',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.primary + '20',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  productImage: {
    width: '100%',
    height: 150,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    backgroundColor: '#f5f5f5',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.danger,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 10,
  },
  productInfo: {
    gap: spacing.sm,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  productDescription: {
    fontSize: 12,
    color: colors.textLight,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
  },
  ctrlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
  },
  quantityText: {
    fontWeight: '700',
    fontSize: 12,
    color: colors.primary,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

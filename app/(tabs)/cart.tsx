import { borderRadius, colors, shadows, spacing } from '@/constants/theme';
import { useTechPhono } from '@/context/TechPhonoContext';
import { sendCartToWhatsApp } from '@/services/whatsapp';
import type { CartItem } from '@/types/cart';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import {
    Alert,
    Animated,
    BackHandler,
    Image,
    LayoutAnimation,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
interface CartItemCardProps {
  item: CartItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}
function CartItemCard({
  item,
  onIncrease,
  onDecrease,
  onRemove,
}: CartItemCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const quantityAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(quantityAnim, {
        toValue: 1.2,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(quantityAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [item.quantity, quantityAnim]);
  return (
    <Animated.View style={[styles.cartItem, { transform: [{ scale: scaleAnim }] }]}>
      <Image
        source={{ uri: item.product.image }}
        style={styles.itemImage}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.product.name}
        </Text>
        <Text style={styles.itemPrice}>
          ₹{item.product.price}
        </Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={onDecrease}
          >
            <Minus size={16} color={colors.primary} />
          </TouchableOpacity>
          <Animated.View style={{ transform: [{ scale: quantityAnim }] }}>
            <Text style={styles.quantityText}>{item.quantity}</Text>
          </Animated.View>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={onIncrease}
          >
            <Plus size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
        <Trash2 size={20} color={colors.danger} />
      </TouchableOpacity>
    </Animated.View>
  );
}
export default function CartScreen() {
  const router = useRouter();
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    getCartTotal,
    clearCart,
  } = useTechPhono();
  useEffect(() => {
    const backAction = () => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
      return true;
    };
    const handler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );
    return () => handler.remove();
  }, [router]);
  const handleBack = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };
  const handleGoToShop = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    router.push('/(tabs)/shop');
  };
  const increaseQty = (item: CartItem) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    updateCartQuantity(item.product.id, item.quantity + 1);
  };
  const decreaseQty = (item: CartItem) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (item.quantity <= 1) {
      removeFromCart(item.product.id);
      return;
    }
    updateCartQuantity(item.product.id, item.quantity - 1);
  };
  const handleCheckout = async () => {
    if (!cart.length) return;
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    try {
      await sendCartToWhatsApp(cart, getCartTotal());
      Alert.alert(
        'Order Sent',
        'Admin will contact you soon regarding the product.',
        [
          {
            text: 'OK',
            onPress: () => clearCart(),
          },
        ]
      );
    } catch {
      Alert.alert(
        'Error',
        'Unable to open WhatsApp. Please try again.'
      );
    }
  };
  if (cart.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.8}
          >
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.emptyCard}>
            <View style={styles.iconWrapper}>
              <ShoppingBag size={48} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptySubtitle}>
              Add products from the shop to get started
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              activeOpacity={0.85}
              onPress={handleGoToShop}
            >
              <Text style={styles.browseButtonText}>Browse Shop</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={handleBack}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Cart</Text>
          </View>
          <TouchableOpacity onPress={clearCart}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {cart.map((item) => (
            <CartItemCard
              key={item.product.id}
              item={item}
              onIncrease={() => increaseQty(item)}
              onDecrease={() => decreaseQty(item)}
              onRemove={() => removeFromCart(item.product.id)}
            />
          ))}
          <View style={{ height: 120 }} />
        </ScrollView>
        <View style={styles.checkoutContainer}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>
              ₹{getCartTotal().toFixed(2)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={handleCheckout}
            activeOpacity={0.9}
          >
            <Text style={styles.checkoutText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  clearText: {
    color: colors.danger,
    fontWeight: '600',
    fontSize: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
    marginBottom: spacing.xl,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.xxl,
    ...shadows.md,
  },
  iconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: (colors.primary + '15'),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  browseButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg,
    width: '100%',
    alignItems: 'center',
  },
  browseButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  contentContainer: {
    paddingBottom: spacing.xxl,
  },
  cartItem: {
    marginTop: 8,
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  itemInfo: { flex: 1 },
  itemName: {
    fontWeight: '600',
    fontSize: 15,
    color: colors.text,
    marginBottom: 4,
  },
  itemPrice: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border || '#e5e5e5',
  },
  quantityText: {
    fontWeight: '700',
    fontSize: 14,
    minWidth: 16,
    textAlign: 'center',
  },
  removeButton: {
    padding: 10,
  },
  checkoutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  totalLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  checkoutButton: {
    backgroundColor: '#25D366',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    ...shadows.md,
  },
  checkoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
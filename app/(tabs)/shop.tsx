import type { Product } from '@/constants/products';
import { borderRadius, colors, shadows, spacing } from '@/constants/theme';
import { useTechPhono } from '@/context/TechPhonoContext';
import { supabase } from '@/services/supabaseClient';
import type { CartItem } from '@/types/cart';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ArrowLeft, Minus, Plus } from 'lucide-react-native';
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
    View
} from 'react-native';
interface ProductCardProps {
    product: Product;
    quantity: number;
    onAdd: () => void;
    onIncrease: () => void;
    onDecrease: () => void;
}
function ProductCard({
    product,
    quantity,
    onAdd,
    onIncrease,
    onDecrease,
}: ProductCardProps) {
    const badgeAnim = useRef(new Animated.Value(0)).current;
    const quantityAnim = useRef(new Animated.Value(1)).current;
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
    return (
        <View style={styles.card}>
            <Image source={{ uri: product.image }} style={styles.productImage} />
            {quantity > 0 && (
                <Animated.View
                    style={[
                        styles.badge,
                        { transform: [{ scale: badgeAnim }], opacity: badgeAnim },
                    ]}
                >
                    <Text style={styles.badgeText}>{quantity}</Text>
                </Animated.View>
            )}
            <View style={styles.productInfo}>
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
                        <TouchableOpacity onPress={onDecrease} style={styles.ctrlBtn}>
                            <Minus size={14} color={colors.primary} />
                        </TouchableOpacity>
                        <Animated.Text
                            style={[
                                styles.quantityText,
                                { transform: [{ scale: quantityAnim }] },
                            ]}
                        >
                            {quantity}
                        </Animated.Text>
                        <TouchableOpacity onPress={onIncrease} style={styles.ctrlBtn}>
                            <Plus size={14} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={onAdd}
                        activeOpacity={0.8}
                    >
                        <Plus size={20} color="#fff" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}
export default function ShopScreen() {
    const router = useRouter();
    const { addToCart, cart, updateCartQuantity, removeFromCart } = useTechPhono();
    const [items, setItems] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetchItems();
    }, []);
    const fetchItems = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('items')
                .select('*')
                .eq('is_deleted', false)
                .order('created_at', { ascending: false });
            if (error) {
                console.error('Error fetching items:', error);
            } else {
                setItems(data || []);
            }
        } catch (err) {
            console.error('Unexpected error:', err);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        const backAction = () => {
            router.back();
            return true;
        };
        const handler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction
        );
        return () => handler.remove();
    }, [router]);
    const getQuantity = (productId: string) =>
        cart.find((i) => i.product.id === productId)?.quantity || 0;
    const add = (product: Product) => {
        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        addToCart({ product, quantity: 1 });
    };
    const increase = (item: CartItem) => {
        updateCartQuantity(item.product.id, item.quantity + 1);
    };
    const decrease = (item: CartItem) => {
        if (item.quantity <= 1) {
            removeFromCart(item.product.id);
            return;
        }
        updateCartQuantity(item.product.id, item.quantity - 1);
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
                    <Text style={styles.headerTitle}>Shop</Text>
                </View>
                <Text style={{ textAlign: 'center', marginTop: 40, color: colors.textSecondary }}>
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
                    style={({ pressed }) => [
                        styles.backButton,
                        pressed && { opacity: 0.6 },
                    ]}
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
                numColumns={2}
                columnWrapperStyle={{
                    justifyContent: 'space-between',
                    gap: spacing.md,
                    marginBottom: spacing.lg,
                }}
                contentContainerStyle={{
                    paddingBottom: 120,
                    paddingTop: spacing.sm,
                }}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: spacing.lg,
        paddingTop: Platform.OS === 'android' ? 40 : spacing.xl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.sm,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.text,
    },
    headerSubtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    card: {
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: borderRadius.lg,
        padding: 12,
        marginBottom: spacing.xs,
        ...shadows.sm,
        position: 'relative',
        maxWidth: '48%',
    },
    productImage: {
        width: '100%',
        height: 120,
        borderRadius: borderRadius.md,
        marginBottom: 8,
        backgroundColor: '#f0f0f0',
        resizeMode: 'contain',
    },
    productInfo: { flex: 1 },
    productName: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    productDescription: {
        color: colors.textSecondary,
        fontSize: 12,
        marginBottom: 12,
        height: 32,
    },
    productFooter: {
        marginTop: 'auto',
    },
    productPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.primary,
    },
    addButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: colors.primary,
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    quantityControl: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        padding: 2,
    },
    ctrlBtn: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
        backgroundColor: '#fff',
        elevation: 1,
    },
    quantityText: {
        fontWeight: '700',
        paddingHorizontal: 8,
        fontSize: 13,
    },
    badge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: colors.primary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        zIndex: 10,
    },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
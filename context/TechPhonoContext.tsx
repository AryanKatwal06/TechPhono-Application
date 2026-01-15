import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { Alert, Linking } from 'react-native';
import { supabase } from '@/services/supabaseClient';
import type { CartItem } from '@/types/cart';
import type { Repair } from '@/types/database';
const CART_STORAGE_KEY = '@techphono_cart';
const sendRepairToWhatsApp = (data: {
    jobId: string;
    name: string;
    phone: string;
    deviceType: string;
    model?: string;
    issue: string;
    service: string;
}) => {
    const adminNumber = '918527361011';
    const message = `
🛠 *New Repair Request*
🆔 Job ID: ${data.jobId}
👤 Name: ${data.name}
📞 Phone: ${data.phone}
📱 Device: ${data.deviceType}
📦 Model: ${data.model || 'N/A'}
🛠 Service: ${data.service}
❗ Issue: ${data.issue}
    `.trim();
    const url = `https://wa.me/${adminNumber}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() =>
        Alert.alert('Error', 'WhatsApp not installed')
    );
};
interface TechPhonoContextType {
    ready: boolean;
    cart: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (productId: string) => void;
    updateCartQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    getCartTotal: () => number;
    getCartCount: () => number;
    createRepair: (data: {
        name: string;
        phone: string;
        deviceType: string;
        model?: string;
        issue: string;
        service: string;
    }) => Promise<{ success: boolean; jobId?: string; error?: string }>;
    getRepairByJobId: (jobId: string) => Promise<Repair | null>;
    getRepairsByPhone: (phone: string) => Promise<Repair[]>;
    getAllRepairs: () => Promise<Repair[]>;
    updateRepairStatus: (
        id: string,
        status: Repair['status']
    ) => Promise<{ success: boolean; error?: string }>;
    updateAdminNotes: (
        id: string,
        notes: string
    ) => Promise<{ success: boolean; error?: string }>;
    submitFeedback: (
        id: string,
        rating: number,
        feedback: string
    ) => Promise<{ success: boolean; error?: string }>;
}
export const TechPhonoContext = createContext<TechPhonoContextType | null>(null);
export const useTechPhono = () => {
    const ctx = useContext(TechPhonoContext);
    if (!ctx) {
        throw new Error('useTechPhono must be used within TechPhonoProvider');
    }
    return ctx;
};
export const TechPhonoProvider = ({ children }: { children?: ReactNode }) => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [ready, setReady] = useState(false);
    const loadCart = useCallback(async () => {
        try {
            const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
            if (stored) {
                setCart(JSON.parse(stored));
            }
        } catch (err) {
            console.error('❌ Cart load failed:', err);
        } finally {
            setReady(true);
        }
    }, []);
    useEffect(() => {
        loadCart();
    }, [loadCart]);
    const persistCart = async (nextCart: CartItem[]) => {
        setCart(nextCart);
        try {
            await AsyncStorage.setItem(
                CART_STORAGE_KEY,
                JSON.stringify(nextCart)
            );
        } catch (err) {
            console.error('❌ Cart save failed:', err);
        }
    };
    const addToCart = (item: CartItem) => {
        const index = cart.findIndex(
            c => c.product.id === item.product.id
        );
        if (index >= 0) {
            const updated = [...cart];
            updated[index].quantity += item.quantity;
            persistCart(updated);
        } else {
            persistCart([...cart, item]);
        }
    };
    const removeFromCart = (productId: string) => {
        persistCart(cart.filter(i => i.product.id !== productId));
    };
    const updateCartQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        persistCart(
            cart.map(item =>
                item.product.id === productId
                    ? { ...item, quantity }
                    : item
            )
        );
    };
    const clearCart = () => persistCart([]);
    const getCartTotal = () =>
        cart.reduce(
            (sum, item) => sum + item.product.price * item.quantity,
            0
        );
    const getCartCount = () =>
        cart.reduce((count, item) => count + item.quantity, 0);
    const generateJobId = () =>
        Crypto.randomUUID().split('-')[0].toUpperCase();
    const createRepair = async (data: {
        name: string;
        phone: string;
        deviceType: string;
        model?: string;
        issue: string;
        service: string;
    }) => {
        try {
            if (!supabase) {
                return { success: false, error: 'Service unavailable' };
            }
            if (
                !data.name ||
                !data.phone ||
                !data.deviceType ||
                !data.issue ||
                !data.service
            ) {
                return { success: false, error: 'All fields are required' };
            }
            const jobId = generateJobId();
            const { error } = await supabase.from('repairs').insert({
                job_id: jobId,
                name: data.name.trim(),
                phone: data.phone.trim(),
                device_type: data.deviceType,
                model: data.model?.trim() || '',
                issue: data.issue.trim(),
                service: data.service.trim(),
                status: 'Pending',
                admin_notes: '', 
                rating: 0,
                feedback: '',
            } as any);
            if (error) return { success: false, error: error.message };
            sendRepairToWhatsApp({
                jobId,
                name: data.name,
                phone: data.phone,
                deviceType: data.deviceType,
                model: data.model,
                issue: data.issue,
                service: data.service,
            });
            return { success: true, jobId };
        } catch (err) {
            console.error('❌ Create repair failed:', err);
            return { success: false, error: 'Failed to create repair' };
        }
    };
    const safeFetch = async <T,>(
        fn: () => Promise<T>,
        fallback: T
    ): Promise<T> => {
        try {
            return await fn();
        } catch {
            return fallback;
        }
    };
    const getRepairByJobId = (jobId: string) =>
        safeFetch(async () => {
            if (!supabase) return null;
            const { data } = await supabase
                .from('repairs')
                .select('*')
                .eq('job_id', jobId)
                .single();
            return data ? (data as Repair) : null;
        }, null);
    const getRepairsByPhone = (phone: string) =>
        safeFetch(async () => {
            if (!supabase) return [];
            const { data } = await supabase
                .from('repairs')
                .select('*')
                .eq('phone', phone)
                .order('created_at', { ascending: false });
            return (data as Repair[]) || [];
        }, []);
    const getAllRepairs = () =>
        safeFetch(async () => {
            if (!supabase) return [];
            const { data } = await supabase
                .from('repairs')
                .select('*')
                .order('created_at', { ascending: false });
            return (data as Repair[]) || [];
        }, []);
    const updateRepairStatus = async (
        id: string,
        status: Repair['status']
    ) => {
        if (!supabase) return { success: false, error: 'Service unavailable' };
        const { error } = await (supabase as any)
            .from('repairs')
            .update({ status })
            .eq('id', id);
        return error
            ? { success: false, error: 'Failed to update status' }
            : { success: true };
    };
    const updateAdminNotes = async (id: string, notes: string) => {
        if (!supabase) return { success: false, error: 'Service unavailable' };
        const { error } = await (supabase as any)
            .from('repairs')
            .update({ admin_notes: notes })
            .eq('id', id);
        return error
            ? { success: false, error: 'Failed to update notes' }
            : { success: true };
    };
    const submitFeedback = async (
        id: string,
        rating: number,
        feedback: string
    ) => {
        if (!supabase) return { success: false, error: 'Service unavailable' };
        const { error } = await (supabase as any)
            .from('repairs')
            .update({ rating, feedback })
            .eq('id', id);
        return error
            ? { success: false, error: 'Failed to submit feedback' }
            : { success: true };
    };
    const value = useMemo(
        () => ({
            ready,
            cart,
            addToCart,
            removeFromCart,
            updateCartQuantity,
            clearCart,
            getCartTotal,
            getCartCount,
            createRepair,
            getRepairByJobId,
            getRepairsByPhone,
            getAllRepairs,
            updateRepairStatus,
            updateAdminNotes,
            submitFeedback,
        }),
        [cart, ready]
    );
    return (
        <TechPhonoContext.Provider value={value}>
            {children}
        </TechPhonoContext.Provider>
    );
};
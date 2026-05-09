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
import { SecurityConfig } from '@/config/security';
import { db } from '@/services/firebaseClient';
import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    updateDoc,
    query,
    where,
    orderBy,
    doc,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
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
    const adminNumber = SecurityConfig.whatsappNumber;
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

// Helper to convert Firestore doc to Repair type
const docToRepair = (docSnap: any): Repair => {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        job_id: data.job_id,
        name: data.name,
        phone: data.phone,
        device_type: data.device_type,
        model: data.model || null,
        issue: data.issue,
        service: data.service,
        status: data.status,
        created_at: data.created_at instanceof Timestamp
            ? data.created_at.toDate().toISOString()
            : data.created_at || new Date().toISOString(),
        admin_notes: data.admin_notes || null,
        rating: data.rating || null,
        feedback: data.feedback || null,
        is_deleted: data.is_deleted || false,
        deleted_at: data.deleted_at || null,
    };
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

            await addDoc(collection(db, 'repairs'), {
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
                is_deleted: false,
                deleted_at: null,
                created_at: serverTimestamp(),
            });

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
        } catch (err: any) {
            console.error('❌ Create repair failed:', err);
            return { success: false, error: err.message || 'Failed to create repair' };
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
            const q = query(
                collection(db, 'repairs'),
                where('job_id', '==', jobId)
            );
            const snapshot = await getDocs(q);
            if (snapshot.empty) return null;
            return docToRepair(snapshot.docs[0]);
        }, null);

    const getRepairsByPhone = (phone: string) =>
        safeFetch(async () => {
            const q = query(
                collection(db, 'repairs'),
                where('phone', '==', phone),
                orderBy('created_at', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(docToRepair);
        }, []);

    const getAllRepairs = () =>
        safeFetch(async () => {
            const q = query(
                collection(db, 'repairs'),
                orderBy('created_at', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(docToRepair);
        }, []);

    const updateRepairStatus = async (
        id: string,
        status: Repair['status']
    ) => {
        try {
            await updateDoc(doc(db, 'repairs', id), {
                status,
                updated_at: serverTimestamp()
            });
            return { success: true };
        } catch (error: any) {
            console.error('❌ Update status failed:', error);
            return { success: false, error: 'Failed to update status' };
        }
    };

    const updateAdminNotes = async (id: string, notes: string) => {
        try {
            await updateDoc(doc(db, 'repairs', id), {
                admin_notes: notes,
                updated_at: serverTimestamp()
            });
            return { success: true };
        } catch (error: any) {
            console.error('❌ Update notes failed:', error);
            return { success: false, error: 'Failed to update notes' };
        }
    };

    const submitFeedback = async (
        id: string,
        rating: number,
        feedback: string
    ) => {
        try {
            await updateDoc(doc(db, 'repairs', id), {
                rating,
                feedback,
                updated_at: serverTimestamp()
            });
            return { success: true };
        } catch (error: any) {
            console.error('❌ Submit feedback failed:', error);
            return { success: false, error: 'Failed to submit feedback' };
        }
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
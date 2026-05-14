import { db } from '@/services/firebaseClient';
import { collection, addDoc, getDocs, updateDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Stack, useRouter } from '@/navigation/router';
import { ArrowLeft, Trash2, Plus, Edit2, X, Check } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Haptics } from '@/utils/haptics';

type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  is_deleted: boolean;
  created_at: string;
};

export default function ManageServices() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'services'));
      const data = snapshot.docs
        .map(d => {
        const docData = d.data();
        return {
          id: d.id,
          name: docData.name,
          description: docData.description,
          price: docData.price,
          is_deleted: docData.is_deleted,
          created_at: docData.created_at instanceof Timestamp
            ? docData.created_at.toDate().toISOString()
            : docData.created_at || new Date().toISOString(),
        } as Service;
      })
        .filter(service => !service.is_deleted)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setServices(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchServices();
    setRefreshing(false);
  }, []);

  // ADD / UPDATE SERVICE
  async function saveService() {
    if (!name || !desc || !price) {
      Alert.alert('Missing fields', 'Please fill all fields');
      return;
    }

    setLoading(true);
    const serviceData = {
      name,
      description: desc,
      price: Number(price),
      is_deleted: false
    };

    try {
      if (editingId) {
        // Update existing
        await updateDoc(doc(db, 'services', editingId), {
          ...serviceData,
          updated_at: serverTimestamp()
        });
      } else {
        // Insert new
        await addDoc(collection(db, 'services'), {
          ...serviceData,
          created_at: serverTimestamp()
        });
      }

      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetForm();
      fetchServices();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  }

  // DELETE SERVICE (SOFT DELETE)
  async function deleteService(id: string) {
    Alert.alert('Delete Service', 'Are you sure? This will hide the service from users.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await updateDoc(doc(db, 'services', id), { is_deleted: true });
            fetchServices();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  }

  const resetForm = () => {
    setName('');
    setDesc('');
    setPrice('');
    setEditingId(null);
  };

  const startEdit = (item: Service) => {
    setName(item.name);
    setDesc(item.description);
    setPrice(item.price.toString());
    setEditingId(item.id);
  };

  const renderItem = ({ item }: { item: Service }) => (
    <View style={styles.listCard}>
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardDesc}>{item.description}</Text>
        <Text style={styles.cardPrice}>₹{item.price}</Text>
      </View>
      <View style={styles.actionColumn}>
        <TouchableOpacity onPress={() => startEdit(item)} style={styles.iconBtn}>
          <Edit2 size={18} color="#2563EB" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteService(item.id)} style={styles.iconBtn}>
          <Trash2 size={18} color="#ff3b30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Services</Text>
      </View>

      <View style={[styles.formCard, editingId && styles.formCardEdit]}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>{editingId ? 'Edit Service' : 'Add New Service'}</Text>
          {editingId && (
            <TouchableOpacity onPress={resetForm}>
              <X size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        <TextInput
          placeholder="Service name (e.g. Screen Replacement)"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <TextInput
          placeholder="One-line description"
          value={desc}
          onChangeText={setDesc}
          style={styles.input}
        />
        <TextInput
          placeholder="Price (₹)"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          style={styles.input}
        />

        <TouchableOpacity
          onPress={saveService}
          style={[styles.primaryBtn, editingId && { backgroundColor: '#059669' }]}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <View style={styles.btnContent}>
              {editingId ? <Check size={18} color="#fff" /> : <Plus size={18} color="#fff" />}
              <Text style={styles.btnText}>{editingId ? 'Update Service' : 'Add Service'}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={<Text style={styles.listHeader}>Active Services ({services.length})</Text>}
        ListEmptyComponent={!loading ? <Text style={styles.emptyText}>No services found</Text> : null}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  headerTitle: { fontSize: 22, fontWeight: '700', marginLeft: 12 },
  formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 24, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  formCardEdit: { borderWidth: 1.5, borderColor: '#059669' },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  formTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  input: { backgroundColor: '#F3F4F6', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  primaryBtn: { backgroundColor: '#2563EB', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 6 },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  listHeader: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12, textTransform: 'uppercase' },
  listCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: '#f0f0f0' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  cardDesc: { color: '#666', fontSize: 13, marginTop: 2 },
  cardPrice: { marginTop: 6, fontWeight: '700', color: '#059669', fontSize: 15 },
  actionColumn: { gap: 12 },
  iconBtn: { padding: 4 },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 40 }
});
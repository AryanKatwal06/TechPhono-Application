import { supabase } from '@/services/supabaseClient';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Trash2 } from 'lucide-react-native';
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
  View
} from 'react-native';
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
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  useEffect(() => {
    fetchServices();
  }, []);
  async function fetchServices() {
    setLoading(true);
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setServices(data || []);
    }
    setLoading(false);
  }
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchServices();
    setRefreshing(false);
  }, []);
  async function addService() {
    if (!name || !desc || !price) {
      Alert.alert('Missing fields', 'Please fill all fields');
      return;
    }
    setLoading(true);
    const { error } = await (supabase as any).from('services').insert({
      name,
      description: desc,
      price: Number(price),
      is_deleted: false
    });
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setName('');
      setDesc('');
      setPrice('');
      fetchServices();
      Alert.alert('Success', 'Service added successfully');
    }
    setLoading(false);
  }
  async function deleteService(id: string) {
    Alert.alert('Delete Service', 'Are you sure you want to remove this service?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await (supabase as any)
            .from('services')
            .update({ is_deleted: true }) 
            .eq('id', id);
          if (error) {
            Alert.alert('Error', error.message);
          } else {
            fetchServices();
          }
        },
      },
    ]);
  }
  const renderItem = ({ item }: { item: Service }) => {
    return (
      <View style={styles.listCard}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardDesc}>{item.description}</Text>
          <Text style={styles.cardPrice}>₹{item.price}</Text>
        </View>
        <TouchableOpacity onPress={() => deleteService(item.id)}>
          <Trash2 size={22} color="#ff3b30" />
        </TouchableOpacity>
      </View>
    );
  };
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Manage Services
        </Text>
      </View>
      <View style={styles.formCard}>
        <TextInput 
          placeholder="Service name" 
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
          onPress={addService} 
          style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
          disabled={loading}
        >
          {loading && !refreshing ? (
             <ActivityIndicator color="#fff" size="small" />
          ) : (
             <Text style={styles.btnText}>Add Service</Text>
          )}
        </TouchableOpacity>
      </View>
      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>No services found</Text>
          ) : null
        }
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
  },
  formCard: {
    backgroundColor: '#F6F8FA',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  primaryBtn: {
    backgroundColor: '#2563EB',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  listCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  cardDesc: {
    color: '#666',
    fontSize: 13,
    marginTop: 2,
  },
  cardPrice: {
    marginTop: 6,
    fontWeight: '600',
    color: '#16a34a',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 40,
  },
});
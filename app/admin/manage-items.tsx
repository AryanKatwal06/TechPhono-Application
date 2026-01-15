import { supabase } from '@/services/supabaseClient';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Image as ImageIcon, Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
type Item = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  is_deleted: boolean;
  created_at: string;
};
export default function ManageItems() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    fetchItems();
  }, []);
  async function fetchItems() {
    setLoading(true);
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });
    if (error) {
      Alert.alert('Error fetching items', error.message);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  }
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  }, []);
  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  }
  async function addItem() {
    if (!name || !price || !image) {
      Alert.alert('Missing fields', 'Please provide a name, price, and image.');
      return;
    }
    setUploading(true);
    let publicUrl = null;
    try {
      const response = await fetch(image);
      const arrayBuffer = await response.arrayBuffer();
      const fileExt = image.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${Date.now()}.${fileExt}`;
      const contentType = `image/${fileExt === 'png' ? 'png' : 'jpeg'}`;
      const { error: uploadError } = await supabase.storage
        .from('items')
        .upload(fileName, arrayBuffer, {
          contentType: contentType,
        });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage
        .from('items')
        .getPublicUrl(fileName);
      publicUrl = data.publicUrl;
      const { error: insertError } = await (supabase as any).from('items').insert({
        name,
        description: desc,
        price: Number(price),
        image_url: publicUrl,
        is_deleted: false
      });
      if (insertError) throw insertError;
      setName('');
      setDesc('');
      setPrice('');
      setImage(null);
      fetchItems();
      Alert.alert('Success', 'Item added successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add item');
    } finally {
      setUploading(false);
    }
  }
  async function deleteItem(id: string) {
    Alert.alert('Delete Item', 'Are you sure you want to remove this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await (supabase as any)
            .from('items')
            .update({ is_deleted: true })
            .eq('id', id);
          if (error) Alert.alert('Error', error.message);
          else fetchItems();
        },
      },
    ]);
  }
  const renderItem = ({ item }: { item: Item }) => {
    return (
      <View style={styles.listCard}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.itemImage} />
        ) : (
          <View style={[styles.itemImage, { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }]}>
            <ImageIcon size={20} color="#ccc" />
          </View>
        )}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
          <Text style={styles.cardPrice}>₹{item.price}</Text>
        </View>
        <TouchableOpacity onPress={() => deleteItem(item.id)}>
          <Trash2 size={20} color="#ff3b30" />
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
          Manage Items
        </Text>
      </View>
      <View style={styles.formCard}>
        <TextInput 
          placeholder="Item name" 
          value={name} 
          onChangeText={setName} 
          style={styles.input} 
        />
        <TextInput 
          placeholder="Short description" 
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
        <TouchableOpacity onPress={pickImage} style={styles.imageBtn}>
          <ImageIcon size={20} color="#4B5563" />
          <Text style={styles.imageBtnText}>
            {image ? 'Change Image' : 'Pick Image'}
          </Text>
        </TouchableOpacity>
        {image && (
          <Image source={{ uri: image }} style={styles.previewImage} />
        )}
        <TouchableOpacity 
          onPress={addItem} 
          style={[styles.primaryBtn, uploading && { opacity: 0.7 }]}
          disabled={uploading}
        >
          {uploading ? (
             <ActivityIndicator color="#fff" size="small" />
          ) : (
             <Text style={styles.btnText}>Add Item</Text>
          )}
        </TouchableOpacity>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading ? <Text style={styles.emptyText}>No items found</Text> : null
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
  imageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  imageBtnText: {
    marginLeft: 8,
    fontWeight: '600',
    color: '#374151',
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
    resizeMode: 'cover',
  },
  primaryBtn: {
    backgroundColor: '#2563EB',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
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
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
  },
  cardTitle: {
    fontWeight: '600',
    fontSize: 16,
    color: '#111',
  },
  cardDesc: {
    color: '#666',
    fontSize: 13,
    marginVertical: 2,
  },
  cardPrice: {
    fontWeight: '600',
    color: '#16a34a',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
  },
});
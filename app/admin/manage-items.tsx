import { supabase } from '@/services/supabaseClient';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Image as ImageIcon, Trash2, Crop } from 'lucide-react-native';
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

// Define the asset type since expo-image-picker doesn't export it properly
type ImageAsset = {
  uri: string;
  base64?: string;
  width?: number;
  height?: number;
  mimeType?: string;
};

type Item = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
};

export default function ManageItems() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState<ImageAsset | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('is_active', true)
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

  const resetForm = () => {
    setName('');
    setDesc('');
    setPrice('');
    setImage(null);
  };

  const pickImage = async () => {
    try {
      // Request camera roll permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to select an image');
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        base64: true,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (pickerResult.canceled) return;

      const asset = pickerResult.assets[0];
      const imageAsset: ImageAsset = {
        uri: asset.uri,
        base64: asset.base64 || undefined,
        width: asset.width,
        height: asset.height,
        mimeType: asset.mimeType || undefined,
      };

      setImage(imageAsset);
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async () => {
    if (!image?.base64) throw new Error('No image selected');

    const fileName = `item-${Date.now()}.jpg`;

    const { error } = await supabase.storage
      .from('items')
      .upload(fileName, decode(image.base64), {
        contentType: 'image/jpeg',
      });

    if (error) {
      console.error('Image upload error:', error);
      throw error;
    }

    const { data } = supabase.storage
      .from('items')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleAddItem = async () => {
    if (!name || !price || !image) {
      Alert.alert('Missing fields', 'Please provide name, price, and image');
      return;
    }

    try {
      setUploading(true);

      const imageUrl = await uploadImage();

      const { error } = await supabase.from('items').insert({
        name,
        description: desc,
        price: parseFloat(price),
        image_url: imageUrl,
        is_active: true
      });

      if (error) throw error;

      Alert.alert('Success', 'Item added successfully');
      resetForm();
      fetchItems();

    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setUploading(false);
    }
  };

  async function deleteItem(id: string) {
    Alert.alert('Delete Item', 'Are you sure you want to remove this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('items')
            .update({ is_active: false })
            .eq('id', id);

          if (error) {
            Alert.alert('Error', error.message);
          } else {
            fetchItems(); 
          }
        },
      },
    ]);
  }

  const renderItem = ({ item }: { item: Item }) => {
    return (
      <View style={styles.listCard}>
        {item.image_url ? (
          <Image 
            source={{ uri: item.image_url }} 
            style={styles.itemImage}
            resizeMode="cover" 
          />
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
          <Crop size={20} color="#4B5563" />
          <Text style={styles.imageBtnText}>
            {image ? 'Change Image' : 'Pick & Crop Image'}
          </Text>
        </TouchableOpacity>

        {image && (
          <View style={styles.imagePreviewContainer}>
            <Image 
              source={{ uri: image.uri }} 
              style={styles.previewImage} 
            />
            <Text style={styles.imageInfoText}>
              1:1 Ratio • {image.width}x{image.height}px
            </Text>
          </View>
        )}

        <TouchableOpacity 
          onPress={handleAddItem} 
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
    height: 200,
    borderRadius: 10,
    marginBottom: 8,
    resizeMode: 'cover',
    backgroundColor: '#f3f4f6',
  },
  imagePreviewContainer: {
    marginBottom: 10,
  },
  imageInfoText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
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
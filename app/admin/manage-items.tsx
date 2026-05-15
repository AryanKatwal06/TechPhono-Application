import { db } from '@/services/firebaseClient';
import { collection, addDoc, getDocs, updateDoc, doc, query, where, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { SecurityConfig } from '@/config/security';
import { Stack, useRouter } from '@/navigation/router';
import { ArrowLeft, Image as ImageIcon, Trash2, Crop } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAlert } from '@/context/AlertContext';
import { CameraUtils } from '@/utils/cameraUtils';
import typography from '@/constants/typography';

// Define the asset type returned by the native image picker wrapper.
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
  const alert = useAlert();
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
    try {
      const q = query(
        collection(db, 'items'),
        where('is_active', '==', true),
        orderBy('created_at', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => {
        const docData = d.data();
        return {
          id: d.id,
          name: docData.name,
          description: docData.description,
          price: docData.price,
          image_url: docData.image_url || null,
          is_active: docData.is_active,
          created_at: docData.created_at instanceof Timestamp
            ? docData.created_at.toDate().toISOString()
            : docData.created_at || new Date().toISOString(),
        } as Item;
      });
      setItems(data);
    } catch (error: any) {
      alert.error('Error fetching items', error.message);
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
      const pickerResult = await CameraUtils.launchImageLibrary({
        includeBase64: true,
        quality: 0.8,
        selectionLimit: 1,
      });

      if (pickerResult.canceled || !pickerResult.assets?.length) return;

      const asset = pickerResult.assets[0];
      if (!asset.uri) {
        alert.error('Error', 'Selected image is missing a valid URI');
        return;
      }

      const imageAsset: ImageAsset = {
        uri: asset.uri,
        base64: asset.base64 || undefined,
        width: asset.width,
        height: asset.height,
        mimeType: asset.type || undefined,
      };

      setImage(imageAsset);
    } catch (error) {
      console.error('Error picking image:', error);
      alert.error('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (): Promise<string> => {
    if (!image?.uri) throw new Error('No image selected');

    const cloudName = SecurityConfig.cloudinaryCloudName;
    const uploadPreset = SecurityConfig.cloudinaryUploadPreset;

    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary is not configured. Please update config/publicConfig.ts with your cloud name and upload preset');
    }

    const formData = new FormData();
    formData.append('file', {
      uri: image.uri,
      type: image.mimeType || 'image/jpeg',
      name: `item-${Date.now()}.jpg`,
    } as any);
    formData.append('upload_preset', uploadPreset);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || 'Image upload failed');
    }

    const data = await response.json();
    return data.secure_url;
  };

  const handleAddItem = async () => {
    if (!name || !price || !image) {
      alert.error('Missing fields', 'Please provide name, price, and image');
      return;
    }

    try {
      setUploading(true);

      const imageUrl = await uploadImage();

      await addDoc(collection(db, 'items'), {
        name,
        description: desc,
        price: parseFloat(price),
        image_url: imageUrl,
        is_active: true,
        is_deleted: false,
        created_at: serverTimestamp(),
      });

      alert.success('Success', 'Item added successfully');
      resetForm();
      fetchItems();

    } catch (err: any) {
      alert.error('Error', err.message || 'Something went wrong');
    } finally {
      setUploading(false);
    }
  };

  async function deleteItem(id: string) {
    alert.confirm(
      'Delete Item',
      'Are you sure you want to remove this item?',
      async () => {
        try {
          await updateDoc(doc(db, 'items', id), { is_active: false });
          fetchItems();
        } catch (error: any) {
          alert.error('Error', error.message);
        }
      }
    );
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
          placeholderTextColor="#9CA3AF"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <TextInput
          placeholder="Short description"
          placeholderTextColor="#9CA3AF"
          value={desc}
          onChangeText={setDesc}
          style={styles.input}
        />
        <TextInput
          placeholder="Price (₹)"
          placeholderTextColor="#9CA3AF"
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
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  headerTitle: { fontSize: typography.h3.mobile.fontSize, lineHeight: typography.h3.mobile.lineHeight, fontWeight: typography.h3.mobile.fontWeight, fontFamily: typography.h3.mobile.fontFamily, marginLeft: 12, color: '#111' },
  formCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 20 },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB', color: '#111', fontSize: typography.inputText.mobile.fontSize, fontFamily: typography.inputText.mobile.fontFamily },
  imageBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E5E7EB', padding: 12, borderRadius: 10, marginBottom: 10 },
  imageBtnText: { marginLeft: 8, fontWeight: '600', color: '#374151', fontSize: typography.label.mobile.fontSize, fontFamily: typography.label.mobile.fontFamily },
  previewImage: { width: '100%', height: 200, borderRadius: 10, marginBottom: 8, resizeMode: 'cover', backgroundColor: '#f3f4f6' },
  imagePreviewContainer: { marginBottom: 10 },
  imageInfoText: { fontSize: typography.caption.mobile.fontSize, color: '#6b7280', textAlign: 'center', fontStyle: 'italic' },
  primaryBtn: { backgroundColor: '#2563EB', padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: typography.buttonText.mobile.fontSize, fontFamily: typography.buttonText.mobile.fontFamily },
  listCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 14, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2, borderWidth: 1, borderColor: '#f0f0f0' },
  itemImage: { width: 60, height: 60, borderRadius: 10, backgroundColor: '#f3f4f6' },
  cardTitle: { fontWeight: typography.h4.mobile.fontWeight, fontSize: typography.h4.mobile.fontSize, color: '#111', fontFamily: typography.h4.mobile.fontFamily },
  cardDesc: { color: '#666', fontSize: typography.caption.mobile.fontSize, marginVertical: 2, fontFamily: typography.caption.mobile.fontFamily },
  cardPrice: { fontWeight: typography.body.mobile.fontWeight, color: '#16a34a', fontSize: typography.body.mobile.fontSize, fontFamily: typography.body.mobile.fontFamily },
  emptyText: { textAlign: 'center', color: '#6b7280', marginTop: 20, fontSize: typography.bodySmall.mobile.fontSize, fontFamily: typography.bodySmall.mobile.fontFamily },
});
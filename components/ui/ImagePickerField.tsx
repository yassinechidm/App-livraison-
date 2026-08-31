import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/Colors';

const PRESET_FOOD_IMAGES = [
  {
    name: 'Shawarma',
    emoji: '🌯',
    url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Tacos',
    emoji: '🌮',
    url: 'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Burger',
    emoji: '🍔',
    url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Pizza',
    emoji: '🍕',
    url: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Pasticcio',
    emoji: '🍝',
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Box & Frites',
    emoji: '🍟',
    url: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Boisson',
    emoji: '🥤',
    url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Dessert',
    emoji: '🍰',
    url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&auto=format&fit=crop&q=80',
  },
];

interface ImagePickerFieldProps {
  label: string;
  value: string;
  onChangeImage: (urlOrBase64: string) => void;
}

export default function ImagePickerField({
  label,
  value,
  onChangeImage,
}: ImagePickerFieldProps) {
  const handlePickFile = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              onChangeImage(reader.result);
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission requise pour accéder à vos photos');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        onChangeImage(result.assets[0].uri);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      {/* Live Preview & Upload Button Row */}
      <View style={styles.previewRow}>
        {value ? (
          <View style={styles.previewWrapper}>
            <Image
              source={{ uri: value }}
              style={styles.previewImage}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => onChangeImage('')}
              activeOpacity={0.8}
            >
              <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeholderWrapper}>
            <Text style={styles.placeholderIcon}>📷</Text>
            <Text style={styles.placeholderText}>Aucune image</Text>
          </View>
        )}

        <View style={styles.uploadButtonsGroup}>
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={handlePickFile}
            activeOpacity={0.8}
          >
            <Text style={styles.uploadBtnText}>📁 Choisir un fichier</Text>
          </TouchableOpacity>
          <Text style={styles.uploadHint}>
            JPG, PNG ou GIF depuis votre PC/téléphone
          </Text>
        </View>
      </View>

      {/* Preset Suggestions */}
      <Text style={styles.presetLabel}>✨ Suggestions rapides :</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.presetsScroll}
      >
        {PRESET_FOOD_IMAGES.map((preset) => (
          <TouchableOpacity
            key={preset.name}
            style={[
              styles.presetChip,
              value === preset.url && styles.presetChipActive,
            ]}
            onPress={() => onChangeImage(preset.url)}
            activeOpacity={0.7}
          >
            <Text style={styles.presetEmoji}>{preset.emoji}</Text>
            <Text
              style={[
                styles.presetName,
                value === preset.url && styles.presetNameActive,
              ]}
            >
              {preset.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  previewWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  placeholderWrapper: {
    width: 80,
    height: 80,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  placeholderIcon: {
    fontSize: 24,
  },
  placeholderText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
    marginTop: 2,
  },
  uploadButtonsGroup: {
    flex: 1,
  },
  uploadBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 6,
  },
  uploadBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  uploadHint: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  presetLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  presetsScroll: {
    gap: 8,
    paddingBottom: 10,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipActive: {
    backgroundColor: '#EBF2FF',
    borderColor: Colors.primary,
  },
  presetEmoji: {
    fontSize: 14,
  },
  presetName: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  presetNameActive: {
    color: Colors.primary,
  },
});

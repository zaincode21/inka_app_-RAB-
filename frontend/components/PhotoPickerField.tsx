import { Alert, Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { resolveMediaUrl } from '../data/apiClient';
import { uploadAttachment, type AttachmentOwnerType } from '../data/farmDatabase';

type Props = {
  label?: string;
  value: string;
  onChange: (uri: string) => void;
  ownerType: AttachmentOwnerType;
  cattleId?: string;
  healthEventId?: string;
  transactionId?: string;
  milkRecordId?: string;
  attachmentLabel?: string;
  /** When true, keep a local URI until the parent uploads (e.g. receipts after create). */
  deferUpload?: boolean;
};

export function PhotoPickerField({
  label = 'Photo',
  value,
  onChange,
  ownerType,
  cattleId,
  healthEventId,
  transactionId,
  milkRecordId,
  attachmentLabel,
  deferUpload = false,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const preview = resolveMediaUrl(value) || value;

  const pickAndUpload = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Allow photo library access to attach an image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (result.canceled || !result.assets?.[0]?.uri) {
        return;
      }

      const asset = result.assets[0];
      if (deferUpload) {
        onChange(asset.uri);
        return;
      }

      setUploading(true);
      const uploaded = await uploadAttachment({
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
        ownerType,
        cattleId,
        healthEventId,
        transactionId,
        milkRecordId,
        label: attachmentLabel,
      });
      onChange(uploaded.uri);
    } catch (error) {
      Alert.alert('Could not upload photo', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View className="mb-3">
      {label ? <Text className="mb-2 text-[14px] font-semibold text-[#6B7280]">{label}</Text> : null}
      <Pressable
        onPress={() => void pickAndUpload()}
        disabled={uploading}
        className="h-36 items-center justify-center overflow-hidden rounded-[18px] border-2 border-dashed border-[#B7D9D9] bg-[#F5FBFB]"
      >
        {preview ? (
          <Image source={{ uri: preview }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <>
            <Feather name="camera" size={24} color="#008B8B" />
            <Text className="mt-2 text-[12px] text-[#008B8B]">{uploading ? 'Uploading...' : 'Tap to add photo'}</Text>
          </>
        )}
      </Pressable>
      {preview ? (
        <Pressable onPress={() => onChange('')} className="mt-2 self-start">
          <Text className="text-[13px] font-semibold text-[#DC2626]">Remove photo</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

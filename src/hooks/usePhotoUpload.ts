import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../services/supabase/client';
import { useAuth } from './useAuth';

export function usePhotoUpload() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const uploadPhoto = async (uri: string): Promise<{ url: string | null; error: Error | null }> => {
    if (!user) {
      return { url: null, error: new Error('No user logged in') };
    }

    try {
      setUploading(true);
      console.log('[usePhotoUpload] Starting upload for URI:', uri);

      // For web, convert the blob URL to a file
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Create a unique filename
      const fileExt = blob.type.split('/')[1] || 'jpg';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('[usePhotoUpload] Uploading to:', filePath);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, blob, {
          contentType: blob.type,
          upsert: false,
        });

      if (error) {
        console.error('[usePhotoUpload] Upload error:', error);
        return { url: null, error };
      }

      console.log('[usePhotoUpload] Upload successful:', data);

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      console.log('[usePhotoUpload] Public URL:', publicUrl);

      return { url: publicUrl, error: null };
    } catch (error) {
      console.error('[usePhotoUpload] Unexpected error:', error);
      return { url: null, error: error as Error };
    } finally {
      setUploading(false);
    }
  };

  const pickAndUploadPhoto = async (): Promise<{ url: string | null; error: Error | null }> => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        return { url: null, error: new Error('Camera roll permission denied') };
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) {
        return { url: null, error: null };
      }

      // Upload the selected photo
      return await uploadPhoto(result.assets[0].uri);
    } catch (error) {
      console.error('[usePhotoUpload] Pick and upload error:', error);
      return { url: null, error: error as Error };
    }
  };

  return {
    uploadPhoto,
    pickAndUploadPhoto,
    uploading,
  };
}

import { useState } from 'react';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
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
      console.log('[usePhotoUpload] Platform:', Platform.OS);

      let fileData: ArrayBuffer | Blob;
      let contentType = 'image/jpeg';
      let fileExt = 'jpg';

      if (Platform.OS === 'web') {
        // For web, convert the blob URL to a file
        const response = await fetch(uri);
        const blob = await response.blob();
        fileData = blob;
        contentType = blob.type || 'image/jpeg';
        fileExt = contentType.split('/')[1] || 'jpg';
      } else {
        // For mobile (Android/iOS), use FileSystem to read the file as base64
        console.log('[usePhotoUpload] Reading file on mobile...');
        
        // Get file extension from URI
        const uriParts = uri.split('.');
        fileExt = uriParts[uriParts.length - 1]?.toLowerCase() || 'jpg';
        
        // Determine content type
        if (fileExt === 'png') {
          contentType = 'image/png';
        } else if (fileExt === 'gif') {
          contentType = 'image/gif';
        } else if (fileExt === 'webp') {
          contentType = 'image/webp';
        } else {
          contentType = 'image/jpeg';
          fileExt = 'jpg';
        }

        // Read file as base64
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64',
        });
        
        console.log('[usePhotoUpload] File read successfully, base64 length:', base64.length);
        
        // Convert base64 to ArrayBuffer
        fileData = decode(base64);
      }
      
      // Create a unique filename
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('[usePhotoUpload] Uploading to:', filePath, 'Content-Type:', contentType);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, fileData, {
          contentType,
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

      // Pick image - no editing for faster experience
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
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

  const takeAndUploadPhoto = async (): Promise<{ url: string | null; error: Error | null }> => {
    try {
      // Check if camera is available (not available on simulator)
      const cameraAvailable = await ImagePicker.getCameraPermissionsAsync();
      
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        return { url: null, error: new Error('Camera permission denied') };
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled) {
        return { url: null, error: null };
      }

      // Upload the captured photo
      return await uploadPhoto(result.assets[0].uri);
    } catch (error: any) {
      console.error('[usePhotoUpload] Take and upload error:', error);
      // Handle simulator case
      if (error?.message?.includes('simulator') || error?.message?.includes('Camera not available')) {
        return { url: null, error: new Error('Camera is not available on the simulator. Please use a real device.') };
      }
      return { url: null, error: error as Error };
    }
  };

  // Pick photo without uploading (for preview)
  const pickPhoto = async (): Promise<{ uri: string | null; error: Error | null }> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        return { uri: null, error: new Error('Camera roll permission denied') };
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled) {
        return { uri: null, error: null };
      }

      return { uri: result.assets[0].uri, error: null };
    } catch (error) {
      console.error('[usePhotoUpload] Pick photo error:', error);
      return { uri: null, error: error as Error };
    }
  };

  // Take photo without uploading (for preview)
  const takePhoto = async (): Promise<{ uri: string | null; error: Error | null }> => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        return { uri: null, error: new Error('Camera permission denied') };
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled) {
        return { uri: null, error: null };
      }

      return { uri: result.assets[0].uri, error: null };
    } catch (error: any) {
      console.error('[usePhotoUpload] Take photo error:', error);
      if (error?.message?.includes('simulator') || error?.message?.includes('Camera not available')) {
        return { uri: null, error: new Error('Camera is not available on the simulator. Please use a real device.') };
      }
      return { uri: null, error: error as Error };
    }
  };

  return {
    uploadPhoto,
    pickAndUploadPhoto,
    takeAndUploadPhoto,
    pickPhoto,
    takePhoto,
    uploading,
  };
}

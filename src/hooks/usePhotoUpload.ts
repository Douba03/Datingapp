import { useState } from 'react';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../services/supabase/client';

export function usePhotoUpload() {
  const [uploading, setUploading] = useState(false);

  const uploadPhoto = async (uri: string): Promise<{ url: string | null; error: Error | null }> => {
    console.log('[usePhotoUpload] Checking user status...');
    
    // Try to get user from session first (faster), then fall back to getUser
    let user: any = null;
    
    try {
      // First try getSession (faster, cached) with timeout
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session timeout')), 5000)
      );
      
      try {
        const { data: sessionData } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        user = sessionData?.session?.user;
        console.log('[usePhotoUpload] Session user found:', !!user);
      } catch (sessionErr) {
        console.warn('[usePhotoUpload] Session fetch failed/timeout:', sessionErr);
      }
      
      // If no session user, try getUser with timeout
      if (!user) {
        console.log('[usePhotoUpload] Trying getUser...');
        const getUserPromise = supabase.auth.getUser();
        const getUserTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('getUser timeout')), 5000)
        );
        
        try {
          const { data: userData, error: authError } = await Promise.race([getUserPromise, getUserTimeout]) as any;
          user = userData?.user;
          if (authError) {
            console.warn('[usePhotoUpload] getUser error:', authError.message);
          }
          console.log('[usePhotoUpload] getUser result:', !!user);
        } catch (getUserErr) {
          console.warn('[usePhotoUpload] getUser failed/timeout:', getUserErr);
        }
      }
    } catch (err) {
      console.error('[usePhotoUpload] Error getting user:', err);
    }
    
    console.log('[usePhotoUpload] Final user check - exists:', !!user);
    if (user) {
      console.log('[usePhotoUpload] User ID:', user.id);
      console.log('[usePhotoUpload] User email:', user.email);
    }
    
    if (!user) {
      console.error('[usePhotoUpload] ❌ NO USER LOGGED IN!');
      return { url: null, error: new Error('No user logged in. Please sign in again.') };
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
        console.log('[usePhotoUpload] WEB: Fetching blob from URI...');
        const response = await fetch(uri);
        console.log('[usePhotoUpload] WEB: Fetch response status:', response.status);
        
        const blob = await response.blob();
        console.log('[usePhotoUpload] WEB: Blob created:', {
          size: blob.size,
          type: blob.type
        });
        
        fileData = blob;
        contentType = blob.type || 'image/jpeg';
        fileExt = contentType.split('/')[1] || 'jpg';
        
        console.log('[usePhotoUpload] WEB: File details:', {
          contentType,
          fileExt,
          blobSize: blob.size
        });
      } else {
        // For mobile (Android/iOS), use FileSystem to read the file as base64
        console.log('[usePhotoUpload] Reading file on mobile...');
        console.log('[usePhotoUpload] Original URI:', uri);
        
        // Get file extension from URI
        const uriParts = uri.split('.');
        fileExt = uriParts[uriParts.length - 1]?.toLowerCase() || 'jpg';
        
        // Handle HEIC/HEIF files (common on iOS)
        if (fileExt === 'heic' || fileExt === 'heif') {
          contentType = 'image/heic';
          // Keep as heic, Supabase should handle it
        } else if (fileExt === 'png') {
          contentType = 'image/png';
        } else if (fileExt === 'gif') {
          contentType = 'image/gif';
        } else if (fileExt === 'webp') {
          contentType = 'image/webp';
        } else {
          contentType = 'image/jpeg';
          fileExt = 'jpg';
        }

        console.log('[usePhotoUpload] File extension:', fileExt);
        console.log('[usePhotoUpload] Content type:', contentType);

        // Read file as base64
        try {
          console.log('[usePhotoUpload] Reading file as base64...');
          const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: 'base64',
          });
          
          console.log('[usePhotoUpload] ✅ File read successfully, base64 length:', base64.length);
          
          // Convert base64 to ArrayBuffer
          fileData = decode(base64);
          console.log('[usePhotoUpload] ✅ Base64 decoded to ArrayBuffer');
        } catch (readError: any) {
          console.error('[usePhotoUpload] ❌ Error reading file:', readError);
          console.error('[usePhotoUpload] Error message:', readError?.message);
          console.error('[usePhotoUpload] Error code:', readError?.code);
          throw new Error(`Failed to read image file: ${readError?.message || 'Unknown error'}`);
        }
      }
      
      // Create a unique filename
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('[usePhotoUpload] Uploading to:', filePath, 'Content-Type:', contentType);
      console.log('[usePhotoUpload] User ID:', user.id);
      console.log('[usePhotoUpload] File data type:', typeof fileData);
      console.log('[usePhotoUpload] File data is Blob:', fileData instanceof Blob);

      // Upload to Supabase Storage with timeout
      console.log('[usePhotoUpload] Calling supabase.storage.upload...');
      
      const uploadPromise = supabase.storage
        .from('profile-pictures')
        .upload(filePath, fileData, {
          contentType,
          upsert: false,
        });
      
      const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
        setTimeout(() => resolve({ 
          data: null, 
          error: new Error('Upload timeout - please try again') 
        }), 30000) // 30 second timeout
      );
      
      const { data, error } = await Promise.race([uploadPromise, timeoutPromise]);

      console.log('[usePhotoUpload] Upload response received');
      console.log('[usePhotoUpload] Has data:', !!data);
      console.log('[usePhotoUpload] Has error:', !!error);

      if (error) {
        console.error('[usePhotoUpload] ❌ Upload error:', error);
        console.error('[usePhotoUpload] Error details:', JSON.stringify(error, null, 2));
        return { url: null, error };
      }

      console.log('[usePhotoUpload] ✅ Upload successful:', data);

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
      console.log('========================================');
      console.log('[usePhotoUpload] 📸 PICK AND UPLOAD STARTED');
      console.log('========================================');
      
      // Request permissions
      console.log('[usePhotoUpload] Step 1: Requesting permissions...');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('[usePhotoUpload] Permission status:', status);
      
      if (status !== 'granted') {
        console.error('[usePhotoUpload] ❌ Permission denied');
        return { url: null, error: new Error('Camera roll permission denied') };
      }

      // Pick image - no editing for faster experience
      console.log('[usePhotoUpload] Step 2: Launching image picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      console.log('[usePhotoUpload] Picker result:', {
        canceled: result.canceled,
        hasAssets: !!result.assets,
        assetCount: result.assets?.length
      });

      if (result.canceled) {
        console.log('[usePhotoUpload] User canceled picker');
        return { url: null, error: null };
      }

      console.log('[usePhotoUpload] Step 3: Uploading selected photo...');
      console.log('[usePhotoUpload] Photo URI:', result.assets[0].uri);
      console.log('[usePhotoUpload] Photo details:', {
        uri: result.assets[0].uri,
        width: result.assets[0].width,
        height: result.assets[0].height,
        type: result.assets[0].type,
        fileSize: result.assets[0].fileSize,
        fileName: result.assets[0].fileName,
      });
      
      // Upload the selected photo
      const uploadResult = await uploadPhoto(result.assets[0].uri);
      
      console.log('[usePhotoUpload] Upload result:', {
        hasUrl: !!uploadResult.url,
        hasError: !!uploadResult.error,
        url: uploadResult.url,
        error: uploadResult.error?.message
      });
      console.log('========================================');
      
      return uploadResult;
    } catch (error) {
      console.error('========================================');
      console.error('[usePhotoUpload] ❌ Pick and upload error:', error);
      console.error('========================================');
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

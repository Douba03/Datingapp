#!/usr/bin/env node

// Test Supabase Storage Upload
// Run with: node test-storage-upload.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://zfnwtnqwokwvuxxwxgsr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmbnd0bnF3b2t3dnV4eHd4Z3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzgwNTUsImV4cCI6MjA3MzUxNDA1NX0.Q9MA7FNex8ZrJ_V9wux4OwrvKhsKGjZfxsf0qH-yz4Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStorageUpload() {
  console.log('🧪 Testing Supabase Storage Upload...\n');

  try {
    // 1. Check if storage bucket exists and is accessible
    console.log('1. Checking storage bucket...');
    
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }

    console.log('✅ Available buckets:', buckets.map(b => b.name).join(', '));
    
    const profilePicturesBucket = buckets.find(b => b.name === 'profile-pictures');
    if (!profilePicturesBucket) {
      console.log('❌ "profile-pictures" bucket not found!');
      console.log('   Available buckets:', buckets.map(b => b.name));
      console.log('   Please create the bucket first.');
      return;
    }

    console.log('✅ "profile-pictures" bucket exists');
    console.log('   Public:', profilePicturesBucket.public);

    // 2. Try to list files in the bucket
    console.log('\n2. Listing files in bucket...');
    
    const { data: files, error: listError } = await supabase
      .storage
      .from('profile-pictures')
      .list('profile-photos', {
        limit: 10,
        offset: 0,
      });

    if (listError) {
      console.error('❌ Error listing files:', listError);
    } else {
      console.log('✅ Can list files in bucket');
      console.log(`   Found ${files?.length || 0} files`);
      if (files && files.length > 0) {
        files.forEach(file => {
          console.log(`   - ${file.name} (${file.metadata?.size || 0} bytes)`);
        });
      }
    }

    // 3. Try to create a test file (this will likely fail without authentication)
    console.log('\n3. Testing file upload (will likely fail without auth)...');
    
    const testFileName = `test-${Date.now()}.txt`;
    const testFilePath = `profile-photos/test-user/${testFileName}`;
    const testContent = 'This is a test file from storage test script';
    
    console.log(`   Attempting to upload: ${testFilePath}`);
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('profile-pictures')
      .upload(testFilePath, testContent, {
        contentType: 'text/plain',
      });

    if (uploadError) {
      console.log('⚠️  Upload failed (expected without authentication):', uploadError.message);
      console.log('   Error code:', uploadError.statusCode || uploadError.code);
      
      if (uploadError.message?.includes('not found')) {
        console.log('\n❌ ISSUE: Bucket not found or not accessible');
        console.log('   Solution: Make sure the bucket is created and public');
      } else if (uploadError.message?.includes('permission') || uploadError.message?.includes('policy')) {
        console.log('\n⚠️  ISSUE: Permission denied (expected without authentication)');
        console.log('   This is normal - the app needs to be authenticated to upload');
      }
    } else {
      console.log('✅ Upload successful!', uploadData);
      
      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('profile-pictures')
        .getPublicUrl(testFilePath);
      
      console.log('   Public URL:', publicUrl);
    }

    // 4. Summary
    console.log('\n📊 SUMMARY:');
    console.log('   Bucket exists:', !!profilePicturesBucket ? '✅' : '❌');
    console.log('   Bucket is public:', profilePicturesBucket?.public ? '✅' : '❌');
    console.log('   Can list files:', !listError ? '✅' : '❌');
    console.log('   Can upload:', !uploadError ? '✅' : '⚠️  (requires authentication)');

    console.log('\n🔍 NEXT STEPS:');
    if (!profilePicturesBucket) {
      console.log('   1. Create the "profile-pictures" bucket in Supabase');
    }
    if (profilePicturesBucket && !profilePicturesBucket.public) {
      console.log('   1. Set the "profile-pictures" bucket to public');
    }
    if (uploadError) {
      console.log('   2. Test upload from the app while logged in');
      console.log('   3. Check browser console for detailed error messages');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testStorageUpload();

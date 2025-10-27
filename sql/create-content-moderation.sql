-- Content Moderation System
-- This table tracks all user-uploaded content for admin review

-- Create content_assets table
CREATE TABLE IF NOT EXISTS content_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('photo', 'video', 'document')),
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason TEXT, -- Reason for rejection (if rejected)
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  review_note TEXT, -- Admin's review notes
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional metadata (dimensions, file size, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_content_assets_user_id ON content_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_content_assets_status ON content_assets(status);
CREATE INDEX IF NOT EXISTS idx_content_assets_uploaded_at ON content_assets(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_assets_type ON content_assets(type);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_content_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_content_assets_updated_at
  BEFORE UPDATE ON content_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_content_assets_updated_at();

-- Enable RLS
ALTER TABLE content_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own content
CREATE POLICY "Users can view their own content"
  ON content_assets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own content
CREATE POLICY "Users can insert their own content"
  ON content_assets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for admin dashboard)
CREATE POLICY "Service role has full access"
  ON content_assets
  FOR ALL
  USING (auth.role() = 'service_role');

-- Function to automatically create content_asset entries when photos are uploaded
CREATE OR REPLACE FUNCTION create_content_asset_for_photo()
RETURNS TRIGGER AS $$
DECLARE
  photo_url TEXT;
BEGIN
  -- Loop through the new photos array
  IF NEW.photos IS NOT NULL AND array_length(NEW.photos, 1) > 0 THEN
    FOREACH photo_url IN ARRAY NEW.photos
    LOOP
      -- Check if this photo URL already has a content_asset entry
      IF NOT EXISTS (
        SELECT 1 FROM content_assets 
        WHERE user_id = NEW.user_id 
        AND url = photo_url
      ) THEN
        -- Create a new content_asset entry for this photo
        INSERT INTO content_assets (user_id, type, url, status)
        VALUES (NEW.user_id, 'photo', photo_url, 'pending');
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create content_asset entries when profile photos are added/updated
DROP TRIGGER IF EXISTS trigger_create_content_asset_for_photo ON profiles;
CREATE TRIGGER trigger_create_content_asset_for_photo
  AFTER INSERT OR UPDATE OF photos ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_content_asset_for_photo();

-- Function to check if user has any pending content
CREATE OR REPLACE FUNCTION user_has_pending_content(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM content_assets
    WHERE user_id = user_uuid
    AND status = 'pending'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get content moderation stats
CREATE OR REPLACE FUNCTION get_content_moderation_stats()
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*),
    'pending', COUNT(*) FILTER (WHERE status = 'pending'),
    'approved', COUNT(*) FILTER (WHERE status = 'approved'),
    'rejected', COUNT(*) FILTER (WHERE status = 'rejected'),
    'photos', COUNT(*) FILTER (WHERE type = 'photo'),
    'videos', COUNT(*) FILTER (WHERE type = 'video')
  ) INTO stats
  FROM content_assets;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON content_assets TO authenticated;
GRANT ALL ON content_assets TO service_role;

-- Comments for documentation
COMMENT ON TABLE content_assets IS 'Stores all user-uploaded content for moderation';
COMMENT ON COLUMN content_assets.status IS 'pending: awaiting review, approved: passed moderation, rejected: violated rules';
COMMENT ON COLUMN content_assets.reason IS 'Admin reason for rejection (if status is rejected)';
COMMENT ON COLUMN content_assets.review_note IS 'Internal admin notes about the review';



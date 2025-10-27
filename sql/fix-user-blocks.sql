-- Fix user_blocks table
-- Drop existing policies first, then recreate everything

-- Drop existing policies (if they exist)
DROP POLICY IF EXISTS "Users can view their own blocks" ON user_blocks;
DROP POLICY IF EXISTS "Users can create blocks" ON user_blocks;
DROP POLICY IF EXISTS "Users can delete their own blocks" ON user_blocks;

-- Drop existing indexes (if they exist)
DROP INDEX IF EXISTS idx_user_blocks_blocker;
DROP INDEX IF EXISTS idx_user_blocks_blocked;

-- Drop existing table (if it exists)
DROP TABLE IF EXISTS user_blocks;

-- Now create everything fresh
CREATE TABLE user_blocks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  blocker_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  blocked_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_user_id, blocked_user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_user_blocks_blocker ON user_blocks(blocker_user_id);
CREATE INDEX idx_user_blocks_blocked ON user_blocks(blocked_user_id);

-- Enable Row Level Security
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_blocks
-- Users can only see their own blocks
CREATE POLICY "Users can view their own blocks"
  ON user_blocks
  FOR SELECT
  USING (auth.uid() = blocker_user_id);

-- Users can create blocks
CREATE POLICY "Users can create blocks"
  ON user_blocks
  FOR INSERT
  WITH CHECK (auth.uid() = blocker_user_id);

-- Users can delete their own blocks (unblock)
CREATE POLICY "Users can delete their own blocks"
  ON user_blocks
  FOR DELETE
  USING (auth.uid() = blocker_user_id);

-- Grant permissions
GRANT ALL ON user_blocks TO authenticated;
GRANT ALL ON user_blocks TO service_role;

-- Verify table creation
SELECT 'user_blocks table created successfully!' as message;
SELECT 'Total columns: ' || COUNT(*)::text as columns_check 
FROM information_schema.columns 
WHERE table_name = 'user_blocks';


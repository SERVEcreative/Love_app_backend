-- Create user pricing table
CREATE TABLE IF NOT EXISTS user_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sms_cost DECIMAL(8,2) DEFAULT 10.00,           -- 10 for 5 min SMS chat
    audio_call_cost DECIMAL(8,2) DEFAULT 25.00,     -- 25 for audio call
    video_call_cost DECIMAL(8,2) DEFAULT 50.00,     -- 50 for video call
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create pricing history table (optional)
CREATE TABLE IF NOT EXISTS pricing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    old_sms_cost DECIMAL(8,2),
    new_sms_cost DECIMAL(8,2),
    old_audio_call_cost DECIMAL(8,2),
    new_audio_call_cost DECIMAL(8,2),
    old_video_call_cost DECIMAL(8,2),
    new_video_call_cost DECIMAL(8,2),
    changed_by UUID REFERENCES users(id),
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_pricing_user_id ON user_pricing(user_id);
CREATE INDEX IF NOT EXISTS idx_user_pricing_active ON user_pricing(is_active);
CREATE INDEX IF NOT EXISTS idx_pricing_history_user_id ON pricing_history(user_id);

-- Insert default pricing for existing users (optional)
INSERT INTO user_pricing (user_id, sms_cost, audio_call_cost, video_call_cost)
SELECT id, 10.00, 25.00, 50.00 FROM users
ON CONFLICT (user_id) DO NOTHING;

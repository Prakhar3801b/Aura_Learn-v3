-- Add learning_level to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS learning_level TEXT DEFAULT 'intermediate' CHECK (learning_level IN ('beginner', 'intermediate', 'advanced'));

-- Create user_knowledge_state for Personalized AI Tutor
CREATE TABLE IF NOT EXISTS user_knowledge_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    mastery_score FLOAT DEFAULT 0, -- 0 to 1
    weak_points TEXT[], -- List of specific concepts student struggles with
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, topic)
);

-- Enable RLS
ALTER TABLE user_knowledge_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own knowledge state"
    ON user_knowledge_state FOR ALL
    USING (auth.uid() = user_id);

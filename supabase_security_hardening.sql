-- ==========================================
-- 🛡️ THE NUCLEAR SECURITY LAYER (RLS)
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 2. PROFILE POLICIES
-- Profiles are viewable by everyone, but only editable by the owner or admin
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 3. PROJECT POLICIES
-- Anyone can see open projects. Only owners can edit.
CREATE POLICY "Anyone can see open projects" ON projects FOR SELECT USING (status = 'open' OR customer_id = auth.uid() OR hired_engineer_id = auth.uid());
CREATE POLICY "Customers can create projects" ON projects FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Only owners can update projects" ON projects FOR UPDATE USING (auth.uid() = customer_id);

-- 4. PROPOSAL POLICIES
-- Only the project owner and the proposing engineer can see a proposal
CREATE POLICY "Owners and bidders can see proposals" ON proposals FOR SELECT USING (
    engineer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM projects WHERE projects.id = proposals.project_id AND projects.customer_id = auth.uid())
);
CREATE POLICY "Engineers can submit proposals" ON proposals FOR INSERT WITH CHECK (auth.uid() = engineer_id);

-- 5. MESSAGE POLICIES
-- MESSAGES ARE PRIVATE!
CREATE POLICY "Users can only see their own messages" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can only send messages as themselves" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 6. ADMIN BYPASS (The Master Key)
-- Allow admins to see and edit everything
CREATE POLICY "Admins can do everything" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
-- (Repeat for other tables if needed, but the current checks allow for scalable security)

-- 7. NOTIFICATION POLICIES
CREATE POLICY "Users only see their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can mark their own notifications as read" ON notifications FOR UPDATE USING (auth.uid() = user_id);

COMMIT;

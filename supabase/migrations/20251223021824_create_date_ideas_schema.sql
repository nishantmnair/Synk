/*
  # Date Ideas Checklist Schema

  ## Overview
  Complete database schema for a couples' date/activity checklist application with 
  sections, subsections, activities, recurring tasks, and couple linking.

  ## New Tables

  ### 1. `profiles`
  Extends auth.users with profile information
  - `id` (uuid, references auth.users)
  - `full_name` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `couples`
  Stores couple relationships
  - `id` (uuid, primary key)
  - `user1_id` (uuid, references profiles)
  - `user2_id` (uuid, references profiles, nullable initially)
  - `anniversary_date` (date)
  - `invite_code` (text, unique, for link sharing)
  - `created_at` (timestamptz)

  ### 3. `sections`
  Top-level sections for organizing activities
  - `id` (uuid, primary key)
  - `couple_id` (uuid, references couples)
  - `title` (text)
  - `parent_section_id` (uuid, references sections, nullable for subsections)
  - `display_order` (integer)
  - `created_at` (timestamptz)

  ### 4. `activities`
  Individual date/activity items
  - `id` (uuid, primary key)
  - `section_id` (uuid, references sections)
  - `couple_id` (uuid, references couples)
  - `title` (text)
  - `description` (text, nullable)
  - `status` (text: 'not_started', 'in_progress', 'finished')
  - `is_deleted` (boolean, default false)
  - `is_recurring` (boolean, default false)
  - `recurrence_interval` (text, nullable: 'weekly', 'monthly', 'yearly')
  - `last_completed_at` (timestamptz, nullable)
  - `display_order` (integer)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. `activity_history`
  Tracks completions for recurring activities
  - `id` (uuid, primary key)
  - `activity_id` (uuid, references activities)
  - `completed_at` (timestamptz)
  - `completed_by` (uuid, references profiles)

  ### 6. `activity_reminders`
  Stores reminders for activities not yet added
  - `id` (uuid, primary key)
  - `couple_id` (uuid, references couples)
  - `activity_title` (text)
  - `dismissed` (boolean, default false)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access data for their couple
  - Both partners in a couple have equal access
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create couples table
CREATE TABLE IF NOT EXISTS couples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  anniversary_date date,
  invite_code text UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE couples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couple members can view their couple"
  ON couples FOR SELECT
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create couples"
  ON couples FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user1_id);

CREATE POLICY "Couple members can update their couple"
  ON couples FOR UPDATE
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id)
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Create sections table
CREATE TABLE IF NOT EXISTS sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  title text NOT NULL,
  parent_section_id uuid REFERENCES sections(id) ON DELETE CASCADE,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couple members can view their sections"
  ON sections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = sections.couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

CREATE POLICY "Couple members can insert sections"
  ON sections FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = sections.couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

CREATE POLICY "Couple members can update their sections"
  ON sections FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = sections.couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = sections.couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

CREATE POLICY "Couple members can delete their sections"
  ON sections FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = sections.couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid REFERENCES sections(id) ON DELETE CASCADE,
  couple_id uuid NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'finished')),
  is_deleted boolean DEFAULT false,
  is_recurring boolean DEFAULT false,
  recurrence_interval text CHECK (recurrence_interval IN ('weekly', 'monthly', 'yearly')),
  last_completed_at timestamptz,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couple members can view their activities"
  ON activities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = activities.couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

CREATE POLICY "Couple members can insert activities"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = activities.couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

CREATE POLICY "Couple members can update their activities"
  ON activities FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = activities.couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = activities.couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

CREATE POLICY "Couple members can delete their activities"
  ON activities FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = activities.couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

-- Create activity_history table
CREATE TABLE IF NOT EXISTS activity_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  completed_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
);

ALTER TABLE activity_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couple members can view activity history"
  ON activity_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM activities
      JOIN couples ON couples.id = activities.couple_id
      WHERE activities.id = activity_history.activity_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

CREATE POLICY "Couple members can insert activity history"
  ON activity_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM activities
      JOIN couples ON couples.id = activities.couple_id
      WHERE activities.id = activity_history.activity_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

-- Create activity_reminders table
CREATE TABLE IF NOT EXISTS activity_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  activity_title text NOT NULL,
  dismissed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couple members can view their reminders"
  ON activity_reminders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = activity_reminders.couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

CREATE POLICY "Couple members can insert reminders"
  ON activity_reminders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = activity_reminders.couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

CREATE POLICY "Couple members can update their reminders"
  ON activity_reminders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = activity_reminders.couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = activity_reminders.couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sections_couple_id ON sections(couple_id);
CREATE INDEX IF NOT EXISTS idx_sections_parent ON sections(parent_section_id);
CREATE INDEX IF NOT EXISTS idx_activities_couple_id ON activities(couple_id);
CREATE INDEX IF NOT EXISTS idx_activities_section_id ON activities(section_id);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_deleted ON activities(is_deleted);
CREATE INDEX IF NOT EXISTS idx_couples_invite_code ON couples(invite_code);
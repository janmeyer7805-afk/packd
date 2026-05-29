import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Category = 'Supplements' | 'Streetwear' | 'Beauty' | 'Sport';
export type DealStatus = 'open' | 'success' | 'failed';

export interface Profile {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
  created_at: string;
}

export interface Deal {
  id: string;
  title: string;
  photo_url: string;
  original_price: number;
  deal_price: number;
  min_people: number;
  current_count: number;
  category: Category;
  status: DealStatus;
  expires_at: string;
  created_by: string;
  created_at: string;
  profiles?: Profile;
}

export interface DealJoin {
  id: string;
  deal_id: string;
  user_id: string;
  joined_at: string;
  profiles?: Profile;
}

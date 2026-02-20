// Perfil de usuario para mostrar nombres y avatares
export type Profile = {
  id: string;
  full_name: string;
  avatar_url?: string;
};

// --- LIBROS / LISTINGS ---
export type Listing = {
  id: string;
  title: string;
  author: string;
  description: string;
  condition: string;
  review: string | null;
  price: number;
  category: string | null;
  publisher: string | null;
  edition: string | null;
  year: string | null;
  location: string | null;
  photo_url: string | null;
  seller_id: string;
  created_at: string;
  stock?: number;
};

export type ListingInput = Omit<Listing, 'id' | 'created_at'>;

// --- COMUNIDADES ---
export type Community = {
  id: string;
  name: string;
  topic: string;
  description: string;
  rules: string | null;
  location: string | null;
  member_count: number | null;
  created_at: string;
  photo_url: string | null;
  creator_id: string | null;
  admin_ids: string[];
};

export type CommunityInput = Omit<Community, 'id' | 'created_at' | 'member_count' | 'creator_id' | 'admin_ids'>;

export type CommunityPost = {
  id: string;
  community_id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  // Join con perfiles para mostrar quién escribió el mensaje
  profiles?: {
    full_name: string;
    avatar_url?: string;
  };
};

export type CommunityPostInput = Omit<CommunityPost, 'id' | 'created_at' | 'user_id' | 'profiles'>;

// --- CHAT ---
export type Conversation = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  // Información extendida para la interfaz
  listing?: {
    title: string;
    photo_url: string | null;
  };
  buyer_profile?: Profile;
  seller_profile?: Profile;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
};

// --- OTROS ---
export type Draft = {
  id: string;
  user_id: string;
  draft_name: string;
  title: string;
  author: string;
  description: string;
  condition: string;
  price: string;
  photos: string[];
  cover_index: number;
  updated_at: string;
  category?: string;
  stock?: number;
};

export type Favorite = {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
  listing?: Listing;
};

export type Rating = {
  id: string;
  reviewer_id: string;
  seller_id: string;
  listing_id: string;
  stars: number;
  comment: string | null;
  created_at: string;
};

export type ReportInput = {
  reporter_id?: string;
  reported_user_id: string;
  message_id?: string;
  reason: string;
  status?: 'pending' | 'reviewed' | 'resolved';
};
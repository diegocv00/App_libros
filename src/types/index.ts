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
};

export type ListingInput = Omit<Listing, 'id' | 'created_at'>;

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
export type CommunityPost = {
  id: string;
  community_id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
};

export type CommunityPostInput = Omit<CommunityPost, 'id' | 'created_at' | 'user_id'>;
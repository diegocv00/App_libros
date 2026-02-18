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
};

export type CommunityInput = Omit<Community, 'id' | 'created_at' | 'member_count'>;


export type UserRole = 'customer' | 'vendor';
export type FarmType = 'slaughter_only' | 'produce_and_meats' | 'mixed';
export type ProductCategory = 'produce' | 'meat';
export type PricingType = 'weight' | 'fixed';
export type BookingType = 'slaughter' | 'activity';
export type BookingStatus = 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
export type InviteeStatus = 'invited' | 'accepted' | 'declined';
export type EidStatus = 'registered' | 'assigned' | 'completed' | 'cancelled';
export type SlotType = 'slaughter' | 'activity';

export type Profile = {
  id: number;
  clerk_user_id: string;
  role: UserRole;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type FarmCertification = {
  id: number;
  farm_id: number;
  label: string;
  document_url: string | null;
  is_verified: boolean;
};

export type Farm = {
  id: number;
  owner_profile_id: number;
  name: string;
  slug: string;
  description: string | null;
  farm_type: FarmType;
  thumbnail_url: string | null;
  photo_urls: string[];
  address_line: string | null;
  city: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  average_rating: number;
  review_count: number;
  is_published: boolean;
  eid_enabled: boolean;
  /** 1 = $, 2 = $$, 3 = $$$. Maintained by a DB trigger from the farm's offerings. */
  price_tier: number;
  farm_certifications?: FarmCertification[];
  activities?: Pick<Activity, 'id'>[];
};

export type Product = {
  id: number;
  farm_id: number;
  category: ProductCategory;
  name: string;
  description: string | null;
  image_url: string | null;
  pricing_type: PricingType;
  unit: string;
  price: number;
  sale_price: number | null;
  is_on_sale: boolean;
  stock_quantity: number | null;
  is_available: boolean;
  farms?: Pick<Farm, 'id' | 'name' | 'slug' | 'thumbnail_url'>;
};

export type Activity = {
  id: number;
  farm_id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  duration_minutes: number | null;
  max_guests: number | null;
  is_available: boolean;
};

export type SlaughterOffering = {
  id: number;
  farm_id: number;
  animal_type: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  yield_notes: string | null;
  max_split_participants: number;
  is_available: boolean;
};

export type AvailabilitySlot = {
  id: number;
  farm_id: number;
  slot_type: SlotType;
  starts_at: string;
  ends_at: string;
  capacity: number;
  remaining: number;
};

export type Booking = {
  id: number;
  farm_id: number;
  customer_profile_id: number;
  booking_type: BookingType;
  slaughter_offering_id: number | null;
  activity_id: number | null;
  slot_id: number | null;
  scheduled_at: string;
  status: BookingStatus;
  total_price: number;
  notes: string | null;
  farms?: Pick<Farm, 'id' | 'name'>;
  slaughter_offerings?: Pick<SlaughterOffering, 'id' | 'name' | 'animal_type'> | null;
  activities?: Pick<Activity, 'id' | 'name'> | null;
  booking_invitees?: BookingInvitee[];
};

export type BookingInvitee = {
  id: number;
  booking_id: number;
  invitee_profile_id: number | null;
  invitee_email: string | null;
  share_count: number;
  status: InviteeStatus;
};

export type Review = {
  id: number;
  farm_id: number;
  author_profile_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles?: Pick<Profile, 'id' | 'display_name'>;
};

export type EidRegistration = {
  id: number;
  farm_id: number;
  customer_profile_id: number;
  ticket_number: string;
  animal_type: string;
  status: EidStatus;
  assigned_slot_id: number | null;
  assigned_at: string | null;
  notes: string | null;
  created_at: string;
  farms?: Pick<Farm, 'id' | 'name'>;
  availability_slots?: Pick<AvailabilitySlot, 'id' | 'starts_at' | 'ends_at'> | null;
};

export const FARM_TYPE_LABELS: Record<FarmType, string> = {
  slaughter_only: 'Slaughter only',
  produce_and_meats: 'Produce & meats',
  mixed: 'Mixed',
};

export function formatPrice(amount: number, pricingType?: PricingType, unit?: string) {
  const value = `$${Number(amount).toFixed(2)}`;
  if (pricingType === 'weight' && unit) return `${value}/${unit}`;
  return value;
}

export function formatRating(rating: number) {
  return Number(rating).toFixed(1);
}

export function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || `farm-${Date.now()}`;
}

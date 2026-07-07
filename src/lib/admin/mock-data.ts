/**
 * Admin Panel Mock Data
 * TODO: Replace all mock data with Prisma queries in production
 */

// ============================================
// Types
// ============================================

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "manager" | "receptionist";
  avatar?: string;
  createdAt: string;
};

export type RoomTypeAdmin = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  size: number;
  maxGuests: number;
  bedType: string;
  view: string;
  amenities: string[];
  totalRooms: number;
  status: "active" | "inactive";
};

export type IndividualRoom = {
  id: string;
  roomNumber: string;
  roomTypeId: string;
  roomTypeName: string;
  floor: number;
  status: "available" | "occupied" | "maintenance" | "cleaning";
  lastCleaned: string;
};

export type BookingAdmin = {
  id: string;
  bookingCode: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomTypeName: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalPrice: number;
  status: "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled";
  createdAt: string;
  specialRequests?: string;
};

export type GuestAdmin = {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationality: string;
  totalStays: number;
  totalSpent: number;
  lastVisit: string;
  vipLevel: "regular" | "silver" | "gold" | "platinum";
};

export type BlogPostAdmin = {
  id: string;
  title: string;
  slug: string;
  locale: "en" | "vi";
  status: "draft" | "published" | "archived";
  author: string;
  category: string;
  createdAt: string;
  publishedAt?: string;
  excerpt: string;
};

export type PromotionAdmin = {
  id: string;
  name: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startDate: string;
  endDate: string;
  applicableRooms: string[];
  status: "active" | "scheduled" | "expired";
  usageCount: number;
  maxUsage: number;
};

export type GalleryImageAdmin = {
  id: string;
  src: string;
  alt: string;
  category: "rooms" | "views" | "dining" | "spa" | "facilities" | "events";
  uploadedAt: string;
  size: string;
  featured: boolean;
};

export type ReviewAdmin = {
  id: string;
  guestName: string;
  guestEmail: string;
  rating: number;
  title: string;
  comment: string;
  roomTypeName: string;
  stayDate: string;
  status: "pending" | "approved" | "rejected";
  response?: string;
  createdAt: string;
};

// ============================================
// Mock Admin Users
// ============================================

export const mockAdminUsers: AdminUser[] = [
  {
    id: "admin-1",
    name: "Nguyen Van Admin",
    email: "admin@hasana.com",
    role: "super_admin",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "admin-2",
    name: "Tran Thi Manager",
    email: "manager@hasana.com",
    role: "manager",
    createdAt: "2024-02-15T00:00:00Z",
  },
  {
    id: "admin-3",
    name: "Le Van Reception",
    email: "reception@hasana.com",
    role: "receptionist",
    createdAt: "2024-03-01T00:00:00Z",
  },
];

// Mock credentials: admin@hasana.com / admin123
export const MOCK_ADMIN_CREDENTIALS = {
  email: "admin@hasana.com",
  password: "admin123",
};

// ============================================
// Mock Room Types (Admin view)
// ============================================

export const mockRoomTypes: RoomTypeAdmin[] = [
  {
    id: "1",
    name: "Superior Sea View",
    slug: "superior-sea-view",
    description: "Comfortable room with beautiful sea view, modern amenities",
    price: 2200000,
    currency: "VND",
    size: 32,
    maxGuests: 2,
    bedType: "King",
    view: "Sea",
    amenities: ["WiFi", "AC", "Minibar", "Safe", "TV", "Bathrobe"],
    totalRooms: 10,
    status: "active",
  },
  {
    id: "2",
    name: "Deluxe Bay View",
    slug: "deluxe-bay-view",
    description: "Spacious room with stunning Ha Long Bay panoramic view",
    price: 3500000,
    currency: "VND",
    size: 42,
    maxGuests: 2,
    bedType: "King",
    view: "Bay",
    amenities: ["WiFi", "AC", "Minibar", "Safe", "TV", "Bathrobe", "Coffee Machine", "Turndown"],
    totalRooms: 8,
    status: "active",
  },
  {
    id: "3",
    name: "Premium Ocean Suite",
    slug: "premium-ocean-suite",
    description: "Luxurious suite with separate living area and ocean view",
    price: 5000000,
    currency: "VND",
    size: 55,
    maxGuests: 3,
    bedType: "King",
    view: "Ocean",
    amenities: ["WiFi", "AC", "Minibar", "Safe", "TV", "Bathrobe", "Coffee Machine", "Lounge Access", "Breakfast"],
    totalRooms: 5,
    status: "active",
  },
  {
    id: "4",
    name: "Executive Suite",
    slug: "executive-suite",
    description: "Premium suite with panoramic view and exclusive services",
    price: 7500000,
    currency: "VND",
    size: 72,
    maxGuests: 4,
    bedType: "King",
    view: "Panoramic",
    amenities: ["WiFi", "AC", "Minibar", "Safe", "TV", "Bathrobe", "Coffee Machine", "Lounge Access", "Breakfast", "Spa Credit", "Airport Transfer"],
    totalRooms: 3,
    status: "active",
  },
  {
    id: "5",
    name: "Presidential Suite",
    slug: "presidential-suite",
    description: "The ultimate luxury experience with private pool and butler",
    price: 15000000,
    currency: "VND",
    size: 120,
    maxGuests: 4,
    bedType: "King",
    view: "Panoramic",
    amenities: ["WiFi", "AC", "Minibar", "Safe", "TV", "Bathrobe", "Coffee Machine", "Lounge Access", "Breakfast", "Spa Credit", "Airport Transfer", "Kitchen", "Jacuzzi", "Private Pool"],
    totalRooms: 1,
    status: "active",
  },
];

// ============================================
// Mock Individual Rooms
// ============================================

export const mockRooms: IndividualRoom[] = [
  { id: "r-301", roomNumber: "301", roomTypeId: "1", roomTypeName: "Superior Sea View", floor: 3, status: "available", lastCleaned: "2024-12-20T08:00:00Z" },
  { id: "r-302", roomNumber: "302", roomTypeId: "1", roomTypeName: "Superior Sea View", floor: 3, status: "occupied", lastCleaned: "2024-12-19T08:00:00Z" },
  { id: "r-303", roomNumber: "303", roomTypeId: "1", roomTypeName: "Superior Sea View", floor: 3, status: "cleaning", lastCleaned: "2024-12-18T08:00:00Z" },
  { id: "r-501", roomNumber: "501", roomTypeId: "2", roomTypeName: "Deluxe Bay View", floor: 5, status: "available", lastCleaned: "2024-12-20T09:00:00Z" },
  { id: "r-502", roomNumber: "502", roomTypeId: "2", roomTypeName: "Deluxe Bay View", floor: 5, status: "occupied", lastCleaned: "2024-12-19T09:00:00Z" },
  { id: "r-801", roomNumber: "801", roomTypeId: "3", roomTypeName: "Premium Ocean Suite", floor: 8, status: "available", lastCleaned: "2024-12-20T10:00:00Z" },
  { id: "r-802", roomNumber: "802", roomTypeId: "3", roomTypeName: "Premium Ocean Suite", floor: 8, status: "maintenance", lastCleaned: "2024-12-15T10:00:00Z" },
  { id: "r-1201", roomNumber: "1201", roomTypeId: "4", roomTypeName: "Executive Suite", floor: 12, status: "available", lastCleaned: "2024-12-20T11:00:00Z" },
  { id: "r-1202", roomNumber: "1202", roomTypeId: "4", roomTypeName: "Executive Suite", floor: 12, status: "occupied", lastCleaned: "2024-12-19T11:00:00Z" },
  { id: "r-2001", roomNumber: "2001", roomTypeId: "5", roomTypeName: "Presidential Suite", floor: 20, status: "available", lastCleaned: "2024-12-20T07:00:00Z" },
];

// ============================================
// Mock Bookings
// ============================================

export const mockBookings: BookingAdmin[] = [
  {
    id: "b-001",
    bookingCode: "HASANA-A1B2C3",
    guestName: "John Smith",
    guestEmail: "john.smith@email.com",
    guestPhone: "+1-555-0101",
    roomTypeName: "Deluxe Bay View",
    roomNumber: "502",
    checkIn: "2024-12-22",
    checkOut: "2024-12-25",
    nights: 3,
    totalPrice: 10500000,
    status: "confirmed",
    createdAt: "2024-12-15T10:30:00Z",
    specialRequests: "Late check-in, extra pillows",
  },
  {
    id: "b-002",
    bookingCode: "HASANA-D4E5F6",
    guestName: "Nguyen Thi Lan",
    guestEmail: "lan.nguyen@email.com",
    guestPhone: "+84-905-123-456",
    roomTypeName: "Superior Sea View",
    roomNumber: "302",
    checkIn: "2024-12-21",
    checkOut: "2024-12-23",
    nights: 2,
    totalPrice: 4400000,
    status: "checked_in",
    createdAt: "2024-12-10T14:20:00Z",
  },
  {
    id: "b-003",
    bookingCode: "HASANA-G7H8I9",
    guestName: "Tanaka Yuki",
    guestEmail: "yuki.tanaka@email.com",
    guestPhone: "+81-90-1234-5678",
    roomTypeName: "Premium Ocean Suite",
    roomNumber: "801",
    checkIn: "2024-12-24",
    checkOut: "2024-12-28",
    nights: 4,
    totalPrice: 20000000,
    status: "pending",
    createdAt: "2024-12-18T09:15:00Z",
    specialRequests: "Anniversary celebration, champagne in room",
  },
  {
    id: "b-004",
    bookingCode: "HASANA-J1K2L3",
    guestName: "Emma Wilson",
    guestEmail: "emma.wilson@email.com",
    guestPhone: "+44-7700-900123",
    roomTypeName: "Executive Suite",
    roomNumber: "1202",
    checkIn: "2024-12-20",
    checkOut: "2024-12-22",
    nights: 2,
    totalPrice: 15000000,
    status: "checked_in",
    createdAt: "2024-12-05T16:45:00Z",
  },
  {
    id: "b-005",
    bookingCode: "HASANA-M4N5O6",
    guestName: "Park Min-jun",
    guestEmail: "minjun.park@email.com",
    guestPhone: "+82-10-1234-5678",
    roomTypeName: "Presidential Suite",
    roomNumber: "2001",
    checkIn: "2024-12-26",
    checkOut: "2024-12-31",
    nights: 5,
    totalPrice: 75000000,
    status: "confirmed",
    createdAt: "2024-12-01T11:00:00Z",
    specialRequests: "VIP arrival, personal butler, airport pickup",
  },
  {
    id: "b-006",
    bookingCode: "HASANA-P7Q8R9",
    guestName: "Maria Garcia",
    guestEmail: "maria.garcia@email.com",
    guestPhone: "+34-612-345-678",
    roomTypeName: "Superior Sea View",
    roomNumber: "301",
    checkIn: "2024-12-18",
    checkOut: "2024-12-20",
    nights: 2,
    totalPrice: 4400000,
    status: "checked_out",
    createdAt: "2024-12-12T08:30:00Z",
  },
  {
    id: "b-007",
    bookingCode: "HASANA-S1T2U3",
    guestName: "Li Wei",
    guestEmail: "li.wei@email.com",
    guestPhone: "+86-138-0013-8000",
    roomTypeName: "Deluxe Bay View",
    roomNumber: "501",
    checkIn: "2024-12-23",
    checkOut: "2024-12-26",
    nights: 3,
    totalPrice: 10500000,
    status: "cancelled",
    createdAt: "2024-12-14T13:00:00Z",
  },
];

// ============================================
// Mock Guests
// ============================================

export const mockGuests: GuestAdmin[] = [
  { id: "g-001", name: "John Smith", email: "john.smith@email.com", phone: "+1-555-0101", nationality: "US", totalStays: 3, totalSpent: 35000000, lastVisit: "2024-12-22", vipLevel: "gold" },
  { id: "g-002", name: "Nguyen Thi Lan", email: "lan.nguyen@email.com", phone: "+84-905-123-456", nationality: "VN", totalStays: 8, totalSpent: 52000000, lastVisit: "2024-12-21", vipLevel: "platinum" },
  { id: "g-003", name: "Tanaka Yuki", email: "yuki.tanaka@email.com", phone: "+81-90-1234-5678", nationality: "JP", totalStays: 2, totalSpent: 25000000, lastVisit: "2024-12-24", vipLevel: "silver" },
  { id: "g-004", name: "Emma Wilson", email: "emma.wilson@email.com", phone: "+44-7700-900123", nationality: "GB", totalStays: 5, totalSpent: 45000000, lastVisit: "2024-12-20", vipLevel: "gold" },
  { id: "g-005", name: "Park Min-jun", email: "minjun.park@email.com", phone: "+82-10-1234-5678", nationality: "KR", totalStays: 1, totalSpent: 75000000, lastVisit: "2024-12-26", vipLevel: "platinum" },
  { id: "g-006", name: "Maria Garcia", email: "maria.garcia@email.com", phone: "+34-612-345-678", nationality: "ES", totalStays: 2, totalSpent: 8800000, lastVisit: "2024-12-18", vipLevel: "regular" },
  { id: "g-007", name: "Li Wei", email: "li.wei@email.com", phone: "+86-138-0013-8000", nationality: "CN", totalStays: 1, totalSpent: 0, lastVisit: "2024-12-14", vipLevel: "regular" },
];

// ============================================
// Mock Blog Posts
// ============================================

export const mockBlogPosts: BlogPostAdmin[] = [
  { id: "bp-001", title: "Top 10 Things to Do in Ha Long Bay", slug: "top-10-ha-long-bay", locale: "en", status: "published", author: "Nguyen Van Admin", category: "Travel Guide", createdAt: "2024-11-15T10:00:00Z", publishedAt: "2024-11-16T08:00:00Z", excerpt: "Discover the must-see attractions and activities in Ha Long Bay..." },
  { id: "bp-002", title: "10 Điều Nên Làm Tại Vịnh Hạ Long", slug: "10-dieu-nen-lam-ha-long", locale: "vi", status: "published", author: "Nguyen Van Admin", category: "Travel Guide", createdAt: "2024-11-15T10:00:00Z", publishedAt: "2024-11-16T08:00:00Z", excerpt: "Khám phá những điểm đến và hoạt động không thể bỏ qua tại Vịnh Hạ Long..." },
  { id: "bp-003", title: "Hasana Hotel: A Year in Review", slug: "hasana-year-review", locale: "en", status: "published", author: "Tran Thi Manager", category: "News", createdAt: "2024-12-01T09:00:00Z", publishedAt: "2024-12-02T06:00:00Z", excerpt: "Looking back at an incredible year of hospitality excellence..." },
  { id: "bp-004", title: "Best Seafood Restaurants Near Ha Long", slug: "best-seafood-ha-long", locale: "en", status: "draft", author: "Nguyen Van Admin", category: "Food & Dining", createdAt: "2024-12-10T14:00:00Z", excerpt: "A curated guide to the freshest seafood experiences..." },
  { id: "bp-005", title: "Spa Wellness Guide: Finding Your Balance", slug: "spa-wellness-guide", locale: "en", status: "draft", author: "Tran Thi Manager", category: "Wellness", createdAt: "2024-12-18T11:00:00Z", excerpt: "Explore our comprehensive spa and wellness offerings..." },
  { id: "bp-006", title: "Cẩm Nang Du Lịch Mùa Đông Hạ Long", slug: "cam-nang-du-lich-mua-dong", locale: "vi", status: "archived", author: "Nguyen Van Admin", category: "Travel Guide", createdAt: "2024-10-01T08:00:00Z", publishedAt: "2024-10-02T06:00:00Z", excerpt: "Hướng dẫn chi tiết cho chuyến du lịch mùa đông..." },
];

// ============================================
// Mock Promotions
// ============================================

export const mockPromotions: PromotionAdmin[] = [
  { id: "promo-001", name: "Early Bird 2025", code: "EARLY2025", discountType: "percentage", discountValue: 20, startDate: "2024-12-01", endDate: "2025-01-31", applicableRooms: ["Superior Sea View", "Deluxe Bay View"], status: "active", usageCount: 45, maxUsage: 200 },
  { id: "promo-002", name: "Lunar New Year Special", code: "TET2025", discountType: "percentage", discountValue: 15, startDate: "2025-01-25", endDate: "2025-02-05", applicableRooms: ["All Room Types"], status: "scheduled", usageCount: 0, maxUsage: 100 },
  { id: "promo-003", name: "Weekend Getaway", code: "WEEKEND30", discountType: "fixed", discountValue: 500000, startDate: "2024-11-01", endDate: "2024-12-31", applicableRooms: ["Superior Sea View", "Deluxe Bay View", "Premium Ocean Suite"], status: "active", usageCount: 78, maxUsage: 150 },
  { id: "promo-004", name: "Summer Splash 2024", code: "SUMMER24", discountType: "percentage", discountValue: 25, startDate: "2024-06-01", endDate: "2024-08-31", applicableRooms: ["All Room Types"], status: "expired", usageCount: 312, maxUsage: 500 },
  { id: "promo-005", name: "Honeymoon Package", code: "LOVE2025", discountType: "percentage", discountValue: 30, startDate: "2025-02-01", endDate: "2025-03-31", applicableRooms: ["Premium Ocean Suite", "Executive Suite", "Presidential Suite"], status: "scheduled", usageCount: 0, maxUsage: 50 },
];

// ============================================
// Mock Gallery Images
// ============================================

export const mockGalleryImages: GalleryImageAdmin[] = [
  { id: "img-001", src: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80", alt: "Superior Room Interior", category: "rooms", uploadedAt: "2024-10-01T10:00:00Z", size: "2.4 MB", featured: true },
  { id: "img-002", src: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&q=80", alt: "Deluxe Room with Bay View", category: "rooms", uploadedAt: "2024-10-01T10:05:00Z", size: "3.1 MB", featured: true },
  { id: "img-003", src: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=80", alt: "Ha Long Bay Sunrise", category: "views", uploadedAt: "2024-10-05T08:00:00Z", size: "4.2 MB", featured: true },
  { id: "img-004", src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80", alt: "Restaurant Interior", category: "dining", uploadedAt: "2024-10-10T14:00:00Z", size: "2.8 MB", featured: false },
  { id: "img-005", src: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80", alt: "Spa Treatment Room", category: "spa", uploadedAt: "2024-10-12T09:00:00Z", size: "1.9 MB", featured: false },
  { id: "img-006", src: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80", alt: "Infinity Pool", category: "facilities", uploadedAt: "2024-10-15T11:00:00Z", size: "3.5 MB", featured: true },
  { id: "img-007", src: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80", alt: "Hotel Exterior at Night", category: "facilities", uploadedAt: "2024-10-15T11:30:00Z", size: "2.7 MB", featured: false },
  { id: "img-008", src: "https://images.unsplash.com/photo-1528127269322-539801943592?w=400&q=80", alt: "Ha Long Bay Boats", category: "views", uploadedAt: "2024-10-20T07:00:00Z", size: "3.8 MB", featured: false },
];

// ============================================
// Mock Reviews
// ============================================

export const mockReviews: ReviewAdmin[] = [
  { id: "rev-001", guestName: "John Smith", guestEmail: "john.smith@email.com", rating: 5, title: "Absolutely stunning!", comment: "The view from our Deluxe Bay View room was breathtaking. Staff was incredibly attentive and the breakfast buffet was world-class.", roomTypeName: "Deluxe Bay View", stayDate: "2024-11-15", status: "approved", response: "Thank you for your wonderful review, Mr. Smith! We're delighted you enjoyed your stay.", createdAt: "2024-11-18T10:00:00Z" },
  { id: "rev-002", guestName: "Tanaka Yuki", guestEmail: "yuki.tanaka@email.com", rating: 4, title: "Great experience overall", comment: "Beautiful hotel with excellent amenities. The spa was particularly relaxing. Minor issue with WiFi speed in the room.", roomTypeName: "Premium Ocean Suite", stayDate: "2024-11-20", status: "approved", createdAt: "2024-11-22T14:00:00Z" },
  { id: "rev-003", guestName: "Maria Garcia", guestEmail: "maria.garcia@email.com", rating: 5, title: "Paradise in Ha Long Bay", comment: "Everything was perfect — from check-in to check-out. The room was immaculate, the food was delicious, and the staff made us feel like royalty.", roomTypeName: "Superior Sea View", stayDate: "2024-12-18", status: "pending", createdAt: "2024-12-19T16:00:00Z" },
  { id: "rev-004", guestName: "David Chen", guestEmail: "david.chen@email.com", rating: 3, title: "Good but could be better", comment: "Nice hotel but the room felt a bit dated. The bathroom needs renovation. However, the location is unbeatable and the bay view is spectacular.", roomTypeName: "Superior Sea View", stayDate: "2024-12-10", status: "pending", createdAt: "2024-12-12T09:00:00Z" },
  { id: "rev-005", guestName: "Anonymous", guestEmail: "test@spam.com", rating: 1, title: "SPAM REVIEW", comment: "Buy cheap watches at www.spam-site.com", roomTypeName: "Superior Sea View", stayDate: "2024-12-15", status: "rejected", createdAt: "2024-12-15T03:00:00Z" },
  { id: "rev-006", guestName: "Emma Wilson", guestEmail: "emma.wilson@email.com", rating: 5, title: "Executive Suite exceeded expectations", comment: "The panoramic view is out of this world. Butler service was impeccable. Already planning our next visit!", roomTypeName: "Executive Suite", stayDate: "2024-12-20", status: "pending", createdAt: "2024-12-21T11:00:00Z" },
];

// ============================================
// Mock Dashboard Stats
// ============================================

export const mockDashboardStats = {
  bookingsToday: 4,
  checkInsToday: 2,
  checkOutsToday: 1,
  occupancyRate: 72,
  totalRooms: 27,
  occupiedRooms: 19,
  availableRooms: 6,
  maintenanceRooms: 2,
  revenueToday: 45000000,
  revenueThisMonth: 890000000,
  revenueLastMonth: 750000000,
  pendingBookings: 3,
  pendingReviews: 3,
  averageRating: 4.4,
  totalGuests: 156,
};

// ============================================
// Mock Site Settings
// ============================================

export const mockSiteSettings = {
  hotelName: "Hasana Hotel & Spa",
  tagline: "Luxury Living by the Bay",
  email: "info@hasana.com",
  phone: "+84-203-123-4567",
  address: "Ha Long Bay, Quang Ninh, Vietnam",
  checkInTime: "14:00",
  checkOutTime: "12:00",
  currency: "VND",
  defaultLocale: "vi",
  supportedLocales: ["vi", "en"],
  socialMedia: {
    facebook: "https://facebook.com/hasanahotel",
    instagram: "https://instagram.com/hasanahotel",
    twitter: "https://twitter.com/hasanahotel",
  },
  seo: {
    metaTitle: "Hasana Hotel & Spa - Luxury in Ha Long Bay",
    metaDescription: "Experience luxury hospitality with stunning views of Ha Long Bay. Book your stay at Hasana Hotel & Spa.",
    ogImage: "/images/og-image.jpg",
  },
  bookingPolicy: {
    cancellationHours: 48,
    depositPercentage: 30,
    maxAdvanceBookingDays: 365,
    childAgeLimit: 12,
  },
};

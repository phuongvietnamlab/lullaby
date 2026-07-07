/**
 * Blog data helpers
 * Provides published blog posts with full content for public pages
 */

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  locale: "en" | "vi";
  category: string;
  author: string;
  publishedAt: string;
  excerpt: string;
  coverImage: string;
  content: string;
};

const blogPosts: BlogPost[] = [
  {
    id: "bp-001",
    title: "Top 10 Things to Do in Ha Long Bay",
    slug: "top-10-ha-long-bay",
    locale: "en",
    category: "Travel Guide",
    author: "Nguyen Van Admin",
    publishedAt: "2024-11-16",
    excerpt:
      "Discover the must-see attractions and activities in Ha Long Bay, from cave explorations to luxury cruises.",
    coverImage:
      "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80",
    content: `Ha Long Bay, a UNESCO World Heritage Site, offers countless experiences for every type of traveler. Here are our top picks for making the most of your visit.

## 1. Explore Sung Sot Cave

One of the largest and most spectacular caves in the bay, Sung Sot (Surprise Cave) features stunning stalactites and stalagmites that have formed over millions of years.

## 2. Kayak Through Hidden Lagoons

Paddle through emerald waters and discover secluded lagoons surrounded by towering limestone karsts. Early morning is the best time for calm waters.

## 3. Take a Luxury Cruise

Experience the bay in style aboard a traditional junk boat or modern yacht. Overnight cruises offer sunset cocktails and fresh seafood dining.

## 4. Visit Ti Top Island

Climb the 427 steps to the summit for breathtaking panoramic views, then cool off at the crescent-shaped beach below.

## 5. Discover Floating Villages

Visit traditional fishing communities where families have lived on the water for generations. Learn about local life and enjoy the freshest seafood.

## 6. Watch the Sunset

Nothing compares to watching the sun dip behind limestone pillars as the sky transforms into gold, pink, and purple.

## 7. Try Fresh Seafood

Ha Long Bay is famous for its incredibly fresh seafood. Don't miss the grilled squid and steamed mantis shrimp.

## 8. Go Pearl Farming

Visit a pearl farm to learn about the delicate process of cultivating pearls in the bay's pristine waters.

## 9. Explore Bai Tu Long Bay

Venture beyond the main tourist routes to the quieter Bai Tu Long Bay for a more intimate experience with nature.

## 10. Relax at HASANA Hotel

End each day of adventure in the comfort of your luxury room, watching the bay from your private balcony.

---

*Need help planning your Ha Long Bay adventure? Our concierge team is happy to arrange bespoke tours tailored to your interests.*`,
  },
  {
    id: "bp-002",
    title: "10 Điều Nên Làm Tại Vịnh Hạ Long",
    slug: "10-dieu-nen-lam-ha-long",
    locale: "vi",
    category: "Travel Guide",
    author: "Nguyen Van Admin",
    publishedAt: "2024-11-16",
    excerpt:
      "Khám phá những điểm đến và hoạt động không thể bỏ qua tại Vịnh Hạ Long, từ khám phá hang động đến du thuyền sang trọng.",
    coverImage:
      "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80",
    content: `Vịnh Hạ Long, Di sản Thế giới UNESCO, mang đến vô số trải nghiệm cho mọi loại du khách. Dưới đây là những gợi ý hàng đầu để tận hưởng chuyến thăm của bạn.

## 1. Khám Phá Hang Sửng Sốt

Một trong những hang động lớn nhất và ngoạn mục nhất vịnh, Hang Sửng Sốt có những nhũ đá tuyệt đẹp đã hình thành qua hàng triệu năm.

## 2. Chèo Kayak Qua Đầm Phá Ẩn Giấu

Chèo thuyền trên mặt nước ngọc bích và khám phá những đầm phá hẻo lánh được bao quanh bởi những khối đá vôi sừng sững. Buổi sáng sớm là thời điểm tốt nhất.

## 3. Du Thuyền Sang Trọng

Trải nghiệm vịnh một cách phong cách trên thuyền buồm truyền thống hoặc du thuyền hiện đại. Du thuyền qua đêm bao gồm cocktail hoàng hôn và ẩm thực hải sản.

## 4. Thăm Đảo Ti Tốp

Leo 427 bậc thang lên đỉnh để ngắm toàn cảnh tuyệt đẹp, sau đó tắm mát tại bãi biển hình lưỡi liềm phía dưới.

## 5. Khám Phá Làng Chài Nổi

Thăm những cộng đồng đánh cá truyền thống nơi các gia đình đã sống trên mặt nước qua nhiều thế hệ.

## 6. Ngắm Hoàng Hôn

Không gì sánh được với việc ngắm mặt trời lặn sau những trụ đá vôi khi bầu trời chuyển thành vàng, hồng và tím.

## 7. Thưởng Thức Hải Sản Tươi

Vịnh Hạ Long nổi tiếng với hải sản tươi sống. Đừng bỏ qua mực nướng và tôm tít hấp.

## 8. Tham Quan Trang Trại Ngọc Trai

Tìm hiểu quy trình nuôi cấy ngọc trai tinh tế trong vùng nước trong lành của vịnh.

## 9. Khám Phá Vịnh Bái Tử Long

Vượt ra ngoài các tuyến du lịch chính đến Vịnh Bái Tử Long yên tĩnh hơn để trải nghiệm thân mật với thiên nhiên.

## 10. Thư Giãn Tại HASANA Hotel

Kết thúc mỗi ngày phiêu lưu trong sự thoải mái của phòng sang trọng, ngắm vịnh từ ban công riêng.

---

*Cần hỗ trợ lên kế hoạch? Đội ngũ concierge luôn sẵn sàng sắp xếp tour riêng phù hợp với sở thích của bạn.*`,
  },
  {
    id: "bp-003",
    title: "Hasana Hotel: A Year in Review",
    slug: "hasana-year-review",
    locale: "en",
    category: "News",
    author: "Tran Thi Manager",
    publishedAt: "2024-12-02",
    excerpt:
      "Looking back at an incredible year of hospitality excellence and unforgettable guest experiences.",
    coverImage:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    content: `As we approach the end of another remarkable year, we're taking a moment to reflect on the milestones, memories, and magic that made 2024 truly special at HASANA Hotel.

## A Year of Growth

This year has been one of tremendous growth. We welcomed over 10,000 guests from 45 countries, maintaining our commitment to personalized luxury service for each and every visitor.

## New Experiences

We introduced several new offerings this year:
- **Sunrise Yoga Sessions** on our rooftop terrace
- **Private Bay Dining** experiences under the stars
- **Cultural Immersion Program** connecting guests with local artisans
- **Wellness Retreats** featuring traditional Vietnamese healing practices

## Awards & Recognition

We're proud to have received recognition from the hospitality industry:
- Luxury Travel Guide Awards 2024 — Best Boutique Hotel Vietnam
- TripAdvisor Travelers' Choice 2024
- Green Hotel Certification for our sustainability practices

## Looking Ahead

As we step into 2025, we're excited about upcoming renovations to our spa wing, new culinary partnerships, and expanded tour offerings. Our commitment to providing an extraordinary Ha Long Bay experience remains unwavering.

Thank you to every guest who has chosen HASANA Hotel as their home away from home. Your trust inspires us every day.

---

*Warm regards,*
*The HASANA Hotel Team*`,
  },
];

/**
 * Get all published blog posts for a given locale
 */
export function getPublishedPosts(locale: string): BlogPost[] {
  return blogPosts.filter(
    (post) => post.locale === locale
  );
}

/**
 * Get a single blog post by slug and locale
 */
export function getPostBySlug(slug: string, locale: string): BlogPost | undefined {
  return blogPosts.find(
    (post) => post.slug === slug && post.locale === locale
  );
}

/**
 * Get all post slugs for static generation
 */
export function getAllPostSlugs(): { slug: string; locale: string }[] {
  return blogPosts.map((post) => ({
    slug: post.slug,
    locale: post.locale,
  }));
}

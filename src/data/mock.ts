export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  categoryId: string;
  badge?: string;
};

export type Review = {
  id: string;
  productId: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
};

export type Brand = {
  id: string;
  name: string;
  logo: string;
};

export const heroBanners = [
  "/بانر1.webp",
  "/بانر2.webp",
  "/بانر3.webp",
  "/بانر4.webp",
  "/بانر5.webp",
] as const;

export const logoSrc = "/logo-white@2x.webp";

export const categories: Category[] = [
  {
    id: "ps",
    name: "أجهزة PS",
    slug: "ps",
    description: "بلايستيشن وإكسسواراته",
  },
  {
    id: "laptops",
    name: "لابتوبات",
    slug: "laptops",
    description: "لابتوبات للألعاب والعمل",
  },
  {
    id: "builds",
    name: "تجميعات",
    slug: "builds",
    description: "تجميعات جاهزة حسب احتياجك",
  },
  {
    id: "monitors",
    name: "شاشات",
    slug: "monitors",
    description: "شاشات جيمنج ومونيتورز",
  },
  {
    id: "accessories",
    name: "إكسسوارات",
    slug: "accessories",
    description: "كيبوردات وماوسات وأكثر",
  },
];

const imgKeyboard = "/XT-GK-979EN-KEYBOARD_.webp";
const imgMonitor = "/MAJESTY-GAMING-MONITOR-27-inch-210HZ-IPS-2K0-7.webp";
const imgHeadset = "/50060تي-اي-قسسسط-600x600.webp";

export const products: Product[] = [
  // PS
  {
    id: "p1",
    name: "PlayStation 5 Slim",
    price: 21999,
    oldPrice: 23999,
    image: imgMonitor,
    categoryId: "ps",
    badge: "الأكثر مبيعاً",
  },
  {
    id: "p2",
    name: "DualSense Controller أبيض",
    price: 1299,
    image: imgKeyboard,
    categoryId: "ps",
  },
  {
    id: "p3",
    name: "PlayStation Portal",
    price: 8999,
    oldPrice: 9999,
    image: imgHeadset,
    categoryId: "ps",
    badge: "جديد",
  },
  {
    id: "p4",
    name: "سماعة Pulse Elite",
    price: 4499,
    image: imgHeadset,
    categoryId: "ps",
  },
  {
    id: "p5",
    name: "DualSense Edge",
    price: 5999,
    image: imgKeyboard,
    categoryId: "ps",
    badge: "عرض",
  },
  {
    id: "p6",
    name: "قاعدة شحن DualSense",
    price: 799,
    image: imgMonitor,
    categoryId: "ps",
  },

  // Laptops
  {
    id: "p7",
    name: "لابتوب جيمنج RTX 4060",
    price: 28999,
    oldPrice: 31999,
    image: imgKeyboard,
    categoryId: "laptops",
    badge: "عرض",
  },
  {
    id: "p8",
    name: "لابتوب ASUS TUF 15",
    price: 32999,
    image: imgMonitor,
    categoryId: "laptops",
  },
  {
    id: "p9",
    name: "لابتوب MSI Katana 15",
    price: 35999,
    oldPrice: 37999,
    image: imgHeadset,
    categoryId: "laptops",
    badge: "جديد",
  },
  {
    id: "p10",
    name: "لابتوب للعمل Ryzen 7",
    price: 24999,
    image: imgKeyboard,
    categoryId: "laptops",
  },
  {
    id: "p11",
    name: "لابتوب Lenovo Legion 5",
    price: 38999,
    image: imgMonitor,
    categoryId: "laptops",
  },

  // Builds
  {
    id: "p12",
    name: "تجميعة أركان Pro RGB",
    price: 18999,
    oldPrice: 20999,
    image: imgHeadset,
    categoryId: "builds",
    badge: "جديد",
  },
  {
    id: "p13",
    name: "تجميعة أركان Starter",
    price: 12999,
    image: imgKeyboard,
    categoryId: "builds",
  },
  {
    id: "p14",
    name: "تجميعة أركان Ultra 4070",
    price: 42999,
    oldPrice: 45999,
    image: imgMonitor,
    categoryId: "builds",
    badge: "الأكثر مبيعاً",
  },
  {
    id: "p15",
    name: "تجميعة بث وتعديل",
    price: 27999,
    image: imgHeadset,
    categoryId: "builds",
  },
  {
    id: "p16",
    name: "تجميعة مكتبية صامتة",
    price: 15999,
    image: imgKeyboard,
    categoryId: "builds",
  },

  // Monitors
  {
    id: "p17",
    name: "شاشة Majesty Gaming 27 بوصة 210Hz",
    price: 3499,
    oldPrice: 3999,
    image: imgMonitor,
    categoryId: "monitors",
    badge: "عرض",
  },
  {
    id: "p18",
    name: "شاشة 2K للتحرير والألعاب",
    price: 4299,
    image: imgMonitor,
    categoryId: "monitors",
  },
  {
    id: "p19",
    name: "شاشة منحنية 32 بوصة 165Hz",
    price: 5199,
    oldPrice: 5799,
    image: imgHeadset,
    categoryId: "monitors",
  },
  {
    id: "p20",
    name: "شاشة مكتبية 24 بوصة IPS",
    price: 2199,
    image: imgKeyboard,
    categoryId: "monitors",
  },
  {
    id: "p21",
    name: "شاشة Ultrawide 34 بوصة",
    price: 8999,
    image: imgMonitor,
    categoryId: "monitors",
    badge: "جديد",
  },

  // Accessories
  {
    id: "p22",
    name: "كيبورد ميكانيكي XT-GK 979",
    price: 899,
    oldPrice: 1199,
    image: imgKeyboard,
    categoryId: "accessories",
    badge: "عرض",
  },
  {
    id: "p23",
    name: "سماعة ألعاب احترافية",
    price: 649,
    image: imgHeadset,
    categoryId: "accessories",
  },
  {
    id: "p24",
    name: "ماوس جيمنج RGB",
    price: 499,
    oldPrice: 699,
    image: imgKeyboard,
    categoryId: "accessories",
  },
  {
    id: "p25",
    name: "ماوس باد XL",
    price: 299,
    image: imgMonitor,
    categoryId: "accessories",
  },
  {
    id: "p26",
    name: "كاميرا ويب Full HD",
    price: 899,
    image: imgHeadset,
    categoryId: "accessories",
    badge: "جديد",
  },
  {
    id: "p27",
    name: "ميكروفون USB للبث",
    price: 1299,
    image: imgKeyboard,
    categoryId: "accessories",
  },
];

export const brands: Brand[] = [
  { id: "b1", name: "Sony", logo: "/brands/sony.svg" },
  { id: "b2", name: "ASUS", logo: "/brands/asus.svg" },
  { id: "b3", name: "MSI", logo: "/brands/msi.svg" },
  { id: "b4", name: "Logitech", logo: "/brands/logitech.svg" },
  { id: "b5", name: "Razer", logo: "/brands/razer.svg" },
  { id: "b6", name: "Samsung", logo: "/brands/samsung.svg" },
  { id: "b7", name: "Intel", logo: "/brands/intel.svg" },
  { id: "b8", name: "AMD", logo: "/brands/amd.svg" },
];

export function formatPrice(price: number) {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(price);
}

export function getProductById(id: string) {
  return products.find((p) => p.id === id);
}

export function getCategoryById(id: string) {
  return categories.find((c) => c.id === id);
}

export function getRelatedProducts(productId: string, limit = 4) {
  const product = getProductById(productId);
  if (!product) return [];

  const sameCategory = products.filter(
    (p) => p.categoryId === product.categoryId && p.id !== productId,
  );

  if (sameCategory.length >= limit) {
    return sameCategory.slice(0, limit);
  }

  const others = products.filter(
    (p) => p.categoryId !== product.categoryId && p.id !== productId,
  );

  return [...sameCategory, ...others].slice(0, limit);
}

export function getProductDescription(product: Product) {
  const category = getCategoryById(product.categoryId);
  return `${product.name} من متجر أركان ضمن قسم ${category?.name ?? "المنتجات"}. منتج موثوق بجودة عالية مناسب للاستخدام اليومي والألعاب، مع ضمان وتوصيل سريع داخل المملكة العربية السعودية.`;
}

export function getProductSpecs(product: Product): { label: string; value: string }[] {
  const base = [
    { label: "القسم", value: getCategoryById(product.categoryId)?.name ?? "—" },
    { label: "الكود", value: product.id.toUpperCase() },
    { label: "التوفر", value: "متوفر في المخزون" },
    { label: "الضمان", value: "سنة على عيوب الصناعة" },
  ];

  if (product.categoryId === "monitors") {
    return [
      ...base,
      { label: "الحجم", value: "27–34 بوصة حسب الموديل" },
      { label: "معدل التحديث", value: "حتى 210Hz" },
    ];
  }

  if (product.categoryId === "builds") {
    return [
      ...base,
      { label: "الاستخدام", value: "جيمنج / مونتاج" },
      { label: "التبريد", value: "هوائي / RGB حسب التجميعة" },
    ];
  }

  if (product.categoryId === "laptops") {
    return [
      ...base,
      { label: "كرت الشاشة", value: "سلسلة RTX / مناسبة للألعاب" },
      { label: "الشاشة", value: "Full HD بمعدل تحديث عالي" },
    ];
  }

  return [
    ...base,
    { label: "التوافق", value: "PC / Console حسب المنتج" },
    { label: "الوصلة", value: "USB / لاسلكي حسب الموديل" },
  ];
}

const reviewTemplates: Omit<Review, "id" | "productId">[] = [
  {
    author: "أحمد محمد",
    rating: 5,
    date: "2026-08-12",
    comment: "منتج ممتاز وجودته عالية، والتوصيل كان سريع جدًا. أنصح بالشراء من أركان.",
  },
  {
    author: "سارة علي",
    rating: 4,
    date: "2026-07-28",
    comment: "أداء قوي بالنسبة للسعر. التغليف محترم والتجربة كانت سلسة من الطلب للاستلام.",
  },
  {
    author: "محمود حسن",
    rating: 5,
    date: "2026-07-03",
    comment: "استخدمته في الألعاب وأداءه ثابت بدون مشاكل. خدمة العملاء ردّوا بسرعة.",
  },
  {
    author: "نورة خالد",
    rating: 4,
    date: "2026-06-19",
    comment: "شكل المنتج أنيق والمواصفات مطابقة للوصف. يستحق التقييم الإيجابي.",
  },
];

export function getProductReviews(productId: string): Review[] {
  // Deterministic mock reviews per product
  const seed = productId.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return reviewTemplates.map((tpl, i) => ({
    ...tpl,
    id: `${productId}-r${i + 1}`,
    productId,
    rating: ((seed + i) % 2 === 0 ? tpl.rating : Math.max(4, tpl.rating - 1)) as number,
    date: tpl.date,
  }));
}

export function getAverageRating(reviews: Review[]) {
  if (reviews.length === 0) return 0;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}

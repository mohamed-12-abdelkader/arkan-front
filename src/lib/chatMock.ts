import { formatPrice, products, type Product } from "@/data/mock";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  products?: Product[];
  createdAt: number;
};

export const chatQuickReplies = [
  "تجميعة اقتصادية للجيمنج",
  "تجميعة متوسطة",
  "تجميعة قوية 4K",
  "عايز شاشة مع التجميعة",
];

function byCategory(id: string) {
  return products.filter((p) => p.categoryId === id);
}

function pickByBudget(list: Product[], max: number, count = 1) {
  return list
    .filter((p) => p.price <= max)
    .sort((a, b) => b.price - a.price)
    .slice(0, count);
}

export function createWelcomeMessage(): ChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    text: "أهلاً بيك في مساعد أركان.\nقولّي ميزانيتك أو نوع الألعاب، وأرشّح لك تجميعة جيمنج مناسبة من منتجاتنا.",
    createdAt: Date.now(),
  };
}

export function getMockAiReply(userText: string): ChatMessage {
  const text = userText.trim();
  const lower = text.toLowerCase();

  const builds = byCategory("builds");
  const monitors = byCategory("monitors");
  const accessories = byCategory("accessories");
  const laptops = byCategory("laptops");

  let reply = "";
  let recommended: Product[] = [];

  const wantsMonitor =
    lower.includes("شاشة") || lower.includes("monitor") || lower.includes("مع التجميعة");
  const wantsLaptop =
    lower.includes("لابتوب") || lower.includes("لاب") || lower.includes("laptop");
  const isBudget =
    lower.includes("اقتصاد") ||
    lower.includes("رخيص") ||
    lower.includes("ميزانية") ||
    lower.includes("مبتدئ") ||
    /\b(5000|6000|7000|8000|9000|10000|11000|12000|13000)\b/.test(lower);
  const isMid =
    lower.includes("متوسط") ||
    lower.includes("متوسطة") ||
    lower.includes("منتصف") ||
    /\b(15000|16000|18000|20000|22000|25000)\b/.test(lower);
  const isHigh =
    lower.includes("قوي") ||
    lower.includes("قوية") ||
    lower.includes("4k") ||
    lower.includes("ultra") ||
    lower.includes("احتراف") ||
    /\b(30000|35000|40000|45000|50000)\b/.test(lower);

  if (wantsLaptop) {
    recommended = laptops.slice(0, 2);
    reply =
      "لو بتفضّل التنقل، دي أفضل لابتوبات جيمنج عندنا حاليًا. تقدر تختار حسب كرت الشاشة والأداء.";
  } else if (isHigh) {
    const build = builds.find((p) => p.id === "p14") ?? builds[builds.length - 1];
    recommended = [build];
    if (wantsMonitor) {
      recommended.push(monitors.find((p) => p.price >= 4000) ?? monitors[0]);
    }
    recommended.push(accessories.find((p) => p.id === "p22") ?? accessories[0]);
    reply =
      "تمام — لتجميعة جيمنج قوية (أداء عالي / 4K) رشّحت لك التجميعة الأقوى مع إكسسوار مناسب. دي هتكون جاهزة للألعاب الثقيلة.";
  } else if (isMid) {
    const build =
      builds.find((p) => p.id === "p15") ??
      pickByBudget(builds, 30000, 1)[0] ??
      builds[0];
    recommended = [build];
    if (wantsMonitor) {
      recommended.push(
        pickByBudget(monitors, 5500, 1)[0] ?? monitors[0],
      );
    }
    recommended.push(accessories.find((p) => p.id === "p23") ?? accessories[0]);
    reply =
      "اختيار ممتاز. لتجميعة متوسطة متوازنة بين السعر والأداء، دي الترشيحات المناسبة من متجر أركان.";
  } else if (isBudget || lower.includes("تجميع")) {
    const build =
      builds.find((p) => p.id === "p13") ??
      pickByBudget(builds, 15000, 1)[0] ??
      builds[0];
    recommended = [build];
    if (wantsMonitor) {
      recommended.push(
        pickByBudget(monitors, 3500, 1)[0] ?? monitors[0],
      );
    }
    recommended.push(accessories.find((p) => p.id === "p24") ?? accessories[0]);
    reply =
      "حاضر! لتجميعة جيمنج اقتصادية وبداية قوية، رشّحت لك المنتجات دي. لو حابب نرفع الأداء شوية قولّي ميزانيتك.";
  } else if (wantsMonitor) {
    recommended = monitors.slice(0, 2);
    reply =
      "تقدر تضيف شاشة جيمنج للتجميعة. دي أفضل الشاشات المتوفرة حاليًا حسب معدل التحديث والجودة.";
  } else {
    recommended = [
      builds.find((p) => p.id === "p12") ?? builds[0],
      monitors.find((p) => p.id === "p17") ?? monitors[0],
    ].filter(Boolean) as Product[];
    reply =
      "فهمتك. بناءً على طلب تجميعة جيمنج، دي توصية سريعة من منتجاتنا. اختَر مستوى الميزانية عشان أدقّق الترشيح أكتر.";
  }

  const total = recommended.reduce((sum, p) => sum + p.price, 0);
  reply += `\n\nإجمالي تقريبي للترشيح: ${formatPrice(total)}`;

  return {
    id: `ai-${Date.now()}`,
    role: "assistant",
    text: reply,
    products: recommended,
    createdAt: Date.now(),
  };
}

import { Brands } from "@/components/Brands";
import { Categories } from "@/components/Categories";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { Products } from "@/components/Products";
import { Reveal } from "@/components/Reveal";
import { WhyUs } from "@/components/WhyUs";
import {
  fetchBrands,
  fetchHomeCategories,
  fetchPopularProducts,
  type Brand,
  type HomeCategory,
  type HomeProduct,
} from "@/lib/catalog";

export const dynamic = "force-dynamic";

async function loadHomeCategories(): Promise<HomeCategory[]> {
  try {
    const data = await fetchHomeCategories(10);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function loadHomeBrands(): Promise<Brand[]> {
  try {
    const res = await fetchBrands(null, {
      page: 1,
      limit: 100,
      is_active: "true",
    });
    return Array.isArray(res.data)
      ? res.data.filter((b) => b.is_active !== false)
      : [];
  } catch {
    return [];
  }
}

async function loadHomeProducts(): Promise<HomeProduct[]> {
  try {
    const res = await fetchPopularProducts({
      page: 1,
      limit: 8,
    });
    return Array.isArray(res.data) ? res.data.slice(0, 8) : [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const [categories, brands, products] = await Promise.all([
    loadHomeCategories(),
    loadHomeBrands(),
    loadHomeProducts(),
  ]);

  return (
    <>
      <Navbar categories={categories} />
      <main className="home-page">
        <div className="home-hero-anim">
          <Hero />
        </div>
        <Reveal delay={40} variant="up">
          <Categories categories={categories} />
        </Reveal>
        <Reveal delay={60} variant="up">
          <Products products={products} />
        </Reveal>
        <Reveal delay={40} variant="fade">
          <Brands brands={brands} />
        </Reveal>
        <Reveal delay={50} variant="fade">
          <WhyUs />
        </Reveal>
        <Reveal delay={40} variant="up">
          <Faq />
        </Reveal>
      </main>
      <Reveal delay={20} variant="fade">
        <Footer categories={categories} />
      </Reveal>
    </>
  );
}

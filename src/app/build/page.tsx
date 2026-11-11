import { Suspense } from "react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { PageLoader } from "@/components/PageLoader";
import { PcBuilder } from "@/components/PcBuilder";

export const dynamic = "force-dynamic";

export default function BuildPage() {
  return (
    <>
      <Navbar />
      <main>
        <Suspense fallback={<PageLoader label="جاري تحميل مكونات التجميعة" />}>
          <PcBuilder />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

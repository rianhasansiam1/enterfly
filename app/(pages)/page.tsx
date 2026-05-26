import CaroselBanner from "./components/CarouselBanner";
import Categories from "./components/Categories";
import { getHomeCategories } from "@/lib/services/home-categories.service";

export default async function Home() {
  const categories = await getHomeCategories();

  return (
    <>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
        <CaroselBanner />
      </div>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pb-10">
        <Categories initialCategories={categories} />
      </div>
    </>
  );
}

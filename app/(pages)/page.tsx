import CaroselBanner from "./components/CarouselBanner";
import Categories from "./components/Categories";

export default function Home() {
  return (
    <>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
        <CaroselBanner />
      </div>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pb-10">
        <Categories />
      </div>
    </>
  );
}

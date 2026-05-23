import Image from "next/image";

type SaleBanner = {
  image: string;
  label: string;
  heading: string;
  discount: string;
  description: string;
};

export const CategoriesBanner = ({ saleBanner }: { saleBanner: SaleBanner }) => {
  return (
    <div className="hidden lg:flex lg:flex-col lg:justify-center w-52 bg-linear-to-br from-violet-600 via-purple-600 to-pink-600 rounded-2xl p-4 text-white relative overflow-hidden shadow-lg shrink-0 group hover:shadow-xl transition-all duration-300">
      <Image
        src={saleBanner.image}
        alt={saleBanner.heading}
        fill
        className="object-cover opacity-30 group-hover:opacity-40 group-hover:scale-110 transition-all duration-500"
      />
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

      <div className="relative z-10">
        <div className="inline-block bg-red-500 text-white px-2.5 py-1 rounded-full text-[10px] font-bold mb-3 shadow-md animate-pulse">
          {saleBanner.label}
        </div>
        <h3 className="text-2xl font-black mb-1 leading-tight tracking-tight">
          {saleBanner.heading}
        </h3>
        <div className="text-4xl font-black text-yellow-300 mb-2 drop-shadow-lg">
          {saleBanner.discount}
        </div>
        <p className="text-[11px] mb-4 opacity-90 leading-relaxed">
          {saleBanner.description}
        </p>
        <button className="w-full bg-white text-violet-700 px-4 py-2 rounded-full font-bold text-xs hover:bg-yellow-300 hover:text-violet-900 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5">
          Shop Now →
        </button>
      </div>
    </div>
  );
};

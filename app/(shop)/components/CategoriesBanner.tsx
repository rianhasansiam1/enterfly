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
    <div className="group relative flex min-h-44 w-full shrink-0 flex-col justify-center overflow-hidden rounded-2xl bg-linear-to-br from-violet-600 via-purple-600 to-pink-600 p-4 text-white shadow-lg transition-all duration-300 hover:shadow-xl sm:min-h-48 sm:p-5 lg:min-h-0 lg:w-52 lg:p-4">
      <Image
        src={saleBanner.image}
        alt={saleBanner.heading}
        fill
        sizes="(min-width: 1024px) 13rem, calc(100vw - 1.5rem)"
        className="object-cover opacity-30 group-hover:opacity-40 group-hover:scale-110 transition-all duration-500"
      />
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

      <div className="relative z-10 max-w-sm lg:max-w-none">
        <div className="inline-block bg-red-500 text-white px-2.5 py-1 rounded-full text-[10px] font-bold mb-3 shadow-md animate-pulse">
          {saleBanner.label}
        </div>
        <h3 className="mb-1 text-xl font-black leading-tight tracking-tight sm:text-2xl">
          {saleBanner.heading}
        </h3>
        <div className="mb-2 text-3xl font-black text-yellow-300 drop-shadow-lg sm:text-4xl">
          {saleBanner.discount}
        </div>
        <p className="text-[11px] mb-4 opacity-90 leading-relaxed">
          {saleBanner.description}
        </p>
        <button className="w-fit bg-white text-violet-700 px-4 py-2 rounded-full font-bold text-xs hover:bg-yellow-300 hover:text-violet-900 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 lg:w-full">
          Shop Now →
        </button>
      </div>
    </div>
  );
};

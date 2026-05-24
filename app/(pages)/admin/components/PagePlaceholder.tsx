import { Hammer } from "lucide-react";

type Props = {
  title: string;
  description?: string;
};

export default function PagePlaceholder({ title, description }: Props) {
  return (
    <section className="rounded-2xl border border-dashed border-violet-200 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
        <Hammer className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-base font-bold text-gray-900">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
        {description ??
          "This screen is part of the admin scaffold. Wire up real data when the API is ready."}
      </p>
    </section>
  );
}

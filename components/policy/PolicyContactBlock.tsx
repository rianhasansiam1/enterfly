/**
 * Highlighted customer-support contact callout shared across policy pages
 * (Privacy, Return, Terms). Renders the standard EnterFly support email,
 * phone, and address inside a violet/pink gradient card.
 */
export default function PolicyContactBlock() {
  return (
    <div className="rounded-2xl bg-linear-to-br from-violet-50 to-pink-50 p-4 ring-1 ring-violet-100 sm:p-5">
      <p className="text-sm font-bold text-gray-900 sm:text-base">EnterFly Customer Support</p>
      <ul className="mt-2 space-y-1 text-sm text-gray-700 sm:text-base">
        <li>
          <span className="font-semibold text-gray-900">Email:</span>{" "}
          <a
            href="mailto:help.enterfly@gmail.com"
            className="text-violet-700 hover:text-violet-800 hover:underline"
          >
            help.enterfly@gmail.com
          </a>
        </li>
        <li>
          <span className="font-semibold text-gray-900">Phone:</span>{" "}
          <a
            href="tel:+8801307026260"
            className="text-violet-700 hover:text-violet-800 hover:underline"
          >
            +8801307026260
          </a>
        </li>
        <li>
          <span className="font-semibold text-gray-900">Address:</span> Dhaka, Bangladesh
        </li>
      </ul>
    </div>
  );
}

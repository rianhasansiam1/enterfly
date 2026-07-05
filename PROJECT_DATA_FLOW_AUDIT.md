# EnterFly Project Data Flow Audit

Generated: 2026-07-05

This report maps the current data flow, API surface, caching, Redux state, database domains, and key performance/security risks for the EnterFly Next.js app. It is based on local repository inspection only. No `.env` secret values were copied into this report.

## Snapshot

- Framework: Next.js `16.2.6`, React `19.2.4`, App Router under `app/`.
- Data layer: Prisma `7.8.0` with PostgreSQL adapter (`@prisma/adapter-pg`) and Prisma Client.
- Auth: Auth.js/NextAuth v5 beta, JWT sessions, credentials + Google providers.
- API surface: 56 `app/api/**/route.ts` files.
- Service layer: 18 modules under `lib/services`.
- Client state: 14 Redux Toolkit slices under `store/slices`.
- Client persistence: cart, wishlist, saved-for-later in `localStorage`; last order snapshot in `sessionStorage`.
- External services: ImgBB uploads, customer courier checker API, EmailJS browser notification.
- Next docs consulted locally: route handlers, caching, proxy, data security, production checklist.

## End-to-End Data Flow

```text
Browser UI
  -> app/layout.tsx
  -> app/providers.tsx
     -> NextAuth SessionProvider
     -> Redux Provider
     -> StoreHydrator
        -> localStorage cart/wishlist hydration
        -> login-time merge to /api/cart/merge and /api/wishlist/merge
  -> page/client components
  -> features/*/api.ts wrappers or direct fetch calls
  -> app/api/**/route.ts route handlers
     -> auth guards, origin checks, rate limits, Zod validation
     -> lib/services/*.service.ts domain services
     -> lib/db/prisma.ts Prisma Client
     -> PostgreSQL
  -> Next data cache via unstable_cache and revalidateTag
  -> external APIs where applicable
```

Server Components are used for SEO/product/category detail surfaces, while most shop list/admin screens are client components that fetch after mount and hydrate Redux. Route handlers act as the backend-for-frontend boundary. Services are mostly marked `server-only`, which is good for keeping database logic and secret access server-side.

## Runtime Providers and Client State

- `app/layout.tsx` sets global metadata, fonts, `JsonLd`, and wraps the app with `Providers`.
- `app/providers.tsx` creates one client boundary containing `SessionProvider`, Redux `Provider`, `StoreHydrator`, `Toaster`, and `ConfirmDialog`.
- `components/layout/StoreHydrator.tsx` hydrates cart/wishlist from browser storage on first mount. When a user becomes authenticated, it merges guest cart/wishlist to server APIs and replaces Redux/localStorage with the server snapshot.
- Logout resets Redux cart/wishlist state and removes the cart/wishlist localStorage keys.

Storage keys:

| Key | File | Data | Source of truth |
| --- | --- | --- | --- |
| `enterfly:cart:v1` | `features/cart/storage.ts` | Guest cart items | Guest browser until login, then server cart |
| `enterfly:wishlist:v1` | `features/wishlist/storage.ts` | Guest wishlist items | Guest browser until login, then server wishlist |
| `enterfly:saved-for-later:v1` | `features/cart/saved-storage.ts` | Saved-for-later items | Browser only |
| `enterfly:order:last:v1` | `features/orders/storage.ts` | Recently placed order snapshot | Session browser fallback for order confirmation |

## Database Domain Map

Prisma models in `prisma/schema.prisma` group into these domains:

| Domain | Models |
| --- | --- |
| Identity/auth | `User`, `Address`; enums `Role`, `AuthProvider` |
| Catalog | `Category`, `Product`, `ProductVariant`, `ProductImage`; product status/category status enums |
| Cart/wishlist | `CartItem`, `Wishlist` |
| Orders | `Order`, `OrderItem`, `OrderStatusHistory`, `PaymentTransaction`, `InventoryLog`; order/payment/inventory enums |
| Reviews/social proof | `Review`, `Testimonial`; source/status enums |
| Promotions/settings | `PromoCode`, `PromoCodeUsage`, `StoreSettings`; promo enums |
| Contact/admin content | `ContactMessage`, `Banner`; contact/banner enums |

Important data-integrity note: `PromoCodeUsage` exists and seed data writes usage rows, but the checkout service currently increments `PromoCode.usedCount` without creating a `PromoCodeUsage` row for live orders.

## API Inventory

Legend:

- Auth: `public`, `user`, `admin`, `nextauth`, or mixed per method.
- Validation lists the main Zod schema(s) observed in the route.
- Cache lists read cache or invalidated tags.
- Models/services lists the primary service module and core database model(s), not every nested relation.

| API | Auth | Validation | Models/services | Cache and notes |
| --- | --- | --- | --- | --- |
| `GET /api/admin/banners` | admin | none | `banner.service`, `Banner`, `Category` | Reads cached `admin-banners`. |
| `POST /api/admin/banners/carousel` | admin | `createCarouselBannerSchema` | `Banner` | Revalidates `admin-banners`, `carousel-banners`. |
| `PATCH/DELETE /api/admin/banners/carousel/[id]` | admin | `updateCarouselBannerSchema` for PATCH | `Banner` | Revalidates `admin-banners`, `carousel-banners` via shared tag constant. |
| `POST /api/admin/banners/category` | admin | `createCategoryBannerSchema` | `Banner`, `Category` | Revalidates `admin-banners`, `category-banners`, `home-categories`. |
| `PATCH/DELETE /api/admin/banners/category/[id]` | admin | `updateCategoryBannerSchema` for PATCH | `Banner`, `Category` | Revalidates category banner/home tags via shared constant. |
| `POST /api/admin/banners/deal` | admin | `createDealBannerSchema` | `Banner` | Revalidates `admin-banners`, `deal-banners`. |
| `PATCH/DELETE /api/admin/banners/deal/[id]` | admin | `updateDealBannerSchema` for PATCH | `Banner` | Revalidates `admin-banners`, `deal-banners`. |
| `POST /api/admin/banners/promo` | admin | `createPromoBannerSchema` | `Banner` | Revalidates `admin-banners`, `promo-banners`. |
| `PATCH/DELETE /api/admin/banners/promo/[id]` | admin | `updatePromoBannerSchema` for PATCH | `Banner` | Revalidates `admin-banners`, `promo-banners`. |
| `POST /api/admin/banners/top` | admin | `createTopBannerSchema` | `Banner` | Revalidates `admin-banners`, `top-banners`. |
| `PATCH/DELETE /api/admin/banners/top/[id]` | admin | `updateTopBannerSchema` for PATCH | `Banner` | Revalidates `admin-banners`, `top-banners`. |
| `POST /api/admin/courier` | admin | `courierCheckSchema` | `courier.service`, external courier API | No cache. Uses server-only `CUSTOMER_INFO_CHECKER_API`. |
| `GET /api/admin/dashboard` | admin | none | `dashboard.service`, `Order`, `OrderItem`, `User`, `Product`, `ContactMessage` | No explicit cache; heavy aggregate payload. |
| `GET /api/admin/messages` | admin | `adminMessageQuerySchema` | `contact.service`, `ContactMessage` | Reads cached `admin-messages`. |
| `PATCH/DELETE /api/admin/messages/[id]` | admin | `updateMessageStatusSchema` for PATCH | `ContactMessage` | Revalidates `admin-messages`. |
| `GET /api/admin/orders` | admin | `adminOrderQuerySchema` | `order.service`, `Order`, `OrderItem`, `User` | Reads cached `admin-orders`. |
| `GET /api/admin/orders/[id]` | admin | none | `Order`, `OrderItem`, `StatusHistory` | No cache; direct detail read. |
| `PATCH /api/admin/orders/[id]/payment-status` | admin | `updatePaymentStatusSchema` | `Order` | Revalidates `admin-orders`. |
| `PATCH /api/admin/orders/[id]/status` | admin | `updateOrderStatusSchema` | `Order`, `OrderStatusHistory`, `InventoryLog`, `ProductVariant` | Revalidates `admin-orders`, `home-categories`, `categories`. |
| `GET /api/admin/reports` | admin | `reportQuerySchema` | `report.service`, most business models | No cache; potentially expensive report generation. |
| `GET /api/admin/reviews` | admin | `adminReviewQuerySchema` | `review.service`, `Review`, `Product`, `User` | Reads direct service list; no explicit cache. |
| `POST /api/admin/reviews` | admin | `createAdminReviewSchema` | `Review`, `Product` | Revalidates `admin-reviews`. |
| `DELETE /api/admin/reviews/[id]` | admin | none | `Review` | Revalidates `admin-reviews`. |
| `GET /api/admin/settings` | admin | none | `settings.service`, `StoreSettings` | Reads cached `store-settings`. |
| `PATCH /api/admin/settings` | admin | `updateStoreSettingsSchema` | `StoreSettings` | Revalidates `store-settings`, `cart`. |
| `GET /api/admin/settings/promo-codes` | admin | none | `PromoCode` | Reads cached `promo-codes`. |
| `POST /api/admin/settings/promo-codes` | admin | `createPromoCodeSchema` | `PromoCode` | Revalidates `promo-codes`, `cart`. |
| `PATCH/DELETE /api/admin/settings/promo-codes/[id]` | admin | `updatePromoCodeSchema` for PATCH | `PromoCode` | Revalidates `promo-codes`, `cart`. |
| `GET /api/admin/testimonials` | admin | `adminTestimonialQuerySchema` | `testimonial.service`, `Testimonial` | Direct admin list; public testimonials cached separately. |
| `POST /api/admin/testimonials` | admin | `createTestimonialSchema` | `Testimonial` | Revalidates `testimonials`. |
| `PATCH/DELETE /api/admin/testimonials/[id]` | admin | `updateTestimonialSchema` for PATCH | `Testimonial` | Revalidates `testimonials`. |
| `POST /api/admin/testimonials/from-review` | admin | `createTestimonialFromReviewSchema` | `Review`, `Testimonial` | Revalidates `testimonials`. |
| `GET /api/admin/users` | admin | `adminUserQuerySchema` | `user.service`, `User`, order aggregates | Reads cached `admin-users`. |
| `GET /api/admin/users/[id]` | admin | none | `User`, order aggregates | No cache; direct detail read. |
| `PATCH /api/admin/users/[id]/role` | admin | `updateUserRoleSchema` | `User` | Self-demotion blocked; last-admin invariant in service; revalidates `admin-users`. |
| `GET/POST /api/auth/[...nextauth]` | nextauth | Auth.js provider validation | `auth.ts`, `User` | Credentials login rate-limited; Google sign-in upserts user. |
| `POST /api/auth/register` | public | `registerSchema` | `User` | Origin check, content-type check, IP rate limit; revalidates `admin-users`. |
| `GET /api/cart` | user | none | `cart.service`, `CartItem`, `Product`, `ProductVariant` | No server cache; user-specific. |
| `POST /api/cart` | user | `addToCartSchema` | `CartItem`, `ProductVariant` | Content-type check. |
| `PUT /api/cart` | user | `syncCartSchema` | `CartItem`, `ProductVariant` | Bulk sync from client state. |
| `PATCH/DELETE /api/cart/[id]` | user | `updateCartItemSchema` for PATCH | `CartItem` | Ownership scoped by user ID. |
| `DELETE /api/cart/clear` | user | none | `CartItem` | Clears current user's cart. |
| `POST /api/cart/merge` | user | `syncCartSchema` | `CartItem`, `ProductVariant` | Login-time guest cart merge. |
| `GET /api/categories` | public | `categoryQuerySchema` | `category.service`, `Category`, optional product count | Reads cached `categories`. |
| `POST /api/categories` | admin | `createCategorySchema` | `Category` | Revalidates `categories`, `home-categories`. |
| `GET /api/categories/[id]` | public | route param | `Category` | Direct read. |
| `PATCH/DELETE /api/categories/[id]` | admin | `updateCategorySchema` for PATCH | `Category`, `Product` on hard delete | Revalidates `categories`, `home-categories`; DELETE hard-deletes category and products. |
| `POST /api/checkout` | user | `checkoutSchema` | `checkout.service`, `User`, `CartItem`, `Product`, `ProductVariant`, `Order`, `OrderItem`, `InventoryLog`, `PromoCode`, `StoreSettings` | Server recomputes price; revalidates `admin-orders`, `home-categories`, `categories`. |
| `POST /api/checkout/preview` | user | `checkoutPreviewSchema` | checkout pricing services | No write; DB-priced preview. |
| `POST /api/contact` | public | `contactMessageSchema` | `ContactMessage` | Origin check, content-type check, IP rate limit; revalidates `admin-messages`; client also attempts EmailJS notification. |
| `POST /api/orders` | user | `checkoutSchema` | Same as checkout | Alias over `placeOrder`; revalidates same tags. |
| `GET /api/orders/[id]` | user | route param | `Order`, `OrderItem`, `StatusHistory` | Owner-scoped unless admin; no IDOR existence leak intent. |
| `PATCH /api/orders/[id]/cancel` | user | optional reason from service flow | `Order`, `ProductVariant`, `InventoryLog`, `StatusHistory` | Revalidates `admin-orders`, `home-categories`, `categories`. |
| `GET /api/orders/my-orders` | user | `orderQuerySchema` | `Order`, `OrderItem` | User-scoped list, no cache. |
| `GET /api/products` | public | `productQuerySchema` | `product.service`, `Product`, `ProductVariant`, `ProductImage`, `Category` | Direct uncached list; includes `buyingPrice` only for admin session. |
| `POST /api/products` | admin | `createProductSchema` | `Product`, variants/images | Revalidates `home-categories`, `categories`. |
| `GET /api/products/[id]` | public | route param | `Product`, variants/images/category | Direct read; admin-only fields gated by session role. |
| `PATCH/DELETE /api/products/[id]` | admin | `updateProductSchema` for PATCH | `Product`, variants/images | Revalidates `home-categories`, `categories`; DELETE hard-deletes product. |
| `GET /api/reviews` | public | `reviewQuerySchema` | `Review`, `Product`, `User` | No cache; product review page reads live. |
| `POST /api/reviews` | user | `createReviewSchema` | `Review`, `Order`, `OrderItem`, `User` | Requires delivered product; revalidates `admin-reviews`. |
| `GET /api/reviews/reviewable` | user | none | delivered `OrderItem`, `Review` | User-scoped review eligibility. |
| `POST /api/upload` | user | multipart form, image field | `upload.service`, ImgBB | IP rate limit; 32MB and MIME validation; server-only `IMGBB_API_KEY`. |
| `GET /api/user/me` | user | optional `include=overview` | `User`, `Order`, `CartItem`, `Wishlist` | User-scoped profile and overview. |
| `PATCH /api/user/me` | user | `updateProfileSchema` | `User` | Updates own profile. |
| `PATCH /api/user/me/password` | user | `changePasswordSchema` | `User` | Current password rules for credential accounts; hashes new password. |
| `GET /api/wishlist` | user | none | `Wishlist`, `Product` | User-scoped list, no cache. |
| `POST /api/wishlist` | user | `addWishlistItemSchema` | `Wishlist`, `Product` | Adds product. |
| `PUT /api/wishlist` | user | `syncWishlistSchema` | `Wishlist`, `Product` | Bulk sync from client. |
| `DELETE /api/wishlist` | user | none | `Wishlist` | Clears current user's wishlist. |
| `DELETE /api/wishlist/[productId]` | user | route param | `Wishlist` | Product-scoped removal. |
| `POST /api/wishlist/merge` | user | `syncWishlistSchema` | `Wishlist`, `Product` | Login-time guest wishlist merge. |

## Cache and Revalidation Map

Server cache uses `unstable_cache` with `revalidateTag(tag, "max")` via direct calls or `lib/cache/revalidation.ts`. Route handlers are not cached by default. Most client fetches use `cache: "no-store"`, which is right for authenticated/admin mutation-heavy screens but limits reuse on public catalog surfaces.

| Cached data | File | TTL | Tag(s) | Invalidated by |
| --- | --- | --- | --- | --- |
| Category list | `lib/services/category.service.ts` | 300s | `categories` | category writes, product writes, order/checkout stock changes |
| Category by slug | `lib/services/category.service.ts` | 300s | `categories` | same as category list |
| Home categories/products | `lib/services/home-categories.service.ts` | 300s | `home-categories` | category/product writes, order/checkout stock changes, category banners |
| Admin banners aggregate | `lib/services/banner.service.ts` | 300s | `admin-banners` | all banner writes |
| Public carousel banners | `lib/services/banner.service.ts` | 300s | `carousel-banners` | carousel banner writes |
| Public deal banners | `lib/services/banner.service.ts` | 300s | `deal-banners` | deal banner writes |
| Public promo banners | `lib/services/banner.service.ts` | 300s | `promo-banners` | promo banner writes |
| Public top banners | `lib/services/banner.service.ts` | 300s | `top-banners` | top banner writes |
| Store settings | `lib/services/settings.service.ts` | 600s | `store-settings` | settings writes |
| Promo codes | `lib/services/settings.service.ts` | 300s | `promo-codes` | promo-code writes |
| Admin orders | `lib/services/order.service.ts` | 300s | `admin-orders` | checkout/order create, cancel, status/payment writes |
| Admin users | `lib/services/user.service.ts` | 300s | `admin-users` | registration, role writes |
| Admin messages | `lib/services/contact.service.ts` | 300s | `admin-messages` | contact submit, message status/delete |
| Public testimonials | `lib/services/testimonial.service.ts` | 300s | `testimonials` | testimonial writes/imports |
| Sitemap | `app/sitemap.ts` | 3600s | route `revalidate` | timed ISR-style regeneration |

Observed cache gaps:

- Public product list/detail APIs are direct DB reads with no `unstable_cache` or `use cache`.
- Dashboard and reports are uncached and aggregation-heavy.
- Client pages call most APIs with `cache: "no-store"`, including some read-mostly admin reference data.
- `next.config.ts` does not enable `cacheComponents`; the app uses the previous `unstable_cache` model.

## Redux State Map

| Slice | Primary data | Hydration/source | Main API wrapper |
| --- | --- | --- | --- |
| `homeCategories` | Home category/product rails | Server/page data into Redux where used | `lib/services/home-categories.service.ts` on server |
| `allProducts` | Public product listing | Client fetch after mount | `features/products/api.ts` |
| `wishlist` | Wishlist items, mode, loading/error | localStorage first, server after auth | `features/wishlist/api.ts`, `features/wishlist/storage.ts` |
| `cart` | Cart items, summary, mode, loading/error | localStorage first, server after auth | `features/cart/api.ts`, `features/cart/storage.ts`, `features/cart/summary.ts` |
| `adminProducts` | Admin product table state | Client fetch snapshot | `features/admin-products/api.ts` plus direct fetches in `app/admin/products/page.tsx` |
| `adminOrders` | Admin orders table state | Client fetch snapshot | `features/admin-orders/api.ts` |
| `adminUsers` | Admin users table state | Client fetch snapshot | `features/admin-users/api.ts` |
| `adminCategories` | Admin categories table state | Client fetch snapshot | `features/admin-categories/api.ts` |
| `adminBanners` | Carousel/category/top/deal/promo banners | Client fetch bundle | `features/admin-banners/api.ts` |
| `adminSettings` | Store settings and promo codes | Client fetch two endpoints | `features/admin-settings/api.ts` |
| `adminMessages` | Contact messages | Client fetch snapshot | `features/admin-messages/api.ts` |
| `adminReports` | Report filters/payload/error | Client fetch by query | `features/admin-reports/api.ts` |
| `adminReviews` | Admin reviews | Client fetch snapshot | `features/admin-reviews/api.ts` |
| `adminTestimonials` | Admin testimonials | Client fetch snapshot | `features/admin-testimonials/api.ts` |

Redux performance risks:

- Admin list pages fetch up to `API_PAGE_SIZE = 100` records and then do filtering/search client-side. This is acceptable for small data but becomes expensive as orders/users/products/messages grow.
- Public products page fetches all active products and stores them in Redux, then filters/sorts locally. This can become a large first-load payload and delays SEO-visible product listing content.
- Some mutations are implemented through direct `fetch` calls inside pages rather than feature API wrappers, which makes auditing and request-policy changes harder.

## External Service and Environment Map

Environment names observed, without values:

| Variable | Exposure | Used by | Risk note |
| --- | --- | --- | --- |
| `DATABASE_URL` | server-only | `lib/db/prisma.ts` | Read at module import time; see finding F1. |
| `AUTH_SECRET` | server-only | Auth.js runtime | Required for JWT/session signing. |
| `AUTH_URL` | server-only | `lib/auth/origin.ts` | Origin check is bypassed if unset. |
| `AUTH_GOOGLE_ID` | server-only | Google provider config | OAuth client ID; not copied to client here. |
| `AUTH_GOOGLE_SECRET` | server-only | Google provider config | OAuth secret. |
| `NEXT_PUBLIC_SITE_URL` | public | SEO/site config | Public by design. |
| `IMGBB_API_KEY` | server-only | `upload.service` | Properly kept behind `/api/upload`. |
| `CUSTOMER_INFO_CHECKER_API` | server-only | `courier.service` | Properly kept behind admin API. |
| `NEXT_PUBLIC_EMAILJS_SERVICE_ID` | public | contact form client | Public EmailJS identifiers. |
| `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID` | public | contact form client | Public EmailJS identifiers. |
| `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY` | public | contact form client | Public key by EmailJS design, but still abuse-prone. |

No `.env.example` file was found by `rg --files -g '.env.example' -g '*.env.example'` during this scan.

## Security and Performance Findings

### F1 - High - Prisma client is initialized at module scope

Evidence: `lib/db/prisma.ts` constructs `new PrismaPg({ connectionString: process.env.DATABASE_URL! })` and `new PrismaClient({ adapter })` at import time.

Impact:

- Next build/static evaluation can load server modules before runtime env is available.
- Serverless cold-start and test environments are less controllable.
- It conflicts with the local Next.js 16 guidance to lazily initialize DB and SDK clients.

Recommendation:

- Replace exported `prisma` singleton with a lazy `getPrisma()` or lazy proxy pattern.
- Keep dev global reuse, but construct the adapter and client inside the getter.
- Then update service imports in a focused refactor.

### F2 - High - Dependency audit currently fails

Evidence: `npm audit --audit-level=low` exits `1` with 10 vulnerabilities:

- 1 critical: `vitest <3.2.6`.
- 1 high: `hono <=4.12.24`.
- 7 moderate, including `@hono/node-server`, `dompurify`, `esbuild`, `js-yaml`, `postcss`.
- 1 low.

Impact:

- Some are dev/transitive, but the audit gate is failing and should be resolved or explicitly accepted.
- `npm audit fix --force` suggests breaking downgrades for some paths, so do not apply force blindly.

Recommendation:

- First run `npm audit fix` and inspect lockfile changes.
- Upgrade `vitest` to a patched compatible version.
- Check whether Prisma/Next transitive advisories have patched releases before force actions.
- Track any accepted dev-only advisories in a security note.

### F3 - High - In-memory rate limits are not production-distributed

Evidence: `lib/auth/rate-limit.ts` stores buckets in a process-local `Map`. It protects login, registration, contact, and upload routes.

Impact:

- Multiple server instances do not share limits.
- Server restarts reset production buckets.
- Attackers can bypass limits across regions/instances.

Recommendation:

- Move rate limits to shared storage such as Redis/Upstash/Vercel KV.
- Keep the existing API shape but swap the implementation behind `rateLimit`.
- Add route-specific keys for login, registration, contact, upload, and potentially checkout/review creation.

### F4 - High - Promo usage audit table is not written by live checkout

Evidence: `PromoCodeUsage` exists in `prisma/schema.prisma` and seed data creates usage records, but `lib/services/checkout.service.ts` only increments `PromoCode.usedCount`.

Impact:

- Promo usage cannot be reliably audited per order/user.
- `usedCount` can drift from real usage if order creation later changes.
- Per-user promo limits cannot be implemented safely without usage rows.

Recommendation:

- In the same checkout transaction that creates `Order`, create `PromoCodeUsage` when `promo?.ok`.
- Consider deriving `usedCount` from usage rows or keep both with transactional invariants.
- Add regression tests for promo application and duplicate usage handling.

### F5 - Medium - Proxy exists but must not be treated as the only authorization layer

Evidence: `proxy.ts` redirects unauthenticated users away from `/admin`, `/profile`, `/checkout` and checks admin role for `/admin`.

Impact:

- Proxy is useful for navigation UX, but direct route calls must still authorize.
- The local Next docs explicitly say proxy is not full session management/authorization.

Current state:

- Most route handlers do re-check with `requireAdmin` or `requireUser`.
- Public GET plus protected write methods are mixed in category/product/review routes and should remain carefully documented.

Recommendation:

- Keep route-level guards as the source of truth.
- Add tests or scripted checks that every admin mutation route uses `requireAdmin`/`adminRoute`.

### F6 - Medium - Public catalog APIs are uncached and client-heavy

Evidence:

- `GET /api/products` and `GET /api/products/[id]` call direct product service reads.
- `features/products/api.ts` fetches product data into Redux, and `app/(shop)/products/page.tsx` filters locally.

Impact:

- Product listing traffic hits DB more often than needed.
- Client receives more data than necessary as catalog grows.
- SEO/listing first paint depends on client fetch instead of server-rendered/cached data.

Recommendation:

- Add cached public product list/detail helpers with tags such as `products`.
- Revalidate `products`, `categories`, and `home-categories` on product writes and order stock changes.
- Move product listing filtering/search into URL-backed server queries or paginated API calls.

### F7 - Medium - Admin dashboard and reports perform heavy uncached aggregations

Evidence:

- `dashboard.service.ts` runs multiple aggregates and several list fetches per `/api/admin/dashboard`.
- `report.service.ts` builds sales/orders/products/profit/inventory/customers/categories reports with broad reads and JS aggregation.

Impact:

- Slow admin experience as order/product volume grows.
- Repeated reports can pressure the database.

Recommendation:

- Cache dashboard overview briefly with an admin-only tag, or use a short TTL such as 30-60 seconds.
- Add database indexes based on report filters if query plans show scans.
- Consider materialized/stat tables for sales/profit dashboards if traffic grows.

### F8 - Medium - Admin list pages fetch full snapshots and filter on client

Evidence: admin feature APIs use `API_PAGE_SIZE = 100`; pages fetch snapshots then filter/search in React/Redux.

Impact:

- Tables get slower as rows grow.
- The client receives more PII/admin data than required for the current view.

Recommendation:

- Move admin table filters/search/pagination to URL query params and server APIs.
- Fetch only current page rows.
- Keep Redux for optimistic row patches, not whole-domain snapshots.

### F9 - Medium - Security headers are thin

Evidence: `next.config.ts` adds only `X-Robots-Tag` for private/API paths. No CSP, HSTS, frame, permissions, or MIME sniffing headers were observed.

Impact:

- Browser-level defense against XSS/clickjacking/misuse is weaker than it should be.
- Public EmailJS and image upload flows increase the value of CSP.

Recommendation:

- Add a Content Security Policy that accounts for Next, images, EmailJS, Google OAuth, and ImgBB.
- Add `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Frame-Options` or CSP `frame-ancestors`, and HSTS for HTTPS production.

### F10 - Medium - Duplicate order creation surface

Evidence: `POST /api/checkout` and `POST /api/orders` both call `checkout.service.placeOrder` with the same `checkoutSchema`.

Impact:

- More API surface to test and protect.
- Client confusion around canonical order creation route.

Recommendation:

- Pick one canonical creation endpoint.
- Keep the other as a deprecated alias only if needed, with tests ensuring identical behavior.

### F11 - Medium - Hard delete paths can remove catalog data

Evidence:

- `DELETE /api/products/[id]` calls `hardDeleteProduct`.
- `DELETE /api/categories/[id]` calls `hardDeleteCategoryWithProducts`.

Impact:

- Admin mistakes can permanently remove catalog rows.
- Related order item snapshots survive, but product/category analytics and historical catalog context degrade.

Recommendation:

- Prefer soft delete/status deactivation for admin UI by default.
- Reserve hard delete for a separate dangerous maintenance action with confirmation and audit logging.

### F12 - Low - API response envelopes are not fully uniform

Evidence:

- Most routes use `{ success: true, data, meta? }`.
- `POST /api/auth/register` returns `{ user }` directly.

Impact:

- Client parsing is less consistent.
- Error/success handling utilities cannot be fully shared.

Recommendation:

- Standardize all non-Auth.js custom routes on `ok`/`created` envelopes unless there is a compatibility reason not to.

### F13 - Low - `.env.example` is missing from the scanned repo

Evidence: no `.env.example` or `*.env.example` file was found by `rg`.

Impact:

- Onboarding and deployment are more error-prone.
- It is harder to distinguish server-only and public env vars.

Recommendation:

- Add `.env.example` with variable names only and comments about server-only vs `NEXT_PUBLIC_`.
- Never commit real values.

## Positive Controls Already Present

- Current Next/React versions are on a modern patched line: Next `16.2.6`, React `19.2.4`.
- Service modules use `server-only`, reducing accidental client imports.
- Auth route guards are centralized in `lib/api/guards.ts`.
- Admin route wrappers in `lib/api/handlers.ts` centralize JSON parsing, validation, error mapping, and tag revalidation.
- Public contact/register endpoints have origin checks and rate limits.
- Uploads are authenticated, IP rate-limited, size-limited, and MIME-checked before ImgBB upload.
- Checkout recomputes all money server-side and atomically decrements stock inside a transaction.
- Order detail reads are user-scoped, limiting IDOR risk.
- Product serialization hides `buyingPrice` unless the caller is an authenticated admin.

## Verification Results

Commands run on 2026-07-05:

| Command | Result | Notes |
| --- | --- | --- |
| `npm run lint` | Pass with warnings | 0 errors, 2 warnings: unused eslint-disable in `features/branding/pdf.ts`, unused `y` in `features/orders/pdf.ts`. |
| `npm test` | Pass | 2 files, 22 tests passed. |
| `npm audit --audit-level=low` | Fail | 10 vulnerabilities reported: 1 low, 7 moderate, 1 high, 1 critical. |

`npm run build` was not run as part of this report because the requested mandatory checks already exposed actionable audit findings and build can be slower/noisier. Run it before shipping optimization/security changes.

## Recommended Execution Order

1. Fix dependency audit without blind `--force`; prioritize `vitest`, `hono`, `dompurify`, and Prisma/Next transitive paths.
2. Refactor Prisma initialization to a lazy server-only getter.
3. Move rate limiting to shared storage.
4. Add promo usage writes inside checkout transaction.
5. Add security headers/CSP in `next.config.ts`.
6. Add cached product read paths and server/query pagination for public catalog.
7. Convert admin tables from full snapshots to server-paginated/filterable APIs.
8. Add tests for authorization coverage, promo usage, checkout aliases, and destructive catalog actions.

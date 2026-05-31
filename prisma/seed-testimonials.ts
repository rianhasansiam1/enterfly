import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

/**
 * One-off, non-destructive seed for the About page testimonials.
 *
 * Unlike the main `seed.ts` (which wipes the DB), this only inserts the
 * three demo testimonials when none exist yet, so it's safe to run
 * against a populated database.
 */
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.testimonial.count();
  if (existing > 0) {
    console.log(`Testimonials already present (${existing}). Skipping.`);
    return;
  }

  await prisma.testimonial.createMany({
    data: [
      {
        name: "Sneha Iyer",
        location: "Mumbai",
        image:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
        rating: 5,
        text: "EnterFly is my go-to for everyday shopping. Same-day delivery from local stores feels like magic, and the prices are unbeatable.",
        position: 0,
        status: "ACTIVE",
      },
      {
        name: "Karan Patel",
        location: "Bengaluru",
        image:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
        rating: 5,
        text: "Clean app, real deals, and genuine products. I love that every store is verified. Customer support helped me within minutes.",
        position: 1,
        status: "ACTIVE",
      },
      {
        name: "Nidhi Rao",
        location: "Pune",
        image:
          "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200",
        rating: 4,
        text: "The flash sale section keeps me coming back. Quality has been consistent across groceries, fashion, and electronics.",
        position: 2,
        status: "ACTIVE",
      },
    ],
  });

  console.log("Seeded 3 demo testimonials.");
}

main()
  .catch((error) => {
    console.error("Failed to seed testimonials:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

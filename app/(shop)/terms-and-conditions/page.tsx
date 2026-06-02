import type { Metadata } from "next";

import PolicyLayout, {
  PolicyContactBlock,
  PolicyList,
  PolicySection,
} from "../../../components/policy/PolicyLayout";
import { buildMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/seo/site";

/**
 * Terms & Conditions page.
 *
 * IMPORTANT: This is a professional starting template tailored to the
 * current EnterFly platform (credentials + Google login, guest checkout,
 * Cash on Delivery active, online "Pay Now" coming soon). The content
 * must be reviewed by a qualified legal professional before being used
 * in production, as legal requirements vary by jurisdiction.
 */

export const metadata: Metadata = buildMetadata({
  title: "Terms & Conditions",
  description: `Read the Terms & Conditions that govern your use of ${siteConfig.name}, including ordering, payment, delivery, and customer responsibilities.`,
  path: "/terms-and-conditions",
  keywords: ["terms and conditions", "terms of service", "user agreement", siteConfig.name],
});

const LAST_UPDATED = "2026-06-03";

export default function TermsAndConditionsPage() {
  return (
    <PolicyLayout
      title="Terms & Conditions"
      description={`Welcome to ${siteConfig.name}. These Terms & Conditions govern your access to and use of our website, products, and services. Please read them carefully before placing an order.`}
      lastUpdated={LAST_UPDATED}
    >
      <PolicySection
        title="1. Acceptance of Terms"
        intro={`By accessing, browsing, or placing an order on ${siteConfig.name} ("the Site"), you agree to be bound by these Terms & Conditions and all applicable laws and regulations. If you do not agree, please do not use the Site.`}
      />

      <PolicySection
        title="2. Website Usage Rules"
        intro="When using EnterFly, you agree to behave responsibly and lawfully."
      >
        <PolicyList
          items={[
            "Use the Site only for lawful purposes and personal, non-commercial shopping",
            "Do not attempt to gain unauthorized access to accounts, systems, or data",
            "Do not interfere with the security, availability, or normal operation of the Site",
            "Do not upload harmful content, malicious code, or misleading information",
            "Do not scrape, copy, or republish content from the Site without permission",
            "Respect other users when posting reviews, ratings, or messages",
          ]}
        />
        <p>
          We reserve the right to suspend or terminate access to any user who violates these rules,
          without prior notice where necessary.
        </p>
      </PolicySection>

      <PolicySection
        title="3. Account Responsibility"
        intro="You may create an account using email & password or by signing in with Google."
      >
        <PolicyList
          items={[
            "You are responsible for providing accurate and up-to-date account information",
            "Keep your login credentials confidential and do not share them with anyone",
            "Notify us immediately if you suspect unauthorized access to your account",
            "You are responsible for all activity that occurs under your account",
            "One person should not maintain multiple accounts to abuse promotions or offers",
          ]}
        />
        <p>
          Guest users who place orders without registering are also responsible for the accuracy of
          the contact, shipping, and order information they provide.
        </p>
      </PolicySection>

      <PolicySection
        title="4. Product Information and Pricing"
        intro="We strive to display accurate product details, images, and prices, but errors can occasionally occur."
      >
        <PolicyList
          items={[
            "Product colors and finishes may appear slightly different on different screens",
            "Specifications, availability, and prices are subject to change without notice",
            "Prices are shown in Bangladeshi Taka (BDT) unless stated otherwise",
            "In case of a pricing or stock error, we reserve the right to cancel or correct the order",
            "Promotional offers and coupon codes may have additional terms shown at checkout",
          ]}
        />
      </PolicySection>

      <PolicySection
        title="5. Order Placement"
        intro="Placing an order is a two-step process."
      >
        <PolicyList
          items={[
            "You submit an order through the checkout flow, either as a registered user or as a guest",
            "We confirm the order via email or on-site notification once it is accepted and ready to be processed",
            "An order is only legally binding once we issue an acceptance confirmation",
            "We may refuse or cancel orders for reasons including stock unavailability, suspected fraud, or pricing errors",
          ]}
        />
      </PolicySection>

      <PolicySection
        title="6. Order Cancellation"
        intro="You may request to cancel an order before it has been shipped."
      >
        <p>
          Once your order has been handed over to our courier partner, it cannot be cancelled but may
          still be eligible for return under our{" "}
          <a href="/return-policy" className="font-semibold text-violet-700 hover:underline">
            Return Policy
          </a>
          . We also reserve the right to cancel orders at our discretion, in which case any amount
          already paid will be refunded.
        </p>
      </PolicySection>

      <PolicySection
        title="7. Payment Terms"
        intro="We currently support the following payment options:"
      >
        <PolicyList
          items={[
            <>
              <span className="font-semibold text-gray-900">Cash on Delivery (COD):</span> Pay in cash
              when your order is delivered to your address. Please keep the exact amount ready when
              possible to make delivery smooth for you and our courier partners.
            </>,
            <>
              <span className="font-semibold text-gray-900">Pay Now (Coming Soon):</span> Online
              payment options are being developed and will be enabled soon. Until then, the Pay Now
              option may appear on the Site but is not yet active for placing orders.
            </>,
          ]}
        />
        <p>
          By choosing a payment method at checkout, you agree to honor the corresponding terms,
          including paying the full order amount and any applicable delivery charges.
        </p>
      </PolicySection>

      <PolicySection
        title="8. Cash on Delivery (COD) Terms"
        intro="To keep COD reliable for everyone, please note the following:"
      >
        <PolicyList
          items={[
            "COD is available only at supported delivery locations",
            "Our courier partner may verify the order with you by phone before dispatch",
            "Repeatedly refusing COD deliveries without valid reason may result in COD being restricted on your account",
            "COD orders may be cancelled if we are unable to reach you within a reasonable time",
          ]}
        />
      </PolicySection>

      <PolicySection
        title="9. Shipping and Delivery"
        intro="We work with trusted courier partners to deliver your orders safely and on time."
      >
        <PolicyList
          items={[
            "Estimated delivery timelines are shown at checkout and are subject to courier availability and your location",
            "Delivery times may be affected by weather, holidays, or other factors beyond our control",
            "It is your responsibility to provide an accurate, complete, and reachable delivery address",
            "Repeated failed delivery attempts due to incorrect information may result in additional charges or order cancellation",
            "Risk of loss or damage transfers to you once the order is delivered and accepted",
          ]}
        />
      </PolicySection>

      <PolicySection
        title="10. Returns and Refunds"
        intro="Returns, exchanges, and refunds are governed by our Return Policy."
      >
        <p>
          Please review the full{" "}
          <a href="/return-policy" className="font-semibold text-violet-700 hover:underline">
            Return Policy
          </a>{" "}
          for eligibility, time limits, non-returnable items, and the refund process. By placing an
          order, you agree to those terms in addition to these Terms & Conditions.
        </p>
      </PolicySection>

      <PolicySection
        title="11. Reviews and User Content"
        intro="You may submit reviews, ratings, and other content related to products."
      >
        <PolicyList
          items={[
            "Content must be honest, respectful, and based on your real experience",
            "Do not post offensive, defamatory, or unlawful content",
            "Do not include personal contact details, links, or promotional material in reviews",
            "By submitting content, you grant us a non-exclusive license to display, edit, and share it on the Site",
            "We may remove or edit content that violates these rules, at our discretion",
          ]}
        />
      </PolicySection>

      <PolicySection
        title="12. Intellectual Property"
        intro="All content on the Site — including logos, designs, text, images, and software — is owned by or licensed to EnterFly."
      >
        <p>
          You may not copy, reproduce, distribute, or create derivative works from any part of the
          Site without our prior written permission, except for personal, non-commercial use as
          intended by the platform.
        </p>
      </PolicySection>

      <PolicySection
        title="13. Limitation of Liability"
        intro="To the maximum extent permitted by law:"
      >
        <PolicyList
          items={[
            'EnterFly is provided on an "as is" and "as available" basis',
            "We do not guarantee uninterrupted, error-free, or completely secure operation of the Site",
            "We are not liable for indirect, incidental, or consequential damages arising from your use of the Site",
            "Our total liability for any claim related to an order shall not exceed the amount paid for that order",
          ]}
        />
        <p>
          Nothing in these terms excludes any liability that cannot be excluded under applicable law,
          including your statutory consumer rights.
        </p>
      </PolicySection>

      <PolicySection
        title="14. Privacy"
        intro="Your use of EnterFly is also governed by our Privacy Policy."
      >
        <p>
          Please review our{" "}
          <a href="/privacy-policy" className="font-semibold text-violet-700 hover:underline">
            Privacy Policy
          </a>{" "}
          to understand how we collect, use, and protect your information.
        </p>
      </PolicySection>

      <PolicySection
        title="15. Changes to These Terms"
        intro="We may update these Terms & Conditions from time to time to reflect changes in our services, technology, or applicable laws."
      >
        <p>
          When we make material changes, we will update the &quot;Last updated&quot; date at the top
          of this page. Your continued use of the Site after changes are posted constitutes
          acceptance of the updated terms.
        </p>
      </PolicySection>

      <PolicySection
        title="16. Governing Law"
        intro="These Terms & Conditions are governed by the laws of the People's Republic of Bangladesh, without regard to its conflict-of-laws principles. Any disputes arising from these terms shall be subject to the jurisdiction of the competent courts located in Dhaka, Bangladesh."
      />

      <PolicySection
        title="17. Contact Information"
        intro="If you have any questions about these Terms & Conditions, please reach out to us."
      >
        <PolicyContactBlock />
      </PolicySection>
    </PolicyLayout>
  );
}

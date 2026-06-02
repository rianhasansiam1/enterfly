import PolicySection from "../components/policy/PolicySection";
import PolicyList from "../components/policy/PolicyList";
import PolicyContactBlock from "../components/policy/PolicyContactBlock";

/**
 * The numbered content sections of the Return & Refund Policy page.
 * Kept separate from `page.tsx` so the route file is a thin shell and the
 * legal copy is easy to locate, audit, and update in isolation.
 */
export default function ReturnSections() {
  return (
    <>
      <PolicySection
        title="1. Overview"
        intro="At EnterFly, we want you to love what you ordered. If something isn't right, we'll do our best to make it right — within fair, transparent rules that protect both you and our team."
      >
        <p>
          This Return & Refund Policy explains when and how you can return items, request a refund,
          or arrange an exchange. By placing an order on EnterFly, you agree to the terms described
          below.
        </p>
      </PolicySection>

      <PolicySection
        title="2. Eligibility for Return"
        intro="An item is generally eligible for return when all of the following are true:"
      >
        <PolicyList
          items={[
            "The return request is submitted within the time limit described in section 3",
            "The item is unused, unworn, and in its original condition",
            "The item is returned with all original packaging, tags, labels, and accessories",
            "The item is not listed as non-returnable in section 5",
            "Proof of purchase (order ID or receipt) is provided",
          ]}
        />
      </PolicySection>

      <PolicySection
        title="3. Return Request Time Limit"
        intro="Return requests must be initiated within 7 (seven) days from the date of delivery."
      >
        <p>
          Requests submitted after this window may not be accepted, except in cases of a verified
          manufacturing defect or where required by applicable law. To start a return, please contact
          our customer support team with your order ID and a brief description of the issue.
        </p>
      </PolicySection>

      <PolicySection
        title="4. Product Condition Requirements"
        intro="To keep returns fair for everyone, returned items must arrive at our facility in resellable condition."
      >
        <PolicyList
          items={[
            "No signs of wear, washing, or use",
            "No scratches, dents, or damage caused after delivery",
            "All seals, stickers, and protective films intact where applicable",
            "Original box, manuals, warranty cards, and accessories included",
          ]}
        />
        <p>
          If a returned product fails our quality inspection, we reserve the right to refuse the return
          or apply a partial refund reflecting the reduced condition of the item.
        </p>
      </PolicySection>

      <PolicySection
        title="5. Non-Returnable Items"
        intro="For hygiene, safety, and product integrity reasons, the following items are not eligible for return or exchange (unless damaged or incorrect on arrival):"
      >
        <PolicyList
          items={[
            "Innerwear, lingerie, swimwear, and similar personal garments",
            "Cosmetics, skincare, and personal care items once opened or used",
            "Food, beverages, and other perishable goods",
            "Custom-made, personalized, or made-to-order products",
            "Digital products, downloadable content, and gift cards",
            'Items marked as "Final Sale" or "Non-returnable" on the product page',
          ]}
        />
      </PolicySection>

      <PolicySection
        title="6. Damaged, Defective, or Wrong Products"
        intro="If your order arrives damaged, defective, or different from what you ordered, we're sorry — and we'll make it right."
      >
        <PolicyList
          items={[
            "Contact our customer support within 48 hours of delivery",
            "Share your order ID and clear photos or a short video of the issue",
            "Keep the original packaging until the issue is resolved",
            "Do not use the item if it appears unsafe or unsealed",
          ]}
        />
        <p>
          Once verified, we will offer a replacement, exchange, or refund at no extra cost to you,
          based on stock availability and your preference.
        </p>
      </PolicySection>

      <PolicySection
        title="7. Refund and Exchange Process"
        intro="Once your return is received and inspected, we'll notify you of the outcome."
      >
        <PolicyList
          items={[
            "Approved returns are processed within 5–10 business days after inspection",
            "Refunds are issued to the original payment method where available",
            "Exchanges are subject to product availability; if unavailable, a refund will be offered",
            "Shipping fees from the original order are non-refundable, unless the return is due to our error",
            "Return shipping costs may be borne by the customer, except for damaged, defective, or wrong items",
          ]}
        />
      </PolicySection>

      <PolicySection
        title="8. Cash on Delivery (COD) Orders"
        intro="For orders paid via Cash on Delivery, refunds are handled a bit differently since no card or digital payment was made."
      >
        <PolicyList
          items={[
            "Approved COD refunds are issued through bank transfer, mobile financial services (such as bKash, Nagad, or Rocket), or in-store credit",
            "You will be asked to provide accurate recipient details so the refund can be sent securely",
            "Refund timelines may vary depending on the chosen method and your bank or operator",
            "Identity verification may be requested for higher-value refunds",
          ]}
        />
      </PolicySection>

      <PolicySection
        title="9. Cancellations"
        intro="You may request to cancel an order before it has been shipped."
      >
        <p>
          Once an order has been handed over to our courier partner, it can no longer be cancelled but
          may still be eligible for return under the conditions described above. To request a
          cancellation, contact our customer support as soon as possible with your order ID.
        </p>
      </PolicySection>

      <PolicySection
        title="10. How to Request a Return"
        intro="Starting a return is simple."
      >
        <PolicyList
          items={[
            "Reach out to our customer support team using the contact details below",
            "Share your order ID, the item(s) you want to return, and the reason for the return",
            "Attach clear photos if the issue involves damage or a wrong item",
            "Our team will guide you through the next steps, including pickup or drop-off instructions",
          ]}
        />
      </PolicySection>

      <PolicySection
        title="11. Customer Support"
        intro="Our team is here to help with any return-related question."
      >
        <PolicyContactBlock />
      </PolicySection>
    </>
  );
}

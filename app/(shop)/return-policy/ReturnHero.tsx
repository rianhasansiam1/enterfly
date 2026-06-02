import PolicyHero from "../components/policy/PolicyHero";

const TITLE = "Return & Refund Policy";
const DESCRIPTION =
  "We want you to shop with confidence. This policy explains when and how you can return items, request a refund, or arrange an exchange on EnterFly.";
const LAST_UPDATED = "2025-11-15";

/** Hero header specific to the Return & Refund Policy page. */
export default function ReturnHero() {
  return <PolicyHero title={TITLE} description={DESCRIPTION} lastUpdated={LAST_UPDATED} />;
}

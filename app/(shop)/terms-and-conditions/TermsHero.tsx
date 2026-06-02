import PolicyHero from "../components/policy/PolicyHero";

const TITLE = "Terms & Conditions";
const DESCRIPTION =
  "These Terms & Conditions govern your use of EnterFly and the orders you place with us. Please read them carefully before browsing, purchasing, or creating an account.";
const LAST_UPDATED = "2025-11-15";

/** Hero header specific to the Terms & Conditions page. */
export default function TermsHero() {
  return <PolicyHero title={TITLE} description={DESCRIPTION} lastUpdated={LAST_UPDATED} />;
}

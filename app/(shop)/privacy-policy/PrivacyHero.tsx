import PolicyHero from "../components/policy/PolicyHero";

const TITLE = "Privacy Policy";
const DESCRIPTION =
  "Your privacy matters to us. This policy explains what information we collect, how we use it, and the choices you have when shopping with EnterFly.";
const LAST_UPDATED = "2025-11-15";

/** Hero header specific to the Privacy Policy page. */
export default function PrivacyHero() {
  return <PolicyHero title={TITLE} description={DESCRIPTION} lastUpdated={LAST_UPDATED} />;
}

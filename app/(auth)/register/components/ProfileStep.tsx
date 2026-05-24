"use client";

import { MapPin, Phone } from "lucide-react";

import FloatField from "./FloatField";
import TermsCheckbox from "./TermsCheckbox";
import type { FieldUpdater, RegisterForm } from "./types";

type ProfileStepProps = {
  form: RegisterForm;
  onFieldChange: FieldUpdater;
};

export default function ProfileStep({ form, onFieldChange }: ProfileStepProps) {
  return (
    <>
      <FloatField
        icon={<Phone className="h-4 w-4" />}
        label="Phone number"
        value={form.phone}
        onChange={(value) => onFieldChange("phone", value)}
        type="tel"
        autoComplete="tel"
      />

      <FloatField
        icon={<MapPin className="h-4 w-4" />}
        label="City"
        value={form.city}
        onChange={(value) => onFieldChange("city", value)}
        autoComplete="address-level2"
      />

      <TermsCheckbox
        checked={form.agreeToTerms}
        onChange={(checked) => onFieldChange("agreeToTerms", checked)}
      />
    </>
  );
}

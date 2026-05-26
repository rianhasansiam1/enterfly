"use client";

import { MapPin, Phone } from "lucide-react";

import { FIELD_LIMITS } from "@/lib/auth/policy";

import FloatField from "@/app/(auth)/_components/FloatField";

import TermsCheckbox from "./TermsCheckbox";
import type { FieldUpdater, RegisterForm } from "../page";

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
        maxLength={FIELD_LIMITS.PHONE_MAX}
      />

      <FloatField
        icon={<MapPin className="h-4 w-4" />}
        label="City"
        value={form.city}
        onChange={(value) => onFieldChange("city", value)}
        autoComplete="address-level2"
        maxLength={FIELD_LIMITS.CITY_MAX}
      />

      <TermsCheckbox
        checked={form.agreeToTerms}
        onChange={(checked) => onFieldChange("agreeToTerms", checked)}
      />
    </>
  );
}

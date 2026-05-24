"use client";

import { Mail, User } from "lucide-react";

import { FIELD_LIMITS } from "@/lib/auth/policy";

import FloatField from "./FloatField";
import { SocialButtons, SocialDivider } from "./SocialButtons";
import type { FieldUpdater, RegisterForm } from "./types";

type AccountStepProps = {
  form: RegisterForm;
  emailValid: boolean;
  onFieldChange: FieldUpdater;
};

export default function AccountStep({
  form,
  emailValid,
  onFieldChange,
}: AccountStepProps) {
  return (
    <>
      <FloatField
        icon={<User className="h-4 w-4" />}
        label="Full name"
        value={form.name}
        onChange={(value) => onFieldChange("name", value)}
        autoComplete="name"
        maxLength={FIELD_LIMITS.NAME_MAX}
      />

      <FloatField
        icon={<Mail className="h-4 w-4" />}
        label="Email address"
        value={form.email}
        onChange={(value) => onFieldChange("email", value)}
        type="email"
        autoComplete="email"
        maxLength={FIELD_LIMITS.EMAIL_MAX}
        valid={form.email.length > 0 ? emailValid : null}
      />

      <SocialDivider />
      <SocialButtons />
    </>
  );
}

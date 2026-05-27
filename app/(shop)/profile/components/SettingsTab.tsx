"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Mail,
  MapPin,
  Phone,
  Save,
  User,
} from "lucide-react";

import {
  updateProfileOnServer,
  type ProfilePatch,
  type ProfileUser,
} from "@/features/profile/api";
import {
  EMAIL_REGEX,
  FIELD_LIMITS,
  PHONE_REGEX,
} from "@/lib/auth/policy";

import FloatField from "@/app/(auth)/_components/FloatField";

type SettingsTabProps = {
  user: ProfileUser;
  onUpdated: (user: ProfileUser) => void;
};

type FormState = {
  name: string;
  phone: string;
  city: string;
  image: string;
};

type SubmitState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "success" }
  | { status: "error"; message: string };

function toFormState(user: ProfileUser): FormState {
  return {
    name: user.name ?? "",
    phone: user.phone ?? "",
    city: user.city ?? "",
    image: user.image ?? "",
  };
}

/**
 * Compare the form against the original user record and return only
 * the fields that actually changed. Skips empty strings unless the
 * original had a value (clearing) so we don't push redundant updates.
 */
function buildPatch(user: ProfileUser, form: FormState): ProfilePatch {
  const patch: ProfilePatch = {};

  if (form.name.trim() !== (user.name ?? "")) {
    patch.name = form.name.trim();
  }
  if (form.phone.trim() !== (user.phone ?? "")) {
    patch.phone = form.phone.trim();
  }
  if (form.city.trim() !== (user.city ?? "")) {
    patch.city = form.city.trim();
  }
  if (form.image.trim() !== (user.image ?? "")) {
    patch.image = form.image.trim();
  }

  return patch;
}

function validate(form: FormState): Record<keyof FormState, boolean | null> {
  return {
    name:
      form.name.length === 0
        ? null
        : form.name.trim().length >= FIELD_LIMITS.NAME_MIN &&
          form.name.length <= FIELD_LIMITS.NAME_MAX,
    phone:
      form.phone.length === 0
        ? null
        : form.phone.length >= FIELD_LIMITS.PHONE_MIN &&
          form.phone.length <= FIELD_LIMITS.PHONE_MAX &&
          PHONE_REGEX.test(form.phone),
    city:
      form.city.length === 0
        ? null
        : form.city.trim().length >= FIELD_LIMITS.CITY_MIN &&
          form.city.length <= FIELD_LIMITS.CITY_MAX,
    image:
      form.image.length === 0
        ? null
        : /^https?:\/\//.test(form.image) && form.image.length <= 2048,
  };
}

/**
 * "Settings" tab — edit personal info.
 *
 * Email is shown as read-only because changing it touches identity
 * and we don't have an email-verification flow yet. The form streams
 * field-level validation through the same FloatField the auth pages
 * use, so the styling and accessibility behaviour stay consistent.
 */
export default function SettingsTab({ user, onUpdated }: SettingsTabProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(user));
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: "idle",
  });

  // Re-sync the form whenever the parent hands us a fresh user (e.g.
  // after a successful save round-trips back through the dashboard).
  useEffect(() => {
    setForm(toFormState(user));
  }, [user]);

  const validity = useMemo(() => validate(form), [form]);
  const patch = useMemo(() => buildPatch(user, form), [user, form]);
  const dirtyKeys = Object.keys(patch);
  const dirty = dirtyKeys.length > 0;

  const blockingError = useMemo(() => {
    if (!dirty) return null;
    for (const key of dirtyKeys) {
      const isValid = validity[key as keyof FormState];
      if (isValid === false) return "Please review the highlighted fields.";
    }
    return null;
  }, [dirty, dirtyKeys, validity]);

  const handleChange = (key: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSubmitState((prev) =>
      prev.status === "success" ? { status: "idle" } : prev,
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dirty || blockingError) return;

    setSubmitState({ status: "saving" });

    try {
      const updated = await updateProfileOnServer(patch);
      onUpdated(updated);
      setSubmitState({ status: "success" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save changes.";
      setSubmitState({ status: "error", message });
    }
  };

  const handleReset = () => {
    setForm(toFormState(user));
    setSubmitState({ status: "idle" });
  };

  // Email gets a read-only render because it's locked. The FloatField
  // matches the rest of the form so the layout stays uniform.
  const emailLooksValid = EMAIL_REGEX.test(user.email);

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6"
    >
      <header className="mb-5 flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-100 text-violet-700">
          <User className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-bold text-gray-900 sm:text-lg">
            Personal info
          </h2>
          <p className="text-xs text-gray-500">
            Update the details we use for your account and checkout.
          </p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <FloatField
          icon={<User className="h-4 w-4" />}
          label="Full name"
          value={form.name}
          onChange={handleChange("name")}
          autoComplete="name"
          maxLength={FIELD_LIMITS.NAME_MAX}
          valid={validity.name}
        />
        <div className="relative">
          <FloatField
            icon={<Mail className="h-4 w-4" />}
            label="Email address"
            value={user.email}
            onChange={() => undefined}
            autoComplete="email"
            valid={emailLooksValid ? true : null}
          />
          <span className="pointer-events-none absolute inset-0 cursor-not-allowed rounded-xl bg-violet-50/60" />
          <p className="mt-1 text-[11px] text-gray-500">
            Email is locked. Contact support to change it.
          </p>
        </div>
        <FloatField
          icon={<Phone className="h-4 w-4" />}
          label="Phone number"
          value={form.phone}
          onChange={handleChange("phone")}
          autoComplete="tel"
          maxLength={FIELD_LIMITS.PHONE_MAX}
          valid={validity.phone}
        />
        <FloatField
          icon={<MapPin className="h-4 w-4" />}
          label="City"
          value={form.city}
          onChange={handleChange("city")}
          autoComplete="address-level2"
          maxLength={FIELD_LIMITS.CITY_MAX}
          valid={validity.city}
        />
        <div className="sm:col-span-2">
          <FloatField
            icon={<ImageIcon className="h-4 w-4" />}
            label="Profile picture URL"
            value={form.image}
            onChange={handleChange("image")}
            autoComplete="url"
            maxLength={2048}
            valid={validity.image}
          />
          <p className="mt-1 text-[11px] text-gray-500">
            Paste a public image URL. Leave blank to use your initials.
          </p>
        </div>
      </div>

      {submitState.status === "error" && (
        <div className="mt-5 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {submitState.message}
        </div>
      )}

      {submitState.status === "success" && (
        <div className="mt-5 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          Profile updated successfully.
        </div>
      )}

      {blockingError && submitState.status !== "saving" && (
        <p className="mt-3 text-xs font-semibold text-rose-600">
          {blockingError}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500">
          {dirty
            ? `${dirtyKeys.length} pending ${dirtyKeys.length === 1 ? "change" : "changes"}.`
            : "All changes saved."}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={!dirty || submitState.status === "saving"}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-white px-4 text-sm font-bold text-violet-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={
              !dirty || submitState.status === "saving" || Boolean(blockingError)
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-violet-600 via-indigo-600 to-fuchsia-600 px-5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:from-gray-300 disabled:via-gray-300 disabled:to-gray-300 disabled:hover:translate-y-0"
          >
            <Save className="h-4 w-4" />
            {submitState.status === "saving" ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  );
}

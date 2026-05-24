export type RegisterStep = 0 | 1 | 2;

export type RegisterStatus = "idle" | "submitting" | "success";

export type RegisterForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  city: string;
  agreeToTerms: boolean;
};

export type PasswordScore = 0 | 1 | 2 | 3 | 4;

export type PasswordField = "password" | "confirmPassword";

export type FieldUpdater = <Field extends keyof RegisterForm>(
  field: Field,
  value: RegisterForm[Field],
) => void;

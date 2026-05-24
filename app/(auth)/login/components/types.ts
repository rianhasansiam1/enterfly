export type LoginStatus =
  | "idle"
  | "submitting"
  | "error"
  | "success";

export type LoginForm = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export type LoginFieldUpdater = <Field extends keyof LoginForm>(
  field: Field,
  value: LoginForm[Field],
) => void;

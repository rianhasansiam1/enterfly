"use client";

import { Eye, EyeOff } from "lucide-react";

type PasswordVisibilityButtonProps = {
  visible: boolean;
  onClick: () => void;
};

export default function PasswordVisibilityButton({
  visible,
  onClick,
}: PasswordVisibilityButtonProps) {
  return (
    <button
      type="button"
      aria-label={visible ? "Hide password" : "Show password"}
      onClick={onClick}
      className="p-1 text-gray-500 transition-colors hover:text-violet-700"
    >
      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}

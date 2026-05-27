"use client";

import { useState } from "react";
import emailjs from "@emailjs/browser";
import {
  Send,
  User,
  Mail,
  Phone,
  MessageSquare,
  Tag,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID ?? "";
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID ?? "";
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ?? "";

const subjects = [
  "General Inquiry",
  "Order Support",
  "Returns & Refunds",
  "Partnership / Sell on EnterFly",
  "Bug Report",
  "Other",
];

type Status = "idle" | "sending" | "sent" | "error";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState(subjects[0]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const emailJsConfigured = Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);

    const visitTime = new Date().toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const templateParams = {
      from_name: name,
      user_email: email,
      subject,
      phone: phone || "Not provided",
      message,
      visit_time: visitTime,
    };

    try {
      // 1) Persist to our own DB first so we never lose a message even
      //    if EmailJS hiccups. The API responds 201 on success and
      //    revalidates the admin "Messages" cache for us.
      const dbResponse = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          subject,
          message,
        }),
      });

      if (!dbResponse.ok) {
        let payload: unknown = null;
        try {
          payload = (await dbResponse.json()) as unknown;
        } catch {
          // ignore
        }
        const fallback = "We couldn't save your message. Please try again.";
        const apiError =
          payload && typeof payload === "object"
            ? ((payload as { error?: string }).error ?? fallback)
            : fallback;
        throw new Error(apiError);
      }

      // 2) Best-effort email notification. A failure here doesn't roll
      //    back the saved message — admin still sees it in the panel.
      if (emailJsConfigured) {
        try {
          await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, {
            publicKey: PUBLIC_KEY,
          });
        } catch (emailErr) {
          console.warn("[contact] EmailJS notification failed", emailErr);
        }
      } else {
        console.warn(
          "[contact] EmailJS not configured — message saved to DB only.",
        );
      }

      setStatus("sent");
      setName("");
      setEmail("");
      setPhone("");
      setSubject(subjects[0]);
      setMessage("");
      setTimeout(() => setStatus("idle"), 4000);
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    }
  };

  return (
    <section
      id="contact-form"
      className="grid gap-6 lg:grid-cols-5 lg:gap-8"
    >
      {/* Left: Contextual panel */}
      <div className="lg:col-span-2">
        <div className="relative h-full overflow-hidden rounded-3xl bg-linear-to-br from-violet-600 via-purple-600 to-pink-600 p-6 sm:p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-white/5 translate-y-1/3 -translate-x-1/3" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm ring-1 ring-white/20">
              <MessageSquare className="h-3.5 w-3.5 text-yellow-300" />
              <span className="text-[11px] font-bold uppercase tracking-wide">
                Drop a line
              </span>
            </div>

            <h2 className="mt-4 text-2xl font-black leading-tight tracking-tight sm:text-3xl">
              Let&apos;s start a conversation
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/90">
              Tell us about your question, idea, or feedback. The more context, the better we can help.
            </p>

            <ul className="mt-6 space-y-3">
              {[
                "Quick replies, usually within 2 hours",
                "Real humans, no bots or canned answers",
                "Available 7 days a week, 9am to 9pm",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-yellow-300" />
                  <span className="text-white/90">{tip}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-white/70">
                Prefer email?
              </p>
              <a
                href="mailto:support@enterfly.com"
                className="mt-1 block text-base font-black text-yellow-300 hover:underline"
              >
                support@enterfly.com
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="lg:col-span-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-violet-100 sm:p-8">
          <h3 className="text-xl font-black tracking-tight text-gray-900 sm:text-2xl">
            Send us a message
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Fill in the details below and we&apos;ll get back to you shortly.
          </p>

          <div className="my-5 h-0.5 w-full bg-linear-to-r from-violet-500 via-purple-400 to-transparent rounded-full" />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Full Name"
                icon={<User className="h-4 w-4" />}
                value={name}
                onChange={setName}
                placeholder="Your name"
                required
              />
              <Field
                label="Email"
                icon={<Mail className="h-4 w-4" />}
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                type="email"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Phone (optional)"
                icon={<Phone className="h-4 w-4" />}
                value={phone}
                onChange={setPhone}
                placeholder="+91 ..."
                type="tel"
              />

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-700">
                  Subject
                </label>
                <div className="relative">
                  <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="h-11 w-full appearance-none rounded-xl border border-violet-200 bg-white pl-9 pr-9 text-sm text-gray-800 shadow-sm transition-colors focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
                  >
                    {subjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-violet-500">
                    ▾
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-700">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us how we can help..."
                rows={5}
                required
                className="w-full resize-none rounded-xl border border-violet-200 bg-white p-3 text-sm text-gray-800 shadow-sm transition-colors placeholder:text-gray-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-xs text-gray-500">
                By sending, you agree to our{" "}
                <a href="/about" className="font-semibold text-violet-700 hover:underline">
                  Privacy Policy
                </a>
                .
              </p>

              <button
                type="submit"
                disabled={status === "sending" || status === "sent"}
                className="group inline-flex items-center gap-2 rounded-full bg-linear-to-r from-violet-600 to-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-violet-700 hover:to-purple-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-80"
              >
                {status === "sending" && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                )}
                {status === "sent" && (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Message Sent
                  </>
                )}
                {(status === "idle" || status === "error") && (
                  <>
                    <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    Send Message
                  </>
                )}
              </button>
            </div>

            {status === "error" && errorMsg && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}

type FieldProps = {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
};

function Field({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: FieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-700">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-violet-500">
          {icon}
        </span>
        <input
          type={type}
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl border border-violet-200 bg-white pl-9 pr-3 text-sm text-gray-800 shadow-sm transition-colors placeholder:text-gray-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
        />
      </div>
    </div>
  );
}

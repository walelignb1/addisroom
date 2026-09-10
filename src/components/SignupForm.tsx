"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  sendOtpCode,
  setPasswordAfterOtp,
  verifyOtpAndLogin,
  type SendOtpResult,
  type SetPasswordResult,
  type VerifyOtpResult,
} from "@/lib/auth-actions";
import { t, type Lang } from "@/lib/i18n";
import { PasswordInput } from "@/components/PasswordInput";

type Channel = "EMAIL" | "SMS";
type Step = "start" | "verify" | "setPassword";

export function SignupForm({
  lang,
  next,
}: {
  lang: Lang;
  next: string;
}) {
  const [channel, setChannel] = useState<Channel>("SMS");
  const [step, setStep] = useState<Step>("start");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [contact, setContact] = useState("");
  const [profileId, setProfileId] = useState<string | null>(null);

  const [sendState, sendAction, sendPending] = useActionState<
    SendOtpResult | null,
    FormData
  >(async (prev, fd) => {
    const result = await sendOtpCode(prev, fd);
    if (result.ok) {
      setChallengeId(result.challengeId);
      setPreviewCode(result.previewCode ?? null);
      setContact(String(fd.get("contact") ?? ""));
      setStep("verify");
    }
    return result;
  }, null);

  const [verifyState, verifyAction, verifyPending] = useActionState<
    VerifyOtpResult | null,
    FormData
  >(async (prev, fd) => {
    const result = await verifyOtpAndLogin(prev, fd);
    if (result.ok && result.needsPassword) {
      setProfileId(result.profileId);
      setStep("setPassword");
    }
    return result;
  }, null);

  const [passwordState, passwordAction, passwordPending] = useActionState<
    SetPasswordResult | null,
    FormData
  >(setPasswordAfterOtp, null);

  const inputClass =
    "mt-2 h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-[var(--foreground)] outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)]/25";

  const tabClass = (active: boolean) =>
    [
      "flex-1 rounded-xl py-2.5 text-sm font-semibold transition",
      active
        ? "bg-[var(--brand-600)] text-white shadow-sm"
        : "text-[var(--muted)] hover:bg-[var(--brand-50)]",
    ].join(" ");

  const loginParams = new URLSearchParams();
  if (lang !== "en") loginParams.set("lang", lang);
  if (next.startsWith("/")) loginParams.set("next", next);
  const loginHref = `/login${loginParams.toString() ? `?${loginParams}` : ""}`;

  if (step === "setPassword" && profileId) {
    return (
      <div className="space-y-4">
        <p className="rounded-xl bg-[var(--brand-50)] px-4 py-3 text-sm text-[var(--brand-800)]">
          {t(lang, "signup.setPasswordHint")}
        </p>
        <form action={passwordAction} className="space-y-4">
          <input type="hidden" name="profileId" value={profileId} />
          {next.startsWith("/") ? (
            <input type="hidden" name="next" value={next} />
          ) : null}
          <div>
            <label className="text-sm font-medium">{t(lang, "login.password")}</label>
            <PasswordInput
              lang={lang}
              name="password"
              required
              minLength={8}
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-medium">
              {t(lang, "signup.confirmPassword")}
            </label>
            <PasswordInput
              lang={lang}
              name="confirmPassword"
              required
              minLength={8}
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
          {passwordState && !passwordState.ok ? (
            <p className="text-sm text-red-600" role="alert">
              {passwordState.error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={passwordPending}
            className="btn-primary h-12 w-full disabled:opacity-60"
          >
            {passwordPending ? "…" : t(lang, "signup.savePassword")}
          </button>
        </form>
      </div>
    );
  }

  if (step === "verify" && challengeId) {
    return (
      <div className="space-y-4">
        <p className="rounded-xl bg-[var(--brand-50)] px-4 py-3 text-sm text-[var(--brand-800)]">
          {channel === "EMAIL"
            ? t(lang, "signup.otpSentEmail")
            : t(lang, "signup.otpSentSms")}{" "}
          <span className="font-semibold">{contact}</span>
        </p>
        {previewCode ? (
          <p className="rounded-xl border border-dashed border-[var(--brand-300)] bg-[var(--surface)] px-4 py-3 text-center font-mono text-lg tracking-widest text-[var(--brand-700)]">
            {t(lang, "signup.devCode")}: {previewCode}
          </p>
        ) : null}
        <form action={verifyAction} className="space-y-4">
          <input type="hidden" name="challengeId" value={challengeId} />
          {next.startsWith("/") ? (
            <input type="hidden" name="next" value={next} />
          ) : null}
          <div>
            <label className="text-sm font-medium">{t(lang, "signup.otpLabel")}</label>
            <input
              name="code"
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              autoComplete="one-time-code"
              placeholder="000000"
              className={`${inputClass} text-center font-mono text-lg tracking-[0.4em]`}
            />
          </div>
          {verifyState && !verifyState.ok ? (
            <p className="text-sm text-red-600" role="alert">
              {verifyState.error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={verifyPending}
            className="btn-primary h-12 w-full disabled:opacity-60"
          >
            {verifyPending ? "…" : t(lang, "signup.verify")}
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            setChallengeId(null);
            setStep("start");
          }}
          className="w-full text-sm font-medium text-[var(--brand-600)] hover:underline"
        >
          {t(lang, "signup.changeContact")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 rounded-2xl bg-[var(--background)] p-1">
        <button
          type="button"
          className={tabClass(channel === "SMS")}
          onClick={() => setChannel("SMS")}
        >
          {t(lang, "signup.smsTab")}
        </button>
        <button
          type="button"
          className={tabClass(channel === "EMAIL")}
          onClick={() => setChannel("EMAIL")}
        >
          {t(lang, "signup.emailTab")}
        </button>
      </div>
      <form action={sendAction} className="space-y-4">
        <input type="hidden" name="channel" value={channel} />
        <div>
          <label className="text-sm font-medium">{t(lang, "signup.name")}</label>
          <input
            name="name"
            required
            className={inputClass}
            placeholder="e.g. Robel"
          />
        </div>
        <div>
          <label className="text-sm font-medium">
            {t(lang, "signup.contact")}
          </label>
          <input
            name="contact"
            required
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder={
              channel === "EMAIL" ? "you@email.com" : "09xxxxxxxx"
            }
            className={inputClass}
          />
        </div>
        {sendState && !sendState.ok ? (
          <p className="text-sm text-red-600" role="alert">
            {sendState.error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={sendPending}
          className="btn-primary h-12 w-full disabled:opacity-60"
        >
          {sendPending ? "…" : t(lang, "signup.sendOtp")}
        </button>
      </form>
      <p className="text-center text-sm text-[var(--muted)]">
        {t(lang, "signup.haveAccount")}{" "}
        <Link
          href={loginHref}
          className="font-medium text-[var(--brand-600)] hover:underline"
        >
          {t(lang, "signup.signIn")}
        </Link>
      </p>
    </div>
  );
}

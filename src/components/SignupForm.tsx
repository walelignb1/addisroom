"use client";

import { useActionState, useState, useEffect } from "react";
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
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { PasswordInput } from "@/components/PasswordInput";

type Channel = "EMAIL" | "SMS";
type Step = "start" | "verify" | "setPassword";

export function SignupForm({ lang, next }: { lang: Lang; next: string }) {
  const [channel, setChannel] = useState<Channel>("EMAIL");
  const [step, setStep] = useState<Step>("start");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [contact, setContact] = useState("");
  const [fullName, setFullName] = useState("");
  const [canResend, setCanResend] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  const [sendState, sendAction, sendPending] = useActionState<
    SendOtpResult | null,
    FormData
  >(async (prev, fd) => {
    const result = await sendOtpCode(prev, fd);
    if (result.ok) {
      setFullName(String(fd.get("name") ?? ""));
      setCanResend(false);
      setChallengeId(result.challengeId);
      setPreviewCode(result.previewCode ?? null);
      setContact(String(fd.get("contact") ?? ""));
      setStep("verify");
    }
    return result;
  }, null);

  useEffect(() => {
    if (step !== "verify") return;
    const timer = setTimeout(() => setCanResend(true), 60000);
    return () => clearTimeout(timer);
  }, [challengeId, step]);

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

  const loginParams = new URLSearchParams();
  if (lang !== "en") loginParams.set("lang", lang);
  if (next.startsWith("/")) loginParams.set("next", next);
  const loginHref = `/login${loginParams.toString() ? `?${loginParams}` : ""}`;

  if (step === "setPassword" && profileId) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          {t(lang, "signup.contactVerified")}
        </h2>
        <p className="rounded-xl bg-[var(--brand-50)] px-4 py-3 text-sm text-[var(--brand-800)]">
          {t(lang, "signup.setPasswordHint")}
        </p>
        <form action={passwordAction} className="space-y-4">
          <input type="hidden" name="profileId" value={profileId} />
          {next.startsWith("/") ? (
            <input type="hidden" name="next" value={next} />
          ) : null}
          <div>
            <label className="text-sm font-medium">
              {t(lang, "login.password")}
            </label>
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
        <h2 className="text-lg font-semibold">
          {t(
            lang,
            channel === "EMAIL" ? "signup.checkEmail" : "signup.checkPhone",
          )}
        </h2>
        <p className="rounded-xl bg-[var(--brand-50)] px-4 py-3 text-sm text-[var(--brand-800)]">
          {previewCode
            ? t(lang, "signup.testVerify")
            : channel === "EMAIL"
              ? t(lang, "signup.otpSentEmail")
              : t(lang, "signup.otpSentSms")}{" "}
          <span className="font-semibold">{contact}</span>
        </p>
        {previewCode ? (
          <p className="rounded-xl border border-dashed border-[var(--brand-300)] bg-[var(--surface)] px-4 py-3 text-center font-mono text-lg tracking-widest text-[var(--brand-700)]">
            Local test mode — no message sent: {previewCode}
          </p>
        ) : null}
        <form action={verifyAction} className="space-y-4">
          <input type="hidden" name="challengeId" value={challengeId} />
          {next.startsWith("/") ? (
            <input type="hidden" name="next" value={next} />
          ) : null}
          <div>
            <label htmlFor="signup-code" className="text-sm font-medium">
              {t(lang, "signup.otpLabel")}
            </label>
            <input
              id="signup-code"
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
        <form action={sendAction}>
          <input type="hidden" name="name" value={fullName} />
          <input type="hidden" name="channel" value={channel} />
          <input type="hidden" name="contact" value={contact} />
          <button
            disabled={!canResend || sendPending}
            className="w-full text-sm font-medium text-[var(--brand-600)] disabled:opacity-50"
          >
            {sendPending
              ? "…"
              : t(lang, canResend ? "signup.resend" : "signup.resendWait")}
          </button>
          {sendState && !sendState.ok && (
            <p role="alert" className="text-sm text-red-700 mt-2">
              {sendState.error}
            </p>
          )}
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
      <GoogleSignInButton next={next} lang={lang} />
      <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
        <span className="h-px flex-1 bg-[var(--border)]" />
        {t(lang, "signup.orEmail")}
        <span className="h-px flex-1 bg-[var(--border)]" />
      </div>
      <p className="text-sm text-[var(--muted)]">
        {t(lang, "signup.emailFirstHint")}
      </p>
      <form action={sendAction} className="space-y-4">
        <input type="hidden" name="channel" value={channel} />
        <div>
          <label htmlFor="signup-full-name" className="text-sm font-medium">
            {t(lang, "signup.fullName")}
          </label>
          <input
            id="signup-full-name"
            name="name"
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            defaultValue={fullName}
            className={inputClass}
            placeholder="e.g. Robel"
          />
        </div>
        <div>
          <label htmlFor="signup-contact" className="text-sm font-medium">
            {t(
              lang,
              channel === "EMAIL"
                ? "signup.emailAddress"
                : "signup.phoneNumber",
            )}
          </label>
          <input
            key={channel}
            id="signup-contact"
            name="contact"
            required
            defaultValue={contact}
            type={channel === "EMAIL" ? "email" : "tel"}
            autoComplete={channel === "EMAIL" ? "email" : "tel"}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder={
              channel === "EMAIL"
                ? "you@gmail.com"
                : "+251 9xxxxxxxx or 07xxxxxxxx"
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
          {sendPending
            ? "…"
            : t(
                lang,
                channel === "EMAIL" ? "signup.sendEmailCode" : "signup.sendOtp",
              )}
        </button>
      </form>
      <button
        type="button"
        onClick={() => {
          setChannel(channel === "EMAIL" ? "SMS" : "EMAIL");
          setContact("");
        }}
        className="w-full text-sm font-medium text-[var(--brand-600)]"
      >
        {t(lang, channel === "EMAIL" ? "signup.usePhone" : "signup.useEmail")}
      </button>
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

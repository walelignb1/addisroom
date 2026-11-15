"use client";
import { useActionState } from "react";
import { reviewIdentityForm } from "@/lib/identity-actions";
export function AdminReviewForm({ profileId }: { profileId: string }) {
  const [state, action, pending] = useActionState(reviewIdentityForm, null);
  return (
    <form action={action} className="space-y-4 mt-4">
      <input type="hidden" name="profileId" value={profileId} />
      <label className="block text-sm">
        Review note
        <textarea
          name="note"
          required
          minLength={5}
          maxLength={500}
          rows={3}
          className="input-field mt-2"
        />
      </label>
      {state?.error && (
        <p role="alert" className="text-red-700 text-sm">
          {state.error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          disabled={pending}
          name="decision"
          value="APPROVED"
          className="btn-primary px-5 py-3 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Approve identity"}
        </button>
        <button
          disabled={pending}
          name="decision"
          value="REJECTED"
          className="rounded-xl border border-red-300 px-5 py-3 text-red-700 disabled:opacity-50"
        >
          Reject & request changes
        </button>
      </div>
    </form>
  );
}

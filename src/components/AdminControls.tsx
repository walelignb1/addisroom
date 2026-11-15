"use client";
import { useActionState, useState } from "react";
import {
  manageUser,
  verifyBroker,
  manageSponsorship,
  moderateListing,
  type AdminResult,
} from "@/lib/admin-actions";
function Feedback({ state }: { state: AdminResult }) {
  return state ? (
    <p
      role="status"
      className={`text-xs mt-2 ${state.error ? "text-red-700" : "text-green-800"}`}
    >
      {state.error ?? state.success}
    </p>
  ) : null;
}
export function UserControls({
  id,
  suspended,
  isAdmin,
  isSuperAdmin,
  canManageAdmin,
  self,
}: {
  id: string;
  suspended: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  canManageAdmin: boolean;
  self: boolean;
}) {
  const [state, action, pending] = useActionState(manageUser, null);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-wrap gap-2">
        {!isAdmin && !self && (
          <button
            disabled={pending}
            name="command"
            value={suspended ? "restore" : "suspend"}
            className="admin-button"
          >
            {suspended ? "Restore user" : "Suspend"}
          </button>
        )}
        {canManageAdmin && !self && !isSuperAdmin && (
          <button
            disabled={pending || suspended}
            name="command"
            value={isAdmin ? "revoke-admin" : "grant-admin"}
            className="admin-button"
          >
            {isAdmin ? "Revoke admin" : "Grant admin"}
          </button>
        )}
        {self && (
          <span className="text-xs text-[var(--muted)]">Your account</span>
        )}
        {isSuperAdmin && !self && (
          <span className="text-xs text-[var(--muted)]">Super admin</span>
        )}
      </div>
      <Feedback state={state} />
    </form>
  );
}
export function BrokerControl({
  id,
  verified,
  eligible,
}: {
  id: string;
  verified: boolean;
  eligible: boolean;
}) {
  const [state, action, pending] = useActionState(verifyBroker, null);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="approve" value={verified ? "false" : "true"} />
      <button
        className="admin-button"
        disabled={pending || (!verified && !eligible)}
      >
        {verified ? "Revoke badge" : "Verify agent"}
      </button>
      <Feedback state={state} />
    </form>
  );
}
export function SponsorForm() {
  const [state, action, pending] = useActionState(manageSponsorship, null);
  return (
    <form action={action} className="card p-5 sm:p-7 space-y-5">
      <input type="hidden" name="command" value="create" />
      {[
        [
          "headline",
          "Headline",
          "e.g. Discover trusted movers & home services in Addis",
        ],
        ["imageUrl", "Image URL (optional)", "https://…"],
        ["linkUrl", "Link URL (optional)", "https://…"],
      ].map(([name, label, placeholder], i) => (
        <div key={name}>
          <label htmlFor={name} className="block text-sm font-medium mb-2">
            {label}
          </label>
          <input
            id={name}
            name={name}
            type={i ? "url" : "text"}
            required={!i}
            maxLength={i ? 2000 : 120}
            placeholder={placeholder}
            className="input-field"
          />
          {!i && (
            <div className="mt-5">
              <label
                htmlFor="sponsor-body"
                className="block text-sm font-medium mb-2"
              >
                Body text
              </label>
              <textarea
                id="sponsor-body"
                name="body"
                required
                maxLength={500}
                rows={3}
                placeholder="Short supporting line shown under the headline"
                className="input-field !h-auto py-3"
              />
            </div>
          )}
        </div>
      ))}
      <button disabled={pending} className="btn-primary h-11 w-full">
        {pending ? "Posting…" : "Post sponsorship"}
      </button>
      <Feedback state={state} />
    </form>
  );
}
export function SponsorControls({
  id,
  active,
}: {
  id: string;
  active: boolean;
}) {
  const [state, action, pending] = useActionState(manageSponsorship, null);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <div className="flex gap-2">
        <button
          name="command"
          value={active ? "deactivate" : "activate"}
          disabled={pending}
          className="admin-button"
        >
          {active ? "Deactivate" : "Activate"}
        </button>
        <button
          name="command"
          value="delete"
          disabled={pending}
          onClick={(e) => {
            if (!window.confirm("Delete this sponsorship?")) e.preventDefault();
          }}
          className="admin-button text-red-700"
        >
          Delete
        </button>
      </div>
      <Feedback state={state} />
    </form>
  );
}
export function ListingModeration({
  id,
  archived,
}: {
  id: string;
  archived: boolean;
}) {
  const [state, action, pending] = useActionState(moderateListing, null);
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        className="admin-button"
        onClick={() => setOpen(!open)}
      >
        {archived ? "Restore listing" : "Remove listing"}
      </button>
      {open && (
        <form action={action} className="mt-3 space-y-2">
          <input type="hidden" name="id" value={id} />
          <input
            type="hidden"
            name="command"
            value={archived ? "restore" : "archive"}
          />
          <input
            name="note"
            aria-label="Moderation reason"
            required
            minLength={5}
            maxLength={300}
            placeholder="Reason for this action"
            className="input-field"
          />
          <button disabled={pending} className="admin-button">
            Confirm {archived ? "restore" : "removal"}
          </button>
          <Feedback state={state} />
        </form>
      )}
    </div>
  );
}

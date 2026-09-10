"use client";

import { useState } from "react";

export function AgentVerifiedField() {
  const [role, setRole] = useState("LANDLORD");

  return (
    <>
      <div>
        <label className="text-sm font-medium">I am a</label>
        <select
          name="role"
          required
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="LANDLORD">Landlord</option>
          <option value="TENANT">Tenant</option>
          <option value="AGENT">Agent / Delala</option>
        </select>
      </div>
      {role === "AGENT" ? (
        <div className="md:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="verifiedBroker"
              className="mt-1 h-4 w-4 rounded border-emerald-300 text-emerald-700"
            />
            <span>
              <span className="text-sm font-semibold text-emerald-900">
                Verified broker (Delala)
              </span>
              <span className="mt-1 block text-xs text-emerald-800/90">
                Show the trusted verified badge on your listings. In production,
                this would be approved by AddisRoom staff.
              </span>
            </span>
          </label>
        </div>
      ) : null}
    </>
  );
}

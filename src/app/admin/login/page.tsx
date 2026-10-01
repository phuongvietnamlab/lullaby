"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message || "Invalid email or password");
      setLoading(false);
      return;
    }

    // Full page navigation: a client-side push can render the dashboard before
    // the auth client's session store has picked up the new cookie, which
    // bounces the user straight back to this page.
    window.location.assign("/admin");
  }

  return (
    <div className="admin-login min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="admin-login-card p-7 sm:p-9">
          {/* Logo / Header */}
          <div className="mb-9 text-center">
            <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-[1rem] bg-[var(--admin-green)] font-[family-name:var(--font-heading)] text-2xl font-semibold text-white">H</span>
            <h1 className="font-[family-name:var(--font-heading)] text-3xl font-semibold text-[var(--admin-ink)]">Welcome back</h1>
            <p className="mt-2 text-sm text-[var(--admin-muted)]">Sign in to manage Hasana Hotel.</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-[var(--admin-ink)]"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="admin-login-input w-full px-4 py-3"
                placeholder="admin@lullaby.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-[var(--admin-ink)]"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="admin-login-input w-full px-4 py-3"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="admin-login-submit w-full py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}

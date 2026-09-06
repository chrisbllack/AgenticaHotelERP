import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, KeyRound, LogIn } from "lucide-react";
import { useAuth, DEMO_PASSWORD } from "../auth/auth";
import { users } from "../data/demo";
import { ROLE_LABELS } from "../types";

const DEMO_ACCOUNTS = users.slice(0, 5);

export default function AuthPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnTo = params.get("returnTo") || "/dashboard";

  const [email, setEmail] = useState("admin@infineon.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const destination = decodeURIComponent(returnTo);

  // Already signed in — go straight to the destination.
  if (user) {
    return <Navigate to={destination} replace />;
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const result = login(email, password);
    if (result.ok) {
      navigate(destination, { replace: true });
    } else {
      setError(result.error ?? "Sign-in failed.");
    }
  };

  const quickFill = (acctEmail: string) => {
    setEmail(acctEmail);
    setPassword(DEMO_PASSWORD);
    setError(null);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-950 px-4 py-12">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-32 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-brand-600/15 blur-3xl" />
        <div className="absolute bottom-0 right-[10%] h-56 w-56 rounded-full bg-gold-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-up">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 font-display text-2xl text-gold-400 ring-1 ring-gold-500/40">
            I
          </div>
          <h1 className="mt-4 font-display text-2xl text-brand-50">Sign in to INFINEON</h1>
          <p className="mt-1 text-sm text-brand-200/60">Grand Palm Hotel Lagos · Enterprise workspace</p>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-brand-800/80 bg-brand-900/50 p-6 shadow-panel backdrop-blur">
          {error ? (
            <div className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {error}
            </div>
          ) : null}

          <label className="block text-sm">
            <span className="mb-1 block text-xs text-brand-200/70">Work email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-brand-800 bg-brand-950/70 px-3 py-2.5 text-sm text-brand-50 outline-none transition-colors focus:border-brand-500"
              placeholder="you@property.com"
            />
          </label>

          <label className="mt-4 block text-sm">
            <span className="mb-1 block text-xs text-brand-200/70">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-brand-800 bg-brand-950/70 px-3 py-2.5 text-sm text-brand-50 outline-none transition-colors focus:border-brand-500"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 px-4 py-2.5 text-sm font-semibold text-brand-950 transition-colors hover:from-gold-400 hover:to-gold-500"
          >
            <LogIn size={15} /> Sign in
          </button>

          <div className="mt-5 border-t border-brand-800/70 pt-4">
            <p className="mb-2 text-[11px] uppercase tracking-wider text-brand-200/50">Demo accounts · password {DEMO_PASSWORD}</p>
            <div className="flex flex-wrap gap-1.5">
              {DEMO_ACCOUNTS.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => quickFill(u.email)}
                  className="rounded-full border border-brand-800 bg-brand-950/60 px-2.5 py-1 text-[11px] text-brand-100/80 transition-colors hover:border-gold-500/50 hover:text-gold-300"
                >
                  {ROLE_LABELS[u.role]}
                </button>
              ))}
            </div>
          </div>
        </form>

        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-brand-200/50">
          <KeyRound size={12} /> Sessions are role-scoped — the sidebar adapts to your permissions.
        </p>
        <p className="mt-3 text-center text-xs">
          <Link to="/" className="text-brand-200/60 transition-colors hover:text-gold-300">
            ← Back to platform overview <ArrowRight size={10} className="inline" />
          </Link>
        </p>
      </div>
    </div>
  );
}

import { useState, FormEvent } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { ChefHat, Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type View = "login" | "forgot" | "forgot-sent";

export default function Login() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetLink, setResetLink] = useState("");

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Please fill in all fields"); return; }
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) { setError("Please enter your email"); return; }
    setLoading(true);
    setError("");
    try {
      const data = await api.post("/auth/forgot-password", { email: forgotEmail });
      if (data.resetLink) setResetLink(data.resetLink);
      setView("forgot-sent");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to process request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Kimi AI Voice</span>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white leading-tight">
              The AI voice platform for modern restaurants
            </h1>
            <p className="text-lg text-white/60 leading-relaxed">
              Automate reservations, handle orders, and delight your customers with human-like AI calls — 24/7, without missing a beat.
            </p>
          </div>
        </div>

        <div className="relative space-y-4">
          {[
            { icon: "📞", title: "AI Phone Answering", desc: "Never miss a call again" },
            { icon: "📅", title: "Smart Bookings", desc: "Automatic appointment scheduling" },
            { icon: "🍕", title: "Order Management", desc: "Seamless order processing" },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <span className="text-2xl">{f.icon}</span>
              <div>
                <div className="text-sm font-semibold text-white">{f.title}</div>
                <div className="text-xs text-white/50">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-foreground">Kimi AI Voice</span>
          </div>

          {view === "login" && (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
                <p className="text-muted-foreground mt-1">Sign in to your restaurant dashboard</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="owner@restaurant.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      onClick={() => { setView("forgot"); setError(""); }}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPass ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pr-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Sign in
                </Button>
              </form>

              <div className="mt-6 p-4 bg-muted rounded-xl border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">Demo Credentials</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div><span className="font-mono bg-background px-1.5 py-0.5 rounded">admin@demo.com</span> / <span className="font-mono bg-background px-1.5 py-0.5 rounded">demo123</span></div>
                  <div className="text-xs text-muted-foreground/70">Superadmin: <span className="font-mono bg-background px-1.5 py-0.5 rounded">super@kimi.ai</span> / <span className="font-mono bg-background px-1.5 py-0.5 rounded">super123</span></div>
                </div>
              </div>
            </>
          )}

          {view === "forgot" && (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground">Reset your password</h2>
                <p className="text-muted-foreground mt-1">Enter your email to receive a reset link</p>
              </div>

              <form onSubmit={handleForgot} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email address</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="owner@restaurant.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="h-11"
                  />
                </div>

                {error && (
                  <div className="px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Send reset link
                </Button>
              </form>

              <button
                onClick={() => { setView("login"); setError(""); }}
                className="mt-4 text-sm text-muted-foreground hover:text-foreground"
              >
                &larr; Back to sign in
              </button>
            </>
          )}

          {view === "forgot-sent" && (
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✉️</span>
              </div>
              <h2 className="text-xl font-bold mb-2">Check your email</h2>
              <p className="text-muted-foreground mb-4">
                A password reset link has been sent to <strong>{forgotEmail}</strong>
              </p>
              {resetLink && (
                <div className="p-3 bg-muted rounded-lg text-xs font-mono text-muted-foreground break-all mb-4">
                  {resetLink}
                </div>
              )}
              <Button onClick={() => { setView("login"); setError(""); }} variant="outline">
                Back to sign in
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

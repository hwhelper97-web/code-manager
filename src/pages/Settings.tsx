import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { Loader2, Save, Settings2, Mail, Image, MessageSquare, Phone, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface BusinessSettings {
  id?: string;
  logoUrl?: string;
  theme: string;
  primaryColor: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  taxRate: number;
  currency: string;
  timezone: string;
  welcomeMessage?: string;
  twilioSid?: string;
  twilioToken?: string;
  twilioPhone?: string;
}

function getActiveBusinessId() { return localStorage.getItem("activeBizId") || ""; }

const TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Dubai",
  "Asia/Karachi", "Asia/Kolkata", "Asia/Singapore", "Australia/Sydney"
];

const CURRENCIES = ["USD", "EUR", "GBP", "PKR", "AED", "INR", "AUD", "CAD", "SGD"];

const COLORS = [
  "#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#06b6d4"
];

export default function Settings() {
  const [settings, setSettings] = useState<BusinessSettings>({
    theme: "light", primaryColor: "#6366f1", taxRate: 0, currency: "USD", timezone: "UTC"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [logoPreview, setLogoPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("business-changed", handler);
    return () => window.removeEventListener("business-changed", handler);
  }, []);

  const load = async () => {
    const bizId = getActiveBusinessId();
    if (!bizId) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await api.get(`/settings?businessId=${bizId}`);
      if (data.success) {
        setSettings(data.data);
        setLogoPreview(data.data.logoUrl || "");
      }
    } catch {} finally { setLoading(false); }
  };

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("Logo must be under 2MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setLogoPreview(dataUrl);
      setSettings((s) => ({ ...s, logoUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const bizId = getActiveBusinessId();
    if (!bizId) { setError("Please select a business first"); return; }
    setSaving(true); setError(""); setSaved(false);
    try {
      await api.put(`/settings?businessId=${bizId}`, settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Business Settings</h1>
          <p className="text-muted-foreground mt-1">Configure your business preferences and AI voice</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {error && <div className="px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">{error}</div>}

      {/* Branding */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Image className="w-4 h-4 text-primary" />
            Branding & Logo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Business Logo</Label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-border shadow-sm" />
              ) : (
                <div className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
                  <Image className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Logo
                </Button>
                <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Or paste a URL</Label>
              <Input
                placeholder="https://your-domain.com/logo.png"
                value={settings.logoUrl?.startsWith("data:") ? "" : (settings.logoUrl || "")}
                onChange={(e) => { setSettings({ ...settings, logoUrl: e.target.value }); setLogoPreview(e.target.value); }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Brand Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSettings({ ...settings, primaryColor: color })}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${settings.primaryColor === color ? "border-foreground scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input type="color" value={settings.primaryColor} onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border border-border" />
              <Input placeholder="#6366f1" value={settings.primaryColor} onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })} className="max-w-32" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input type="email" placeholder="contact@business.com" value={settings.contactEmail || ""} onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Contact Phone</Label>
              <Input placeholder="+1 555 0100" value={settings.contactPhone || ""} onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Website</Label>
              <Input placeholder="https://yourbusiness.com" value={settings.website || ""} onChange={(e) => setSettings({ ...settings, website: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Operations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-primary" />
            Business Operations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={settings.currency} onValueChange={(v) => setSettings({ ...settings, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tax Rate (%)</Label>
              <Input type="number" step="0.1" min="0" max="100" placeholder="0" value={settings.taxRate} onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={settings.timezone} onValueChange={(v) => setSettings({ ...settings, timezone: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIMEZONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Voice Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            AI Voice Greeting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            This is what your AI voice assistant (Alex) says when a customer calls. Keep it warm and natural.
          </p>
          <div className="space-y-2">
            <Label>Welcome Message</Label>
            <textarea
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm min-h-24 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Hi there! Thanks for calling [Business Name]! I'm Alex, how can I help you today?"
              value={settings.welcomeMessage || ""}
              onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Twilio Integration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary" />
            Twilio Phone Integration
            <Badge variant="secondary" className="ml-auto text-xs">Required for live calls</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            {settings.twilioSid && settings.twilioToken && settings.twilioPhone
              ? <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            }
            <div className="text-xs text-blue-700 dark:text-blue-300">
              {settings.twilioSid && settings.twilioToken && settings.twilioPhone
                ? "Twilio is configured. Your AI voice agent is ready to take calls."
                : "Connect Twilio to enable AI voice calls. Get your credentials at twilio.com — create an account, buy a phone number, and paste your Account SID, Auth Token, and phone number below."
              }
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Account SID</Label>
              <Input
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={settings.twilioSid || ""}
                onChange={(e) => setSettings({ ...settings, twilioSid: e.target.value })}
                type="password"
              />
            </div>
            <div className="space-y-2">
              <Label>Auth Token</Label>
              <Input
                placeholder="your_auth_token"
                value={settings.twilioToken || ""}
                onChange={(e) => setSettings({ ...settings, twilioToken: e.target.value })}
                type="password"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Twilio Phone Number</Label>
              <Input
                placeholder="+15551234567"
                value={settings.twilioPhone || ""}
                onChange={(e) => setSettings({ ...settings, twilioPhone: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {saved ? "Changes Saved!" : "Save All Settings"}
        </Button>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Loader2, Phone, Clock, Mic } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Call {
  id: string;
  fromNumber: string;
  toNumber: string;
  duration: number;
  tokensUsed: number;
  transcript?: string;
  createdAt: string;
  business: { name: string };
}

function getActiveBusinessId() { return localStorage.getItem("activeBizId") || ""; }

export default function Calls() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Call | null>(null);

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
      const data = await api.get(`/call/history?businessId=${bizId}`);
      if (data.success) setCalls(data.data);
    } catch {} finally { setLoading(false); }
  };

  const formatDuration = (secs: number) => {
    if (!secs) return "0s";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Call History</h1>
        <p className="text-muted-foreground mt-1">{calls.length} calls recorded</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Call list */}
        <div className="lg:col-span-1">
          {loading ? (
            <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : calls.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Phone className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No calls yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Calls will appear here once your AI answers</p>
            </div>
          ) : (
            <div className="space-y-2">
              {calls.map((call) => (
                <div
                  key={call.id}
                  onClick={() => setSelected(call)}
                  className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                    selected?.id === call.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{call.business?.name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{call.fromNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(call.duration)}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(call.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Call details */}
        <div className="lg:col-span-2">
          {selected ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Mic className="w-4 h-4 text-primary" />
                  Call Transcript
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">From:</span>
                    <span className="ml-2 font-medium">{selected.fromNumber}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">To:</span>
                    <span className="ml-2 font-medium">{selected.toNumber}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="ml-2 font-medium">{formatDuration(selected.duration)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tokens Used:</span>
                    <span className="ml-2 font-medium">{selected.tokensUsed}</span>
                  </div>
                </div>

                {selected.transcript ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Conversation:</p>
                    <div className="bg-muted/50 rounded-xl p-4 text-sm space-y-3 max-h-96 overflow-y-auto">
                      {selected.transcript.split("\n").map((line, i) => {
                        const isAI = line.startsWith("assistant:");
                        const isUser = line.startsWith("user:");
                        const text = line.replace(/^(assistant|user):/, "").trim();
                        if (!text) return null;
                        return (
                          <div key={i} className={`flex gap-2 ${isAI ? "justify-start" : "justify-end"}`}>
                            <div className={`max-w-xs px-3 py-2 rounded-xl text-sm ${
                              isAI
                                ? "bg-primary/10 text-primary-foreground"
                                : "bg-card border border-border"
                            }`}>
                              {isAI && <p className="text-xs text-muted-foreground mb-1">AI Alex</p>}
                              {isUser && <p className="text-xs text-muted-foreground mb-1">Customer</p>}
                              {text}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mic className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No transcript available for this call</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground border border-border rounded-xl bg-muted/10">
              <Phone className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm">Select a call to view transcript</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

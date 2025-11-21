"use client";

import { useState } from "react";

import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function InstanceOnboarding() {
  const [instanceName, setInstanceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"input" | "qr" | "connected">("input");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateInstance = async () => {
    if (!instanceName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/whatsapp/instance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceName }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Failed to create instance");

      toast.success("Instance created successfully");
      fetchQrCode();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const fetchQrCode = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/whatsapp/instance?instanceName=${instanceName}&action=qr`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      if (data.base64) {
        setQrCode(data.base64);
        setStep("qr");
        // Start polling for status
        pollStatus();
      } else if (data.code) {
        setQrCode(data.code); // Evolution v2 might return 'code'
        setStep("qr");
        pollStatus();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch QR");
    } finally {
      setLoading(false);
    }
  };

  const pollStatus = () => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/whatsapp/instance?instanceName=${instanceName}&action=status`);
        const data = await res.json();

        if (data?.instance?.state === "open") {
          clearInterval(interval);

          // 🔥 AUTOMATICALLY CONFIGURE WEBHOOK
          console.log("✅ Instance connected! Configuring webhook...");
          try {
            const webhookRes = await fetch("/api/whatsapp/webhook-config", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ instanceName }),
            });

            const webhookData = await webhookRes.json();
            if (webhookRes.ok) {
              console.log("✅ Webhook configured:", webhookData);
            } else {
              console.warn("⚠️ Webhook config failed:", webhookData.error);
            }
          } catch (webhookError) {
            console.error("⚠️ Webhook config error:", webhookError);
            // Don't fail the whole flow if webhook fails
          }

          setStep("connected");
          toast.success("WhatsApp Connected!");
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 3000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  };

  return (
    <Card className="mx-auto mt-8 w-full max-w-md">
      <CardHeader>
        <CardTitle>Connect WhatsApp</CardTitle>
        <CardDescription>Link your number to start the AI Agent</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === "input" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Instance Name</label>
              <Input
                placeholder="e.g., Sales-Agent-01"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={handleCreateInstance} disabled={loading || !instanceName}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create & Connect
            </Button>
          </div>
        )}

        {step === "qr" && (
          <div className="flex flex-col items-center space-y-4">
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              {qrCode ? (
                <img src={qrCode} alt="WhatsApp QR Code" className="h-64 w-64" />
              ) : (
                <div className="flex h-64 w-64 items-center justify-center rounded bg-gray-100">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              )}
            </div>
            <p className="text-muted-foreground text-center text-sm">
              Open WhatsApp on your phone &gt; Settings &gt; Linked Devices &gt; Link a Device
            </p>
          </div>
        )}

        {step === "connected" && (
          <div className="flex flex-col items-center space-y-4 py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold">Connected Successfully!</h3>
            <p className="text-muted-foreground text-center">Your AI Agent is now ready to receive messages.</p>
            <Button className="w-full" variant="outline" onClick={() => (window.location.href = "/dashboard/chat")}>
              Go to Chat
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

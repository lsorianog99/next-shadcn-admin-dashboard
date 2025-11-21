import { InstanceOnboarding } from "@/features/whatsapp/components/instance-onboarding";

export default function WhatsAppConfigPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-8 text-3xl font-bold">WhatsApp Configuration</h1>
      <InstanceOnboarding />
    </div>
  );
}

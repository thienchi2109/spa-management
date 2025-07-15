import { AiAssistantClient } from './components/ai-assistant-client';

export default function AiAssistantPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-headline font-bold">Trợ lý chẩn đoán AI</h1>
          <p className="text-muted-foreground">
            Nhận đề xuất chẩn đoán và giới thiệu chuyên khoa từ AI.
          </p>
        </div>
      </div>
      <AiAssistantClient />
    </div>
  );
}

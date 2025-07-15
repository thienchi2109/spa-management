'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  suggestDiagnosis,
  SuggestDiagnosisOutput,
} from '@/ai/flows/suggest-diagnosis';
import {
  suggestSpecialist,
  SuggestSpecialistOutput,
} from '@/ai/flows/suggest-specialist';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Bot, Lightbulb, Stethoscope, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  symptoms: z.string().min(10, {
    message: 'Triệu chứng phải có ít nhất 10 ký tự.',
  }),
  medicalHistory: z.string().min(10, {
    message: 'Tiền sử bệnh phải có ít nhất 10 ký tự.',
  }),
  examHistory: z.string().optional(),
});

type AiOutput = {
  diagnosis: SuggestDiagnosisOutput;
  specialist: SuggestSpecialistOutput;
};

const translatePriority = (priority: string) => {
    switch(priority.toLowerCase()){
        case 'high': return 'Cao';
        case 'medium': return 'Trung bình';
        case 'low': return 'Thấp';
        default: return priority;
    }
}

export function AiAssistantClient() {
  const [output, setOutput] = useState<AiOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      symptoms: '',
      medicalHistory: '',
      examHistory: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setOutput(null);
    try {
      const [diagnosisRes, specialistRes] = await Promise.all([
        suggestDiagnosis(values),
        suggestSpecialist(values),
      ]);
      setOutput({ diagnosis: diagnosisRes, specialist: specialistRes });
    } catch (error) {
      console.error('AI Assistant Error:', error);
      toast({
        variant: 'destructive',
        title: 'Đã xảy ra lỗi',
        description: 'Không thể nhận gợi ý từ trợ lý AI.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <UserPlus /> Thông tin bệnh nhân
          </CardTitle>
          <CardDescription>
            Nhập thông tin bệnh nhân để nhận gợi ý từ AI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="symptoms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Triệu chứng</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="VD: ho dai dẳng, sốt, và khó thở trong 5 ngày gần đây."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="medicalHistory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiền sử bệnh</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="VD: có tiền sử hen suyễn, không hút thuốc, không dị ứng."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="examHistory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lịch sử khám (Tùy chọn)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="VD: X-quang ngực trước đây cho thấy có viêm nhẹ."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Đang phân tích...' : 'Nhận gợi ý'}
                <Bot className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Lightbulb /> Gợi ý từ AI
            </CardTitle>
            <CardDescription>
              Xem lại các gợi ý chẩn đoán và giới thiệu do AI tạo ra.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading && (
              <div className="space-y-6">
                <div>
                  <Skeleton className="h-6 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4 mt-1" />
                </div>
                <div>
                  <Skeleton className="h-6 w-1/3 mb-2" />
                   <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4 mt-1" />
                </div>
              </div>
            )}
            {!loading && !output && (
                <div className="text-center text-muted-foreground py-10">
                    <p>Gợi ý sẽ xuất hiện ở đây sau khi bạn gửi thông tin bệnh nhân.</p>
                </div>
            )}
            {output && (
              <>
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                    <Stethoscope /> Chẩn đoán có thể
                    <Badge
                      variant={
                        output.diagnosis.priority === 'high'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      Ưu tiên: {translatePriority(output.diagnosis.priority)}
                    </Badge>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {output.diagnosis.possibleDiagnoses.map((diag) => (
                      <Badge key={diag} variant="outline">
                        {diag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                    <UserPlus /> Chuyên khoa đề xuất
                  </h3>
                  <ul className="space-y-4">
                    {output.specialist.suggestedSpecialists.map((spec) => (
                      <li key={spec.department} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold">{spec.department}</h4>
                          <Badge>Ưu tiên: {spec.priority}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {spec.rationale}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

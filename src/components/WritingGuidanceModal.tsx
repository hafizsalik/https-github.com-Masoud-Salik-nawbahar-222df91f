import { useState } from "react";
import type { MouseEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface WritingGuidanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEditor: (e: MouseEvent<HTMLButtonElement>) => void;
}

const STEPS = [
  {
    title: "۱. یک فکر انتخاب کن",
    description: "یک ایده ساده، تجربه یا بینش امروزت را انتخاب کن.",
    example: "امروز یاد گرفتم...",
  },
  {
    title: "۲. ۳-۵ خط بنویس",
    description: "کوتاه و مستقیم بنویس. هدف سرعت و شفافیت است.",
    example: "این موضوع برای من مهم است زیرا...",
  },
  {
    title: "۳. مثال یا نظر اضافه کن",
    description: "یک مثال کوتاه یا دلیل بیاور تا نوشته جذاب‌تر شود.",
    example: "مثال: ...",
  },
  {
    title: "۴. انتشار!",
    description: "پس از نگارش، «هوش مصنوعی نوبهار» مقاله را بر اساس ۵ معیار ارزیابی می‌کند، بازخورد می‌دهد و پس از تأیید منتشر می‌شود.
یادآوری: انجام بهتر از کامل است.",
    example: "نظر من این است که...",
  },
];

const TEMPLATES = [
  "امروز یاد گرفتم...",
  "نظر من این است که...",
  "مثال: ...",
  "من تازه فهمیدم...",
];

export function WritingGuidanceModal({ isOpen, onClose, onOpenEditor }: WritingGuidanceModalProps) {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <DialogTitle className="text-base font-bold">راهنمای شروع به نوشتن و نشر مقاله</DialogTitle>
              <DialogDescription className="text-[12px] text-muted-foreground">
                ۴ مرحله ساده برای شروع نوشتن ۳-۵ خطی
              </DialogDescription>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-muted-foreground hover:text-foreground"
              aria-label="بستن"
            >
              <X size={18} />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full ${index <= step ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-background p-4 text-right">
            <h3 className="text-sm font-semibold text-foreground mb-2">{STEPS[step].title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {STEPS[step].description}
            </p>
            <div className="mt-3 rounded-xl bg-muted/60 p-3 text-[13px] text-muted-foreground">
              {STEPS[step].example}
            </div>
          </div>

          {step === 0 && (
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((template) => (
                <div key={template} className="rounded-2xl border border-border bg-background p-3 text-xs text-foreground">
                  {template}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 justify-between">
          <Button
            variant="outline"
            onClick={() => setStep((value) => Math.max(0, value - 1))}
            disabled={step === 0}
          >
            → قبلی
          </Button>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setStep((value) => Math.min(STEPS.length - 1, value + 1))}
              disabled={step === STEPS.length - 1}
            >
              بعدی ←
            </Button>
            <Button onClick={(e) => {
              onClose(); // Close modal first
              setTimeout(() => onOpenEditor(e), 100); // Small delay to ensure modal closes
            }}>شروع به نوشتن</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

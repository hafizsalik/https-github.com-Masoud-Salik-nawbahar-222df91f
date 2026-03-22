import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { analyticsService } from '@/services/analytics';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Flag, Loader2 } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: string;
  contentType: 'article' | 'comment' | 'profile';
  contentTitle?: string;
}

const reportReasons = [
  { value: 'spam', label: 'محتوای تبلیغاتی/اسپم', description: 'محتوای غیرمرتبط یا تبلیغاتی' },
  { value: 'harassment', label: 'آزار و اذیت', description: 'محتوای توهین‌آمیز یا آزاردهنده' },
  { value: 'misinformation', label: 'اطلاعات نادرست', description: 'محتوای غیرواقعی یا گمراه‌کننده' },
  { value: 'inappropriate', label: 'محتوای نامناسب', description: 'محتوای نامناسب یا غیراخلاقی' },
  { value: 'copyright', label: 'نقض حق نشر', description: 'استفاده غیرمجاز از محتوای دیگران' },
  { value: 'other', label: 'سایر', description: 'دلایل دیگر' },
];

export function ReportModal({ 
  isOpen, 
  onClose, 
  contentId, 
  contentType, 
  contentTitle 
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast({
        title: 'لطفاً دلیل گزارش را انتخاب کنید',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'برای گزارش باید وارد شوید',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('content_reports')
        .insert({
          reporter_id: user.id,
          content_id: contentId,
          content_type: contentType,
          report_reason: selectedReason,
          report_note: note.trim() || null,
          status: 'pending',
        });

      if (error) throw error;

      // Track the report action
      analyticsService.logActivity({
        userId: user.id,
        deviceId: analyticsService.deviceId,
        activityType: contentType === 'article' ? 'admin_action' : 'admin_action',
        entityId: contentId,
        entityType: contentType,
        metadata: { action: 'report', reason: selectedReason },
      });

      toast({
        title: 'گزارش ثبت شد',
        description: 'با تشکر از کمک شما. گزارش شما بررسی خواهد شد.',
      });

      // Reset and close
      setSelectedReason('');
      setNote('');
      onClose();
    } catch (error) {
      toast({
        title: 'خطا در ثبت گزارش',
        description: 'لطفاً دوباره تلاش کنید',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getContentTypeLabel = () => {
    switch (contentType) {
      case 'article': return 'مقاله';
      case 'comment': return 'نظر';
      case 'profile': return 'پروفایل';
      default: return 'محتوا';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-destructive" />
            گزارش {getContentTypeLabel()}
          </DialogTitle>
          {contentTitle && (
            <DialogDescription className="text-right">
              «{contentTitle.substring(0, 50)}{contentTitle.length > 50 ? '...' : ''}»
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>دلیل گزارش را انتخاب کنید:</Label>
            <RadioGroup
              value={selectedReason}
              onValueChange={setSelectedReason}
              className="space-y-2"
            >
              {reportReasons.map((reason) => (
                <div key={reason.value} className="flex items-start space-x-2 space-x-reverse">
                  <RadioGroupItem value={reason.value} id={reason.value} className="mt-1" />
                  <div className="grid gap-0.5">
                    <Label htmlFor={reason.value} className="text-sm font-medium cursor-pointer">
                      {reason.label}
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      {reason.description}
                    </span>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">
              توضیحات اختیاری
            </Label>
            <Textarea
              id="note"
              placeholder="جزئیات بیشتری درباره مشکل بنویسید (اختیاری)..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              className="min-h-[100px] text-right"
              dir="rtl"
            />
            <p className="text-xs text-muted-foreground text-left">
              {note.length}/500
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            انصراف
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedReason || isSubmitting}
            variant="destructive"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                در حال ارسال...
              </>
            ) : (
              'ثبت گزارش'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ReportModal;

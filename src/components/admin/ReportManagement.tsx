import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Flag,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  FileText,
  User,
  Loader2,
  ExternalLink,
  Clock
} from 'lucide-react';
import { formatSolarShort } from '@/lib/solarHijri';

interface ContentReport {
  id: string;
  reporter_id: string;
  content_id: string;
  content_type: 'article' | 'comment' | 'profile';
  report_reason: string;
  report_note: string | null;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  admin_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  content_preview?: string;
  content_author_id?: string;
  reporter_name?: string;
  resolver_name?: string;
}

const statusLabels = {
  pending: { label: 'در انتظار', color: 'bg-yellow-500' },
  reviewing: { label: 'در حال بررسی', color: 'bg-blue-500' },
  resolved: { label: 'حل شده', color: 'bg-green-500' },
  dismissed: { label: 'رد شده', color: 'bg-gray-500' },
};

const reasonLabels: Record<string, string> = {
  spam: 'محتوای تبلیغاتی/اسپم',
  harassment: 'آزار و اذیت',
  misinformation: 'اطلاعات نادرست',
  inappropriate: 'محتوای نامناسب',
  copyright: 'نقض حق نشر',
  other: 'سایر',
};

export function ReportManagement() {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();
  }, [activeTab]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('content_reports_with_details' as any)
        .select('*')
        .eq('status', activeTab)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports((data || []) as any);
    } catch (error) {
      toast({
        title: 'خطا در بارگذاری گزارش‌ها',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (
    reportId: string, 
    newStatus: 'reviewing' | 'resolved' | 'dismissed'
  ) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('content_reports')
        .update({
          status: newStatus,
          admin_notes: adminNotes || null,
          resolved_at: newStatus !== 'reviewing' ? new Date().toISOString() : null,
        })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: 'وضعیت گزارش به‌روز شد',
        description: `گزارش به وضعیت "${statusLabels[newStatus].label}" تغییر یافت`,
      });

      setSelectedReport(null);
      setAdminNotes('');
      fetchReports();
    } catch (error) {
      toast({
        title: 'خطا در به‌روزرسانی',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'article': return <FileText className="w-4 h-4" />;
      case 'comment': return <MessageSquare className="w-4 h-4" />;
      case 'profile': return <User className="w-4 h-4" />;
      default: return <Flag className="w-4 h-4" />;
    }
  };

  const getContentUrl = (report: ContentReport) => {
    switch (report.content_type) {
      case 'article': return `/article/${report.content_id}`;
      case 'comment': return `/article/${report.content_id}`; // Comments shown in article context
      case 'profile': return `/profile/${report.content_id}`;
      default: return '#';
    }
  };

  const pendingCount = activeTab === 'pending' ? reports.length : 0;

  return (
    <div className="space-y-4" dir="rtl">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="relative">
            در انتظار
            {pendingCount > 0 && (
              <span className="absolute -top-1 -left-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="reviewing">در حال بررسی</TabsTrigger>
          <TabsTrigger value="resolved">حل شده</TabsTrigger>
          <TabsTrigger value="dismissed">رد شده</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : reports.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                گزارشی در این بخش وجود ندارد
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <Card 
                  key={report.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    setSelectedReport(report);
                    setAdminNotes(report.admin_notes || '');
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {getContentTypeIcon(report.content_type)}
                          <Badge variant="outline" className="text-xs">
                            {report.content_type === 'article' ? 'مقاله' : 
                             report.content_type === 'comment' ? 'نظر' : 'پروفایل'}
                          </Badge>
                          <Badge className={`text-xs ${statusLabels[report.status].color} text-white`}>
                            {statusLabels[report.status].label}
                          </Badge>
                        </div>

                        <p className="font-medium line-clamp-2">
                          {report.content_preview || 'محتوا'}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Flag className="w-3 h-3" />
                            {reasonLabels[report.report_reason] || report.report_reason}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            گزارش‌دهنده: {report.reporter_name || 'ناشناس'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatSolarShort(report.created_at)}
                          </span>
                        </div>

                        {report.report_note && (
                          <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                            <span className="font-medium">توضیحات گزارش‌دهنده:</span>
                            <br />
                            {report.report_note}
                          </p>
                        )}
                      </div>

                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(getContentUrl(report), '_blank');
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="w-5 h-5" />
              جزئیات گزارش
            </DialogTitle>
            <DialogDescription>
              بررسی و مدیریت گزارش ارسال شده
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {getContentTypeIcon(selectedReport.content_type)}
                  <span className="font-medium">
                    {selectedReport.content_type === 'article' ? 'مقاله' : 
                     selectedReport.content_type === 'comment' ? 'نظر' : 'پروفایل'}
                  </span>
                </div>
                <p className="text-sm bg-muted p-2 rounded">
                  {selectedReport.content_preview || 'محتوا'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">دلیل گزارش:</span>
                  <p className="font-medium">
                    {reasonLabels[selectedReport.report_reason] || selectedReport.report_reason}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">گزارش‌دهنده:</span>
                  <p className="font-medium">{selectedReport.reporter_name || 'ناشناس'}</p>
                </div>
              </div>

              {selectedReport.report_note && (
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">توضیحات گزارش‌دهنده:</span>
                  <p className="text-sm bg-muted p-2 rounded">
                    {selectedReport.report_note}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">یادداشت‌های مدیر:</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="یادداشت‌های داخلی (اختیاری)..."
                  className="min-h-[80px]"
                />
              </div>

              <DialogFooter className="flex gap-2 justify-end">
                {selectedReport.status === 'pending' && (
                  <Button
                    variant="outline"
                    onClick={() => handleStatusUpdate(selectedReport.id, 'reviewing')}
                    disabled={isProcessing}
                  >
                    <Eye className="w-4 h-4 ml-2" />
                    شروع بررسی
                  </Button>
                )}

                {(selectedReport.status === 'pending' || selectedReport.status === 'reviewing') && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusUpdate(selectedReport.id, 'dismissed')}
                      disabled={isProcessing}
                    >
                      <XCircle className="w-4 h-4 ml-2" />
                      رد گزارش
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => handleStatusUpdate(selectedReport.id, 'resolved')}
                      disabled={isProcessing}
                    >
                      <CheckCircle className="w-4 h-4 ml-2" />
                      حل شده
                    </Button>
                  </>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ReportManagement;

import { Bookmark, Share2, Flag, Pencil, Trash2, EyeOff, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { NawbaharIcon } from "@/components/NawbaharIcon";
import menuDotsIcon from "@/assets/icons/menu-dots-vertical.svg";
import { cn } from "@/lib/utils";

const REPORT_REASONS = [
  "محتوای نادرست یا گمراه‌کننده",
  "محتوای توهین‌آمیز یا نفرت‌پراکنی",
  "نقض حق تألیف یا کپی",
  "اسپم یا تبلیغات",
  "سایر موارد",
];

interface ArticleActionsMenuProps {
  articleId: string;
  authorId: string;
  articleTitle?: string;
  onDelete?: () => void;
}

export function ArticleActionsMenu({ articleId, authorId, articleTitle, onDelete }: ArticleActionsMenuProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reportStep, setReportStep] = useState<0 | 1 | 2>(0);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [reportNote, setReportNote] = useState("");
  const [bookmarkChecked, setBookmarkChecked] = useState(false);

  const { user } = useAuth();
  
  useEffect(() => {
    setUserId(user?.id || null);
  }, [user]);

  const checkBookmark = useCallback(async () => {
    if (bookmarkChecked || !userId) return;
    const { data: bookmark } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("article_id", articleId)
      .eq("user_id", userId)
      .maybeSingle();
    setIsBookmarked(!!bookmark);
    setBookmarkChecked(true);
  }, [articleId, userId, bookmarkChecked]);

  useEffect(() => {
    if (isOpen) checkBookmark();
  }, [isOpen, checkBookmark]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-bottom-sheet]')) return;
      smoothClose();
    };
    document.addEventListener('pointerdown', handler, true);
    return () => document.removeEventListener('pointerdown', handler, true);
  }, [isOpen]);

  const isOwner = userId === authorId;

  const smoothClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 200);
  };

  const openSheet = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(true);
    setIsClosing(false);
  };

  const handleSave = async () => {
    if (!userId) {
      toast({ title: "برای ذخیره باید وارد شوید", variant: "destructive" });
      return;
    }
    if (isBookmarked) {
      await supabase.from("bookmarks").delete().eq("article_id", articleId).eq("user_id", userId);
      setIsBookmarked(false);
      toast({ title: "از ذخیره‌ها حذف شد" });
    } else {
      await supabase.from("bookmarks").insert({ article_id: articleId, user_id: userId });
      setIsBookmarked(true);
      toast({ title: "ذخیره شد" });
    }
    smoothClose();
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/article/${articleId}`;
    if (navigator.share) {
      await navigator.share({ title: articleTitle || "مقاله", url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "لینک کپی شد" });
    }
    smoothClose();
  };

  const handleEdit = () => {
    smoothClose();
    navigate(`/write?edit=${articleId}`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("articles").delete().eq("id", articleId);
      if (error) throw error;
      toast({ title: "مقاله حذف شد" });
      onDelete?.();
    } catch {
      toast({ title: "خطا در حذف مقاله", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleNotInterested = () => {
    try {
      const hidden = JSON.parse(localStorage.getItem("hidden_articles") || "[]");
      if (!hidden.includes(articleId)) {
        hidden.push(articleId);
        localStorage.setItem("hidden_articles", JSON.stringify(hidden));
      }
    } catch { /* ignore */ }
    toast({ title: "این نوع مقالات کمتر نمایش داده خواهد شد" });
    smoothClose();
    onDelete?.();
  };

  const handleReportStart = () => {
    smoothClose();
    setTimeout(() => setReportStep(1), 220);
  };

  const handleReportConfirm = () => {
    setReportStep(2);
  };

  const handleReportSubmit = async () => {
    if (!userId || !selectedReason) return;
    const reason = reportNote.trim()
      ? `${selectedReason} — ${reportNote.trim()}`
      : selectedReason;

    const { error } = await supabase.from("reported_articles" as any).insert({
      article_id: articleId,
      reporter_id: userId,
      reason,
    });
    if (error?.code === "23505") {
      toast({ title: "قبلاً گزارش کرده‌اید" });
    } else if (error) {
      toast({ title: "خطا در ثبت گزارش", variant: "destructive" });
    } else {
      toast({ title: "گزارش ثبت شد", description: "با تشکر از گزارش شما" });
    }
    setReportStep(0);
    setSelectedReason(null);
    setReportNote("");
  };

  const closeReport = () => {
    setReportStep(0);
    setSelectedReason(null);
    setReportNote("");
  };

  const menuItemClass = "flex items-center gap-4 w-full px-5 py-3.5 text-[14px] text-foreground active:bg-muted/60 transition-colors";

  return (
    <>
      {/* Trigger button */}
      <button
        className="p-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
        onClick={openSheet}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <NawbaharIcon src={menuDotsIcon} size={14} className="opacity-30 dark:invert" />
      </button>

      {/* Bottom Sheet */}
      {(isOpen || isClosing) && (
        <div className="fixed inset-0 z-[100]" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
          {/* Backdrop */}
          <div
            className={cn(
              "absolute inset-0 bg-black/30 transition-opacity duration-200",
              isClosing ? "opacity-0" : "opacity-100"
            )}
            onClick={smoothClose}
          />
          {/* Sheet */}
          <div
            data-bottom-sheet
            className={cn(
              "absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl shadow-2xl max-w-lg mx-auto overflow-hidden",
              isClosing ? "animate-bottom-sheet-out" : "animate-bottom-sheet-in"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
            </div>

            <div className="pb-6 safe-bottom">
              <button onClick={handleSave} className={menuItemClass}>
                <Bookmark size={18} strokeWidth={1.5} className={isBookmarked ? "text-primary fill-primary" : "text-muted-foreground"} />
                <span>{isBookmarked ? "حذف از ذخیره‌ها" : "ذخیره"}</span>
              </button>
              <button onClick={handleShare} className={menuItemClass}>
                <Share2 size={18} strokeWidth={1.5} className="text-muted-foreground" />
                <span>اشتراک‌گذاری</span>
              </button>

              {isOwner && (
                <>
                  <div className="mx-5 border-b border-border/20 my-1" />
                  <button onClick={handleEdit} className={menuItemClass}>
                    <Pencil size={18} strokeWidth={1.5} className="text-muted-foreground" />
                    <span>ویرایش</span>
                  </button>
                  <button onClick={() => { smoothClose(); setTimeout(() => setShowDeleteDialog(true), 220); }} className={cn(menuItemClass, "text-destructive")}>
                    <Trash2 size={18} strokeWidth={1.5} />
                    <span>حذف</span>
                  </button>
                </>
              )}

              {!isOwner && (
                <>
                  <div className="mx-5 border-b border-border/20 my-1" />
                  <button onClick={handleNotInterested} className={menuItemClass}>
                    <EyeOff size={18} strokeWidth={1.5} className="text-muted-foreground" />
                    <span>علاقه‌مند نیستم</span>
                  </button>
                  <button onClick={handleReportStart} className={cn(menuItemClass, "text-destructive")}>
                    <Flag size={18} strokeWidth={1.5} />
                    <span>گزارش</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف مقاله</AlertDialogTitle>
            <AlertDialogDescription>
              این مقاله برای همیشه حذف خواهد شد و قابل بازیابی نیست. آیا مطمئن هستید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isDeleting}>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "در حال حذف..." : "بله، حذف شود"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report Dialogs */}
      <AlertDialog open={reportStep === 1} onOpenChange={(open) => !open && closeReport()}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>گزارش مقاله</AlertDialogTitle>
            <AlertDialogDescription>
              آیا مطمئن هستید که می‌خواهید این مقاله را گزارش دهید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={handleReportConfirm}>بله، ادامه</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={reportStep === 2} onOpenChange={(open) => !open && closeReport()}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>علت گزارش</AlertDialogTitle>
            <AlertDialogDescription>
              لطفاً دلیل گزارش خود را انتخاب کنید
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            {REPORT_REASONS.map((reason) => (
              <button
                key={reason}
                onClick={() => setSelectedReason(reason)}
                className={`w-full text-right text-sm px-3 py-2.5 rounded-lg border transition-colors ${
                  selectedReason === reason
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-foreground hover:border-primary/30"
                }`}
              >
                {reason}
              </button>
            ))}
            <Textarea
              placeholder="توضیحات اضافی (اختیاری)..."
              value={reportNote}
              onChange={(e) => setReportNote(e.target.value)}
              className="min-h-[60px] resize-none text-sm mt-2"
            />
          </div>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReportSubmit}
              disabled={!selectedReason}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ثبت گزارش
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

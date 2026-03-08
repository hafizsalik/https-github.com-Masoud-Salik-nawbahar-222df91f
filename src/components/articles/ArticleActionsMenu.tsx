import { MoreVertical, Bookmark, Share2, Flag, Pencil, Trash2, EyeOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [articleId]);

  // Close menu on scroll or any touch outside
  useEffect(() => {
    if (!isOpen) return;
    const close = () => setIsOpen(false);
    window.addEventListener("scroll", close, { passive: true, capture: true });
    window.addEventListener("touchstart", close, { passive: true });
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("touchstart", close);
    };
  }, [isOpen]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    setUserId(uid || null);

    if (uid) {
      const { data: bookmark } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("article_id", articleId)
        .eq("user_id", uid)
        .maybeSingle();
      setIsBookmarked(!!bookmark);
    }
  };

  const isOwner = userId === authorId;

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
    setIsOpen(false);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/article/${articleId}`;
    if (navigator.share) {
      await navigator.share({ title: articleTitle || "مقاله", url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "لینک کپی شد" });
    }
    setIsOpen(false);
  };

  const handleEdit = () => {
    setIsOpen(false);
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
    setIsOpen(false);
    onDelete?.(); // Remove from current view
  };

  const handleReport = () => {
    toast({ title: "گزارش ثبت شد", description: "با تشکر از گزارش شما" });
    setIsOpen(false);
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors focus:outline-none">
            <MoreVertical size={16} strokeWidth={1.5} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={handleSave} className="gap-3 text-sm">
            <Bookmark size={14} strokeWidth={1.5} />
            <span>{isBookmarked ? "حذف از ذخیره‌ها" : "ذخیره"}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShare} className="gap-3 text-sm">
            <Share2 size={14} strokeWidth={1.5} />
            <span>اشتراک‌گذاری</span>
          </DropdownMenuItem>

          {isOwner && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleEdit} className="gap-3 text-sm">
                <Pencil size={14} strokeWidth={1.5} />
                <span>ویرایش</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setIsOpen(false); setShowDeleteDialog(true); }} className="gap-3 text-sm text-destructive focus:text-destructive">
                <Trash2 size={14} strokeWidth={1.5} />
                <span>حذف</span>
              </DropdownMenuItem>
            </>
          )}

          {!isOwner && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleNotInterested} className="gap-3 text-sm">
                <EyeOff size={14} strokeWidth={1.5} />
                <span>علاقه‌مند نیستم</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleReport} className="gap-3 text-sm text-destructive focus:text-destructive">
                <Flag size={14} strokeWidth={1.5} />
                <span>گزارش</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
            <AlertDialogDescription>
              این مقاله برای همیشه حذف خواهد شد و قابل بازیابی نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isDeleting}>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "در حال حذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

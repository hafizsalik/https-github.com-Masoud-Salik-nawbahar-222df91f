import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Clock, FileText, CheckCircle, XCircle, Users, Eye, MessageCircle, Flag, TrendingUp, Shield, BarChart3, ThumbsUp, Trash2, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatSolarShort } from "@/lib/solarHijri";
import { ReviewModal } from "@/components/admin/ReviewModal";
import { cn } from "@/lib/utils";
import AdminAnalyticsDashboard from "@/components/admin/AdminAnalyticsDashboard";
import ReportManagement from "@/components/admin/ReportManagement";

interface AdminArticle {
  id: string;
  title: string;
  content: string;
  author_id: string;
  status: string;
  created_at: string;
  view_count: number | null;
  total_feed_rank: number | null;
  editorial_score_science: number | null;
  editorial_score_ethics: number | null;
  editorial_score_writing: number | null;
  editorial_score_timing: number | null;
  editorial_score_innovation: number | null;
  profiles?: { display_name: string } | null;
}

interface DashboardStats {
  totalArticles: number;
  totalUsers: number;
  totalViews: number;
  totalComments: number;
  totalReactions: number;
  totalBookmarks: number;
  pendingArticles: number;
  reportedComments: number;
}

const AdminDashboard = () => {
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<AdminArticle | null>(null);
  const [activeTab, setActiveTab] = useState("stats");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reportedComments, setReportedComments] = useState<any[]>([]);
  const [articleToDelete, setArticleToDelete] = useState<AdminArticle | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  useEffect(() => { checkAdminAccess(); }, []);

  const refreshActiveTab = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    const tab = activeTabRef.current;
    try {
      // Always refresh stats so badges stay live across all tabs
      await fetchStats(true);
      if (tab === "reports") await fetchReportedComments(true);
      else if (tab === "pending" || tab === "published" || tab === "rejected") {
        await fetchArticles(tab, true);
      }
      setLastUpdated(new Date());
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, []);

  // 60-second polling + realtime subscriptions
  useEffect(() => {
    if (!isAdmin) return;
    const interval = setInterval(() => { refreshActiveTab(true); }, 60_000);

    const channel = supabase
      .channel("admin-dashboard-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "articles" }, () => refreshActiveTab(true))
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => refreshActiveTab(true))
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, () => refreshActiveTab(true))
      .on("postgres_changes", { event: "*", schema: "public", table: "reported_comments" }, () => refreshActiveTab(true))
      .on("postgres_changes", { event: "*", schema: "public", table: "reported_articles" }, () => refreshActiveTab(true))
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [isAdmin, refreshActiveTab]);

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === "stats") fetchStats();
      else if (activeTab === "reports") fetchReportedComments();
      else if (activeTab === "pending" || activeTab === "published" || activeTab === "rejected") {
        fetchArticles(activeTab as any);
      } else {
        // analytics / content-reports have their own loaders; still refresh stats for badges
        fetchStats(true);
      }
    }
  }, [isAdmin, activeTab]);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { navigate("/auth"); return; }
    const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle();
    if (error || !data) {
      toast({ title: "دسترسی غیرمجاز", description: "شما دسترسی ادمین ندارید", variant: "destructive" });
      navigate("/"); return;
    }
    setIsAdmin(true);
  };

  const fetchStats = async (silent = false) => {
    if (!silent) setLoading(true);
    const [
      { count: totalArticles },
      { count: totalUsers },
      { count: pendingArticles },
      { count: totalComments },
      { count: reportedCommentsCount },
      { count: totalReactions },
      { count: totalBookmarks },
    ] = await Promise.all([
      supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("comments").select("*", { count: "exact", head: true }),
      supabase.from("reported_comments").select("*", { count: "exact", head: true }),
      supabase.from("reactions").select("*", { count: "exact", head: true }),
      supabase.from("bookmarks").select("*", { count: "exact", head: true }),
    ]);

    const { data: viewsData } = await supabase.from("articles").select("view_count").eq("status", "published");
    const totalViews = viewsData?.reduce((sum, a) => sum + (a.view_count || 0), 0) || 0;

    setStats({
      totalArticles: totalArticles || 0,
      totalUsers: totalUsers || 0,
      totalViews,
      totalComments: totalComments || 0,
      totalReactions: totalReactions || 0,
      totalBookmarks: totalBookmarks || 0,
      pendingArticles: pendingArticles || 0,
      reportedComments: reportedCommentsCount || 0,
    });
    setLoading(false);
  };

  const fetchArticles = async (status: "pending" | "published" | "rejected", silent = false) => {
    if (!silent) setLoading(true);

    const { data, error } = await supabase
      .from("articles")
      .select("id, title, content, author_id, status, created_at, view_count, total_feed_rank, editorial_score_science, editorial_score_ethics, editorial_score_writing, editorial_score_timing, editorial_score_innovation")
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "خطا", description: error.message, variant: "destructive" });
      if (!silent) setLoading(false);
      return;
    }

    const authorIds = [...new Set((data || []).map((a) => a.author_id))].filter(Boolean);

    if (authorIds.length === 0) {
      setArticles((data || []).map((item: any) => ({ ...item, profiles: null })));
      if (!silent) setLoading(false);
      return;
    }

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", authorIds);

    if (profilesError) {
      console.error("Error fetching profiles for admin dashboard:", profilesError);
      setArticles((data || []).map((item: any) => ({ ...item, profiles: null })));
      if (!silent) setLoading(false);
      return;
    }

    const profilesMap = new Map((profiles || []).map((p) => [p.id, p]));

    setArticles(
      (data || []).map((item: any) => ({
        ...item,
        profiles: profilesMap.get(item.author_id)
          ? { display_name: profilesMap.get(item.author_id)!.display_name }
          : null,
      }))
    );
    if (!silent) setLoading(false);
  };

  const fetchReportedComments = async (silent = false) => {
    if (!silent) setLoading(true);
    const { data } = await supabase.from("reported_comments").select("*, comments(id, content, user_id, article_id)").order("created_at", { ascending: false });
    setReportedComments(data || []);
    if (!silent) setLoading(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (!error) { toast({ title: "✅ نظر حذف شد" }); fetchReportedComments(); }
  };

  const handleDismissReport = async (reportId: string) => {
    const { error } = await supabase.from("reported_comments").delete().eq("id", reportId);
    if (!error) { toast({ title: "گزارش رد شد" }); fetchReportedComments(); }
  };

  const handleDeleteArticle = async () => {
    if (!articleToDelete) return;
    setDeleting(true);
    const { error } = await supabase.from("articles").delete().eq("id", articleToDelete.id);
    setDeleting(false);
    if (error) {
      toast({ title: "خطا در حذف", description: error.message, variant: "destructive" });
      return;
    }
    setArticles(prev => prev.filter(a => a.id !== articleToDelete.id));
    setArticleToDelete(null);
    toast({ title: "✅ مقاله حذف شد" });
    queryClient.invalidateQueries({ queryKey: ["articles-smart-feed"] });
    queryClient.invalidateQueries({ queryKey: ["articles-published"] });
    if (activeTab === "stats") fetchStats();
  };
  const handleReviewComplete = () => {
    setSelectedArticle(null);
    if (activeTab !== "stats" && activeTab !== "reports") fetchArticles(activeTab as any);
    else fetchStats();
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/30">
        <div className="flex items-center justify-between px-4 h-12 max-w-screen-md mx-auto">
          <button onClick={() => navigate(-1)} className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowRight size={20} strokeWidth={1.5} />
          </button>
          <h1 className="text-sm font-bold flex items-center gap-2">
            <Shield size={14} className="text-primary" />
            داشبورد مدیریت
          </h1>
          <button
            onClick={() => refreshActiveTab(false)}
            disabled={refreshing}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            aria-label="بروزرسانی"
            title={lastUpdated ? `آخرین بروزرسانی: ${lastUpdated.toLocaleTimeString("fa-IR")}` : "بروزرسانی"}
          >
            <RefreshCw size={16} strokeWidth={1.8} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      <main className="max-w-screen-md mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-7 mb-4 h-auto bg-muted/30 rounded-xl p-1">
            {[
              { value: "stats", icon: TrendingUp, label: "آمار کلی" },
              { value: "analytics", icon: BarChart3, label: "تحلیل‌ها" },
              { value: "pending", icon: Clock, label: "در انتظار انتشار", badge: stats?.pendingArticles },
              { value: "published", icon: CheckCircle, label: "منتشر شده" },
              { value: "rejected", icon: XCircle, label: "رد" },
              { value: "reports", icon: Flag, label: "گزارش", badge: stats?.reportedComments, badgeVariant: "destructive" as const },
              { value: "content-reports", icon: Flag, label: "گزارش محتوا" },
            ].map(({ value, icon: Icon, label, badge, badgeVariant }) => (
              <TabsTrigger key={value} value={value} className="text-[10px] sm:text-xs py-2 px-1 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm relative">
                <Icon size={12} className="ml-1 hidden sm:inline" />
                {label}
                {badge != null && badge > 0 && (
                  <span className={cn(
                    "absolute -top-1 -left-1 min-w-[14px] h-[14px] flex items-center justify-center text-[8px] font-bold rounded-full px-0.5",
                    badgeVariant === "destructive" ? "text-destructive-foreground bg-destructive" : "text-primary-foreground bg-primary"
                  )}>{badge}</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="analytics">
            <AdminAnalyticsDashboard />
          </TabsContent>

          <TabsContent value="stats">
            {loading ? <LoadingSpinner /> : stats && (
              <div className="grid grid-cols-2 gap-2.5">
                <StatCard icon={FileText} label="مقالات" value={stats.totalArticles} />
                <StatCard icon={Users} label="کاربران" value={stats.totalUsers} />
                <StatCard icon={Eye} label="بازدیدها" value={stats.totalViews} />
                <StatCard icon={MessageCircle} label="نظرات" value={stats.totalComments} />
                <StatCard icon={ThumbsUp} label="واکنش‌ها" value={stats.totalReactions} />
                <StatCard icon={BarChart3} label="ذخیره‌ها" value={stats.totalBookmarks} />
                <StatCard icon={Clock} label="در انتظار" value={stats.pendingArticles} variant={stats.pendingArticles > 0 ? "warning" : "default"} />
                <StatCard icon={Flag} label="گزارش‌ها" value={stats.reportedComments} variant={stats.reportedComments > 0 ? "danger" : "default"} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="content-reports">
            <ReportManagement />
          </TabsContent>

          <TabsContent value="reports">
            {loading ? <LoadingSpinner /> : reportedComments.length === 0 ? (
              <EmptyState icon={Flag} text="گزارشی موجود نیست" />
            ) : (
              <div className="space-y-2.5">
                {reportedComments.map((report) => (
                  <div key={report.id} className="bg-card border border-border/50 rounded-xl p-4 space-y-2.5">
                    <p className="text-sm text-foreground line-clamp-3 leading-relaxed">{report.comments?.content}</p>
                    {report.reason && (
                      <p className="text-[11px] text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg">دلیل: {report.reason}</p>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-muted-foreground">{formatSolarShort(report.created_at)}</span>
                      <div className="flex gap-1.5">
                        <Button variant="ghost" size="sm" onClick={() => handleDismissReport(report.id)} className="text-[11px] h-7">رد</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteComment(report.comments?.id)} className="text-[11px] h-7">حذف نظر</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {["pending", "published", "rejected"].map((tab) => (
            <TabsContent key={tab} value={tab}>
              {loading ? <LoadingSpinner /> : articles.length === 0 ? (
                <EmptyState icon={FileText} text={tab === "pending" ? "مقاله‌ای در انتظار نیست 🎉" : "مقاله‌ای موجود نیست"} />
              ) : (
                <div className="space-y-2">
                  {articles.map((article) => {
                    const totalScore = (article.editorial_score_science || 0) + (article.editorial_score_ethics || 0) + 
                      (article.editorial_score_writing || 0) + (article.editorial_score_timing || 0) + (article.editorial_score_innovation || 0);
                    return (
                      <div
                        key={article.id}
                        className="bg-card border border-border/50 rounded-xl p-3.5 hover:border-border transition-all cursor-pointer group"
                        onClick={() => setSelectedArticle(article)}
                      >
                        <h3 className="font-medium text-foreground mb-1.5 line-clamp-1 text-sm group-hover:text-primary transition-colors">{article.title}</h3>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{article.profiles?.display_name || "ناشناس"}</span>
                            <span className="text-muted-foreground/30">·</span>
                            <span>{formatSolarShort(article.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {article.view_count != null && article.view_count > 0 && (
                              <span className="flex items-center gap-0.5"><Eye size={11} />{article.view_count}</span>
                            )}
                            {totalScore > 0 && (
                              <span className="text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded-full text-[9px]">{totalScore}/50</span>
                            )}
                            <button
                              type="button"
                              aria-label="حذف مقاله"
                              onClick={(e) => { e.stopPropagation(); setArticleToDelete(article); }}
                              className="p-1 rounded-md text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>

      {selectedArticle && (
        <ReviewModal article={selectedArticle} onClose={() => setSelectedArticle(null)} onComplete={handleReviewComplete} />
      )}

      <AlertDialog open={!!articleToDelete} onOpenChange={(o) => { if (!o) setArticleToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف مقاله</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف مقاله «{articleToDelete?.title}» مطمئن هستید؟ این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>انصراف</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => { e.preventDefault(); handleDeleteArticle(); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "در حال حذف…" : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="text-center py-14">
      <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
        <Icon size={20} className="text-muted-foreground/40" />
      </div>
      <p className="text-muted-foreground text-xs">{text}</p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, variant = "default" }: { icon: any; label: string; value: number; variant?: "default" | "warning" | "danger" }) {
  return (
    <div className={cn(
      "bg-card border rounded-xl p-4 transition-all duration-300 hover:shadow-md group",
      variant === "warning" ? "border-warning/30 bg-gradient-to-br from-warning/5 to-warning/10" :
      variant === "danger" ? "border-destructive/30 bg-gradient-to-br from-destructive/5 to-destructive/10" :
      "border-border/40 hover:border-primary/20"
    )}>
      <div className="flex items-center gap-2 mb-2">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
          variant === "warning" ? "bg-warning/15 text-warning" :
          variant === "danger" ? "bg-destructive/15 text-destructive" :
          "bg-primary/10 text-primary group-hover:bg-primary/15"
        )}>
          <Icon size={16} />
        </div>
        <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
      </div>
      <p className="text-2xl font-black text-foreground tabular-nums">{value.toLocaleString("fa-IR")}</p>
    </div>
  );
}

export default AdminDashboard;

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Clock, FileText, CheckCircle, XCircle, Users, Eye, MessageCircle, Flag, TrendingUp, Shield, UserCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { formatSolarShort } from "@/lib/solarHijri";
import { ReviewModal } from "@/components/admin/ReviewModal";
import { cn } from "@/lib/utils";

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
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === "stats") fetchStats();
      else if (activeTab === "reports") fetchReportedComments();
      else fetchArticles(activeTab as "pending" | "published" | "rejected");
    }
  }, [isAdmin, activeTab]);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { navigate("/auth"); return; }

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (error || !data) {
      toast({ title: "دسترسی غیرمجاز", description: "شما دسترسی ادمین ندارید", variant: "destructive" });
      navigate("/");
      return;
    }
    setIsAdmin(true);
  };

  const fetchStats = async () => {
    setLoading(true);
    const [
      { count: totalArticles },
      { count: totalUsers },
      { count: pendingArticles },
      { count: totalComments },
      { count: reportedCommentsCount },
    ] = await Promise.all([
      supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("comments").select("*", { count: "exact", head: true }),
      supabase.from("reported_comments").select("*", { count: "exact", head: true }),
    ]);

    const { data: viewsData } = await supabase
      .from("articles").select("view_count").eq("status", "published");
    const totalViews = viewsData?.reduce((sum, a) => sum + (a.view_count || 0), 0) || 0;

    setStats({
      totalArticles: totalArticles || 0,
      totalUsers: totalUsers || 0,
      totalViews,
      totalComments: totalComments || 0,
      pendingArticles: pendingArticles || 0,
      reportedComments: reportedCommentsCount || 0,
    });
    setLoading(false);
  };

  const fetchArticles = async (status: "pending" | "published" | "rejected") => {
    setLoading(true);
    const { data, error } = await supabase
      .from("articles")
      .select("id, title, content, author_id, status, created_at, view_count, total_feed_rank, editorial_score_science, editorial_score_ethics, editorial_score_writing, editorial_score_timing, editorial_score_innovation, profiles:author_id(display_name)")
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "خطا", description: "خطا در دریافت مقالات", variant: "destructive" });
    } else {
      setArticles((data || []).map((item: any) => ({
        ...item,
        profiles: item.profiles,
      })));
    }
    setLoading(false);
  };

  const fetchReportedComments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reported_comments")
      .select("*, comments(id, content, user_id, article_id)")
      .order("created_at", { ascending: false });
    setReportedComments(data || []);
    setLoading(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (!error) { toast({ title: "✅ نظر حذف شد" }); fetchReportedComments(); }
  };

  const handleDismissReport = async (reportId: string) => {
    const { error } = await supabase.from("reported_comments").delete().eq("id", reportId);
    if (!error) { toast({ title: "گزارش رد شد" }); fetchReportedComments(); }
  };

  const handleReviewComplete = () => {
    setSelectedArticle(null);
    if (activeTab !== "stats" && activeTab !== "reports") {
      fetchArticles(activeTab as "pending" | "published" | "rejected");
    } else {
      fetchStats();
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="relative">
          <div className="w-10 h-10 border-2 border-primary/20 rounded-full" />
          <div className="absolute inset-0 w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 h-12 max-w-screen-md mx-auto">
          <button onClick={() => navigate(-1)} className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowRight size={20} strokeWidth={1.5} />
          </button>
          <h1 className="text-sm font-semibold flex items-center gap-2">
            <Shield size={14} className="text-primary" />
            داشبورد مدیریت
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-screen-md mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-5 mb-4 h-auto bg-muted/50 rounded-xl p-1">
            <TabsTrigger value="stats" className="text-[10px] sm:text-xs py-2 px-1 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <TrendingUp size={13} className="ml-1 hidden sm:inline" />
              آمار
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-[10px] sm:text-xs py-2 px-1 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm relative">
              <Clock size={13} className="ml-1 hidden sm:inline" />
              انتظار
              {stats && stats.pendingArticles > 0 && (
                <span className="absolute -top-1 -left-1 min-w-[16px] h-[16px] flex items-center justify-center text-[9px] font-bold text-primary-foreground bg-primary rounded-full px-1">
                  {stats.pendingArticles}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="published" className="text-[10px] sm:text-xs py-2 px-1 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <CheckCircle size={13} className="ml-1 hidden sm:inline" />
              منتشر
            </TabsTrigger>
            <TabsTrigger value="rejected" className="text-[10px] sm:text-xs py-2 px-1 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <XCircle size={13} className="ml-1 hidden sm:inline" />
              رد
            </TabsTrigger>
            <TabsTrigger value="reports" className="text-[10px] sm:text-xs py-2 px-1 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm relative">
              <Flag size={13} className="ml-1 hidden sm:inline" />
              گزارش
              {stats && stats.reportedComments > 0 && (
                <span className="absolute -top-1 -left-1 min-w-[16px] h-[16px] flex items-center justify-center text-[9px] font-bold text-destructive-foreground bg-destructive rounded-full px-1">
                  {stats.reportedComments}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Stats Tab */}
          <TabsContent value="stats">
            {loading ? <LoadingSpinner /> : stats && (
              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={FileText} label="مقالات منتشر شده" value={stats.totalArticles} />
                <StatCard icon={Users} label="کاربران" value={stats.totalUsers} />
                <StatCard icon={Eye} label="کل بازدیدها" value={stats.totalViews} />
                <StatCard icon={MessageCircle} label="نظرات" value={stats.totalComments} />
                <StatCard icon={Clock} label="در انتظار تایید" value={stats.pendingArticles} variant={stats.pendingArticles > 0 ? "warning" : "default"} />
                <StatCard icon={Flag} label="گزارش‌ها" value={stats.reportedComments} variant={stats.reportedComments > 0 ? "danger" : "default"} />
              </div>
            )}
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            {loading ? <LoadingSpinner /> : reportedComments.length === 0 ? (
              <EmptyState icon={Flag} text="گزارشی موجود نیست" />
            ) : (
              <div className="space-y-3">
                {reportedComments.map((report) => (
                  <div key={report.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                    <p className="text-sm text-foreground line-clamp-3 leading-relaxed">
                      {report.comments?.content}
                    </p>
                    {report.reason && (
                      <p className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
                        دلیل: {report.reason}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatSolarShort(report.created_at)}
                      </span>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDismissReport(report.id)}
                          className="text-xs h-8"
                        >
                          رد گزارش
                        </Button>
                        <Button 
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteComment(report.comments?.id)}
                          className="text-xs h-8"
                        >
                          حذف نظر
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Articles Tabs */}
          {["pending", "published", "rejected"].map((tab) => (
            <TabsContent key={tab} value={tab}>
              {loading ? <LoadingSpinner /> : articles.length === 0 ? (
                <EmptyState 
                  icon={FileText} 
                  text={tab === "pending" ? "مقاله‌ای در انتظار تایید نیست 🎉" : "مقاله‌ای موجود نیست"} 
                />
              ) : (
                <div className="space-y-2">
                  {articles.map((article) => {
                    const totalScore = (article.editorial_score_science || 0) + (article.editorial_score_ethics || 0) + 
                      (article.editorial_score_writing || 0) + (article.editorial_score_timing || 0) + (article.editorial_score_innovation || 0);
                    
                    return (
                      <div
                        key={article.id}
                        className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-all cursor-pointer group"
                        onClick={() => setSelectedArticle(article)}
                      >
                        <h3 className="font-medium text-foreground mb-2 line-clamp-1 text-sm group-hover:text-primary transition-colors">
                          {article.title}
                        </h3>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{article.profiles?.display_name || "ناشناس"}</span>
                            <span className="text-muted-foreground/40">·</span>
                            <span>{formatSolarShort(article.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {article.view_count != null && article.view_count > 0 && (
                              <span className="flex items-center gap-1">
                                <Eye size={12} />
                                {article.view_count}
                              </span>
                            )}
                            {totalScore > 0 && (
                              <span className="text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full text-[10px]">
                                {totalScore}/50
                              </span>
                            )}
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

      {/* Review Modal */}
      {selectedArticle && (
        <ReviewModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
          onComplete={handleReviewComplete}
        />
      )}
    </div>
  );
};

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="relative">
        <div className="w-8 h-8 border-2 border-primary/20 rounded-full" />
        <div className="absolute inset-0 w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="text-center py-16">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
        <Icon size={24} className="text-muted-foreground" />
      </div>
      <p className="text-muted-foreground text-sm">{text}</p>
    </div>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  variant = "default" 
}: { 
  icon: any; 
  label: string; 
  value: number; 
  variant?: "default" | "warning" | "danger";
}) {
  return (
    <div className={cn(
      "bg-card border rounded-xl p-4 transition-colors",
      variant === "warning" ? "border-warning/30" :
      variant === "danger" ? "border-destructive/30" :
      "border-border"
    )}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className={cn(
          variant === "warning" ? "text-warning" :
          variant === "danger" ? "text-destructive" :
          "text-primary"
        )} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground tabular-nums">{value.toLocaleString("fa-IR")}</p>
    </div>
  );
}

export default AdminDashboard;
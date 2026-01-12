import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Clock, FileText, CheckCircle, XCircle, Users, Eye, MessageCircle, Flag, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatSolarShort } from "@/lib/solarHijri";
import { ReviewModal } from "@/components/admin/ReviewModal";

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
      if (activeTab === "stats") {
        fetchStats();
      } else if (activeTab === "reports") {
        fetchReportedComments();
      } else {
        fetchArticles(activeTab as "pending" | "published" | "rejected");
      }
    }
  }, [isAdmin, activeTab]);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      navigate("/auth");
      return;
    }

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (error || !data) {
      toast({
        title: "دسترسی غیرمجاز",
        description: "شما دسترسی ادمین ندارید",
        variant: "destructive",
      });
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

    // Get total views
    const { data: viewsData } = await supabase
      .from("articles")
      .select("view_count")
      .eq("status", "published");
    
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
      .select(`
        id,
        title,
        content,
        author_id,
        status,
        created_at,
        view_count,
        total_feed_rank,
        editorial_score_science,
        editorial_score_ethics,
        editorial_score_writing,
        editorial_score_timing,
        editorial_score_innovation,
        profiles:author_id(display_name)
      `)
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "خطا",
        description: "خطا در دریافت مقالات",
        variant: "destructive",
      });
    } else {
      const transformed: AdminArticle[] = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        author_id: item.author_id,
        status: item.status,
        created_at: item.created_at,
        view_count: item.view_count,
        total_feed_rank: item.total_feed_rank,
        editorial_score_science: item.editorial_score_science,
        editorial_score_ethics: item.editorial_score_ethics,
        editorial_score_writing: item.editorial_score_writing,
        editorial_score_timing: item.editorial_score_timing,
        editorial_score_innovation: item.editorial_score_innovation,
        profiles: item.profiles,
      }));
      setArticles(transformed);
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
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (!error) {
      toast({ title: "نظر حذف شد" });
      fetchReportedComments();
    }
  };

  const handleDismissReport = async (reportId: string) => {
    const { error } = await supabase
      .from("reported_comments")
      .delete()
      .eq("id", reportId);

    if (!error) {
      toast({ title: "گزارش رد شد" });
      fetchReportedComments();
    }
  };

  const handleReviewComplete = () => {
    setSelectedArticle(null);
    if (activeTab !== "stats" && activeTab !== "reports") {
      fetchArticles(activeTab as "pending" | "published" | "rejected");
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-12 max-w-screen-md mx-auto">
          <button
            onClick={() => navigate("/")}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowRight size={20} />
          </button>
          <h1 className="text-sm font-semibold">داشبورد ادمین</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-screen-md mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-5 mb-4 h-auto">
            <TabsTrigger value="stats" className="text-xs py-2 px-1">
              <TrendingUp size={14} className="ml-1" />
              آمار
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs py-2 px-1">
              <Clock size={14} className="ml-1" />
              انتظار
            </TabsTrigger>
            <TabsTrigger value="published" className="text-xs py-2 px-1">
              <CheckCircle size={14} className="ml-1" />
              منتشر
            </TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs py-2 px-1">
              <XCircle size={14} className="ml-1" />
              رد
            </TabsTrigger>
            <TabsTrigger value="reports" className="text-xs py-2 px-1">
              <Flag size={14} className="ml-1" />
              گزارش
            </TabsTrigger>
          </TabsList>

          {/* Stats Tab */}
          <TabsContent value="stats">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : stats && (
              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={FileText} label="مقالات منتشر شده" value={stats.totalArticles} />
                <StatCard icon={Users} label="کاربران" value={stats.totalUsers} />
                <StatCard icon={Eye} label="کل بازدیدها" value={stats.totalViews} />
                <StatCard icon={MessageCircle} label="نظرات" value={stats.totalComments} />
                <StatCard icon={Clock} label="در انتظار تایید" value={stats.pendingArticles} color="text-yellow-500" />
                <StatCard icon={Flag} label="گزارش‌ها" value={stats.reportedComments} color="text-red-500" />
              </div>
            )}
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : reportedComments.length === 0 ? (
              <div className="text-center py-12">
                <Flag size={40} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm">گزارشی موجود نیست</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reportedComments.map((report) => (
                  <div key={report.id} className="bg-card border border-border rounded-lg p-3">
                    <p className="text-sm text-foreground mb-2 line-clamp-3">
                      {report.comments?.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatSolarShort(report.created_at)}
                      </span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleDismissReport(report.id)}
                          className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
                        >
                          رد گزارش
                        </button>
                        <button 
                          onClick={() => handleDeleteComment(report.comments?.id)}
                          className="text-xs text-destructive hover:text-destructive/80 px-2 py-1"
                        >
                          حذف نظر
                        </button>
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
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : articles.length === 0 ? (
                <div className="text-center py-12">
                  <FileText size={40} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm">مقاله‌ای موجود نیست</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {articles.map((article) => (
                    <div
                      key={article.id}
                      className="bg-card border border-border rounded-lg p-3 hover:shadow-sm transition-shadow cursor-pointer"
                      onClick={() => setSelectedArticle(article)}
                    >
                      <h3 className="font-medium text-foreground mb-1.5 line-clamp-1 text-sm">
                        {article.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{article.profiles?.display_name || "ناشناس"}</span>
                        <div className="flex items-center gap-3">
                          {article.view_count !== null && (
                            <span className="flex items-center gap-1">
                              <Eye size={12} />
                              {article.view_count}
                            </span>
                          )}
                          <span>{formatSolarShort(article.created_at)}</span>
                        </div>
                      </div>
                      {article.total_feed_rank && (
                        <div className="mt-1.5 text-xs text-primary">
                          امتیاز: {article.total_feed_rank}
                        </div>
                      )}
                    </div>
                  ))}
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

// Stat Card Component
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color = "text-primary" 
}: { 
  icon: any; 
  label: string; 
  value: number; 
  color?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={18} className={color} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value.toLocaleString("fa-IR")}</p>
    </div>
  );
}

export default AdminDashboard;
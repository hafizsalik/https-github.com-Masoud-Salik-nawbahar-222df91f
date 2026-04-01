import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Crown, Plus, Edit3, Trash2, Save, X, ImagePlus, Link2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { getRelativeTime } from "@/lib/relativeTime";
import { SEOHead } from "@/components/SEOHead";

interface VIPPost {
  id: string;
  title: string;
  content: string;
  type: string;
  author_id: string | null;
  created_at: string;
  image_url: string | null;
  link_url: string | null;
  link_label: string | null;
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  announcement: { label: "اطلاعیه", color: "bg-primary/10 text-primary" },
  editorial: { label: "سرمقاله", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  competition: { label: "مسابقه", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
};

const VIP = () => {
  const { isAdmin } = useUserRole();
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<VIPPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editPost, setEditPost] = useState<Partial<VIPPost>>({});
  const [showImageField, setShowImageField] = useState(false);
  const [showLinkField, setShowLinkField] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("vip_posts")
      .select("*")
      .order("created_at", { ascending: false });
    setPosts((data as VIPPost[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const openEditor = (post?: VIPPost) => {
    if (post) {
      setEditPost(post);
      setShowImageField(!!post.image_url);
      setShowLinkField(!!post.link_url);
    } else {
      setEditPost({ type: "announcement" });
      setShowImageField(false);
      setShowLinkField(false);
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editPost.title?.trim() || !editPost.content?.trim()) {
      toast({ title: "عنوان و محتوا الزامی است", variant: "destructive" });
      return;
    }

    const payload = {
      title: editPost.title,
      content: editPost.content,
      type: editPost.type || "announcement",
      image_url: editPost.image_url || null,
      link_url: editPost.link_url || null,
      link_label: editPost.link_label || null,
    };

    if (editPost.id) {
      const { error } = await supabase.from("vip_posts").update(payload).eq("id", editPost.id);
      if (error) { toast({ title: "خطا", description: error.message, variant: "destructive" }); return; }
      toast({ title: "ویرایش شد ✅" });
    } else {
      const { error } = await supabase.from("vip_posts").insert({ ...payload, author_id: user?.id });
      if (error) { toast({ title: "خطا", description: error.message, variant: "destructive" }); return; }
      toast({ title: "مطلب اضافه شد ✅" });
    }
    setEditPost({});
    setIsEditing(false);
    fetchPosts();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("vip_posts").delete().eq("id", id);
    if (!error) { toast({ title: "حذف شد" }); fetchPosts(); }
  };

  return (
    <AppLayout>
      <SEOHead title="محتوای ویژه" description="سرمقاله‌ها، مسابقات و اطلاعیه‌های ویژه نوبهار" ogUrl="/vip" />
      <div className="animate-fade-in">
        {/* Header */}
        <div className="sticky top-11 z-30 bg-background border-b border-border px-5 py-3 flex items-center justify-between">
          <h1 className="text-[15px] font-bold flex items-center gap-2">
            <Crown size={17} strokeWidth={1.5} className="text-muted-foreground/45" />
            محتوای ویژه
          </h1>
          {isAdmin && !isEditing && (
            <button
              onClick={() => openEditor()}
              className="p-2 text-muted-foreground/45 hover:text-foreground transition-colors"
            >
              <Plus size={18} strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Edit Form */}
        {isAdmin && isEditing && (
          <div className="px-5 py-4 border-b border-border/50 bg-muted/5 space-y-3 animate-slide-down">
            <Input
              placeholder="عنوان مطلب..."
              value={editPost.title || ""}
              onChange={(e) => setEditPost(prev => ({ ...prev, title: e.target.value }))}
              className="bg-background border-border/40 h-10 text-[13px] font-semibold"
            />
            <Textarea
              placeholder="محتوا را بنویسید..."
              value={editPost.content || ""}
              onChange={(e) => setEditPost(prev => ({ ...prev, content: e.target.value }))}
              className="bg-background border-border/40 min-h-[100px] text-[13px] leading-[1.9]"
            />

            {/* Image URL field */}
            {showImageField && (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="آدرس تصویر (URL)..."
                  value={editPost.image_url || ""}
                  onChange={(e) => setEditPost(prev => ({ ...prev, image_url: e.target.value }))}
                  className="bg-background border-border/40 h-9 text-[12px] flex-1"
                  dir="ltr"
                />
                <button onClick={() => { setShowImageField(false); setEditPost(prev => ({ ...prev, image_url: null })); }}
                  className="p-1.5 text-muted-foreground/40 hover:text-destructive transition-colors">
                  <X size={14} />
                </button>
              </div>
            )}
            {showImageField && editPost.image_url && (
              <div className="rounded-lg overflow-hidden border border-border/30 max-h-[160px]">
                <img src={editPost.image_url} alt="پیش‌نمایش" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Link URL field */}
            {showLinkField && (
              <div className="space-y-2">
                <Input
                  placeholder="آدرس لینک (URL)..."
                  value={editPost.link_url || ""}
                  onChange={(e) => setEditPost(prev => ({ ...prev, link_url: e.target.value }))}
                  className="bg-background border-border/40 h-9 text-[12px]"
                  dir="ltr"
                />
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="متن لینک (اختیاری)..."
                    value={editPost.link_label || ""}
                    onChange={(e) => setEditPost(prev => ({ ...prev, link_label: e.target.value }))}
                    className="bg-background border-border/40 h-9 text-[12px] flex-1"
                  />
                  <button onClick={() => { setShowLinkField(false); setEditPost(prev => ({ ...prev, link_url: null, link_label: null })); }}
                    className="p-1.5 text-muted-foreground/40 hover:text-destructive transition-colors">
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Toolbar: type tags + attachment buttons */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {(["announcement", "editorial", "competition"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setEditPost(prev => ({ ...prev, type }))}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors",
                      editPost.type === type ? "bg-foreground text-background" : "bg-muted/50 text-muted-foreground"
                    )}
                  >
                    {TYPE_CONFIG[type].label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                {!showImageField && (
                  <button onClick={() => setShowImageField(true)}
                    className="p-1.5 text-muted-foreground/40 hover:text-foreground transition-colors" title="افزودن تصویر">
                    <ImagePlus size={15} strokeWidth={1.5} />
                  </button>
                )}
                {!showLinkField && (
                  <button onClick={() => setShowLinkField(true)}
                    className="p-1.5 text-muted-foreground/40 hover:text-foreground transition-colors" title="افزودن لینک">
                    <Link2 size={15} strokeWidth={1.5} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setEditPost({}); }} className="text-[12px] h-8">
                انصراف
              </Button>
              <Button size="sm" onClick={handleSave} className="text-[12px] h-8 gap-1">
                <Save size={12} />
                ذخیره
              </Button>
            </div>
          </div>
        )}

        {/* Posts */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length > 0 ? (
          <div className="divide-y divide-border/30">
            {posts.map((post) => {
              const config = TYPE_CONFIG[post.type] || TYPE_CONFIG.announcement;
              return (
                <article key={post.id} className="animate-slide-up">
                  {/* Image */}
                  {post.image_url && (
                    <div className="mx-5 mt-5 rounded-xl overflow-hidden border border-border/20">
                      {post.link_url ? (
                        <a href={post.link_url} target="_blank" rel="noopener noreferrer" className="block">
                          <img src={post.image_url} alt={post.title} className="w-full max-h-[220px] object-cover hover:scale-[1.02] transition-transform duration-300" loading="lazy" />
                        </a>
                      ) : (
                        <img src={post.image_url} alt={post.title} className="w-full max-h-[220px] object-cover" loading="lazy" />
                      )}
                    </div>
                  )}

                  <div className="px-5 pt-4 pb-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Type badge + time */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-bold", config.color)}>
                            {config.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground/35">{getRelativeTime(post.created_at)}</span>
                        </div>

                        <h3 className="text-[15px] font-extrabold text-foreground leading-relaxed">{post.title}</h3>
                        <p className="text-[13px] text-muted-foreground/60 leading-[1.9] mt-2 whitespace-pre-wrap">{post.content}</p>

                        {/* Link */}
                        {post.link_url && (
                          <a
                            href={post.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-primary/[0.06] text-primary text-[11px] font-medium hover:bg-primary/[0.12] transition-colors"
                          >
                            <ExternalLink size={12} strokeWidth={1.5} />
                            {post.link_label || "مشاهده لینک"}
                          </a>
                        )}
                      </div>

                      {isAdmin && (
                        <div className="flex gap-0.5 shrink-0 pt-1">
                          <button
                            onClick={() => openEditor(post)}
                            className="p-1.5 text-muted-foreground/30 hover:text-foreground transition-colors"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="p-1.5 text-muted-foreground/30 hover:text-destructive transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
              <Crown size={24} className="text-muted-foreground/25" />
            </div>
            <p className="text-[13px] text-muted-foreground/40">محتوای ویژه به زودی منتشر می‌شود</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default VIP;

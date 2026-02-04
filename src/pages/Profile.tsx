import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { LogIn, Moon, Sun, Type, LogOut, Shield, Settings } from "lucide-react";
import { MessageCircle as WhatsApp, Facebook, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useUserRole } from "@/hooks/useUserRole";
import { useFollowStats } from "@/hooks/useFollowStats";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { getRelativeTime } from "@/lib/relativeTime";
import { FollowersList } from "@/components/profile/FollowersList";
import { FollowButton } from "@/components/FollowButton";
import { cn } from "@/lib/utils";

const Profile = () => {
  const { userId: paramUserId } = useParams();
  const { user, signOut } = useAuth();
  const viewingUserId = paramUserId || user?.id;
  const isOwnProfile = !paramUserId || paramUserId === user?.id;
  
  const { profile, articles, bookmarks, loading, refetch } = useProfile(viewingUserId);
  const { isAdmin } = useUserRole();
  const { followerCount, followingCount } = useFollowStats(viewingUserId);
  const navigate = useNavigate();
  
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  const [textSize, setTextSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('text-sm', 'text-base', 'text-lg', 'text-xl');
    root.classList.add(`text-${textSize}`);
    localStorage.setItem('textSize', textSize);
  }, [textSize]);

  const textSizes = [
    { key: 'sm' as const, label: 'A' },
    { key: 'base' as const, label: 'A' },
    { key: 'lg' as const, label: 'A' },
    { key: 'xl' as const, label: 'A' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Not logged in and viewing own profile
  if (!user && isOwnProfile) {
    return (
      <AppLayout>
        <div className="p-4 space-y-8 animate-fade-in">
          <div className="flex flex-col items-center py-10 px-6 bg-gradient-to-br from-primary/10 to-accent/5 rounded-2xl border border-primary/20">
            <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mb-5">
              <span className="text-3xl font-bold text-primary-foreground">ن</span>
            </div>
            <h2 className="text-xl font-bold mb-2">به نوبهار خوش آمدید</h2>
            <p className="text-muted-foreground text-sm text-center mb-6 max-w-xs leading-relaxed">
              برای ذخیره مقالات، دنبال کردن نویسندگان و اشتراک‌گذاری صدای خود وارد شوید.
            </p>
            <Link to="/auth">
              <Button className="rounded-full px-8 h-11 btn-press">
                <LogIn size={18} className="ml-2" />
                ورود / ثبت‌نام
              </Button>
            </Link>
          </div>
          
          <SettingsSection
            isDark={isDark}
            setIsDark={setIsDark}
            textSize={textSize}
            setTextSize={setTextSize}
            textSizes={textSizes}
          />
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </AppLayout>
    );
  }

  const hasSocialLinks = profile?.whatsapp_number || profile?.facebook_url || (profile as any)?.linkedin_url;

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto animate-fade-in">
        {/* Profile Header */}
        {profile && (
          <div className="px-4 pt-8 pb-6">
            {/* Avatar & Actions */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    className="w-18 h-18 rounded-2xl object-cover ring-2 ring-primary/10"
                    style={{ width: '72px', height: '72px' }}
                  />
                ) : (
                  <div 
                    className="rounded-2xl bg-primary/10 flex items-center justify-center"
                    style={{ width: '72px', height: '72px' }}
                  >
                    <span className="text-primary font-bold text-3xl">
                      {profile.display_name?.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h1 className="text-lg font-bold text-foreground">{profile.display_name}</h1>
                  {profile.specialty && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{profile.specialty}</p>
                  )}
                </div>
              </div>
              
              {/* Admin icon */}
              {isOwnProfile && isAdmin && (
                <Link 
                  to="/admin" 
                  className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted"
                  aria-label="پنل مدیریت"
                >
                  <Shield size={20} strokeWidth={1.5} />
                </Link>
              )}
            </div>

            {/* Follow Stats */}
            <div className="flex items-center gap-5 mt-5">
              <button 
                onClick={() => setShowFollowers(true)}
                className="hover:opacity-80 transition-opacity"
              >
                <span className="font-bold text-foreground text-lg">{followerCount}</span>
                <span className="text-muted-foreground text-sm mr-1">دنبال‌کننده</span>
              </button>
              <span className="text-muted-foreground/30">|</span>
              <button 
                onClick={() => setShowFollowing(true)}
                className="hover:opacity-80 transition-opacity"
              >
                <span className="font-bold text-foreground text-lg">{followingCount}</span>
                <span className="text-muted-foreground text-sm mr-1">دنبال‌شده</span>
              </button>
            </div>

            {/* Social Links */}
            {hasSocialLinks && (
              <div className="flex items-center gap-2 mt-4">
                {profile.whatsapp_number && (
                  <a 
                    href={`https://wa.me/${profile.whatsapp_number}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
                    aria-label="واتساپ"
                  >
                    <WhatsApp size={18} strokeWidth={1.5} />
                  </a>
                )}
                {profile.facebook_url && (
                  <a 
                    href={profile.facebook_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
                    aria-label="فیسبوک"
                  >
                    <Facebook size={18} strokeWidth={1.5} />
                  </a>
                )}
                {(profile as any)?.linkedin_url && (
                  <a 
                    href={(profile as any).linkedin_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
                    aria-label="لینکدین"
                  >
                    <Linkedin size={18} strokeWidth={1.5} />
                  </a>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 mt-5">
              {isOwnProfile ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditModalOpen(true)}
                  className="rounded-full px-5"
                >
                  ویرایش پروفایل
                </Button>
              ) : (
                viewingUserId && <FollowButton userId={viewingUserId} />
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="articles" className="w-full">
          <TabsList className={cn(
            "w-full bg-transparent border-b border-border rounded-none h-auto p-0 sticky top-12 z-20 bg-card",
            isOwnProfile ? "grid-cols-3" : "grid-cols-2"
          )}>
            <TabsTrigger 
              value="articles" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 text-sm font-medium"
            >
              مقالات
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger 
                value="saved" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 text-sm font-medium"
              >
                ذخیره‌شده‌ها
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="about" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 text-sm font-medium"
            >
              درباره
            </TabsTrigger>
          </TabsList>

          <TabsContent value="articles" className="mt-0">
            {articles.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  📝
                </div>
                {isOwnProfile ? "هنوز مقاله‌ای ننوشته‌اید" : "هنوز مقاله‌ای ندارد"}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {articles.map((article, index) => (
                  <ProfileArticleItem 
                    key={article.id} 
                    article={article}
                    style={{ animationDelay: `${index * 50}ms` }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {isOwnProfile && (
            <TabsContent value="saved" className="mt-0">
              {bookmarks.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground text-sm">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    🔖
                  </div>
                  هنوز مقاله‌ای ذخیره نکرده‌اید
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {bookmarks.map((article, index) => (
                    <ProfileArticleItem 
                      key={article.id} 
                      article={article}
                      style={{ animationDelay: `${index * 50}ms` }}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="about" className="mt-0 p-4">
            <div className="space-y-4">
              {profile?.specialty && (
                <div className="bg-muted/50 rounded-xl p-4">
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">تخصص</h4>
                  <p className="text-sm text-foreground">{profile.specialty}</p>
                </div>
              )}
              <div className="bg-muted/50 rounded-xl p-4">
                <h4 className="text-xs font-medium text-muted-foreground mb-1">تاریخ عضویت</h4>
                <p className="text-sm text-foreground">
                  {profile?.created_at ? getRelativeTime(profile.created_at) : "نامشخص"}
                </p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <h4 className="text-xs font-medium text-muted-foreground mb-1">آمار</h4>
                <p className="text-sm text-foreground">{articles.length} مقاله منتشر شده</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Settings & Sign Out */}
        {isOwnProfile && (
          <div className="p-4 space-y-4 border-t border-border mt-6">
            <SettingsSection
              isDark={isDark}
              setIsDark={setIsDark}
              textSize={textSize}
              setTextSize={setTextSize}
              textSizes={textSizes}
            />

            <Button
              variant="outline"
              onClick={handleSignOut}
              className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground h-11"
            >
              <LogOut size={16} />
              خروج از حساب
            </Button>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {profile && isOwnProfile && user && (
        <EditProfileModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          userId={user.id}
          currentDisplayName={profile.display_name}
          currentSpecialty={profile.specialty}
          currentAvatarUrl={profile.avatar_url}
          currentWhatsapp={profile.whatsapp_number}
          currentFacebook={profile.facebook_url}
          currentLinkedin={(profile as any).linkedin_url}
          onUpdate={refetch}
        />
      )}

      {/* Followers List Modal */}
      {viewingUserId && (
        <>
          <FollowersList
            isOpen={showFollowers}
            onClose={() => setShowFollowers(false)}
            userId={viewingUserId}
            type="followers"
          />
          <FollowersList
            isOpen={showFollowing}
            onClose={() => setShowFollowing(false)}
            userId={viewingUserId}
            type="following"
          />
        </>
      )}
    </AppLayout>
  );
};

// Profile Article Item
function ProfileArticleItem({ 
  article, 
  style 
}: { 
  article: { id: string; title: string; cover_image_url: string | null; created_at: string };
  style?: React.CSSProperties;
}) {
  return (
    <Link
      to={`/article/${article.id}`}
      className="flex gap-4 px-4 py-4 hover:bg-muted/30 transition-colors animate-slide-up"
      style={style}
    >
      {article.cover_image_url && (
        <img 
          src={article.cover_image_url} 
          alt="" 
          className="w-14 h-14 rounded-lg object-cover shrink-0"
          loading="lazy"
        />
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground text-sm line-clamp-2">{article.title}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {getRelativeTime(article.created_at)}
        </p>
      </div>
    </Link>
  );
}

// Settings Section
function SettingsSection({
  isDark,
  setIsDark,
  textSize,
  setTextSize,
  textSizes,
}: {
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  textSize: 'sm' | 'base' | 'lg' | 'xl';
  setTextSize: (v: 'sm' | 'base' | 'lg' | 'xl') => void;
  textSizes: { key: 'sm' | 'base' | 'lg' | 'xl'; label: string }[];
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold flex items-center gap-2">
        <Settings size={16} className="text-muted-foreground" />
        تنظیمات
      </h3>

      {/* Dark Mode */}
      <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
        <div className="flex items-center gap-3">
          {isDark ? <Moon size={18} className="text-primary" /> : <Sun size={18} className="text-primary" />}
          <span className="font-medium text-sm">حالت تاریک</span>
        </div>
        <button
          onClick={() => setIsDark(!isDark)}
          className={cn(
            "w-12 h-6 rounded-full transition-colors relative",
            isDark ? 'bg-primary' : 'bg-muted'
          )}
          aria-label={isDark ? "غیرفعال کردن حالت تاریک" : "فعال کردن حالت تاریک"}
        >
          <span
            className={cn(
              "absolute top-0.5 w-5 h-5 rounded-full bg-card shadow-sm transition-transform",
              isDark ? 'translate-x-6' : 'translate-x-0.5'
            )}
          />
        </button>
      </div>

      {/* Text Size */}
      <div className="p-4 bg-card rounded-xl border border-border">
        <div className="flex items-center gap-3 mb-3">
          <Type size={18} className="text-primary" />
          <span className="font-medium text-sm">اندازه متن</span>
        </div>
        <div className="flex items-center justify-between bg-muted rounded-lg p-1">
          {textSizes.map((size, index) => (
            <button
              key={size.key}
              onClick={() => setTextSize(size.key)}
              className={cn(
                "flex-1 py-2 rounded-md transition-all text-sm",
                textSize === size.key 
                  ? 'bg-card shadow-sm text-foreground font-medium' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
              style={{ fontSize: `${12 + index * 2}px` }}
              aria-label={`اندازه متن ${size.key}`}
            >
              {size.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Profile;

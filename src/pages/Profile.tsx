import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { LogIn, Moon, Sun, Type, LogOut, Shield, Phone, MessageCircle as WhatsApp, Facebook, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useUserRole } from "@/hooks/useUserRole";
import { useFollowStats } from "@/hooks/useFollowStats";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { formatSolarShort } from "@/lib/solarHijri";
import { FollowersList } from "@/components/profile/FollowersList";

const Profile = () => {
  const { userId: paramUserId } = useParams();
  const { user, signOut } = useAuth();
  const viewingUserId = paramUserId || user?.id;
  const isOwnProfile = !paramUserId || paramUserId === user?.id;
  
  const { profile, articles, bookmarks, loading, refetch } = useProfile(viewingUserId);
  const { isAdmin } = useUserRole();
  const { followerCount, followingCount } = useFollowStats(viewingUserId);
  const navigate = useNavigate();
  
  const [isDark, setIsDark] = useState(false);
  const [textSize, setTextSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('text-sm', 'text-base', 'text-lg', 'text-xl');
    root.classList.add(`text-${textSize}`);
  }, [textSize]);

  const textSizes = [
    { key: 'sm' as const, label: 'A', size: 'text-sm' },
    { key: 'base' as const, label: 'A', size: 'text-base' },
    { key: 'lg' as const, label: 'A', size: 'text-lg' },
    { key: 'xl' as const, label: 'A', size: 'text-xl' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Not logged in and viewing own profile - show sign in card
  if (!user && isOwnProfile) {
    return (
      <AppLayout>
        <div className="p-4 space-y-8">
          <div className="flex flex-col items-center py-8 px-4 bg-card rounded-2xl border border-border/60">
            <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mb-4">
              <span className="text-3xl font-bold text-primary-foreground">ن</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">به نوبهار خوش آمدید</h2>
            <p className="text-muted-foreground text-sm text-center mb-6 max-w-xs">
              برای ذخیره مقالات، دنبال کردن نویسندگان و اشتراک‌گذاری صدای خود وارد شوید.
            </p>
            <Link to="/auth">
              <Button className="bg-primary text-primary-foreground rounded-full px-8 h-11">
                <LogIn size={18} className="ml-2" />
                ورود
              </Button>
            </Link>
          </div>
          
          {/* Settings for guests */}
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
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  // Check if profile has social links
  const hasSocialLinks = profile?.whatsapp_number || profile?.facebook_url || (profile as any)?.linkedin_url;

  return (
    <AppLayout>
      <div className="p-4 space-y-4">
        {/* Profile Header - Compact */}
        {profile && (
          <ProfileHeader
            displayName={profile.display_name}
            avatarUrl={profile.avatar_url}
            specialty={profile.specialty}
            reputationScore={profile.reputation_score}
            isOwnProfile={isOwnProfile}
            onEditClick={() => setEditModalOpen(true)}
          />
        )}

        {/* Follow Stats - Clickable */}
        <div className="flex items-center justify-center gap-6 py-3">
          <button 
            onClick={() => setShowFollowers(true)}
            className="text-center hover:opacity-70 transition-opacity"
          >
            <span className="font-semibold text-lg">{followerCount}</span>
            <p className="text-xs text-muted-foreground">دنبال‌کننده</p>
          </button>
          <div className="w-px h-8 bg-border" />
          <button 
            onClick={() => setShowFollowing(true)}
            className="text-center hover:opacity-70 transition-opacity"
          >
            <span className="font-semibold text-lg">{followingCount}</span>
            <p className="text-xs text-muted-foreground">دنبال‌شده</p>
          </button>
        </div>

        {/* Social Links (if available) */}
        {hasSocialLinks && (
          <div className="flex items-center justify-center gap-3">
            {profile?.whatsapp_number && (
              <a 
                href={`https://wa.me/${profile.whatsapp_number}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
              >
                <WhatsApp size={18} className="text-muted-foreground" />
              </a>
            )}
            {profile?.facebook_url && (
              <a 
                href={profile.facebook_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
              >
                <Facebook size={18} className="text-muted-foreground" />
              </a>
            )}
            {(profile as any)?.linkedin_url && (
              <a 
                href={(profile as any).linkedin_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
              >
                <Linkedin size={18} className="text-muted-foreground" />
              </a>
            )}
          </div>
        )}

        {/* Admin Button - only for own profile */}
        {isOwnProfile && isAdmin && (
          <Link to="/admin">
            <Button variant="outline" className="w-full gap-2 h-10 text-sm">
              <Shield size={16} />
              پنل مدیریت
            </Button>
          </Link>
        )}

        {/* Tabs: مقالات / ذخیره‌شده‌ها / درباره ما */}
        <Tabs defaultValue="articles" className="w-full">
          <TabsList className={`grid w-full ${isOwnProfile ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="articles" className="text-sm">مقالات</TabsTrigger>
            {isOwnProfile && <TabsTrigger value="saved" className="text-sm">ذخیره‌شده‌ها</TabsTrigger>}
            <TabsTrigger value="about" className="text-sm">درباره ما</TabsTrigger>
          </TabsList>

          <TabsContent value="articles" className="mt-4 space-y-2">
            {articles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                هنوز مقاله‌ای ننوشته‌اید
              </div>
            ) : (
              articles.map((article) => (
                <ArticleListItem key={article.id} article={article} />
              ))
            )}
          </TabsContent>

          {isOwnProfile && (
            <TabsContent value="saved" className="mt-4 space-y-2">
              {bookmarks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  هنوز مقاله‌ای ذخیره نکرده‌اید
                </div>
              ) : (
                bookmarks.map((article) => (
                  <ArticleListItem key={article.id} article={article} />
                ))
              )}
            </TabsContent>
          )}

          <TabsContent value="about" className="mt-4">
            <div className="bg-card rounded-xl border border-border/60 p-4 space-y-4">
              {profile?.specialty && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-1">تخصص</h4>
                  <p className="text-sm text-muted-foreground">{profile.specialty}</p>
                </div>
              )}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-1">تاریخ عضویت</h4>
                <p className="text-sm text-muted-foreground">
                  {profile?.created_at ? formatSolarShort(profile.created_at) : "—"}
                </p>
              </div>
              {profile?.reputation_score !== undefined && profile.reputation_score > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-1">امتیاز</h4>
                  <p className="text-sm text-muted-foreground">{profile.reputation_score}</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Settings & Sign Out - only for own profile */}
        {isOwnProfile && (
          <>
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
              className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground h-10 text-sm"
            >
              <LogOut size={16} />
              خروج از حساب
            </Button>
          </>
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

// Article List Item Component - More compact
function ArticleListItem({ article }: { article: { id: string; title: string; cover_image_url: string | null; created_at: string } }) {
  return (
    <Link
      to={`/article/${article.id}`}
      className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border/60 hover:border-primary/30 transition-colors"
    >
      {article.cover_image_url ? (
        <img
          src={article.cover_image_url}
          alt={article.title}
          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-primary font-semibold">ن</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground line-clamp-2 text-sm">{article.title}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {formatSolarShort(article.created_at)}
        </p>
      </div>
    </Link>
  );
}

// Settings Section Component - More compact
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
  textSizes: { key: 'sm' | 'base' | 'lg' | 'xl'; label: string; size: string }[];
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">تنظیمات</h3>

      {/* Dark Mode */}
      <div className="flex items-center justify-between p-3 bg-card rounded-xl border border-border/60">
        <div className="flex items-center gap-2">
          {isDark ? <Moon size={18} className="text-primary" /> : <Sun size={18} className="text-primary" />}
          <span className="font-medium text-sm">حالت تاریک</span>
        </div>
        <button
          onClick={() => setIsDark(!isDark)}
          className={`w-11 h-6 rounded-full transition-colors ${isDark ? 'bg-primary' : 'bg-muted'} relative`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-card shadow transition-transform ${isDark ? 'translate-x-5' : 'translate-x-0.5'}`}
          />
        </button>
      </div>

      {/* Text Size */}
      <div className="p-3 bg-card rounded-xl border border-border/60">
        <div className="flex items-center gap-2 mb-3">
          <Type size={18} className="text-primary" />
          <span className="font-medium text-sm">اندازه متن</span>
        </div>
        <div className="flex items-center justify-between bg-muted rounded-lg p-1">
          {textSizes.map((size, index) => (
            <button
              key={size.key}
              onClick={() => setTextSize(size.key)}
              className={`flex-1 py-1.5 rounded-md transition-colors text-sm ${textSize === size.key ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
              style={{ fontSize: `${11 + index * 3}px` }}
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
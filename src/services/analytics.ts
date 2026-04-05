// Analytics Service — stubbed out (tables don't exist yet)
// All methods are no-ops that silently succeed to prevent console spam

export type ActivityType = 
  | 'app_open' | 'app_install' | 'app_update' | 'login' | 'logout' | 'register'
  | 'article_view' | 'article_read' | 'article_write' | 'article_publish' 
  | 'article_edit' | 'article_delete' | 'article_share' | 'article_bookmark' 
  | 'article_unbookmark' | 'article_like' | 'article_unlike'
  | 'comment_add' | 'comment_edit' | 'comment_delete' | 'comment_like'
  | 'reaction_add' | 'reaction_remove' | 'follow_user' | 'unfollow_user'
  | 'profile_view' | 'profile_edit' | 'profile_setup'
  | 'search' | 'explore_view' | 'notification_open' | 'notification_read'
  | 'vip_post_view' | 'admin_action';

export interface ActivityLogEntry {
  userId?: string;
  deviceId: string;
  activityType: ActivityType;
  entityId?: string;
  entityType?: string;
  metadata?: Record<string, any>;
  url?: string;
  referrer?: string;
  timeSpentSeconds?: number;
}

const getDeviceId = (): string => {
  const storageKey = 'nawbahar_device_id';
  let deviceId = localStorage.getItem(storageKey);
  if (!deviceId) {
    deviceId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(storageKey, deviceId);
  }
  return deviceId;
};

// No-op analytics service — all DB writes disabled until tables are created
export const analyticsService = {
  deviceId: getDeviceId(),
  getDeviceInfo: () => ({ deviceId: getDeviceId(), deviceType: 'unknown' as const }),
  async registerDevice() { return getDeviceId(); },
  async logActivity(_entry: ActivityLogEntry) { /* no-op */ },
  async startSession(_userId?: string) { return null; },
  async endSession(_sessionId: string) { /* no-op */ },
  async updatePresence() { /* no-op */ },
  async trackAppInstall() { /* no-op */ },
  async trackRegistration() { /* no-op */ },
  async trackLogin() { /* no-op */ },
  async trackLogout() { /* no-op */ },
  async trackArticleView() { /* no-op */ },
  async trackArticleRead() { /* no-op */ },
  async trackSearch() { /* no-op */ },
  async trackProfileView() { /* no-op */ },
};

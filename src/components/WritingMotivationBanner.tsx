import { useState, useCallback } from "react";
import type { MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, Edit, Sparkles } from "lucide-react";
import { WritingGuidanceModal } from "@/components/WritingGuidanceModal";
import { type WritingMotivationData } from "@/hooks/useWritingMotivation";
import { cn } from "@/lib/utils";

interface WritingMotivationBannerProps {
    position: "sticky-top" | "feed-card";
    onDismiss?: () => void;
    motivationData: WritingMotivationData;
}

export function WritingMotivationBanner({ position, onDismiss, motivationData }: WritingMotivationBannerProps) {
    const navigate = useNavigate();
    const [showGuidance, setShowGuidance] = useState(false);

    const handleOpenEditor = useCallback(
        (e: MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            e.stopPropagation();
            // Close any open guidance modal first
            setShowGuidance(false);
            // Small delay to ensure modal closes before navigation
            setTimeout(() => {
                navigate("/editor", {
                    state: {
                        motivationPrompt: "امروز یاد گرفتم...",
                        autoFocus: true,
                        bannerClick: true,
                    },
                });
            }, 100);
        },
        [navigate],
    );

    const renderActionText = motivationData.hasWrittenToday
        ? "امروز نوشتید — اگر دوباره کوتاه بنویسید عالی است"
        : motivationData.dailyMessage;

    return (
        <>
            <div
                className={cn(
                    "relative rounded-2xl border border-border p-4 shadow-sm",
                    "bg-gradient-to-r from-sky-50 via-white to-fuchsia-50 dark:from-sky-950 dark:via-slate-950 dark:to-fuchsia-950",
                    position === "feed-card" ? "mx-4 my-3" : "mx-4 mb-3",
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={18} className="text-primary" />
                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                                    نوشتن سریع
                            </span>
                        </div>
                        <p className="text-sm font-semibold text-foreground leading-6">
                            {renderActionText}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 text-[12px] text-muted-foreground">
                            <span className="rounded-full bg-white/70 px-2 py-1 text-[11px] font-medium dark:bg-slate-900/70">
                                {motivationData.currentStreak > 0
                                    ? `🔥 ${motivationData.currentStreak} روز متوالی`
                                    : "امروز اولین خط شما"}
                            </span>
                            <span className="rounded-full bg-white/70 px-2 py-1 text-[11px] font-medium dark:bg-slate-900/70">
                                {motivationData.articlesThisMonth < motivationData.maxMonthly
                                    ? `${motivationData.maxMonthly - motivationData.articlesThisMonth} مقاله باقی‌مانده این ماه برای تکمیل کردن نوشتن مقاله های ماهانه!`
                                    : "حداکثر مقاله‌های ماه را نوشته‌اید"}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <button
                            onClick={handleOpenEditor}
                            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 active:scale-95"
                        >
                            <Edit size={14} />
                            بنویس
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowGuidance(true);
                            }}
                            className="text-[12px] text-muted-foreground hover:text-foreground"
                        >
                            راهنمایی نوشتن
                        </button>
                    </div>
                </div>

                {onDismiss && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDismiss();
                        }}
                        className="absolute right-2 top-2 z-20 rounded-full bg-background/90 p-2 text-muted-foreground hover:text-foreground hover:bg-background shadow-sm border border-border/50 transition-all"
                        aria-label="بستن"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            {showGuidance && (
                <WritingGuidanceModal
                    isOpen={showGuidance}
                    onClose={() => setShowGuidance(false)}
                    onOpenEditor={(e) => {
                        setShowGuidance(false);
                        // Small delay to ensure modal closes before navigation
                        setTimeout(() => handleOpenEditor(e), 150);
                    }}
                />
            )}
        </>
    );
}

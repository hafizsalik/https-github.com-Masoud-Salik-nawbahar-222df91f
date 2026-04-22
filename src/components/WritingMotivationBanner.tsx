import { useState, useCallback, useMemo } from "react";
import type { MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { X, Edit, Sparkles } from "lucide-react";
import { WritingGuidanceModal } from "@/components/WritingGuidanceModal";
import { type WritingMotivationData } from "@/hooks/useWritingMotivation";
import { cn } from "@/lib/utils";

interface WritingMotivationBannerProps {
    position: "sticky-top" | "feed-card";
    onDismiss?: () => void;
    motivationData: WritingMotivationData;
}

export function WritingMotivationBanner({
    position,
    onDismiss,
    motivationData,
}: WritingMotivationBannerProps) {
    const navigate = useNavigate();
    const [showGuidance, setShowGuidance] = useState(false);

    // ✅ cleaner navigation (no timeout)
    const goToEditor = useCallback(() => {
        navigate("/editor", {
            state: {
                motivationPrompt: "امروز یاد گرفتم...",
                autoFocus: true,
                bannerClick: true,
            },
        });
    }, [navigate]);

    const handleOpenEditor = useCallback(
        (e?: MouseEvent) => {
            e?.preventDefault();
            e?.stopPropagation();
            setShowGuidance(false);
            goToEditor();
        },
        [goToEditor],
    );

    // ✅ memoized text
    const actionText = useMemo(() => {
        return motivationData.hasWrittenToday
            ? "امروز نوشتید — یک خط دیگر هم عالیه ✨"
            : motivationData.dailyMessage;
    }, [motivationData]);

    const remainingArticles = motivationData.maxMonthly - motivationData.articlesThisMonth;

    return (
        <>
            <div
                className={cn(
                    "relative rounded-2xl border border-border p-4 shadow-sm transition-all duration-200",
                    "bg-gradient-to-r from-sky-50 via-white to-fuchsia-50 dark:from-sky-950 dark:via-slate-950 dark:to-fuchsia-950",
                    "hover:shadow-md",
                    "pr-10", // ✅ fix overlap with close button
                    position === "feed-card" ? "mx-4 my-3" : "mx-4 mb-3",
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start gap-4">
                    {/* LEFT CONTENT */}
                    <div className="flex-1 min-w-0">
                        {/* HEADER */}
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={18} className="text-primary shrink-0" />
                            <span className="text-sm font-bold text-primary">
                                نوشتن سریع
                            </span>
                        </div>

                        {/* MESSAGE */}
                        <p className="text-sm font-medium text-foreground leading-6 line-clamp-2">
                            {actionText}
                        </p>

                        {/* STATS */}
                        <div className="mt-3 flex flex-wrap gap-2 text-[12px] text-muted-foreground">
                            <span className="rounded-full bg-white/70 px-2 py-1 text-[11px] font-medium dark:bg-slate-900/70">
                                {motivationData.currentStreak > 0
                                    ? `🔥 ${motivationData.currentStreak} روز`
                                    : "شروع امروز"}
                            </span>

                            <span className="rounded-full bg-white/70 px-2 py-1 text-[11px] font-medium dark:bg-slate-900/70">
                                {remainingArticles > 0
                                    ? `${remainingArticles} باقی‌مانده`
                                    : "تکمیل شد ✅"}
                            </span>
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <button
                            onClick={handleOpenEditor}
                            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
                            className="text-[12px] text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none"
                        >
                            راهنمایی
                        </button>
                    </div>
                </div>

                {/* CLOSE BUTTON */}
                {onDismiss && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDismiss();
                        }}
                        className="absolute right-2 top-2 z-20 rounded-full bg-background/90 p-2 text-muted-foreground hover:text-foreground hover:bg-background shadow-sm border border-border/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label="بستن"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* MODAL */}
            {showGuidance && (
                <WritingGuidanceModal
                    isOpen={showGuidance}
                    onClose={() => setShowGuidance(false)}
                    onOpenEditor={handleOpenEditor}
                />
            )}
        </>
    );
}

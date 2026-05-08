import { useState, useCallback } from "react";
import type { MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { X, PenLine } from "lucide-react";
import { WritingGuidanceModal } from "@/components/WritingGuidanceModal";
import { type WritingMotivationData } from "@/hooks/useWritingMotivation";
import { cn } from "@/lib/utils";

interface WritingMotivationBannerProps {
    position: "sticky-top" | "feed-card";
    onDismiss?: () => void;
    motivationData: WritingMotivationData;
}

/**
 * Quiet, contextual writing nudge — Medium-style "tip card".
 * No gradients, no streak/count chips, single ghost CTA.
 */
export function WritingMotivationBanner({
    position,
    onDismiss,
    motivationData,
}: WritingMotivationBannerProps) {
    const navigate = useNavigate();
    const [showGuidance, setShowGuidance] = useState(false);

    const goToEditor = useCallback(() => {
        navigate("/editor", {
            state: { autoFocus: true, bannerClick: true },
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

    const message = motivationData.hasWrittenToday
        ? "امروز نوشتید. یک خط دیگر هم عالیه."
        : motivationData.dailyMessage;

    return (
        <>
            <div
                className={cn(
                    "relative rounded-xl border border-border/60 bg-card px-4 py-3 transition-colors",
                    "hover:border-border",
                    position === "feed-card" ? "mx-4 my-4" : "mx-4 mt-3 mb-1",
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 pl-6">
                    <PenLine size={15} strokeWidth={1.7} className="text-muted-foreground/70 shrink-0" />

                    <p className="flex-1 min-w-0 text-[12.5px] leading-snug text-foreground/85 truncate">
                        {message}
                    </p>

                    <button
                        type="button"
                        onClick={handleOpenEditor}
                        className="shrink-0 inline-flex items-center rounded-full border border-border/70 px-3 h-7 text-[11.5px] font-medium text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                        بنویسید
                    </button>
                </div>

                {onDismiss && (
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDismiss(); }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                        aria-label="بستن"
                    >
                        <X size={13} strokeWidth={1.8} />
                    </button>
                )}
            </div>

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

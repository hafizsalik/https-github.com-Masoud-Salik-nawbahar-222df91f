import { Award } from "lucide-react";
import { toPersianNumber, cn } from "@/lib/utils";

interface EditorialScoreChartProps {
  science: number;     // 0-15
  ethics: number;      // 0-10
  writing: number;     // 0-10
  timing: number;      // 0-10
  innovation: number;  // 0-5
  className?: string;
}

const CRITERIA = [
  { key: "science",    label: "علمی",      max: 15, color: "hsl(var(--primary))" },
  { key: "ethics",     label: "اخلاقی",    max: 10, color: "hsl(var(--accent))" },
  { key: "writing",    label: "نگارشی",    max: 10, color: "hsl(160 60% 45%)" },
  { key: "timing",     label: "به‌روزی",   max: 10, color: "hsl(28 85% 55%)" },
  { key: "innovation", label: "نوآوری",    max: 5,  color: "hsl(340 70% 55%)" },
] as const;

/**
 * Compact 5-criterion editorial score display surfaced on the article reader
 * to reinforce نوبهار's editorial standard. Hidden when all scores are zero
 * (article hasn't been scored yet).
 */
export function EditorialScoreChart({
  science, ethics, writing, timing, innovation, className,
}: EditorialScoreChartProps) {
  const values = { science, ethics, writing, timing, innovation };
  const total = science + ethics + writing + timing + innovation;
  if (total <= 0) return null;

  // weighted average percent: (sum of value/max) / 5 * 100
  const avgPercent = Math.round(
    ((science / 15 + ethics / 10 + writing / 10 + timing / 10 + innovation / 5) / 5) * 100
  );

  return (
    <section
      className={cn(
        "rounded-2xl border border-border/30 bg-card/40 p-4 my-8",
        className
      )}
      aria-label="ارزیابی سرمقاله‌ای"
    >
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Award size={15} strokeWidth={1.8} className="text-primary" />
          <h3 className="text-[13px] font-bold text-foreground">ارزیابی سرمقاله</h3>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-[18px] font-extrabold text-primary tabular-nums">
            {toPersianNumber(avgPercent)}
          </span>
          <span className="text-[10px] text-muted-foreground/70">٪</span>
        </div>
      </header>

      <ul className="space-y-2">
        {CRITERIA.map(({ key, label, max, color }) => {
          const v = values[key];
          const pct = Math.max(0, Math.min(100, (v / max) * 100));
          return (
            <li key={key} className="flex items-center gap-3">
              <span className="w-16 text-[11px] text-muted-foreground shrink-0">{label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-muted/60 overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
              <span className="w-10 text-[11px] text-foreground/80 tabular-nums text-left">
                {toPersianNumber(v)}<span className="text-muted-foreground/50">/{toPersianNumber(max)}</span>
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-[10px] text-muted-foreground/60 leading-relaxed">
        این ارزیابی توسط سامانه نوبهار بر اساس پنج معیار علمی، اخلاقی، نگارشی، به‌روزی و نوآوری انجام شده است.
      </p>
    </section>
  );
}

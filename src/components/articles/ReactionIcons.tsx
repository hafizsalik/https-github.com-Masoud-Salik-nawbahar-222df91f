import { cn } from "@/lib/utils";
import likeIcon from "@/assets/icons/reaction-like.svg";
import loveIcon from "@/assets/icons/reaction-love.svg";
import insightfulIcon from "@/assets/icons/reaction-insightful.svg";
import laughIcon from "@/assets/icons/reaction-laugh.svg";
import sadIcon from "@/assets/icons/reaction-sad.svg";

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  animated?: boolean;
}

function IconMask({ size = 24, className, animated, icon }: IconProps & { icon: string }) {
  return (
    <span
      className={cn(
        "reaction-mask transition-all duration-200",
        animated && "animate-reaction-pop-enhanced",
        className
      )}
      style={{
        width: size,
        height: size,
        WebkitMaskImage: `url(${icon})`,
        maskImage: `url(${icon})`,
      }}
      aria-hidden="true"
    />
  );
}

/** Modern reaction icons using uploaded pack - lively, professional, with subtle animations */
export function ThumbsUpIcon({ size = 24, className, animated = false }: IconProps) {
  return (
    <IconMask
      size={size}
      animated={animated}
      className={cn(animated && "animate-pulse-subtle", className)}
      icon={likeIcon}
    />
  );
}

export function HeartIcon({ size = 24, className, animated = false }: IconProps) {
  return (
    <IconMask
      size={size}
      animated={animated}
      className={cn(animated && "animate-heartbeat", className)}
      icon={loveIcon}
    />
  );
}

export function LightbulbIcon({ size = 24, className, animated = false }: IconProps) {
  return (
    <IconMask
      size={size}
      animated={animated}
      className={cn(animated && "animate-glow", className)}
      icon={insightfulIcon}
    />
  );
}

export function SmileIcon({ size = 24, className, animated = false }: IconProps) {
  return (
    <IconMask
      size={size}
      animated={animated}
      className={cn(animated && "animate-bounce-gentle", className)}
      icon={laughIcon}
    />
  );
}

export function FrownIcon({ size = 24, className, animated = false }: IconProps) {
  return (
    <IconMask
      size={size}
      animated={animated}
      className={cn(animated && "animate-sway", className)}
      icon={sadIcon}
    />
  );
}

export const REACTION_SVG_ICONS: Record<string, (props: IconProps) => JSX.Element> = {
  like: ThumbsUpIcon,
  love: HeartIcon,
  insightful: LightbulbIcon,
  laugh: SmileIcon,
  sad: FrownIcon,
};

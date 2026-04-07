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

/** Direct <img> rendering — guarantees icons display on all platforms */
function ReactionImg({ size = 24, className, animated, icon, alt }: IconProps & { icon: string; alt: string }) {
  return (
    <img
      src={icon}
      alt={alt}
      width={size}
      height={size}
      draggable={false}
      className={cn(
        "inline-block flex-shrink-0 transition-transform duration-200",
        animated && "animate-reaction-pop-enhanced",
        className
      )}
      aria-hidden="true"
    />
  );
}

export function ThumbsUpIcon({ size = 24, className, animated = false }: IconProps) {
  return <ReactionImg size={size} animated={animated} className={className} icon={likeIcon} alt="like" />;
}

export function HeartIcon({ size = 24, className, animated = false }: IconProps) {
  return <ReactionImg size={size} animated={animated} className={className} icon={loveIcon} alt="love" />;
}

export function LightbulbIcon({ size = 24, className, animated = false }: IconProps) {
  return <ReactionImg size={size} animated={animated} className={className} icon={insightfulIcon} alt="insightful" />;
}

export function SmileIcon({ size = 24, className, animated = false }: IconProps) {
  return <ReactionImg size={size} animated={animated} className={className} icon={laughIcon} alt="laugh" />;
}

export function FrownIcon({ size = 24, className, animated = false }: IconProps) {
  return <ReactionImg size={size} animated={animated} className={className} icon={sadIcon} alt="sad" />;
}

export const REACTION_SVG_ICONS: Record<string, (props: IconProps) => JSX.Element> = {
  like: ThumbsUpIcon,
  love: HeartIcon,
  insightful: LightbulbIcon,
  laugh: SmileIcon,
  sad: FrownIcon,
};

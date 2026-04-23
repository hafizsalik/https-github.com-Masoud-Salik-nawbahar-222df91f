import { cn } from "@/lib/utils";
import likeIcon from "@/assets/icons/reaction-like.svg";
import celebrateIcon from "@/assets/icons/reaction-celebrate.svg";
import supportIcon from "@/assets/icons/reaction-support.svg";
import insightfulIcon from "@/assets/icons/reaction-insightful.svg";
import appreciateIcon from "@/assets/icons/reaction-appreciate.svg";
import funnyIcon from "@/assets/icons/reaction-funny.svg";

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
  return <ReactionImg size={size} animated={animated} className={className} icon={celebrateIcon} alt="celebrate" />;
}

export function SupportIcon({ size = 24, className, animated = false }: IconProps) {
  return <ReactionImg size={size} animated={animated} className={className} icon={supportIcon} alt="support" />;
}

export function LightbulbIcon({ size = 24, className, animated = false }: IconProps) {
  return <ReactionImg size={size} animated={animated} className={className} icon={insightfulIcon} alt="insightful" />;
}

export function HandshakeIcon({ size = 24, className, animated = false }: IconProps) {
  return <ReactionImg size={size} animated={animated} className={className} icon={appreciateIcon} alt="appreciate" />;
}

export function FunnyIcon({ size = 24, className, animated = false }: IconProps) {
  return <ReactionImg size={size} animated={animated} className={className} icon={funnyIcon} alt="funny" />;
}

export const REACTION_SVG_ICONS: Record<string, (props: IconProps) => JSX.Element> = {
  like: ThumbsUpIcon,
  celebrate: HeartIcon,
  support: SupportIcon,
  insightful: LightbulbIcon,
  appreciate: HandshakeIcon,
  funny: FunnyIcon,
};

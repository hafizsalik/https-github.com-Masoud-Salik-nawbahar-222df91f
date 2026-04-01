import { cn } from "@/lib/utils";

interface NawbaharIconProps {
  src: string;
  size?: number;
  className?: string;
  alt?: string;
}

export function NawbaharIcon({ src, size = 20, className, alt = "" }: NawbaharIconProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn("inline-block flex-shrink-0", className)}
      draggable={false}
    />
  );
}

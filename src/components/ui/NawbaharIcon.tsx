import { cn } from "@/lib/utils";
import homeIcon from "@/assets/icons/nav-home.svg";
import searchIcon from "@/assets/icons/nav-search.svg";
import addIcon from "@/assets/icons/nav-add.svg";
import bookmarkIcon from "@/assets/icons/nav-bookmark.svg";
import userIcon from "@/assets/icons/nav-user.svg";
import menuIcon from "@/assets/icons/nav-menu.svg";
import bellIcon from "@/assets/icons/nav-bell.svg";

const ICONS = {
  home: homeIcon,
  search: searchIcon,
  add: addIcon,
  bookmark: bookmarkIcon,
  user: userIcon,
  menu: menuIcon,
  bell: bellIcon,
} as const;

export type NawbaharIconName = keyof typeof ICONS;

interface NawbaharIconProps {
  name: NawbaharIconName;
  size?: number;
  className?: string;
}

export function NawbaharIcon({ name, size = 20, className }: NawbaharIconProps) {
  const icon = ICONS[name];
  return (
    <span
      className={cn("inline-block", className)}
      style={{
        width: size,
        height: size,
        backgroundColor: "currentColor",
        WebkitMaskImage: `url(${icon})`,
        maskImage: `url(${icon})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
      aria-hidden="true"
    />
  );
}

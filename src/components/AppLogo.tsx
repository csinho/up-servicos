import { APP_LOGO_INITIALS, APP_NAME, APP_NAME_ADMIN } from "@/lib/app-brand";
import { cn } from "@/lib/utils";

type AppLogoProps = {
  variant?: "default" | "admin";
  size?: "default" | "compact";
  className?: string;
  showName?: boolean;
};

export function AppLogo({
  variant = "default",
  size = "default",
  className,
  showName = true,
}: AppLogoProps) {
  const name = variant === "admin" ? APP_NAME_ADMIN : APP_NAME;
  const badgeSize = size === "compact" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  const nameSize =
    size === "compact" ? "text-sm font-semibold" : "text-lg font-semibold tracking-tight";

  return (
    <div
      className={cn(
        "flex items-center gap-3",
        variant === "default" && "justify-center",
        className,
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg bg-[#111] font-bold text-white",
          badgeSize,
        )}
        aria-hidden
      >
        {APP_LOGO_INITIALS}
      </div>
      {showName && <span className={cn(nameSize, "truncate")}>{name}</span>}
    </div>
  );
}

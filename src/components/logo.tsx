import Image from "next/image";
import logo from "../../logo.png";

/** Cheshire Bookkeeping circular logo. Bundled via static import (served from /_next). */
export function Logo({
  size = 40,
  className = "",
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={logo}
      alt="Cheshire Bookkeeping"
      width={size}
      height={size}
      priority={priority}
      className={className}
    />
  );
}

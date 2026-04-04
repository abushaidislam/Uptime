import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@kit/ui/utils';

function LogoImage({
  className,
  width = 140,
}: {
  className?: string;
  width?: number;
}) {
  return (
    <Image
      src="/images/uptime-logo.svg"
      alt="Uptime"
      width={width}
      height={45}
      className={cn('h-auto w-[120px] lg:w-[140px]', className)}
      priority
    />
  );
}

export function AppLogo({
  href,
  label,
  className,
}: {
  href?: string | null;
  className?: string;
  label?: string;
}) {
  if (href === null) {
    return <LogoImage className={className} />;
  }

  return (
    <Link aria-label={label ?? 'Home Page'} href={href ?? '/'}>
      <LogoImage className={className} />
    </Link>
  );
}

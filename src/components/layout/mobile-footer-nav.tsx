
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Pill,
  MoreHorizontal,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

const mainNavItems = [
  { href: '/', label: 'Bảng điều khiển', icon: LayoutDashboard },
  { href: '/appointments', label: 'Lịch hẹn', icon: Calendar },
  { href: '/inventory', label: 'Dịch vụ', icon: Pill },
];

const moreNavItems = [
  { href: '/patients', label: 'Khách hàng', icon: 'Users' },
  { href: '/staff', label: 'Kỹ thuật viên', icon: 'Stethoscope' },
  { href: '/invoices', label: 'Hóa đơn', icon: 'FileText' },
];

export function MobileFooterNav() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/80 backdrop-blur-lg">
      <div className="flex h-20 items-center justify-around">
        {mainNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 p-2 text-sm ${
              pathname === item.href
                ? 'text-primary'
                : 'text-muted-foreground'
            }`}>
            <item.icon className="h-6 w-6" />
            <span>{item.label}</span>
          </Link>
        ))}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" className="flex flex-col items-center gap-1 p-2 text-xs text-muted-foreground">
              <MoreHorizontal className="h-6 w-6" />
              <span>Thêm</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>Thêm</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-4 p-4">
              {moreNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center gap-2 rounded-lg p-4 text-center hover:bg-muted">
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

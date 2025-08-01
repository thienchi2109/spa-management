'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  UserCog,
  ClipboardList,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Bảng điều khiển', icon: LayoutDashboard },
  { href: '/appointments', label: 'Lịch hẹn', icon: Calendar },
  { href: '/patients', label: 'Khách hàng', icon: Users },
  { href: '/staff', label: 'Kỹ thuật viên', icon: UserCog },
  { href: '/inventory', label: 'Dịch vụ', icon: ClipboardList },
  { href: '/invoices', label: 'Hóa đơn', icon: FileText },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
      <SidebarContent className="p-2 pt-4">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href} className="my-1">
                <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                >
                    <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}

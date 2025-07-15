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
  Pill,
  FileText,
  Bot,
  Stethoscope,
  Clipboard,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Bảng điều khiển', icon: LayoutDashboard },
  { href: '/appointments', label: 'Lịch hẹn', icon: Calendar },
  { href: '/patients', label: 'Bệnh nhân', icon: Users },
  { href: '/staff', label: 'Nhân viên y tế', icon: Stethoscope },
  { href: '/inventory', label: 'Kho thuốc', icon: Pill },
  { href: '/prescriptions', label: 'Đơn thuốc', icon: Clipboard },
  { href: '/invoices', label: 'Hóa đơn', icon: FileText },
  { href: '/ai-assistant', label: 'Trợ lý AI', icon: Bot },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
      <SidebarContent className="p-2 pt-4">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
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

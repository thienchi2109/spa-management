'use client';

import React from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import { SidebarNav } from './sidebar-nav';
import { Header } from './header';
import { MobileFooterNav } from './mobile-footer-nav';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <SidebarProvider defaultOpen>
        <Sidebar collapsible="icon">
          <SidebarNav />
        </Sidebar>
        <SidebarInset className="flex flex-col p-0">
            <Header />
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              {children}
            </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 pb-20"> {/* Add padding-bottom */}
          {children}
        </main>
        <MobileFooterNav />
      </div>
    </SidebarProvider>
  );
}

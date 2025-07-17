'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Settings, LogOut } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';

import { useMediaQuery } from '@/hooks/use-media-query';

export function Header() {
  const [staffName, setStaffName] = useState('');
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    // Get staff info from currentUser or localStorage
    if (currentUser) {
      setStaffName(currentUser.name);
    } else {
      const name = localStorage.getItem('staffName');
      setStaffName(name || 'Người dùng');
    }
  }, [currentUser]);

  const handleLogout = () => {
    // Use AuthContext logout method to clear all state
    logout();

    // Redirect to login
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-4 text-foreground sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
            {isDesktop && <SidebarTrigger />}
            <Link href="/" className="flex items-center gap-3">
              <Image src="https://i.postimg.cc/9XRr9dDp/beauty-salon-6328167.png" alt="Spa Management Logo" width={28} height={28} />
              <h1 className="whitespace-nowrap text-xl font-headline font-semibold">
                LTSpa
              </h1>
            </Link>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://placehold.co/100x100.png" alt="Bác sĩ Smith" data-ai-hint="doctor avatar" />
                <AvatarFallback>BS</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{staffName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                        Nhân viên phòng khám
                    </p>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Cài đặt</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
    </header>
  );
}

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
import { Settings, LogOut, Clock, RefreshCw } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

import { useMediaQuery } from '@/hooks/use-media-query';

export function Header() {
  const [staffName, setStaffName] = useState('');
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number | null>(null);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const router = useRouter();
  const { currentUser, logout, login, refreshAuth } = useAuth();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { toast } = useToast();

  useEffect(() => {
    // Get staff info from currentUser or localStorage
    if (currentUser) {
      setStaffName(currentUser.name);
    } else {
      const name = localStorage.getItem('staffName');
      setStaffName(name || 'Người dùng');
    }
  }, [currentUser]);

  // Monitor session expiration
  useEffect(() => {
    const checkSessionTime = () => {
      const sessionExpiration = localStorage.getItem('sessionExpiration');
      if (sessionExpiration && currentUser) {
        const expirationTime = parseInt(sessionExpiration);
        const currentTime = new Date().getTime();
        const timeLeft = expirationTime - currentTime;
        
        setSessionTimeLeft(timeLeft);
        
        // Show warning when less than 15 minutes left
        if (timeLeft > 0 && timeLeft < 15 * 60 * 1000 && !showSessionWarning) {
          setShowSessionWarning(true);
          toast({
            title: "Phiên đăng nhập sắp hết hạn",
            description: `Phiên của bạn sẽ hết hạn trong ${Math.ceil(timeLeft / (60 * 1000))} phút. Nhấn để gia hạn.`,
            duration: 10000,
            action: (
              <Button size="sm" onClick={handleExtendSession}>
                Gia hạn
              </Button>
            ),
          });
        }
        
        // Hide warning if session was extended
        if (timeLeft > 15 * 60 * 1000 && showSessionWarning) {
          setShowSessionWarning(false);
        }
      } else {
        setSessionTimeLeft(null);
        setShowSessionWarning(false);
      }
    };

    checkSessionTime();
    const interval = setInterval(checkSessionTime, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [currentUser, showSessionWarning, toast]);

  const handleLogout = () => {
    // Use AuthContext logout method to clear all state
    logout();

    // Redirect to login
    router.push('/login');
  };

  const handleExtendSession = async () => {
    if (currentUser) {
      try {
        // Re-authenticate to extend session
        const success = await login(currentUser.email, currentUser.password);
        if (success) {
          setShowSessionWarning(false);
          toast({
            title: "Phiên đã được gia hạn",
            description: "Phiên đăng nhập của bạn đã được gia hạn thêm 2 giờ.",
            duration: 3000,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Lỗi gia hạn phiên",
            description: "Không thể gia hạn phiên. Vui lòng đăng nhập lại.",
            duration: 5000,
          });
          handleLogout();
        }
      } catch (error) {
        console.error('Error extending session:', error);
        toast({
          variant: "destructive",
          title: "Lỗi gia hạn phiên",
          description: "Có lỗi xảy ra. Vui lòng đăng nhập lại.",
          duration: 5000,
        });
        handleLogout();
      }
    }
  };

  const handleRefreshAuth = () => {
    refreshAuth();
    toast({
      title: "Đã làm mới xác thực",
      description: "Thông tin đăng nhập đã được cập nhật.",
      duration: 2000,
    });
  };

  const formatTimeLeft = (timeLeft: number) => {
    const minutes = Math.ceil(timeLeft / (60 * 1000));
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
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
        
        <div className="flex items-center gap-2">
          {/* Session Timer */}
          {sessionTimeLeft && sessionTimeLeft > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Badge 
                variant={sessionTimeLeft < 15 * 60 * 1000 ? "destructive" : "secondary"}
                className="text-xs"
              >
                {formatTimeLeft(sessionTimeLeft)}
              </Badge>
            </div>
          )}
          
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
              <DropdownMenuItem onClick={handleRefreshAuth}>
                <RefreshCw className="mr-2 h-4 w-4" />
                <span>Làm mới xác thực</span>
              </DropdownMenuItem>
              {showSessionWarning && (
                <DropdownMenuItem onClick={handleExtendSession}>
                  <Clock className="mr-2 h-4 w-4" />
                  <span>Gia hạn phiên</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
    </header>
  );
}

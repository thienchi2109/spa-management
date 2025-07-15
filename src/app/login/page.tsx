'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Staff } from '@/lib/types';
import { User, Lock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { toast } = useToast();
  const { refreshAuth } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const staffCollection = collection(db, 'staff');
      const q = query(staffCollection, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('Email hoặc mật khẩu không đúng');
        setIsLoading(false);
        return;
      }

      let isValidLogin = false;
      let staffName = '';
      querySnapshot.forEach((doc) => {
        const staffData = doc.data() as Staff;
        if (staffData.email === email && staffData.password === password) {
          isValidLogin = true;
          staffName = staffData.name;
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('staffId', staffData.id);
          localStorage.setItem('staffName', staffData.name);
        }
      });

      if (isValidLogin) {
        // Show success toast with user's name
        toast({
          variant: "success" as any,
          title: "Đăng nhập thành công!",
          description: `Chào mừng ${staffName || 'bạn'} quay trở lại!`,
          duration: 3000,
        });

        // Refresh auth context to load user data
        setTimeout(() => {
          refreshAuth();
          router.push('/');
        }, 1500);
      } else {
        setError('Email hoặc mật khẩu không đúng');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col">
      {/* Header Section */}
      <header className="bg-primary text-primary-foreground py-8 px-4 text-center shadow-md">
        <div className="inline-block bg-white p-2 rounded-full mb-3">
          <img
            src="https://i.postimg.cc/6ptfnpqy/clinic-8217926.png"
            alt="Clinic Logo"
            className="w-12 h-12 object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold tracking-wider">
          QUẢN LÝ PHÒNG KHÁM
        </h1>
        <p className="text-sm text-primary-foreground/80 mt-1">
          Đăng nhập vào hệ thống
        </p>
      </header>

      {/* Form Section */}
      <main className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-sm -mt-24 shadow-xl">
            <CardContent className="p-6 pt-8 space-y-4">
                {/* Error Alert */}
                {error && (
                    <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="email" className="flex items-center text-sm font-medium text-foreground">
                            <User className="w-4 h-4 mr-2 text-muted-foreground" />
                            Tên đăng nhập
                        </label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Nhập email của bạn"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-11 text-base"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="flex items-center text-sm font-medium text-foreground">
                            <Lock className="w-4 h-4 mr-2 text-muted-foreground" />
                            Mật khẩu
                        </label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Nhập mật khẩu của bạn"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="h-11 text-base"
                        />
                    </div>

                    <Button
                    type="submit"
                    className="w-full h-11 text-base font-semibold"
                    disabled={isLoading}
                    >
                    {isLoading ? (
                        <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang đăng nhập...</span>
                        </div>
                    ) : (
                        'Đăng nhập'
                    )}
                    </Button>
                </form>

                {/* Demo Info */}
                <div className="p-3 bg-muted/80 rounded-lg border border-border text-center mt-4">
                    <p className="text-sm text-foreground font-medium mb-2">Thông tin demo:</p>
                    <p className="text-xs text-muted-foreground mb-1">
                    Email: <span className="font-mono bg-background px-1 rounded">minh.bs@clinic.com</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                    Mật khẩu: <span className="font-mono bg-background px-1 rounded">111</span>
                    </p>
                </div>
            </CardContent>
            <CardFooter className="justify-center py-4">
                <p className="text-xs text-muted-foreground">
                    Phát triển bởi <span className="font-medium text-foreground">Nguyễn Thiện Chí</span>
                </p>
            </CardFooter>
        </Card>
      </main>
    </div>
  );
} 
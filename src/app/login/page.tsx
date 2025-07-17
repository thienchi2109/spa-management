'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {

      
      // Use the auth context login function (which uses Google Sheets)
      const success = await login(email, password);

      if (success) {
        toast({
          title: "Đăng nhập thành công!",
          description: `Chào mừng bạn quay trở lại!`,
          duration: 3000,
        });

        // Redirect to home page
        setTimeout(() => {
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
      <header className="bg-primary text-primary-foreground py-12 px-4 text-center spa-shadow-elegant">
        <div className="inline-block bg-accent/10 backdrop-blur-sm p-3 rounded-full mb-4 ring-2 ring-accent/20">
          <img
            src="https://i.postimg.cc/6ptfnpqy/clinic-8217926.png"
            alt="Spa Logo"
            className="w-16 h-16 object-contain"
          />
        </div>
        <h1 className="text-3xl font-bold font-headline tracking-wider mb-2">
          HỆ THỐNG QUẢN LÝ LTSPA
        </h1>
        <p className="text-primary-foreground/90 font-medium">
          Đăng nhập vào hệ thống quản lý
        </p>
      </header>

      {/* Form Section */}
      <main className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-md -mt-24 shadow-xl spa-glass">
            <CardContent className="p-8 pt-10 space-y-6">
                {/* Error Alert */}
                {error && (
                    <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-3">
                        <label htmlFor="email" className="flex items-center text-sm font-medium text-foreground">
                            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center mr-3">
                                <User className="w-4 h-4 text-accent" />
                            </div>
                            Tên đăng nhập
                        </label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Nhập email của bạn"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-14 text-base spa-input"
                        />
                    </div>

                    <div className="space-y-3">
                        <label htmlFor="password" className="flex items-center text-sm font-medium text-foreground">
                            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center mr-3">
                                <Lock className="w-4 h-4 text-accent" />
                            </div>
                            Mật khẩu
                        </label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Nhập mật khẩu của bạn"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="h-14 text-base spa-input"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 text-base font-semibold spa-button-accent mt-8"
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
            </CardContent>
            <CardFooter className="justify-center py-6 border-t border-border/50">
                <p className="text-sm text-muted-foreground font-medium">
                    Hệ thống quản lý Spa chuyên nghiệp
                </p>
            </CardFooter>
        </Card>
      </main>
    </div>
  );
} 
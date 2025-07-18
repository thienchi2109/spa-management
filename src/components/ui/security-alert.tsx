import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, Lock, Clock } from 'lucide-react';

interface SecurityAlertProps {
  type: 'session-expiring' | 'password-changed' | 'account-deleted' | 'security-breach';
  title: string;
  description: string;
  onAction?: () => void;
  actionLabel?: string;
  onDismiss?: () => void;
  autoHide?: boolean;
  duration?: number;
}

export function SecurityAlert({
  type,
  title,
  description,
  onAction,
  actionLabel,
  onDismiss,
  autoHide = false,
  duration = 10000
}: SecurityAlertProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  // Auto-hide functionality
  React.useEffect(() => {
    if (autoHide && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoHide, duration, onDismiss]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'session-expiring':
        return <Clock className="h-4 w-4" />;
      case 'password-changed':
        return <Lock className="h-4 w-4" />;
      case 'account-deleted':
        return <AlertTriangle className="h-4 w-4" />;
      case 'security-breach':
        return <Shield className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getVariant = () => {
    switch (type) {
      case 'session-expiring':
        return 'default' as const;
      case 'password-changed':
      case 'account-deleted':
      case 'security-breach':
        return 'destructive' as const;
      default:
        return 'default' as const;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-w-[90vw]">
      <Alert variant={getVariant()} className="shadow-lg border-2">
        <div className="flex items-start gap-2">
          {getIcon()}
          <div className="flex-1 min-w-0">
            <AlertTitle className="font-semibold">{title}</AlertTitle>
            <AlertDescription className="mt-1 text-sm">
              {description}
            </AlertDescription>
            
            {(onAction || onDismiss) && (
              <div className="flex gap-2 mt-3">
                {onAction && actionLabel && (
                  <Button
                    size="sm"
                    variant={type === 'session-expiring' ? 'default' : 'outline'}
                    onClick={onAction}
                    className="h-8 px-3 text-xs"
                  >
                    {actionLabel}
                  </Button>
                )}
                {onDismiss && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsVisible(false);
                      onDismiss();
                    }}
                    className="h-8 px-3 text-xs"
                  >
                    Đóng
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </Alert>
    </div>
  );
}

// Pre-configured security alerts
export const SecurityAlerts = {
  SessionExpiring: ({ timeLeft, onExtend, onDismiss }: { 
    timeLeft: number; 
    onExtend: () => void; 
    onDismiss: () => void;
  }) => (
    <SecurityAlert
      type="session-expiring"
      title="Phiên đăng nhập sắp hết hạn"
      description={`Phiên của bạn sẽ hết hạn trong ${Math.ceil(timeLeft / (60 * 1000))} phút. Nhấn để gia hạn.`}
      onAction={onExtend}
      actionLabel="Gia hạn phiên"
      onDismiss={onDismiss}
      autoHide
      duration={15000}
    />
  ),

  PasswordChanged: ({ onLogout }: { onLogout: () => void }) => (
    <SecurityAlert
      type="password-changed"
      title="Mật khẩu đã thay đổi"
      description="Mật khẩu tài khoản của bạn đã được thay đổi từ nguồn khác. Vui lòng đăng nhập lại để đảm bảo bảo mật."
      onAction={onLogout}
      actionLabel="Đăng nhập lại"
    />
  ),

  AccountDeleted: ({ onLogout }: { onLogout: () => void }) => (
    <SecurityAlert
      type="account-deleted"
      title="Tài khoản không tồn tại"
      description="Tài khoản của bạn đã bị xóa khỏi hệ thống. Vui lòng liên hệ quản trị viên để được hỗ trợ."
      onAction={onLogout}
      actionLabel="Về trang đăng nhập"
    />
  ),

  SecurityBreach: ({ onLogout }: { onLogout: () => void }) => (
    <SecurityAlert
      type="security-breach"
      title="Phát hiện hoạt động bất thường"
      description="Hệ thống phát hiện hoạt động bất thường trên tài khoản của bạn. Vui lòng đăng nhập lại để đảm bảo bảo mật."
      onAction={onLogout}
      actionLabel="Đăng xuất ngay"
    />
  )
}; 
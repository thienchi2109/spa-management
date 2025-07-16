'use client';

import { useState } from 'react';
import type { Staff, Appointment, MedicalRecord } from '@/lib/types';
import {
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Phone,
  Mail,
  Calendar,
  Users,
  Stethoscope,
  Clock,
  TrendingUp,
  Shield,
  Pencil,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StaffDetailProps {
  staff: Staff;
  appointments?: Appointment[];
  medicalRecords?: MedicalRecord[];
  onEdit?: (staff: Staff) => void;
  onClose: () => void;
}

const translateRole = (role: Staff['role']) => {
  switch (role) {
    case 'Chuyên viên':
      return 'Chuyên viên';
    case 'Kỹ thuật viên':
      return 'Kỹ thuật viên';
    case 'admin':
      return 'Quản trị viên';
    default:
      return role;
  }
};

const getRoleBadgeVariant = (role: Staff['role']) => {
  switch (role) {
    case 'Chuyên viên':
      return 'default';
    case 'admin':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export function StaffDetail({ staff, appointments = [], medicalRecords = [], onEdit, onClose }: StaffDetailProps) {
  const [isEditing, setIsEditing] = useState(false);

  // Calculate statistics
  const staffAppointments = appointments.filter(app => app.doctorName === staff.name);
  const todayAppointments = staffAppointments.filter(app => app.date === new Date().toISOString().split('T')[0]);
  const completedAppointments = staffAppointments.filter(app => app.status === 'Completed');
  const staffMedicalRecords = medicalRecords.filter(record => record.doctorName === staff.name);

  // Get recent appointments (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentAppointments = staffAppointments.filter(app => 
    new Date(app.date) >= sevenDaysAgo
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleEdit = () => {
    if (onEdit) {
      onEdit(staff);
    }
    setIsEditing(true);
  };

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={staff.avatarUrl} alt={staff.name} />
            <AvatarFallback className="text-lg">{staff.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <DialogTitle className="text-2xl font-headline">{staff.name}</DialogTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={getRoleBadgeVariant(staff.role)} className="text-sm">
                {translateRole(staff.role)}
              </Badge>
              {staff.role === 'admin' && (
                <Badge variant="outline" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Quyền quản trị
                </Badge>
              )}
            </div>
          </div>
          {onEdit && (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
          )}
        </div>
      </DialogHeader>

      <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-4">
        {/* Contact Information */}
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2 text-base">
            <User className="h-5 w-5 text-primary" />
            Thông tin liên hệ
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Phone className="h-5 w-5 text-primary" />
              <span>{staff.phone}</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Mail className="h-5 w-5 text-primary" />
              <span className="truncate">{staff.email}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Statistics */}
        {staff.role !== 'admin' && (
          <>
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-primary" />
                Thống kê hoạt động
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Hôm nay</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span className="text-2xl font-bold">{todayAppointments.length}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">lịch hẹn</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Tổng lịch hẹn</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-green-500" />
                      <span className="text-2xl font-bold">{staffAppointments.length}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">tất cả</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Đã hoàn thành</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-500" />
                      <span className="text-2xl font-bold">{completedAppointments.length}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">lịch hẹn</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Hồ sơ y tế</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-orange-500" />
                      <span className="text-2xl font-bold">{staffMedicalRecords.length}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">đã tạo</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Separator />
          </>
        )}

        {/* Recent Activity */}
        {staff.role !== 'admin' && recentAppointments.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-primary" />
              Hoạt động gần đây (7 ngày qua)
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recentAppointments.slice(0, 10).map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{appointment.patientName}</div>
                      <div className="text-muted-foreground text-xs">
                        {formatDate(appointment.date)} • {appointment.startTime} - {appointment.endTime}
                      </div>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      appointment.status === 'Completed' ? 'default' :
                      appointment.status === 'Scheduled' ? 'secondary' :
                      'destructive'
                    }
                    className="text-xs"
                  >
                    {appointment.status === 'Completed' ? 'Hoàn thành' :
                     appointment.status === 'Scheduled' ? 'Đã lên lịch' :
                     'Đã hủy'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin specific information */}
        {staff.role === 'admin' && (
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-primary" />
              Quyền quản trị
            </h4>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">
                Tài khoản này có quyền quản trị hệ thống, bao gồm:
              </div>
              <ul className="mt-2 text-sm space-y-1 text-muted-foreground">
                <li>• Quản lý kỹ thuật viên</li>
                <li>• Xem báo cáo tổng quan</li>
                <li>• Cấu hình hệ thống</li>
                <li>• Quản lý dữ liệu</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Đóng
        </Button>
      </DialogFooter>
    </>
  );
}

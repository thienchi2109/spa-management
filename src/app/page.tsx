'use client';

import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Activity, Calendar, Users, DollarSign, Loader2, TrendingUp } from 'lucide-react';
import type { Customer, Appointment, Invoice } from '@/lib/types';
import { formatDate, calculateAge } from '@/lib/utils';
import { useData } from '@/contexts/data-context';
import { PerformanceMonitor } from '@/components/performance-monitor';

const translateGender = (gender: Customer['gender']) => {
    switch(gender) {
        case 'Male': return 'Nam';
        case 'Female': return 'Nữ';
        case 'Other': return 'Khác';
        case 'Nam': return 'Nam';
        case 'Nữ': return 'Nữ';
        default: return gender;
    }
}

export default function Dashboard() {
  // Use cached data from context
  const {
    customers,
    appointments,
    invoices,
    staff,
    isLoadingCustomers,
    isLoadingAppointments,
    isLoadingInvoices
  } = useData();

  const loading = isLoadingCustomers || isLoadingAppointments || isLoadingInvoices;

  const today = new Date();
  const todayString = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  const todaysAppointments = appointments.filter(
    (app) => app.date === todayString
  );
  
  // Calculate today's appointment statistics
  const todaysScheduled = todaysAppointments.filter(app => app.status === 'Scheduled').length;
  const todaysCompleted = todaysAppointments.filter(app => app.status === 'Completed').length;
  const todaysCancelled = todaysAppointments.filter(app => app.status === 'Cancelled').length;
  
  // Calculate revenue statistics
  const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const paidRevenue = invoices.filter(inv => inv.status === 'Paid').reduce((sum, invoice) => sum + invoice.amount, 0);
  const unpaidRevenue = totalRevenue - paidRevenue;
  const paidPercentage = totalRevenue > 0 ? (paidRevenue / totalRevenue) * 100 : 0;
  const unpaidPercentage = 100 - paidPercentage;

  // Calculate today's revenue
  const todaysInvoices = invoices.filter(invoice => invoice.date === todayString);
  const todaysTotalRevenue = todaysInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const todaysPaidRevenue = todaysInvoices.filter(inv => inv.status === 'Paid').reduce((sum, invoice) => sum + invoice.amount, 0);
  const todaysUnpaidRevenue = todaysTotalRevenue - todaysPaidRevenue;

  // Calculate doctor statistics from real data
  const getDoctorStats = () => {
    // Get unique doctors from appointments
    const uniqueDoctors = [...new Set(appointments.map(app => app.doctorName))];
    
    const doctorStats = uniqueDoctors.map(doctorName => {
      // Count appointments for this doctor
      const doctorAppointments = appointments.filter(app => app.doctorName === doctorName);
      
      // Calculate revenue from invoices
      let totalRevenue = 0;
      let paidRevenue = 0;
      let unpaidRevenue = 0;
      
      // Find invoices related to this doctor's appointments
      doctorAppointments.forEach(appointment => {
        const relatedInvoice = invoices.find(invoice => 
          invoice.patientName === appointment.patientName && 
          invoice.date === appointment.date
        );
        
        if (relatedInvoice) {
          totalRevenue += relatedInvoice.amount;
          if (relatedInvoice.status === 'Paid') {
            paidRevenue += relatedInvoice.amount;
          } else {
            unpaidRevenue += relatedInvoice.amount;
          }
        }
      });
      
      return {
        name: doctorName,
        appointments: doctorAppointments.length,
        totalRevenue,
        paidRevenue,
        unpaidRevenue
      };
    });

    return doctorStats.sort((a, b) => b.totalRevenue - a.totalRevenue);
  };

  const doctorStats = getDoctorStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 md:gap-8">
        <h1 className="text-2xl font-headline font-bold">Bảng điều khiển</h1>
      
      {/* Main KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng lịch hẹn</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointments.length}</div>
            <p className="text-xs text-muted-foreground">
              Tổng số lịch hẹn đã đặt
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hôm nay</CardTitle>
            <Activity className="h-4 w-4 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysAppointments.length}</div>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-blue-600">Đã lên lịch:</span>
                <span className="font-medium">{todaysScheduled}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">Đã hoàn thành:</span>
                <span className="font-medium">{todaysCompleted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600">Đã hủy:</span>
                <span className="font-medium">{todaysCancelled}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Khách hàng</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground">
              Tổng số khách hàng
            </p>
          </CardContent>
        </Card>

        <Card 
          className="bg-white border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            // TODO: Navigate to statistics/reports page when implemented
            console.log('Navigate to statistics page - TODO');
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu hôm nay</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-blue-600">{todaysTotalRevenue.toLocaleString('vi-VN')} đ</div>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Đã thanh toán: {todaysPaidRevenue.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span>Chưa thanh toán: {todaysUnpaidRevenue.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Nhấp để xem báo cáo chi tiết
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Doctor Statistics Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Thống kê bác sĩ</h2>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {doctorStats.map((doctor, index) => {
            const paidPercentage = doctor.totalRevenue > 0 ? (doctor.paidRevenue / doctor.totalRevenue) * 100 : 0;
            const unpaidPercentage = 100 - paidPercentage;
            
            return (
              <Card key={index} className="bg-white border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-gray-900 text-base">{doctor.name}</CardTitle>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      Đặt lịch: <span className="text-primary font-medium">{doctor.appointments}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Tổng doanh thu: <span className="text-gray-900 font-medium">{doctor.totalRevenue.toLocaleString('vi-VN')} đ</span>
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">Thanh toán</div>
                    
                    {doctor.totalRevenue > 0 ? (
                      <>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="flex h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-green-500" 
                              style={{ width: `${paidPercentage}%` }}
                            ></div>
                            <div 
                              className="bg-red-500" 
                              style={{ width: `${unpaidPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-gray-700">{doctor.paidRevenue.toLocaleString('vi-VN')} đ</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span className="text-gray-700">{doctor.unpaidRevenue.toLocaleString('vi-VN')} đ</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-full bg-gray-200 rounded-full h-2"></div>
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-gray-700">0 đ</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span className="text-gray-700">0 đ</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent patients and appointments sections */}
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Khách hàng gần đây</CardTitle>
              <CardDescription>
                Tổng quan về các khách hàng đã đến gần đây.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead className="hidden xl:table-column">
                    Giới tính
                  </TableHead>
                  <TableHead className="text-right">Lần đến cuối</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.slice(0, 5).map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="font-medium">{customer.name}</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        Tuổi: {calculateAge(customer.birthYear)}
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-column">
                      {translateGender(customer.gender)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatDate(customer.lastVisit)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Lịch hẹn hôm nay</CardTitle>
            <CardDescription>
              Danh sách các lịch hẹn trong hôm nay.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {todaysAppointments.length > 0 ? (
              todaysAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center gap-4">
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">
                      {appointment.patientName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      với {appointment.doctorName}
                    </p>
                  </div>
                  <div className="ml-auto font-medium">
                    <Badge variant={
                      appointment.status === 'Completed' ? 'default' :
                      appointment.status === 'Cancelled' ? 'destructive' :
                      'secondary'
                    }>
                      {appointment.status === 'Completed' ? 'Hoàn thành' :
                       appointment.status === 'Cancelled' ? 'Đã hủy' :
                       appointment.status === 'Scheduled' ? 'Đã lên lịch' : 'Đang chờ'}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Không có lịch hẹn nào hôm nay.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    
    {/* Performance Monitor */}
    <PerformanceMonitor />
  </>
  );
}

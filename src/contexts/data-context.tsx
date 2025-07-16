// src/contexts/data-context.tsx
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useCachedCustomers, useCachedAppointments, useCachedServices, useCachedInvoices, useCachedStaff } from '@/hooks/use-cached-data';
import { useOptimisticUpdates } from '@/hooks/use-optimistic-updates';
import { cacheManager } from '@/lib/cache-manager';
import type { Customer, Appointment, SpaService, Invoice, Staff } from '@/lib/types';

interface DataContextType {
  // Data
  customers: Customer[];
  appointments: Appointment[];
  services: SpaService[];
  invoices: Invoice[];
  staff: Staff[];
  
  // Loading states
  isLoadingCustomers: boolean;
  isLoadingAppointments: boolean;
  isLoadingServices: boolean;
  isLoadingInvoices: boolean;
  isLoadingStaff: boolean;
  
  // Error states
  customersError: Error | null;
  appointmentsError: Error | null;
  servicesError: Error | null;
  invoicesError: Error | null;
  staffError: Error | null;
  
  // Refetch functions
  refetchCustomers: () => Promise<void>;
  refetchAppointments: () => Promise<void>;
  refetchServices: () => Promise<void>;
  refetchInvoices: () => Promise<void>;
  refetchStaff: () => Promise<void>;
  refetchAll: () => Promise<void>;
  
  // Optimistic update functions
  updateCustomerOptimistic: (customer: Customer, updateFn: () => Promise<any>) => Promise<any>;
  deleteCustomerOptimistic: (customerId: string, deleteFn: () => Promise<any>) => Promise<any>;
  addCustomerOptimistic: (customer: Customer, addFn: () => Promise<any>) => Promise<any>;
  
  updateAppointmentOptimistic: (appointment: Appointment, updateFn: () => Promise<any>) => Promise<any>;
  deleteAppointmentOptimistic: (appointmentId: string, deleteFn: () => Promise<any>) => Promise<any>;
  addAppointmentOptimistic: (appointment: Appointment, addFn: () => Promise<any>) => Promise<any>;
  
  updateServiceOptimistic: (service: SpaService, updateFn: () => Promise<any>) => Promise<any>;
  deleteServiceOptimistic: (serviceId: string, deleteFn: () => Promise<any>) => Promise<any>;
  
  // Cache management
  clearCache: () => void;
  getCacheStats: () => any;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  // Cached data hooks
  const {
    data: customers,
    isLoading: isLoadingCustomers,
    error: customersError,
    refetch: refetchCustomers
  } = useCachedCustomers();

  const {
    data: appointments,
    isLoading: isLoadingAppointments,
    error: appointmentsError,
    refetch: refetchAppointments
  } = useCachedAppointments();

  const {
    data: services,
    isLoading: isLoadingServices,
    error: servicesError,
    refetch: refetchServices
  } = useCachedServices();

  const {
    data: invoices,
    isLoading: isLoadingInvoices,
    error: invoicesError,
    refetch: refetchInvoices
  } = useCachedInvoices();

  const {
    data: staff,
    isLoading: isLoadingStaff,
    error: staffError,
    refetch: refetchStaff
  } = useCachedStaff();

  // Optimistic update hooks
  const customerOptimistic = useOptimisticUpdates<Customer>('customers');
  const appointmentOptimistic = useOptimisticUpdates<Appointment>('appointments');
  const serviceOptimistic = useOptimisticUpdates<SpaService>('services');

  // Refetch all data
  const refetchAll = async () => {
    await Promise.all([
      refetchCustomers(),
      refetchAppointments(),
      refetchServices(),
      refetchInvoices(),
      refetchStaff()
    ]);
  };

  // Optimistic update wrappers with cache invalidation
  const updateCustomerOptimistic = async (customer: Customer, updateFn: () => Promise<any>) => {
    return customerOptimistic.optimisticUpdate(updateFn, customer, {
      invalidateCache: ['appointments:customer', 'invoices:customer']
    });
  };

  const deleteCustomerOptimistic = async (customerId: string, deleteFn: () => Promise<any>) => {
    return customerOptimistic.optimisticDelete(deleteFn, customerId, {
      invalidateCache: ['appointments:customer', 'invoices:customer']
    });
  };

  const addCustomerOptimistic = async (customer: Customer, addFn: () => Promise<any>) => {
    return customerOptimistic.optimisticAdd(addFn, customer);
  };

  const updateAppointmentOptimistic = async (appointment: Appointment, updateFn: () => Promise<any>) => {
    return appointmentOptimistic.optimisticUpdate(updateFn, appointment, {
      invalidateCache: ['appointments:today', 'appointments:customer']
    });
  };

  const deleteAppointmentOptimistic = async (appointmentId: string, deleteFn: () => Promise<any>) => {
    return appointmentOptimistic.optimisticDelete(deleteFn, appointmentId, {
      invalidateCache: ['appointments:today', 'appointments:customer']
    });
  };

  const addAppointmentOptimistic = async (appointment: Appointment, addFn: () => Promise<any>) => {
    return appointmentOptimistic.optimisticAdd(addFn, appointment, {
      invalidateCache: ['appointments:today', 'appointments:customer']
    });
  };

  const updateServiceOptimistic = async (service: SpaService, updateFn: () => Promise<any>) => {
    return serviceOptimistic.optimisticUpdate(updateFn, service);
  };

  const deleteServiceOptimistic = async (serviceId: string, deleteFn: () => Promise<any>) => {
    return serviceOptimistic.optimisticDelete(deleteFn, serviceId);
  };

  // Cache management
  const clearCache = () => {
    cacheManager.clear();
  };

  const getCacheStats = () => {
    return cacheManager.getStats();
  };

  const value: DataContextType = {
    // Data
    customers,
    appointments,
    services,
    invoices,
    staff,
    
    // Loading states
    isLoadingCustomers,
    isLoadingAppointments,
    isLoadingServices,
    isLoadingInvoices,
    isLoadingStaff,
    
    // Error states
    customersError,
    appointmentsError,
    servicesError,
    invoicesError,
    staffError,
    
    // Refetch functions
    refetchCustomers,
    refetchAppointments,
    refetchServices,
    refetchInvoices,
    refetchStaff,
    refetchAll,
    
    // Optimistic updates
    updateCustomerOptimistic,
    deleteCustomerOptimistic,
    addCustomerOptimistic,
    updateAppointmentOptimistic,
    deleteAppointmentOptimistic,
    addAppointmentOptimistic,
    updateServiceOptimistic,
    deleteServiceOptimistic,
    
    // Cache management
    clearCache,
    getCacheStats
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

// Specialized hooks for specific data needs
export function useCustomerData() {
  const { customers, isLoadingCustomers, customersError, refetchCustomers } = useData();
  return { customers, isLoading: isLoadingCustomers, error: customersError, refetch: refetchCustomers };
}

export function useAppointmentData() {
  const { appointments, isLoadingAppointments, appointmentsError, refetchAppointments } = useData();
  return { appointments, isLoading: isLoadingAppointments, error: appointmentsError, refetch: refetchAppointments };
}

export function useServiceData() {
  const { services, isLoadingServices, servicesError, refetchServices } = useData();
  return { services, isLoading: isLoadingServices, error: servicesError, refetch: refetchServices };
}
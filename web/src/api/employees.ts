import { apiFetch } from './client';
import type { Employee, EmployeeAssignments } from '@/types';

export interface EmployeesResponse {
  data: Employee[];
}

export async function getEmployees(): Promise<EmployeesResponse> {
  return apiFetch<EmployeesResponse>('/api/employees');
}

export async function getEmployee(id: string): Promise<Employee> {
  return apiFetch<Employee>(`/api/employees/${id}`);
}

export async function createEmployee(body: {
  companyId: string;
  employeeCode: string;
  firstName: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  phone?: string;
}): Promise<{ id: string; employeeCode: string; firstName: string }> {
  return apiFetch('/api/employees', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateEmployee(
  id: string,
  body: {
    employeeCode?: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    email?: string;
    phone?: string;
    status?: string;
  }
): Promise<{ ok: boolean }> {
  return apiFetch(`/api/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteEmployee(id: string): Promise<{ ok: boolean }> {
  return apiFetch(`/api/employees/${id}`, {
    method: 'DELETE',
  });
}

export async function getEmployeeAssignments(employeeId: string): Promise<EmployeeAssignments> {
  return apiFetch<EmployeeAssignments>(`/api/employees/${employeeId}/assignments`);
}

export async function updateEmployeeRoles(
  employeeId: string,
  body: { email?: string; password?: string; roleWeb?: string; roleMobile?: string }
): Promise<{ ok: boolean; userId?: string }> {
  return apiFetch(`/api/employees/${employeeId}/assignments/roles`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function updateEmployeeZones(
  employeeId: string,
  body: { zoneIds?: (number | string)[]; noLocation?: boolean }
): Promise<{ ok: boolean }> {
  return apiFetch(`/api/employees/${employeeId}/assignments/zones`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

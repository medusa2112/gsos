/**
 * API Client for GSOS Admin App
 */

// Use a function to get the API base URL at runtime
function getApiBase(): string {
  // In Next.js, NEXT_PUBLIC_ variables are available in the browser
  return (globalThis as any).process?.env?.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = (baseUrl || getApiBase()).replace(/\/$/, ''); // Remove trailing slash
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Health check
  async health() {
    return this.request<{ ok: boolean; ts: number }>('/health');
  }

  // Students
  async getStudents() {
    return this.request('/students');
  }

  async getStudent(id: string) {
    return this.request(`/students/${id}`);
  }

  async createStudent(data: any) {
    return this.request('/students', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateStudent(id: string, data: any) {
    return this.request(`/students/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteStudent(id: string) {
    return this.request(`/students/${id}`, {
      method: 'DELETE',
    });
  }

  // Admissions
  async getAdmissions() {
    return this.request('/admissions');
  }

  async createAdmission(data: any) {
    return this.request('/admissions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAdmission(id: string) {
    return this.request(`/admissions/${id}`);
  }

  async updateAdmission(id: string, data: any) {
    return this.request(`/admissions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAdmission(id: string) {
    return this.request(`/admissions/${id}`, {
      method: 'DELETE',
    });
  }

  // Attendance
  async getAttendance() {
    return this.request('/attendance');
  }

  async createAttendance(data: any) {
    return this.request('/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Behavior
  async getBehavior() {
    return this.request('/behavior');
  }

  async createBehavior(data: any) {
    return this.request('/behavior', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Invoices
  async getInvoices() {
    return this.request('/invoices');
  }

  async createInvoice(data: any) {
    return this.request('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInvoice(id: string, data: any) {
    return this.request(`/invoices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Payments
  async getPayments() {
    return this.request('/payments');
  }

  async createPayment(data: any) {
    return this.request('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
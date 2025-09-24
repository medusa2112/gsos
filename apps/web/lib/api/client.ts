/**
 * API Client for GSOS Web App
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

  // Attendance
  async getAttendance() {
    return this.request('/attendance');
  }

  // Behavior
  async getBehavior() {
    return this.request('/behavior');
  }

  // Invoices
  async getInvoices() {
    return this.request('/invoices');
  }

  // Payments
  async getPayments() {
    return this.request('/payments');
  }
}

export const apiClient = new ApiClient();
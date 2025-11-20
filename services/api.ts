import { User, Report } from '../types';
import { 
  API_BASE_PATH, 
  DEBUG_API,
  CLOUDFLARE_TUNNEL_URL,
  USE_CLOUDFLARE_TUNNEL
} from '@env';

const ENV_CONFIG = {
  apiBasePath: API_BASE_PATH || '/api',
  useCloudflare: USE_CLOUDFLARE_TUNNEL === 'true',
  cloudflareUrl: CLOUDFLARE_TUNNEL_URL,
  debugApi: DEBUG_API === 'true'
};

const getApiBaseUrl = () => {
  if (!ENV_CONFIG.cloudflareUrl) {
    throw new Error('CLOUDFLARE_TUNNEL_URL no está configurado en .env');
  }

  return `${ENV_CONFIG.cloudflareUrl}${ENV_CONFIG.apiBasePath}`;
};

const API_BASE_URL = getApiBaseUrl();

export const getImageUrl = (relativePath: string | null | undefined): string | null => {
  if (!relativePath) return null;
  
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  
  const baseUrl = ENV_CONFIG.cloudflareUrl;
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${baseUrl}${path}`;
};

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  token: string;
}

class ApiService {
  private currentApiUrl: string = getApiBaseUrl();

  get apiUrl(): string {
    return this.currentApiUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const url = `${this.currentApiUrl}${endpoint}`;
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      
      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
          if (ENV_CONFIG.debugApi) {
            console.error('Server error response:', errorText);
          }
        } catch (e) {
          errorText = 'Could not read error response';
        }
        throw new Error(`HTTP error! status: ${response.status}. Server response: ${errorText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      if (ENV_CONFIG.debugApi) {
        console.error('API request failed:', error);
      }
      
      if (error instanceof Error && error.message?.includes('Network request failed')) {
        throw new Error('No se puede conectar al servidor Cloudflare. Verifica que el tunnel esté activo.');
      }
      
      throw error;
    }
  }

  async checkServerHealth(): Promise<{ success: boolean; code: string; message: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.currentApiUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          success: false,
          code: `HTTP_${response.status}`,
          message: `Servidor respondió con código ${response.status}`
        };
      }

      const data = await response.json();
      return {
        success: true,
        code: 'SERVER_OK',
        message: 'Servidor conectado correctamente'
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          code: 'TIMEOUT_ERROR',
          message: 'El servidor no responde (timeout)'
        };
      }
      
      if (error.message?.includes('Network request failed')) {
        return {
          success: false,
          code: 'NETWORK_ERROR',
          message: 'No se puede conectar al servidor'
        };
      }

      return {
        success: false,
        code: 'UNKNOWN_ERROR',
        message: error.message || 'Error desconocido del servidor'
      };
    }
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async createReport(report: Report, token: string): Promise<Report> {
    return this.request<Report>('/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(report),
    });
  }

  async getReports(token: string): Promise<Report[]> {
    return this.request<Report[]>('/reports', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async uploadImage(imageUri: string, token: string, reportId?: string): Promise<{ url: string; key: string }> {
    try {
      if (!imageUri || !imageUri.startsWith('file://')) {
        throw new Error('Invalid image URI provided');
      }
      
      const formData = new FormData();
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${reportId || 'temp'}_${timestamp}.jpg`;
      
      const fileObject = {
        uri: imageUri,
        type: 'image/jpeg',
        name: filename,
      };
      
      formData.append('file', fileObject as any);
      formData.append('folder', 'aquapool-reports');

      const response = await fetch(`${this.currentApiUrl}/upload/single`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        let errorDetails = 'Unknown error';
        try {
          const errorData = await response.json();
          errorDetails = errorData.error || errorData.details || JSON.stringify(errorData);
        } catch (parseError) {
          errorDetails = await response.text();
        }
        
        if (ENV_CONFIG.debugApi) {
          console.error('Upload failed:', response.status, errorDetails);
        }
        throw new Error(`Upload failed (${response.status}): ${errorDetails}`);
      }
      
      const result = await response.json();
      
      if (!result.file || !result.file.url) {
        throw new Error('Invalid response from server - missing file URL');
      }
      
      return {
        url: result.file.url,
        key: result.file.key || ''
      };
      
    } catch (error: any) {
      if (ENV_CONFIG.debugApi) {
        console.error('Upload image error:', error);
      }
      
      if (error?.message?.includes('Network request failed')) {
        throw new Error('No se pudo conectar al servidor. Verifica tu conexión.');
      } else if (error?.message?.includes('Upload failed')) {
        throw error;
      } else {
        throw new Error(`Error de subida: ${error?.message || 'Error desconocido'}`);
      }
    }
  }

  async uploadBase64Image(base64Data: string, filename: string, token: string): Promise<{ url: string; key: string }> {
    return this.request<{ file: { url: string; key: string } }>('/upload/base64', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        data: base64Data, 
        filename: filename,
        mimetype: 'image/jpeg',
        folder: 'aquapool-reports' 
      }),
    }).then(result => ({
      url: result.file.url,
      key: result.file.key
    }));
  }

  async getPresignedUrl(filename: string, token: string): Promise<{ uploadUrl: string; imageUrl: string; key: string }> {
    return this.request<{ uploadUrl: string; imageUrl: string; key: string }>('/upload/presigned', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ filename, folder: 'aquapool-reports' }),
    });
  }

  async getUserStats(token: string): Promise<{
    totalReports: number;
    todayReports: number;
    weekReports: number;
  }> {
    return this.request<{
      totalReports: number;
      todayReports: number;
      weekReports: number;
    }>('/reports/my/stats', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getUserReports(token: string, page: number = 1, limit: number = 10): Promise<{
    reports: any[];
    totalPages: number;
    currentPage: number;
    totalCount: number;
  }> {
    return this.request(`/reports/my/history?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getUserReport(reportId: number, token: string): Promise<any> {
    return this.request(`/reports/my/${reportId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getProducts(token: string): Promise<any> {
    return this.request('/products/all', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getProductsByCategory(categoryId: number, token: string): Promise<any> {
    return this.request(`/products/category/${categoryId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getProductCategories(token: string): Promise<any> {
    return this.request('/products/categories', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async get<T>(endpoint: string, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  async post<T>(endpoint: string, data?: any, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }

  async createOrder(orderData: any, token?: string): Promise<any> {
    return this.post('/orders', orderData, token);
  }

  async getOrders(token: string, page: number = 1, limit: number = 10): Promise<any> {
    return this.get(`/orders?page=${page}&limit=${limit}`, token);
  }

  async getOrderById(orderId: number, token: string): Promise<any> {
    return this.get(`/orders/${orderId}`, token);
  }

  async testEndpoint(data: any): Promise<any> {
    return this.post('/test/test', data);
  }

  async getUserOrders(token: string, page: number = 1, limit: number = 10): Promise<any> {
    return this.request(`/products/orders?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getAppVersion(): Promise<{
    success: boolean;
    version: string;
    name: string;
    description: string;
  }> {
    return this.get('/version');
  }

  // Projects Methods
  async getAllProjects(token: string): Promise<any[]> {
    const response: any = await this.request('/projects', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.projects || [];
  }

  async getProjectById(projectId: string, token: string): Promise<any> {
    return this.request(`/projects/${projectId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

export default new ApiService();
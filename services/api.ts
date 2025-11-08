import { User, Report } from '../types';

// Lista de IPs comunes para probar automáticamente
const COMMON_IPS = [
  '192.168.0.103',   // IP actual
  '192.168.1.232',   // IP anterior
  '192.168.1.1',     // Router común
  '192.168.0.1',     // Router común
  '10.0.0.1',        // Otra red común
];

// Detectar si estamos en desarrollo y usar la IP correcta
const getApiBaseUrl = () => {
  if (__DEV__) {
    // Usar la IP actual detectada
    return 'http://192.168.0.103:3001/api'; 
  }
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

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
  private isInitialized: boolean = false;

  // Getter para obtener la URL actual del API
  get apiUrl(): string {
    return this.currentApiUrl;
  }

  // Inicializar el servicio detectando la IP correcta
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await this.detectWorkingIP();
      this.isInitialized = true;
    } catch (error) {
      this.isInitialized = true;
    }
  }

  // Detectar automáticamente la IP correcta probando conexiones
  async detectWorkingIP(): Promise<string> {
    // Primero probar la IP actual configurada
    const currentUrl = this.currentApiUrl;
    if (await this.testConnection(currentUrl)) {
      return currentUrl;
    }

    // Si la actual no funciona, probar otras IPs comunes
    for (const ip of COMMON_IPS) {
      const testUrl = `http://${ip}:3001/api`;
      if (await this.testConnection(testUrl)) {
        this.currentApiUrl = testUrl; // Actualizar la IP actual
        return testUrl;
      }
    }

    throw new Error('No se puede conectar al servidor. Verifica que esté ejecutándose y que estés en la misma red.');
  }

  // Probar conexión a una URL específica
  private async testConnection(baseUrl: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 segundos timeout

      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      // Usar la URL actual (puede haber sido detectada automáticamente)
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
          console.error('❌ Server error response:', errorText);
        } catch (e) {
          errorText = 'Could not read error response';
        }
        throw new Error(`HTTP error! status: ${response.status}. Server response: ${errorText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ API request failed:', error);
      throw error;
    }
  }

  // Health check
  async checkServerHealth(): Promise<{ success: boolean; code: string; message: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

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

  // Auth
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      // Intentar inicializar si no se ha hecho
      if (!this.isInitialized) {
        await this.initialize();
      }

      const response = await this.request<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      
      return response;
    } catch (error: any) {
      // Si falla, intentar detectar nueva IP y reintentar
      if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
        try {
          await this.detectWorkingIP();
          const response = await this.request<LoginResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
          });
          return response;
        } catch (retryError) {
          throw new Error('No se puede conectar al servidor. Verifica que esté ejecutándose y que estés en la misma red.');
        }
      }
      throw error;
    }
  }

  // Reports
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

  // Upload image to AWS S3
  async uploadImage(imageUri: string, token: string, reportId?: string): Promise<{ url: string; key: string }> {
    try {
      // Verificar que la URI de la imagen es válida
      if (!imageUri || !imageUri.startsWith('file://')) {
        throw new Error('Invalid image URI provided');
      }
      
      const formData = new FormData();
      
      // Generate unique filename with timestamp and report info
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${reportId || 'temp'}_${timestamp}.jpg`;
      
      // Create file object for React Native - asegurar formato correcto
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
          // Permitir que el browser configure el Content-Type automáticamente
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
        
        console.error('❌ Upload failed with status:', response.status, 'Error:', errorDetails);
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
      console.error('❌ Upload image error:', error);
      
      // Proporcionar mensaje más descriptivo
      if (error?.message?.includes('Network request failed')) {
        throw new Error('No se pudo conectar al servidor. Verifica tu conexión.');
      } else if (error?.message?.includes('Upload failed')) {
        throw error; // Re-throw para mantener el mensaje específico
      } else {
        throw new Error(`Error de subida: ${error?.message || 'Error desconocido'}`);
      }
    }
  }

  // Upload image from base64 data (alternative method)
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

  // Get presigned URL for direct S3 upload (alternative method)
  async getPresignedUrl(filename: string, token: string): Promise<{ uploadUrl: string; imageUrl: string; key: string }> {
    return this.request<{ uploadUrl: string; imageUrl: string; key: string }>('/upload/presigned', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ filename, folder: 'aquapool-reports' }),
    });
  }

  // User Statistics
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

  // User Report History
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

  // Get specific user report by ID
  async getUserReport(reportId: number, token: string): Promise<any> {
    return this.request(`/reports/my/${reportId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Products API methods
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

  // Generic HTTP methods
  async get<T>(endpoint: string, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  async post<T>(endpoint: string, data?: any, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  // Orders API methods
  async createOrder(orderData: any, token?: string): Promise<any> {
    return this.post('/orders', orderData, token);
  }

  async getOrders(token: string, page: number = 1, limit: number = 10): Promise<any> {
    return this.get(`/orders?page=${page}&limit=${limit}`, token);
  }

  async getOrderById(orderId: number, token: string): Promise<any> {
    return this.get(`/orders/${orderId}`, token);
  }

  // Test endpoint
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
}

export default new ApiService();
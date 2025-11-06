import { User, Report } from '../types';

// Detectar si estamos en desarrollo y usar la IP correcta
const getApiBaseUrl = () => {
  // En desarrollo, usar la IP de la red local que Expo puede alcanzar
  if (__DEV__) {
    return 'http://192.168.100.81:3001/api'; 
  }
  // En producción, usar la URL real del servidor
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl(); // Backend AWS integrado

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  token: string;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Health check
  async checkServerHealth(): Promise<{ success: boolean; code: string; message: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${API_BASE_URL}/health`, {
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
      // Try real backend login first
      return await this.request<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    } catch (error) {
      console.log('Backend login failed, trying demo credentials:', error);
      
      // Fallback to demo credentials for testing
      if (credentials.email === 'demo@aquapool.com' && credentials.password === 'demo123') {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              user: {
                id: 'demo-user-1',
                name: 'Juan Pérez',
                email: 'demo@aquapool.com',
                role: 'technician'
              },
              token: 'demo-jwt-token-12345'
            });
          }, 1000);
        });
      }

      // Admin demo credentials
      if (credentials.email === 'admin@aquapool.com' && credentials.password === 'admin123') {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              user: {
                id: 'admin-user-1',
                name: 'María González',
                email: 'admin@aquapool.com',
                role: 'admin'
              },
              token: 'admin-jwt-token-67890'
            });
          }, 1000);
        });
      }

      throw new Error('Invalid credentials');
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
      console.log('📤 Starting image upload:', { imageUri, reportId });
      
      // Verificar que la URI de la imagen es válida
      if (!imageUri || !imageUri.startsWith('file://')) {
        throw new Error('Invalid image URI provided');
      }
      
      const formData = new FormData();
      
      // Generate unique filename with timestamp and report info
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${reportId || 'temp'}_${timestamp}.jpg`;
      
      console.log('📝 Generated filename:', filename);
      
      // Create file object for React Native - asegurar formato correcto
      const fileObject = {
        uri: imageUri,
        type: 'image/jpeg',
        name: filename,
      };
      
      console.log('📋 File object:', fileObject);
      
      formData.append('file', fileObject as any);
      formData.append('folder', 'aquapool-reports');

      console.log('🚀 Sending upload request to:', `${API_BASE_URL}/upload/single`);

      const response = await fetch(`${API_BASE_URL}/upload/single`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Permitir que el browser configure el Content-Type automáticamente
        },
        body: formData,
      });

      console.log('📥 Upload response status:', response.status);
      console.log('📥 Upload response headers:', response.headers);
      
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
      console.log('✅ Upload successful:', result);
      
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
    return this.request('/reports/my/stats', {
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
}

export default new ApiService();
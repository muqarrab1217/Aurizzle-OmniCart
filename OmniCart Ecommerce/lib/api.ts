// API utility for backend integration

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://aurizzle-omnicart.onrender.com/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeader(): HeadersInit {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        return {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };
      }
    }
    return {
      'Content-Type': 'application/json',
    };
  }

  private transformResponse(data: any): any {
    // Transform _id to id for MongoDB documents
    if (Array.isArray(data)) {
      return data.map(item => this.transformResponse(item));
    } else if (data && typeof data === 'object' && data._id) {
      const { _id, ...rest } = data;
      return { id: _id, ...rest };
    }
    return data;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getAuthHeader(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'An error occurred');
      }

      // Transform _id to id in the response data
      if (data.success && data.data) {
        data.data = this.transformResponse(data.data);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<ApiResponse<{ user: any; token: string }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signup(name: string, email: string, password: string, role: string = 'customer'): Promise<ApiResponse<{ user: any; token: string }>> {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
  }

  async getMe(): Promise<ApiResponse<any>> {
    return this.request('/auth/me');
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<any>> {
    return this.request('/auth/updatepassword', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // User profile endpoints
  async getProfile(): Promise<ApiResponse<any>> {
    return this.request('/users/profile');
  }

  async updateProfile(profileData: { name?: string; phone?: string; cnic?: string }): Promise<ApiResponse<any>> {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async uploadProfilePhoto(file: File) {
    const formData = new FormData();
    formData.append('photo', file);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    return fetch(`${this.baseUrl}/users/profile/photo`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    }).then(res => res.json());
  }

  // Shop endpoints
  async getShops() {
    return this.request('/shops');
  }

  async getShop(id: string) {
    return this.request(`/shops/${id}`);
  }

  async createShop(shopData: any) {
    return this.request('/shops/register', {
      method: 'POST',
      body: JSON.stringify(shopData),
    });
  }

  async createShopAdmin(shopData: any) {
    return this.request('/shops', {
      method: 'POST',
      body: JSON.stringify(shopData),
    });
  }

  async updateShop(id: string, shopData: any) {
    return this.request(`/shops/${id}`, {
      method: 'PUT',
      body: JSON.stringify(shopData),
    });
  }

  async deleteShop(id: string) {
    return this.request(`/shops/${id}`, {
      method: 'DELETE',
    });
  }

  async getShopRevenue(id: string) {
    return this.request(`/shops/${id}/revenue`);
  }

  async updateShopStatus(id: string, status: string, rejectionReason?: string) {
    return this.request(`/shops/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, rejectionReason }),
    });
  }

  // Product endpoints
  async getProducts(params?: {
    shopId?: string;
    tags?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request(`/products${queryString ? `?${queryString}` : ''}`);
  }

  async getProduct(id: string) {
    return this.request(`/products/${id}`);
  }

  async createProduct(productData: any) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id: string, productData: any) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id: string) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  async getProductsByShop(shopId: string) {
    return this.request(`/products/shop/${shopId}`);
  }

  async uploadProductImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    return fetch(`${this.baseUrl}/products/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    }).then(res => res.json());
  }

  // Order endpoints
  async getOrders() {
    return this.request('/orders');
  }

  async getOrder(id: string) {
    return this.request(`/orders/${id}`);
  }

  async createOrder(items: any[]) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  }

  async updateOrderStatus(id: string, status: string) {
    return this.request(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async getMyOrders() {
    return this.request('/orders/user/me');
  }

  async deleteOrder(id: string) {
    return this.request(`/orders/${id}`, {
      method: 'DELETE',
    });
  }

  // Analytics endpoints
  async getPlatformAnalytics() {
    return this.request('/analytics/platform');
  }

  async getDailyUserRegistrations(days: number = 30) {
    return this.request(`/analytics/users/daily?days=${days}`);
  }

  async getDailyShopRegistrations(days: number = 30) {
    return this.request(`/analytics/shops/daily?days=${days}`);
  }

  async getShopAnalytics(shopId: string) {
    return this.request(`/analytics/shops/${shopId}`);
  }
}

export const api = new ApiClient(API_URL);
export default api;


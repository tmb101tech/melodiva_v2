const API_BASE_URL = 'http://localhost:3001/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

export const api = {
  auth: {
    signup: async (data: any) => {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    },
    login: async (emailOrPhone: string, password: string) => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone, password })
      });
      return response.json();
    },
    getProfile: async () => {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: getAuthHeaders()
      });
      return response.json();
    },
    updateProfile: async (data: any) => {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return response.json();
    },
    changePassword: async (currentPassword: string, newPassword: string) => {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ currentPassword, newPassword })
      });
      return response.json();
    }
  },
  products: {
    getAll: async (category?: string) => {
      const url = category
        ? `${API_BASE_URL}/products?category=${category}`
        : `${API_BASE_URL}/products`;
      const response = await fetch(url);
      return response.json();
    },
    getBySlug: async (slug: string) => {
      const response = await fetch(`${API_BASE_URL}/products/${slug}`);
      return response.json();
    }
  },
  orders: {
    calculateCheckout: async (data: any) => {
      const response = await fetch(`${API_BASE_URL}/orders/calculate-checkout`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return response.json();
    },
    create: async (data: any) => {
      const response = await fetch(`${API_BASE_URL}/orders/create`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return response.json();
    },
    getMyOrders: async (status?: string) => {
      const url = status
        ? `${API_BASE_URL}/orders/my-orders?status=${status}`
        : `${API_BASE_URL}/orders/my-orders`;
      const response = await fetch(url, {
        headers: getAuthHeaders()
      });
      return response.json();
    },
    getById: async (orderId: string) => {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        headers: getAuthHeaders()
      });
      return response.json();
    }
  },
  affiliate: {
    register: async () => {
      const response = await fetch(`${API_BASE_URL}/affiliate/register`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      return response.json();
    },
    getDashboard: async () => {
      const response = await fetch(`${API_BASE_URL}/affiliate/dashboard`, {
        headers: getAuthHeaders()
      });
      return response.json();
    },
    withdraw: async (amount: number) => {
      const response = await fetch(`${API_BASE_URL}/affiliate/withdraw`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount })
      });
      return response.json();
    },
    validateCode: async (code: string) => {
      const response = await fetch(`${API_BASE_URL}/affiliate/validate-code/${code}`);
      return response.json();
    }
  },
  reviews: {
    create: async (data: any) => {
      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return response.json();
    },
    getByProduct: async (productId: string) => {
      const response = await fetch(`${API_BASE_URL}/reviews/product/${productId}`);
      return response.json();
    },
    getMyReviews: async () => {
      const response = await fetch(`${API_BASE_URL}/reviews/my-reviews`, {
        headers: getAuthHeaders()
      });
      return response.json();
    }
  },
  getStatesCities: async () => {
    const response = await fetch(`${API_BASE_URL}/states-cities`);
    return response.json();
  }
};

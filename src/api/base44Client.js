import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Entity methods that mimic Base44 SDK structure
export const base44 = {
  entities: {
    Subject: {
      list: async () => {
        const response = await apiClient.get('/subjects');
        return response.data;
      },
      get: async (id) => {
        const response = await apiClient.get(`/subjects/${id}`);
        return response.data;
      },
      create: async (data) => {
        const response = await apiClient.post('/subjects', data);
        return response.data;
      },
      update: async (id, data) => {
        const response = await apiClient.put(`/subjects/${id}`, data);
        return response.data;
      },
      delete: async (id) => {
        const response = await apiClient.delete(`/subjects/${id}`);
        return response.data;
      },
    },
    Room: {
      list: async () => {
        const response = await apiClient.get('/rooms');
        return response.data;
      },
      get: async (id) => {
        const response = await apiClient.get(`/rooms/${id}`);
        return response.data;
      },
      create: async (data) => {
        const response = await apiClient.post('/rooms', data);
        return response.data;
      },
      update: async (id, data) => {
        const response = await apiClient.put(`/rooms/${id}`, data);
        return response.data;
      },
      delete: async (id) => {
        const response = await apiClient.delete(`/rooms/${id}`);
        return response.data;
      },
    },
    Faculty: {
      list: async () => {
        const response = await apiClient.get('/faculty');
        return response.data;
      },
      get: async (id) => {
        const response = await apiClient.get(`/faculty/${id}`);
        return response.data;
      },
      create: async (data) => {
        console.log('API: Creating faculty with data:', data);
        try {
          const response = await apiClient.post('/faculty', data);
          console.log('API: Faculty created successfully:', response.data);
          return response.data;
        } catch (error) {
          console.error('API: Error creating faculty:', error.response?.data || error.message);
          throw error;
        }
      },
      update: async (id, data) => {
        const response = await apiClient.put(`/faculty/${id}`, data);
        return response.data;
      },
      delete: async (id) => {
        const response = await apiClient.delete(`/faculty/${id}`);
        return response.data;
      },
    },
    Timetable: {
      list: async (sort = '-created_date') => {
        const response = await apiClient.get('/timetables');
        // Handle sorting if needed
        if (sort === '-created_date') {
          return response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        return response.data;
      },
      get: async (id) => {
        const response = await apiClient.get(`/timetables/${id}`);
        return response.data;
      },
      create: async (data) => {
        const response = await apiClient.post('/timetables', data);
        return response.data;
      },
      update: async (id, data) => {
        const response = await apiClient.put(`/timetables/${id}`, data);
        return response.data;
      },
      delete: async (id) => {
        const response = await apiClient.delete(`/timetables/${id}`);
        return response.data;
      },
    },
  },
  auth: {
    me: async () => {
      // Return a mock user since we're not using auth
      return { id: 'local-user', name: 'Local User' };
    },
    logout: () => {
      // No-op for local version
      console.log('Logout called - no action needed for local version');
    },
    redirectToLogin: () => {
      // No-op for local version
      console.log('Redirect to login called - no action needed for local version');
    },
  },
};

export default apiClient;

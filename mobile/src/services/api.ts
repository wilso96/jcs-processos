import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_TIMEOUT } from '../config/api';

const TOKEN_KEY = '@jcs_token';
const USER_KEY = '@jcs_usuario';

// Cria instância do axios
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - adiciona token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - trata erros
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expirado - limpa storage e redireciona para login
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
      // O logout será tratado pela tela que chamou
    }
    return Promise.reject(error);
  }
);

// Funções utilitárias para Token
export const setToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const getToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(TOKEN_KEY);
};

export const removeToken = async (): Promise<void> => {
  await AsyncStorage.removeItem(TOKEN_KEY);
};

// Funções utilitárias para Usuário
export const setUsuario = async (usuario: object): Promise<void> => {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(usuario));
};

export const getUsuario = async (): Promise<any | null> => {
  const data = await AsyncStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
};

export const removeUsuario = async (): Promise<void> => {
  await AsyncStorage.removeItem(USER_KEY);
};

// Logout completo
export const logout = async (): Promise<void> => {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
};

export default api;

import api, { setToken, setUsuario, logout as apiLogout } from './api';
import { AuthResponse } from '../types';

export const AuthService = {
  async login(email: string, senha: string): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/login', {
        email,
        senha,
      });

      // Salva token e usuário
      await setToken(response.data.token);
      await setUsuario(response.data.usuario);

      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao fazer login';
      throw new Error(message);
    }
  },

  async logout(): Promise<void> {
    await apiLogout();
  },
};

export default AuthService;

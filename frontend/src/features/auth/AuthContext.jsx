import { useEffect, useState } from 'react';
import { authApi } from '../../services/api';
import { AuthContext } from './AuthContextBase';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem('accessToken'));
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(token));

  useEffect(() => {
    let active = true;

    if (!token) {
      setUser(null);
      setIsLoading(false);
      return () => {
        active = false;
      };
    }

    setIsLoading(true);
    authApi.currentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch(() => {
        sessionStorage.removeItem('accessToken');
        if (active) {
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const establishSession = (response) => {
    sessionStorage.setItem('accessToken', response.access_token);
    setToken(response.access_token);
    setUser(response.user);
  };

  const login = async (credentials) => establishSession(await authApi.login(credentials));
  const register = async (details) => establishSession(await authApi.register(details));

  const logout = () => {
    sessionStorage.removeItem('accessToken');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
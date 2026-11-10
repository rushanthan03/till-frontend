import { createContext, useState, useEffect, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../app/store';
import { loginRequest, logoutRequest } from '../features/auth/authSilce';
import { User } from '../features/auth/types';
import { tokenStorage } from '../utils/token';

interface AuthContextType {
  primaryColor: string;
  updatePrimaryColor: (color: string) => void;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithPin: (tenantId: string, employeeNumber: string, pin: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  updateRestaurantLogo: (logo: string) => void;
  updateRestaurantName: (name: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [primaryColor, setPrimaryColor] = useState("#2563EB");
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("currentUser");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const dispatch = useDispatch<AppDispatch>();

  const { user: logUser, loading: isLoading, logoutMessage } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    if (!logUser) return;
    setUser(logUser);
    setPrimaryColor(logUser.restaurant?.primaryColor || "#2563EB");
    localStorage.setItem('currentUser', JSON.stringify(logUser));
  }, [logUser])

  useEffect(() => {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      setPrimaryColor(user.restaurant?.primaryColor || "#2563EB");
      if (user.restaurant?.logo) {
        localStorage.setItem('lastUploadedLogo', user.restaurant.logo);
      } else {
        localStorage.removeItem('lastUploadedLogo');
      }
    }
  }, [user])

  useEffect(() => {
    if (logoutMessage) {
      setUser(null);
      tokenStorage.remove();
    }
  }, [logoutMessage]);

  const login = async (email: string, password: string) => {
    dispatch(loginRequest({ email, password }));
  };

  const loginWithPin = async (tenantId: string, employeeNumber: string, pin: string) => {
    dispatch(loginRequest({ tenantId, employeeNumber, pin }));
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    dispatch(logoutRequest());
  };

  const updateRestaurantLogo = (logo: string) => {
    setUser(prev => prev ? ({ ...prev, restaurant: { ...prev.restaurant, logo } }) : null);
  };

  const updateRestaurantName = (name: string) => {
    setUser(prev => prev ? ({ ...prev, restaurant: { ...prev.restaurant, name } }) : null);
  };

  const updatePrimaryColor = (color: string) => {
    setPrimaryColor(color);
    setUser(prev => prev ? ({ ...prev, restaurant: { ...prev.restaurant, primaryColor: color } }) : null);
  }

  return (
    <AuthContext.Provider value={{ user, login, loginWithPin, logout, isLoading, primaryColor, updatePrimaryColor, updateRestaurantLogo, updateRestaurantName }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext }
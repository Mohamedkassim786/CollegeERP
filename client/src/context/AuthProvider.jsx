import { createContext, useState, useEffect } from 'react';
import { login as authLogin } from '../services/auth.service';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState(() => {
        try {
            const storedUser = localStorage.getItem('user');
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (_) {
            localStorage.removeItem('user');
            return null;
        }
    });

    const login = async (username, password) => {
        try {
            const response = await authLogin(username, password);
            const user = response.data;
            localStorage.setItem('user', JSON.stringify(user));
            setAuth(user);
            return user;
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('user');
        setAuth(null);
    };

    return (
        <AuthContext.Provider value={{ auth, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;

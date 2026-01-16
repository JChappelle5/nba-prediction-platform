import { createContext, useState, useContext, useEffect } from "react";
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => 
{
    const context = useContext(AuthContext);
    if (!context)
    {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) =>
{
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check for existing token on mount
    useEffect(() =>
    {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser)
        {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) =>
    {
        try
        {
            const response = await authAPI.login({ email, password });
            const { token, user } = response.data;

            // Save to state
            setToken(token);
            setUser(user);

            // Save to localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            return { success: true };
        }
        catch (error)
        {
            return {
                success: false,
                error: error.response?.data?.error || 'Login failed',
            };
        }
    };


    const register = async (username, email, password) =>
    {
        try
        {
            const response = await authAPI.register({ username, email, password });
            const { token, user } = response.data;

            // Save to state
            setToken(token);
            setUser(user);

            // Save to localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            return { success: true };
        }
        catch (error)
        {
            return {
                success: false,
                error: error.response?.data?.error || 'Regestration failed',
            };
        }
    };

    const logout = () =>
    {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    const value =
    {
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!token,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
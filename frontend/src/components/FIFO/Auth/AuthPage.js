import React, { useState } from 'react';
import { loginUser } from '../../../api/api';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Button, TextField, Paper, ThemeProvider, createTheme, CssBaseline } from '@mui/material';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
    },
    typography: {
        fontFamily: "'Outfit', sans-serif",
    },
});

const AuthPage = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { token, userId } = await loginUser(formData.username, formData.password);
            if (token) {
                localStorage.setItem('token', token);
                localStorage.setItem('userId', userId);
                toast.success('Login successful!');
                navigate('/pending-pickslip');
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } else {
                toast.error('Invalid login credentials.');
            }
        } catch (error) {
            if (error.response?.status === 401) {
                toast.error('Session expired. Please log in again.');
            } else {
                toast.error(error.message || 'An error occurred during login.');
            }
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <div className="flex justify-center items-center min-h-screen bg-white">
                <ToastContainer />
                <Paper elevation={3} className="p-8 w-full max-w-md">
                    <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Login</h2>
                    <form onSubmit={handleSubmit} className="mt-6">
                        <TextField
                            label="Username"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            fullWidth
                            required
                            margin="normal"
                            variant="outlined"
                        />
                        <TextField
                            label="Password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            fullWidth
                            required
                            margin="normal"
                            variant="outlined"
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            className="mt-4"
                        >
                            Login
                        </Button>
                    </form>
                </Paper>
            </div>
        </ThemeProvider>
    );
};

export default AuthPage;

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthProvider';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <ErrorBoundary>
            <BrowserRouter>
                <AuthProvider>
                    <Routes>
                        <Route path="/*" element={<App />} />
                    </Routes>
                </AuthProvider>
            </BrowserRouter>
            <Toaster
                position="bottom-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        borderRadius: '16px',
                        fontWeight: '600',
                        fontSize: '13px',
                        padding: '12px 16px',
                        boxShadow: '0 8px 32px rgba(0,59,115,0.12)',
                    },
                    success: {
                        iconTheme: { primary: '#003B73', secondary: '#fff' },
                    },
                }}
            />
        </ErrorBoundary>
    </StrictMode>,
)

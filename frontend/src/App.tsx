import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SessionView from './pages/SessionView';
import Assignments from './pages/Assignments';
import AssignmentDetails from './pages/AssignmentDetails';
import GuestJoinForm from './pages/GuestJoinForm';
import QueryPPTView from './pages/QueryPPTView';
import QueryAsk from './pages/QueryAsk';

const App: React.FC = () => {
    return (
        <AuthProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    {/* Public route for guest join and query ask */}
                    <Route path="/join/:code" element={<GuestJoinForm />} />
                    <Route path="/ask/:code" element={<QueryAsk />} />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/session/:code"
                        element={
                            <ProtectedRoute>
                                <SessionView />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/assignments"
                        element={
                            <ProtectedRoute>
                                <Assignments />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/assignments/:id"
                        element={
                            <ProtectedRoute>
                                <AssignmentDetails />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/query-mode"
                        element={
                            <ProtectedRoute>
                                <QueryPPTView />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;

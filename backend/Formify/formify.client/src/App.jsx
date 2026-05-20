import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import CreateForm from './pages/CreateForm';
import ViewForm from './pages/ViewForm';
import ProfessorDashboard from './pages/Professor/ProfessorDashboard';
import FuncionarioDashboard from './pages/Funcionario/FuncionarioDashboard';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import SessionGuard from './components/Auth/SessionGuard';
import RespondForm from './pages/RespondForm';
import MySubmissions from './pages/MySubmissions';
import MySubmissionDetail from './pages/MySubmissionDetail';

export default function App() {
    return (
        <Router>
            <SessionGuard />
            <Layout>
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard isDraft={false} /></ProtectedRoute>} />
                    <Route path="/DraftedForms" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard isDraft={true} /></ProtectedRoute>} />

                    <Route path="/professor" element={<ProtectedRoute allowedRoles={["professor"]}><ProfessorDashboard /></ProtectedRoute>} />

                    <Route path="/CreateForm" element={<ProtectedRoute allowedRoles={["admin"]}><CreateForm /></ProtectedRoute>} />
                    <Route path="/edit-form/:id" element={<ProtectedRoute allowedRoles={["admin"]}><CreateForm /></ProtectedRoute>} />

                    <Route path="/ViewForm/:id" element={<ViewForm />} />

                    <Route path="/funcionario" element={<ProtectedRoute allowedRoles={["funcionario"]}><FuncionarioDashboard /></ProtectedRoute>} />

                    <Route path="/respond/:id" element={
                        <ProtectedRoute allowedRoles={["professor", "funcionario"]}>
                            <RespondForm />
                        </ProtectedRoute>
                    } />

                    <Route path="/meus-formularios" element={
                        <ProtectedRoute allowedRoles={["professor", "funcionario"]}>
                            <MySubmissions />
                        </ProtectedRoute>
                    } />
                    <Route path="/meus-formularios/:id" element={
                        <ProtectedRoute allowedRoles={["professor", "funcionario"]}>
                            <MySubmissionDetail />
                        </ProtectedRoute>
                    } />
                </Routes>
            </Layout>
        </Router>
    );
}
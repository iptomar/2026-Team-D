import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import AdminDashboard from './pages/AdminDashboard';
import CreateForm from './pages/CreateForm';
import DraftedForms from './pages/DraftedForms';

export default function App() {
    return (
        <Router>
            <Layout>
                <Routes>
                    <Route path="/" element={<AdminDashboard />} />
                    <Route path="/DraftedForms" element={<DraftedForms />} />
                    <Route path="/CreateForm" element={<CreateForm />} />
                    <Route path="/edit-form/:id" element={<CreateForm />} />
                </Routes>
            </Layout>
        </Router>
    );
}
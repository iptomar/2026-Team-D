import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import AdminDashboard from './pages/AdminDashboard';
import CreateForm from './pages/CreateForm';
import ViewForm from './pages/ViewForm';
import ProfessorDashboard from './pages/Professor/ProfessorDashboard';

export default function App() {
    return (
        <Router>
            <Layout>
                <Routes>                 
                    <Route path="/" element={<AdminDashboard isDraft={false} />} />
                    <Route path="/DraftedForms" element={<AdminDashboard isDraft={true} />} />
                    <Route path="/professor" element={<ProfessorDashboard />} />
                    <Route path="/CreateForm" element={<CreateForm />} />
                    <Route path="/edit-form/:id" element={<CreateForm />} />
                    <Route path="/ViewForm/:id" element={<ViewForm />} />
                </Routes>
            </Layout>
        </Router>
    );
}
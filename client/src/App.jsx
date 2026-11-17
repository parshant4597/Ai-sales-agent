import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AssistantPage from './pages/AssistantPage';
import InsightsPage from './pages/InsightsPage';
import LeadsPage from './pages/LeadsPage';
import LoginPage from './pages/LoginPage';
import PricesPage from './pages/PricesPage';
import TeamPage from './pages/TeamPage';

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />

      {/* Everything below needs a signed-in team member */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<AssistantPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="prices" element={<PricesPage />} />

          {/* Admin only: the whole-team dashboard, the Team page */}
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="insights" element={<InsightsPage />} />
            <Route path="team" element={<TeamPage />} />
          </Route>

          <Route path="*" element={<p className="text-sm text-stone-600">Page not found.</p>} />
        </Route>
      </Route>
    </Routes>
  );
}

import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import AssistantPage from './pages/AssistantPage';
import LeadsPage from './pages/LeadsPage';
import PricesPage from './pages/PricesPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<AssistantPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="prices" element={<PricesPage />} />
        <Route path="*" element={<p className="text-sm text-stone-600">Page not found.</p>} />
      </Route>
    </Routes>
  );
}

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { LeadsProvider } from "./data/LeadsProvider";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { LeadsPage } from "./pages/LeadsPage";
import { PipelinePage } from "./pages/PipelinePage";

export function App() {
  return (
    <LeadsProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/leads" replace />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="pipeline" element={<PipelinePage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="*" element={<Navigate to="/leads" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LeadsProvider>
  );
}

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { AppDocPage } from "@/pages/AppDocPage";
import { CadastrarPage } from "@/pages/CadastrarPage";
import { CatalogPage } from "@/pages/CatalogPage";
import { LabelsPage } from "@/pages/LabelsPage";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<CatalogPage />} />
            <Route path="/labels" element={<LabelsPage />} />
            <Route path="/cadastrar" element={<CadastrarPage />} />
            <Route path="/apps/:appId" element={<AppDocPage />} />
            <Route path="/apps/:appId/editar" element={<AppDocPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

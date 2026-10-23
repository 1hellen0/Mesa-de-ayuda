import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { HomePage } from '../pages/HomePage';
import { DashboardPage } from '../pages/DashboardPage';
import { MetricsPage } from '../pages/MetricsPage';
import { TicketsListPage } from '../pages/TicketsListPage';
import { TicketDetailPage } from '../pages/TicketDetailPage';
import { CreateTicketPage } from '../pages/CreateTicketPage';
import { EditTicketPage } from '../pages/EditTicketPage';
import { AgentsPage } from '../pages/AgentsPage';
import { ClientsPage } from '../pages/ClientsPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Portal Principal / Landing Editorial NEXORA */}
        <Route path="/" element={<HomePage />} />

        {/* Centro de Operaciones y Módulos Internos con Layout NEXORA */}
        <Route element={<Layout />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="metricas" element={<MetricsPage />} />
          <Route path="tickets" element={<TicketsListPage />} />
          <Route path="tickets/nuevo" element={<CreateTicketPage />} />
          <Route path="tickets/:id" element={<TicketDetailPage />} />
          <Route path="tickets/:id/editar" element={<EditTicketPage />} />
          <Route path="agentes" element={<AgentsPage />} />
          <Route path="clientes" element={<ClientsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

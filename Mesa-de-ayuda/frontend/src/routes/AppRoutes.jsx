import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { DashboardPage } from '../pages/DashboardPage';
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
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
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

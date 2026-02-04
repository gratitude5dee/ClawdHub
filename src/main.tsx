import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThirdwebProvider } from 'thirdweb/react';
import { createThirdwebClient } from 'thirdweb';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { TaskBoardPage } from './pages/TaskBoardPage';
import './index.css';

export const thirdwebClient = createThirdwebClient({
  clientId: 'YOUR_THIRDWEB_CLIENT_ID', // Replace with your thirdweb client ID
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThirdwebProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:agentId/:slug" element={<ProjectDetailPage />} />
              <Route path="/projects/:agentId/:slug/tasks" element={<TaskBoardPage />} />
              {/* Placeholder routes */}
              <Route path="/agents" element={<PlaceholderPage title="Agents" />} />
              <Route path="/dashboard" element={<PlaceholderPage title="Dashboard" />} />
              <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThirdwebProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="container py-16 text-center">
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      <p className="text-muted-foreground mt-2">Coming soon...</p>
    </div>
  );
}

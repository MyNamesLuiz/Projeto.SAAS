import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PrivateRoute from './components/PrivateRoute'
import Preloader from './components/Preloader'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import OSListPage from './pages/OSListPage'
import KanbanPage from './pages/KanbanPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Dados sempre considerados velhos — refetch acontece ao focar janela
      // e no intervalo definido por cada query
      staleTime: 0,
      // Mantém cache por 2min (evita flash ao navegar entre páginas)
      gcTime: 2 * 60 * 1000,
      // Tenta de novo 1x em caso de falha de rede
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
})

function App() {
  const [preloaderDone, setPreloaderDone] = useState(false) // Estado para controlar exibição do preloader

  return (
    <QueryClientProvider client={queryClient}>
      
        {!preloaderDone && (
          <Preloader 
          minDuration={2400}
          onDone={() => setPreloaderDone(true)}  // Simula carregamento inicial de 2.4s
          />
        )}
      
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="os" element={<OSListPage />} />
            <Route path="kanban" element={<KanbanPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
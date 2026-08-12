import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider.jsx';
import RutaProtegida from './components/RutaProtegida.jsx';
import Login from './pages/Login.jsx';
import Calendario from './pages/Calendario.jsx';
import NuevaReserva from './pages/NuevaReserva.jsx';
import ReservasAnteriores from './pages/ReservasAnteriores.jsx';
import DetalleReserva from './pages/DetalleReserva.jsx';
import Estadisticas from './pages/Estadisticas.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RutaProtegida>
                <Calendario />
              </RutaProtegida>
            }
          />
          <Route
            path="/reservas/nueva"
            element={
              <RutaProtegida>
                <NuevaReserva />
              </RutaProtegida>
            }
          />
          <Route
            path="/estadisticas"
            element={
              <RutaProtegida>
                <Estadisticas />
              </RutaProtegida>
            }
          />
          <Route
            path="/reservas/:id/editar"
            element={
              <RutaProtegida>
                <NuevaReserva />
              </RutaProtegida>
            }
          />
          <Route
            path="/reservas-anteriores"
            element={
              <RutaProtegida>
                <ReservasAnteriores />
              </RutaProtegida>
            }
          />
          <Route
            path="/reservas/:id"
            element={
              <RutaProtegida>
                <DetalleReserva />
              </RutaProtegida>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
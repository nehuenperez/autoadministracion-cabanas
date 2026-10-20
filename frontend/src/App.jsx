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
          {/* Todo lo de adentro exige sesión iniciada */}
          <Route element={<RutaProtegida />}>
            <Route path="/" element={<Calendario />} />
            <Route path="/reservas/nueva" element={<NuevaReserva />} />
            <Route path="/reservas/:id" element={<DetalleReserva />} />
            <Route path="/reservas-anteriores" element={<ReservasAnteriores />} />
            <Route path="/estadisticas" element={<Estadisticas />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

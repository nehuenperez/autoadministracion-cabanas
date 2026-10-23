import { CalendarDays } from 'lucide-react';
import { BotonEnlace } from '../components/comunes/Boton.jsx';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-900">Esta página no existe</h1>
        <p className="text-[15px] text-slate-500">Puede que el enlace esté mal escrito o que la reserva se haya borrado.</p>
        <BotonEnlace to="/" icono={CalendarDays}>Ir al calendario</BotonEnlace>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-white rounded-2xl p-6 border border-slate-200/70 shadow-xs text-center space-y-4">
        <p className="text-sm font-bold text-slate-800">Página no encontrada</p>
        <Link to="/" className="inline-block bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold">
          Ir al calendario
        </Link>
      </div>
    </div>
  );
}

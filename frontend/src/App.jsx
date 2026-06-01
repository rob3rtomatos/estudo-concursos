import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Login          from './pages/Login';
import Registro       from './pages/Registro';
import Dashboard      from './pages/Dashboard';
import CicloEstudos   from './pages/CicloEstudos';
import RegistroDiario from './pages/RegistroDiario';
import Notificacoes   from './pages/Notificacoes';
import Cronometro     from './pages/Cronometro';
import Questoes       from './pages/Questoes';
import Simulados      from './pages/Simulados';
import MeusCursos     from './pages/MeusCursos';
import Relatorios     from './pages/Relatorios';
import Layout         from './components/Layout';

function RotaProtegida({ children }) {
  const { usuario, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      height:'100vh', background:'var(--bg-primary)' }}>
      <div style={{ width:40, height:40, border:'3px solid var(--accent)',
        borderTopColor:'transparent', borderRadius:'50%',
        animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  return usuario ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login"    element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      <Route path="/" element={<RotaProtegida><Layout /></RotaProtegida>}>
        <Route index                  element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"       element={<Dashboard />} />
        <Route path="ciclo"           element={<CicloEstudos />} />
        <Route path="registro-diario" element={<RegistroDiario />} />
        <Route path="cronometro"      element={<Cronometro />} />
        <Route path="questoes"        element={<Questoes />} />
        <Route path="simulados"       element={<Simulados />} />
        <Route path="meus-cursos"     element={<MeusCursos />} />
        <Route path="relatorios"      element={<Relatorios />} />
        <Route path="notificacoes"    element={<Notificacoes />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

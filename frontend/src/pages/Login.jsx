import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Login() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [form, setForm]       = useState({ email: '', senha: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.usuario);
      toast.success(`Bem-vindo, ${data.usuario.nome}!`);
      navigate('/dashboard');
    } catch {
      // Erro tratado pelo interceptor do axios
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card scale-in">

        {/* Logo / Título */}
        <div className="auth-logo">
          <span style={{ fontSize:'2.25rem', lineHeight:1 }}>📚</span>
          <div style={{ textAlign:'center' }}>
            <h1 style={{
              fontSize:'1.5rem', fontWeight:800,
              color:'var(--text-primary)', letterSpacing:'-0.02em'
            }}>
              Estudo Concursos
            </h1>
            <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem', marginTop:'var(--sp-1)' }}>
              Entre na sua conta para continuar
            </p>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="auth-fields">

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input-field"
              placeholder="seu@email.com"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={form.senha}
              onChange={e => setForm(p => ({ ...p, senha: e.target.value }))}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary auth-submit"
            disabled={loading}
            style={{ width:'100%', justifyContent:'center', minHeight:44 }}
          >
            {loading
              ? <><span className="spinner" style={{ width:16, height:16, borderWidth:2 }} /> Entrando...</>
              : 'Entrar'}
          </button>

        </form>

        {/* Rodapé */}
        <p className="auth-footer">
          Não tem conta?{' '}
          <Link
            to="/registro"
            style={{ color:'var(--accent)', fontWeight:700 }}
          >
            Criar conta
          </Link>
        </p>

      </div>
    </div>
  );
}

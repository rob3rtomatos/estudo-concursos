import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Registro() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ nome: '', email: '', senha: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.senha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/registro', form);
      login(data.token, data.usuario);
      toast.success('Conta criada com sucesso!');
      navigate('/dashboard');
    } catch {
      // Tratado pelo interceptor
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem' }}>🎓</h1>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Criar Conta</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Comece a organizar seus estudos
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { label: 'Nome completo', name: 'nome', type: 'text', placeholder: 'Seu nome' },
            { label: 'Email',         name: 'email', type: 'email', placeholder: 'seu@email.com' },
            { label: 'Senha',         name: 'senha', type: 'password', placeholder: 'Mínimo 6 caracteres' }
          ].map(field => (
            <div key={field.name}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
                {field.label}
              </label>
              <input
                type={field.type}
                className="input-field"
                placeholder={field.placeholder}
                value={form[field.name]}
                onChange={e => setForm(p => ({ ...p, [field.name]: e.target.value }))}
                required
              />
            </div>
          ))}

          <button type="submit" className="btn-primary" disabled={loading}
            style={{ marginTop: '0.5rem' }}>
            {loading ? 'Criando...' : 'Criar Conta'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Já tem conta?{' '}
          <Link to="/login" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}>
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}

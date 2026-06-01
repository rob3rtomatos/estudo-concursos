import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Registro() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [form, setForm]       = useState({ nome: '', email: '', senha: '' });
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

  const FIELDS = [
    { label:'Nome completo', name:'nome',  type:'text',     placeholder:'Seu nome completo', autoComplete:'name' },
    { label:'Email',         name:'email', type:'email',    placeholder:'seu@email.com',      autoComplete:'email' },
    { label:'Senha',         name:'senha', type:'password', placeholder:'Mínimo 6 caracteres',autoComplete:'new-password' },
  ];

  return (
    <div className="auth-container">
      <div className="auth-card scale-in">

        {/* Logo / Título */}
        <div className="auth-logo">
          <span style={{ fontSize:'2.25rem', lineHeight:1 }}>🎓</span>
          <div style={{ textAlign:'center' }}>
            <h1 style={{
              fontSize:'1.5rem', fontWeight:800,
              color:'var(--text-primary)', letterSpacing:'-0.02em'
            }}>
              Criar Conta
            </h1>
            <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem', marginTop:'var(--sp-1)' }}>
              Comece a organizar seus estudos
            </p>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="auth-fields">
          {FIELDS.map(field => (
            <div key={field.name} className="form-group">
              <label className="form-label" htmlFor={field.name}>
                {field.label}
              </label>
              <input
                id={field.name}
                type={field.type}
                className="input-field"
                placeholder={field.placeholder}
                value={form[field.name]}
                autoComplete={field.autoComplete}
                onChange={e => setForm(p => ({ ...p, [field.name]: e.target.value }))}
                required
              />
            </div>
          ))}

          <button
            type="submit"
            className="btn-primary auth-submit"
            disabled={loading}
            style={{ width:'100%', justifyContent:'center', minHeight:44 }}
          >
            {loading
              ? <><span className="spinner" style={{ width:16, height:16, borderWidth:2 }} /> Criando...</>
              : 'Criar Conta'}
          </button>
        </form>

        {/* Rodapé */}
        <p className="auth-footer">
          Já tem conta?{' '}
          <Link to="/login" style={{ color:'var(--accent)', fontWeight:700 }}>
            Fazer login
          </Link>
        </p>

      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { X, User, Mail, Shield, KeyRound, CheckCircle2 } from 'lucide-react';

export default function UserModal({ isOpen, onClose, onSave, userToEdit = null }) {
  const isEditing = !!userToEdit;

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('usuario');
  const [activo, setActivo] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userToEdit) {
      setNombre(userToEdit.nombre || '');
      setEmail(userToEdit.email || '');
      setPassword('');
      setRol(userToEdit.rol || 'usuario');
      setActivo(userToEdit.activo !== undefined ? userToEdit.activo : true);
    } else {
      setNombre('');
      setEmail('');
      setPassword('');
      setRol('usuario');
      setActivo(true);
    }
    setError('');
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!nombre.trim() || !email.trim()) {
      setError('El nombre y el correo electrónico son obligatorios.');
      return;
    }

    if (!isEditing && !password) {
      setError('La contraseña es requerida para un nuevo usuario.');
      return;
    }

    onSave({
      id: userToEdit?.id,
      nombre: nombre.trim(),
      email: email.trim(),
      password: password.trim(),
      rol,
      activo
    });
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div className="modal-container" style={{
        background: 'var(--bg-card, #ffffff)',
        color: 'var(--text-main, #1e293b)',
        borderRadius: '1.25rem',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
        overflow: 'hidden',
        border: '1px solid var(--border-color, #e2e8f0)'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color, #e2e8f0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-header, #f8fafc)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '0.6rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <User size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700' }}>
              {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '0.4rem',
              borderRadius: '0.5rem'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '0.75rem 1rem',
              borderRadius: '0.6rem',
              marginBottom: '1rem',
              fontSize: '0.85rem'
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '1.1rem' }}>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '0.35rem' }}>
              Nombre y Apellido *
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Juan Pérez"
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                  borderRadius: '0.6rem',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.1rem' }}>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '0.35rem' }}>
              Correo Electrónico *
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@constructora.com"
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                  borderRadius: '0.6rem',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.1rem' }}>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '0.35rem' }}>
              Rol de Usuario *
            </label>
            <div style={{ position: 'relative' }}>
              <Shield size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                  borderRadius: '0.6rem',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                  background: '#ffffff'
                }}
              >
                <option value="usuario">Usuario Estándar (Acceso completo sin administración)</option>
                <option value="admin">Administrador (Acceso total + Gestión de Usuarios)</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1.1rem' }}>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '0.35rem' }}>
              {isEditing ? 'Nueva Contraseña (dejar en blanco para conservar actual)' : 'Contraseña *'}
            </label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEditing ? '•••••••• (Sin cambios)' : '••••••••'}
                required={!isEditing}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                  borderRadius: '0.6rem',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {isEditing && (
            <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <input
                type="checkbox"
                id="activoCheck"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="activoCheck" style={{ fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' }}>
                Cuenta Habilitada / Activa
              </label>
            </div>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            marginTop: '1.5rem'
          }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <CheckCircle2 size={16} />
              {isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

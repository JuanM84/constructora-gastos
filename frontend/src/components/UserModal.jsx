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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <User size={20} color="var(--accent-blue)" />
            <span>{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</span>
          </div>
          <button type="button" className="btn-icon-only" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1rem',
                fontSize: '0.85rem'
              }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Nombre y Apellido *</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Correo Electrónico *</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@constructora.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Rol de Usuario *</label>
              <div style={{ position: 'relative' }}>
                <Shield size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
                <select
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                >
                  <option value="usuario">Usuario Estándar (Acceso completo sin administración)</option>
                  <option value="admin">Administrador (Acceso total + Gestión de Usuarios)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                {isEditing ? 'Nueva Contraseña (dejar en blanco para conservar actual)' : 'Contraseña *'}
              </label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isEditing ? '•••••••• (Sin cambios)' : '••••••••'}
                  required={!isEditing}
                />
              </div>
            </div>

            {isEditing && (
              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.6rem', marginTop: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="activoCheck"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-emerald)' }}
                />
                <label htmlFor="activoCheck" style={{ fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer', margin: 0, color: 'var(--text-main)' }}>
                  Cuenta Habilitada / Activa
                </label>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <CheckCircle2 size={16} />
              <span>{isEditing ? 'Guardar Cambios' : 'Crear Usuario'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

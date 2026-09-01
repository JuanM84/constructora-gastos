import { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, Shield, ShieldAlert, CheckCircle, XCircle, Search, Edit2, Trash2, KeyRound, UserCheck, RefreshCw } from 'lucide-react';
import { API_BASE } from '../config';
import { authFetch, getCurrentUser } from '../utils/auth';
import UserModal from './UserModal';

export default function UsersTab({ showToast }) {
  const currentUser = getCurrentUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/usuarios`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al cargar listado de usuarios', 'error');
      }
    } catch (err) {
      console.error('Error cargando usuarios:', err);
      showToast('Error de conexión al servidor', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenNewUser = () => {
    setUserToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditUser = (user) => {
    setUserToEdit(user);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (userData) => {
    const isEdit = !!userData.id;
    const url = isEdit ? `${API_BASE}/usuarios/${userData.id}` : `${API_BASE}/usuarios`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await res.json();

      if (res.ok) {
        showToast(isEdit ? '¡Usuario modificado con éxito!' : '¡Usuario creado con éxito!');
        setIsModalOpen(false);
        setUserToEdit(null);
        fetchUsers();
      } else {
        showToast(data.error || 'Error al guardar el usuario', 'error');
      }
    } catch (err) {
      showToast('Error de conexión', 'error');
    }
  };

  const handleToggleActiveStatus = async (user) => {
    const newStatus = !user.activo;
    const actionText = newStatus ? 'activar' : 'desactivar';

    if (!window.confirm(`¿Estás seguro de ${actionText} la cuenta de ${user.nombre}?`)) return;

    try {
      const res = await authFetch(`${API_BASE}/usuarios/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
          activo: newStatus
        })
      });

      if (res.ok) {
        showToast(`Usuario ${user.nombre} ${newStatus ? 'activado' : 'desactivado'}`);
        fetchUsers();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al modificar estado', 'error');
      }
    } catch (err) {
      showToast('Error de conexión', 'error');
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.id === currentUser?.id) {
      showToast('No puedes eliminar tu propia cuenta en uso', 'error');
      return;
    }

    if (!window.confirm(`¿Deseas eliminar definitivamente al usuario ${user.nombre} (${user.email})?`)) return;

    try {
      const res = await authFetch(`${API_BASE}/usuarios/${user.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        showToast('Usuario eliminado correctamente');
        fetchUsers();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al eliminar el usuario', 'error');
      }
    } catch (err) {
      showToast('Error de conexión', 'error');
    }
  };

  const filteredUsers = users.filter(u =>
    u.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.rol?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUsers = users.length;
  const adminUsers = users.filter(u => u.rol === 'admin').length;
  const standardUsers = users.filter(u => u.rol === 'usuario').length;
  const activeUsers = users.filter(u => u.activo).length;

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Encabezado Principal */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            margin: '0 0 0.25rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}>
            <Users size={28} style={{ color: 'var(--primary-color, #2563eb)' }} />
            Gestión de Usuarios
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted, #64748b)', fontSize: '0.9rem' }}>
            Panel de administración de credenciales y roles del sistema
          </p>
        </div>

        <button
          onClick={handleOpenNewUser}
          className="btn btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.2rem',
            borderRadius: '0.75rem',
            fontWeight: '600'
          }}
        >
          <UserPlus size={18} />
          Nuevo Usuario
        </button>
      </div>

      {/* Tarjetas de Métricas de Usuarios */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.75rem'
      }}>
        <div style={{
          background: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '1rem',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '0.75rem',
            background: 'rgba(37, 99, 235, 0.1)',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', fontWeight: '500' }}>Total Usuarios</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{totalUsers}</div>
          </div>
        </div>

        <div style={{
          background: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '1rem',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '0.75rem',
            background: 'rgba(217, 119, 6, 0.1)',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', fontWeight: '500' }}>Administradores</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{adminUsers}</div>
          </div>
        </div>

        <div style={{
          background: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '1rem',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '0.75rem',
            background: 'rgba(14, 165, 233, 0.1)',
            color: '#0ea5e9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <UserCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', fontWeight: '500' }}>Usuarios Estándar</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{standardUsers}</div>
          </div>
        </div>

        <div style={{
          background: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '1rem',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '0.75rem',
            background: 'rgba(34, 197, 94, 0.1)',
            color: '#22c55e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', fontWeight: '500' }}>Cuentas Activas</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{activeUsers}</div>
          </div>
        </div>
      </div>

      {/* Filtros y Buscador */}
      <div style={{
        background: 'var(--bg-card, #ffffff)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: '1rem',
        padding: '1rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Buscar por nombre, email o rol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.85rem 0.6rem 2.4rem',
              borderRadius: '0.6rem',
              border: '1px solid var(--border-color, #cbd5e1)',
              fontSize: '0.875rem',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <button
          onClick={fetchUsers}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem' }}
          title="Actualizar Lista"
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
      </div>

      {/* Tabla de Usuarios */}
      <div style={{
        background: 'var(--bg-card, #ffffff)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: '1rem',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-header, #f8fafc)', borderBottom: '1px solid var(--border-color, #e2e8f0)', color: 'var(--text-muted, #64748b)' }}>
              <th style={{ padding: '0.85rem 1.25rem', fontWeight: '600' }}>Usuario</th>
              <th style={{ padding: '0.85rem 1.25rem', fontWeight: '600' }}>Email</th>
              <th style={{ padding: '0.85rem 1.25rem', fontWeight: '600' }}>Rol</th>
              <th style={{ padding: '0.85rem 1.25rem', fontWeight: '600' }}>Estado</th>
              <th style={{ padding: '0.85rem 1.25rem', fontWeight: '600' }}>Fecha Registro</th>
              <th style={{ padding: '0.85rem 1.25rem', fontWeight: '600', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                  Cargando usuarios...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                  No se encontraron usuarios registrados.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const isAdmin = user.rol === 'admin';
                const isSelf = user.id === currentUser?.id;

                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color, #f1f5f9)' }}>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: isAdmin ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '0.9rem'
                        }}>
                          {user.nombre?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--text-main, #0f172a)' }}>
                            {user.nombre} {isSelf && <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: '600' }}>(Tú)</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted, #475569)' }}>
                      {user.email}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '2rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: isAdmin ? 'rgba(217, 119, 6, 0.12)' : 'rgba(37, 99, 235, 0.12)',
                        color: isAdmin ? '#b45309' : '#1d4ed8'
                      }}>
                        {isAdmin ? <Shield size={13} /> : <UserCheck size={13} />}
                        {isAdmin ? 'Administrador' : 'Usuario'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '2rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: user.activo ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        color: user.activo ? '#15803d' : '#b91c1c'
                      }}>
                        {user.activo ? <CheckCircle size={13} /> : <XCircle size={13} />}
                        {user.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted, #64748b)', fontSize: '0.85rem' }}>
                      {user.creado_en ? new Date(user.creado_en).toLocaleDateString('es-AR') : '-'}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button
                          onClick={() => handleOpenEditUser(user)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#3b82f6',
                            padding: '0.4rem',
                            borderRadius: '0.4rem'
                          }}
                          title="Editar / Cambiar contraseña"
                        >
                          <Edit2 size={16} />
                        </button>

                        <button
                          onClick={() => handleToggleActiveStatus(user)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: user.activo ? '#d97706' : '#22c55e',
                            padding: '0.4rem',
                            borderRadius: '0.4rem'
                          }}
                          title={user.activo ? 'Desactivar cuenta' : 'Activar cuenta'}
                        >
                          {user.activo ? <XCircle size={16} /> : <CheckCircle size={16} />}
                        </button>

                        {!isSelf && (
                          <button
                            onClick={() => handleDeleteUser(user)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#ef4444',
                              padding: '0.4rem',
                              borderRadius: '0.4rem'
                            }}
                            title="Eliminar usuario"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Alta/Edición */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUser}
        userToEdit={userToEdit}
      />
    </div>
  );
}

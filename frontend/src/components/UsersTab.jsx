import { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, Shield, CheckCircle, XCircle, Search, Edit2, Trash2, UserCheck, RefreshCw } from 'lucide-react';
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
            <Users size={28} style={{ color: 'var(--accent-amber, #f59e0b)' }} />
            Gestión de Usuarios
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted, #94a3b8)', fontSize: '0.9rem' }}>
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
            borderRadius: 'var(--radius-md)',
            fontWeight: '600'
          }}
        >
          <UserPlus size={18} />
          Nuevo Usuario
        </button>
      </div>

      {/* Tarjetas de Métricas de Usuarios */}
      <div className="stats-grid" style={{ marginBottom: '1.75rem' }}>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Total Usuarios</div>
            <div className="stat-value">{totalUsers}</div>
          </div>
          <div className="stat-icon blue">
            <Users size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Administradores</div>
            <div className="stat-value">{adminUsers}</div>
          </div>
          <div className="stat-icon amber">
            <Shield size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Usuarios Estándar</div>
            <div className="stat-value">{standardUsers}</div>
          </div>
          <div className="stat-icon blue">
            <UserCheck size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Cuentas Activas</div>
            <div className="stat-value">{activeUsers}</div>
          </div>
          <div className="stat-icon emerald">
            <CheckCircle size={24} />
          </div>
        </div>
      </div>

      {/* Filtros y Buscador */}
      <div className="filter-bar" style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem 1.25rem',
        marginBottom: '1.5rem'
      }}>
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o rol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button
          onClick={fetchUsers}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          title="Actualizar Lista"
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
      </div>

      {/* Tabla de Usuarios */}
      <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.65)', borderBottom: '1px solid var(--border-color)' }}>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Fecha Registro</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Cargando usuarios...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No se encontraron usuarios registrados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isAdmin = user.rol === 'admin';
                  const isSelf = user.id === currentUser?.id;

                  return (
                    <tr key={user.id}>
                      <td>
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
                            <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                              {user.nombre} {isSelf && <span style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', fontWeight: '600' }}>(Tú)</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {user.email}
                      </td>
                      <td>
                        <span className={`badge ${isAdmin ? 'badge-warning' : 'badge-success'}`}>
                          <Shield size={12} style={{ marginRight: '0.25rem' }} />
                          {isAdmin ? 'Administrador' : 'Usuario'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${user.activo ? 'badge-active' : 'badge-neutral'}`}>
                          {user.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {user.creado_en ? new Date(user.creado_en).toLocaleDateString('es-AR') : '-'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button
                            className="btn-icon-only"
                            onClick={() => handleOpenEditUser(user)}
                            title="Editar / Cambiar contraseña"
                          >
                            <Edit2 size={15} />
                          </button>

                          <button
                            className="btn-icon-only"
                            onClick={() => handleToggleActiveStatus(user)}
                            style={{ color: user.activo ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}
                            title={user.activo ? 'Desactivar cuenta' : 'Activar cuenta'}
                          >
                            {user.activo ? <XCircle size={15} /> : <CheckCircle size={15} />}
                          </button>

                          {!isSelf && (
                            <button
                              className="btn-icon-only delete"
                              onClick={() => handleDeleteUser(user)}
                              title="Eliminar usuario"
                            >
                              <Trash2 size={15} />
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

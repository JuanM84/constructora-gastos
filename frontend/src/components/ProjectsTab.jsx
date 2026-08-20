import { useState } from 'react';
import { Building2, Plus, Edit2, Trash2, Search, MapPin, Calendar, Layers, ArrowRight, User } from 'lucide-react';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../utils/formatters';

export default function ProjectsTab({ projects, onOpenNewProject, onEditProject, onDeleteProject, onSelectProject }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');

  const filteredProjects = projects.filter(proy => {
    const matchesSearch = proy.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (proy.ubicacion && proy.ubicacion.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (proy.cliente_nombre && proy.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'Todos' || proy.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="panel-card">
      <div className="panel-header">
        <div className="panel-title">
          <Building2 size={22} color="var(--accent-amber)" />
          <span>Gestión de Proyectos u Obras ({filteredProjects.length})</span>
        </div>
        <button className="btn btn-primary" onClick={onOpenNewProject}>
          <Plus size={16} />
          <span>Nuevo Proyecto</span>
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar por nombre, ubicación o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="select-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="Todos">Todos los Estados</option>
          <option value="Activo">Activos</option>
          <option value="En Pausa">En Pausa</option>
          <option value="Finalizado">Finalizados</option>
        </select>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="empty-state">
          <Building2 size={48} className="empty-icon" />
          <div className="empty-title">No se encontraron proyectos</div>
          <p>Prueba con otros términos de búsqueda o crea un nuevo proyecto.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {filteredProjects.map((proy) => {
            const pct = proy.porcentaje_ejecutado || 0;
            const isOver = pct > 100;
            const barClass = isOver ? 'danger' : pct > 80 ? 'warning' : 'normal';

            return (
              <div 
                key={proy.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  boxShadow: 'var(--shadow-main)',
                  transition: 'transform 0.2s ease, border-color 0.2s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: 0, fontWeight: '700' }}>{proy.nombre}</h3>
                      {proy.cliente_nombre && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <User size={13} /> {proy.cliente_nombre}
                        </div>
                      )}
                    </div>
                    <span className={`badge ${getStatusBadgeClass(proy.estado)}`}>{proy.estado}</span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MapPin size={14} color="var(--accent-amber)" />
                    <span>{proy.ubicacion || 'Sin ubicación especificada'}</span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={14} color="var(--accent-blue)" />
                    <span>Inicio: {formatDate(proy.fecha_inicio)}</span>
                  </div>

                  {/* Tarjeta de Barra de Progreso y Financiero */}
                  <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Gastado / Presupuesto Total</span>
                      <span style={{ fontWeight: '700', color: isOver ? 'var(--accent-rose)' : 'var(--accent-amber)' }}>{pct}%</span>
                    </div>

                    <div className="progress-bar-container">
                      <div className={`progress-bar-fill ${barClass}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                      <span>Gastos: <strong style={{ color: isOver ? 'var(--accent-rose)' : 'var(--text-main)' }}>{formatCurrency(proy.total_gastado)}</strong></span>
                      <span>Presupuesto: <strong style={{ color: 'var(--text-main)' }}>{formatCurrency(proy.presupuesto_estimado)}</strong></span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>Cobrado: {formatCurrency(proy.total_cobrado)}</span>
                      <span style={{ color: 'var(--accent-amber)', fontWeight: '600' }}>Por cobrar: {formatCurrency(proy.saldo_pendiente_cobro)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: 'var(--accent-amber)', color: 'var(--accent-amber)' }}
                    onClick={() => onSelectProject(proy.id)}
                  >
                    <Layers size={14} />
                    <span>Ver Etapas & Cobros</span>
                    <ArrowRight size={14} />
                  </button>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="btn-icon-only" onClick={() => onEditProject(proy)} title="Editar proyecto">
                      <Edit2 size={16} />
                    </button>
                    <button className="btn-icon-only delete" onClick={() => onDeleteProject(proy.id)} title="Eliminar proyecto">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

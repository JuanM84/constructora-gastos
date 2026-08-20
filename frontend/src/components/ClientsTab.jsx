import { useState } from 'react';
import { Users, Plus, Search, Edit2, Trash2, Phone, Mail, Building2 } from 'lucide-react';

export default function ClientsTab({ clients, onOpenNewClient, onEditClient, onDeleteClient }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clients.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.dni_cuit && c.dni_cuit.includes(searchTerm)) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="panel-card">
      <div className="panel-header">
        <div className="panel-title">
          <Users size={22} color="var(--accent-blue)" />
          <span>Gestión de Clientes ({filteredClients.length})</span>
        </div>
        <button className="btn btn-primary" onClick={onOpenNewClient}>
          <Plus size={16} />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar por Razón Social, CUIT, DNI o Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className="empty-state">
          <Users size={48} className="empty-icon" />
          <div className="empty-title">No hay clientes registrados</div>
          <p>Utiliza el botón "Nuevo Cliente" para agregar propietarios o comitentes.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Nombre / Razón Social</th>
                <th>CUIT / DNI</th>
                <th>Contacto</th>
                <th>Dirección</th>
                <th style={{ textAlign: 'center' }}>Proyectos Asignados</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(client => (
                <tr key={client.id}>
                  <td>
                    <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{client.nombre}</div>
                    {client.notas && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{client.notas}</div>}
                  </td>
                  <td>
                    <span className="badge badge-neutral">{client.dni_cuit || 'Sin CUIT/DNI'}</span>
                  </td>
                  <td>
                    {client.telefono && (
                      <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Phone size={13} color="var(--accent-amber)" />
                        {client.telefono}
                      </div>
                    )}
                    {client.email && (
                      <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)' }}>
                        <Mail size={13} color="var(--accent-blue)" />
                        {client.email}
                      </div>
                    )}
                  </td>
                  <td>
                    {client.direccion ? (
                      <span style={{ fontSize: '0.85rem' }}>📍 {client.direccion}</span>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>-</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge badge-active">
                      <Building2 size={13} style={{ marginRight: '0.25rem' }} />
                      {client.proyectos_count || 0} obras
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem' }}>
                      <button className="btn-icon-only" onClick={() => onEditClient(client)} title="Editar cliente">
                        <Edit2 size={15} />
                      </button>
                      <button className="btn-icon-only delete" onClick={() => onDeleteClient(client.id)} title="Eliminar cliente">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

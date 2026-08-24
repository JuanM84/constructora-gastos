import { useState } from 'react';
import { DollarSign, Search, Plus, Trash2, Pencil, Wallet, Calendar, Building2, Briefcase, Printer } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function IncomeTab({
  ingresos = [],
  projects = [],
  tesoreriaAccounts = [],
  onOpenNewIncome,
  onEditIncome,
  onDeleteIncome
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedProject, setSelectedProject] = useState('');

  // Filtrado dinámico
  const filteredIngresos = ingresos.filter(ing => {
    const matchesSearch = !searchTerm || 
      (ing.concepto && ing.concepto.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ing.proyecto_nombre && ing.proyecto_nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ing.cuenta_nombre && ing.cuenta_nombre.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAccount = !selectedAccount || ing.cuenta_id === parseInt(selectedAccount, 10);
    
    // Filtro por proyecto/estudio
    let matchesProject = true;
    if (selectedProject === 'estudio') {
      matchesProject = !ing.proyecto_id;
    } else if (selectedProject) {
      matchesProject = ing.proyecto_id === parseInt(selectedProject, 10);
    }

    return matchesSearch && matchesAccount && matchesProject;
  });

  const totalIngresadoARS = filteredIngresos
    .filter(i => i.moneda === 'ARS' || !i.moneda)
    .reduce((acc, curr) => acc + (curr.monto || 0), 0);

  const totalIngresadoUSD = filteredIngresos
    .filter(i => i.moneda === 'USD')
    .reduce((acc, curr) => acc + (curr.monto || 0), 0);

  const estudioIngresosCount = ingresos.filter(i => !i.proyecto_id).length;
  const obrasIngresosCount = ingresos.filter(i => i.proyecto_id).length;

  return (
    <div className="panel-card">
      
      {/* Encabezado del Panel */}
      <div className="panel-header" style={{ marginBottom: '1.25rem' }}>
        <div className="panel-title">
          <DollarSign size={24} color="var(--accent-emerald)" />
          <div>
            <span>Registro de Ingresos Varios & Servicios ({filteredIngresos.length})</span>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
              Gestión de ingresos esporádicos (asesorías, consultas, honorarios) y entregas de obras
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            className="btn btn-secondary no-print"
            onClick={() => window.print()}
            title="Imprimir listado de ingresos filtrados"
          >
            <Printer size={16} />
            <span>Imprimir</span>
          </button>

          <button 
            className="btn btn-primary" 
            style={{ background: 'linear-gradient(135deg, var(--accent-emerald), #059669)', border: 'none' }}
            onClick={onOpenNewIncome}
          >
            <Plus size={16} />
            <span>Registrar Nuevo Ingreso</span>
          </button>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input 
            type="text"
            placeholder="Buscar por concepto, cliente o cuenta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select 
          className="select-filter"
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
        >
          <option value="">Todos los Orígenes ({ingresos.length})</option>
          <option value="estudio">💼 Servicios / Estudio - Sin Obra ({estudioIngresosCount})</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>
              🏗️ Obra: {p.nombre}{p.cliente_nombre ? ` (${p.cliente_nombre})` : ''}
            </option>
          ))}
        </select>

        <select 
          className="select-filter"
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
        >
          <option value="">Todas las Cuentas</option>
          {tesoreriaAccounts.map(c => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      {/* Tira Resumen de Ingresos */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        padding: '0.85rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        marginBottom: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <DollarSign size={20} color="var(--accent-emerald)" />
          <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: '600' }}>
            Total Ingresado Acumulado (Filtro Actual):
          </span>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-emerald)', fontFamily: 'var(--font-heading)' }}>
            {formatCurrency(totalIngresadoARS)}
          </div>
          {totalIngresadoUSD > 0 && (
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--accent-amber)', fontFamily: 'var(--font-heading)' }}>
              + US$ {totalIngresadoUSD.toLocaleString('es-AR')}
            </div>
          )}
        </div>
      </div>

      {/* Tabla de Ingresos */}
      {filteredIngresos.length === 0 ? (
        <div className="empty-state" style={{ padding: '3rem' }}>
          <DollarSign size={40} className="empty-icon" style={{ color: 'var(--accent-emerald)' }} />
          <div className="empty-title">No hay ingresos registrados</div>
          <p>Utiliza el botón "Registrar Nuevo Ingreso" para cargar asesorías, consultas o cobros.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Concepto / Referencia</th>
                <th>Origen / Destino</th>
                <th>Cuenta Tesorería Acreditada</th>
                <th style={{ textAlign: 'right' }}>Monto Ingreso</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredIngresos.map(ing => {
                const isEstudio = !ing.proyecto_id;
                return (
                  <tr key={ing.id}>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {formatDate(ing.fecha)}
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-main)', display: 'block' }}>
                        {ing.concepto || 'Ingreso de Dinero'}
                      </strong>
                    </td>
                    <td>
                      {isEstudio ? (
                        <span className="badge badge-active" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}>
                          💼 Servicio Estudio / Asesoría
                        </span>
                      ) : (
                        <span className="badge badge-warning">
                          🏗️ {ing.proyecto_nombre}
                        </span>
                      )}
                    </td>
                    <td>
                      {ing.cuenta_nombre ? (
                        <span style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: '600' }}>
                          <Wallet size={13} /> {ing.cuenta_nombre}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--accent-emerald)', whiteSpace: 'nowrap', fontSize: '0.95rem' }}>
                      + {ing.moneda === 'USD' ? `US$ ${ing.monto.toLocaleString('es-AR')}` : formatCurrency(ing.monto)}
                    </td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {onEditIncome && (
                        <button 
                          className="btn-icon-only edit"
                          onClick={() => onEditIncome(ing)}
                          title="Editar ingreso"
                          style={{ marginRight: '0.35rem' }}
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      <button 
                        className="btn-icon-only delete"
                        onClick={() => onDeleteIncome(ing.id)}
                        title="Eliminar ingreso"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}

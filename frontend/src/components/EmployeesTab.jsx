import { useState } from 'react';
import { UserCheck, Search, Plus, Trash2, Edit2, Phone, Mail, FileText, Briefcase, DollarSign, Wallet, Eye } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function EmployeesTab({
  employees = [],
  onOpenNewEmployee,
  onEditEmployee,
  onDeleteEmployee,
  onOpenPaymentModal,
  onOpenAccountModal
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = employees.filter(emp => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      emp.nombre.toLowerCase().includes(term) ||
      (emp.puesto_rol && emp.puesto_rol.toLowerCase().includes(term)) ||
      (emp.dni_cuit && emp.dni_cuit.toLowerCase().includes(term)) ||
      (emp.telefono && emp.telefono.toLowerCase().includes(term))
    );
  });

  const totalPagadoTodos = employees.reduce((acc, emp) => acc + (emp.total_pagado || 0), 0);

  return (
    <div className="panel-card">
      
      {/* Encabezado del Panel */}
      <div className="panel-header" style={{ marginBottom: '1.25rem' }}>
        <div className="panel-title">
          <UserCheck size={26} color="var(--accent-blue)" />
          <div>
            <span>Personal & Empleados del Estudio ({employees.length})</span>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
              Gestión de salarios, jornales, cuenta corriente y asignación de pagos a obras (Mano de Obra - MDO)
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn btn-primary" 
            style={{ background: 'linear-gradient(135deg, var(--accent-amber), #d97706)', border: 'none' }}
            onClick={() => onOpenPaymentModal(null)}
          >
            <DollarSign size={16} />
            <span>Registrar Pago</span>
          </button>

          <button className="btn btn-primary" onClick={onOpenNewEmployee}>
            <Plus size={16} />
            <span>Nuevo Empleado</span>
          </button>
        </div>
      </div>

      {/* Barra de Búsqueda y Tira Resumen */}
      <div className="filter-bar" style={{ marginBottom: '1.25rem' }}>
        <div className="search-input-wrapper" style={{ flex: 1 }}>
          <Search size={16} className="search-icon" />
          <input 
            type="text"
            placeholder="Buscar por nombre, puesto, CUIT o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          padding: '0.6rem 1.25rem',
          borderRadius: 'var(--radius-md)'
        }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Pagado Acumulado:</span>
          <strong style={{ fontSize: '1.15rem', color: 'var(--accent-blue)', fontFamily: 'var(--font-heading)' }}>
            {formatCurrency(totalPagadoTodos)}
          </strong>
        </div>
      </div>

      {/* Lista / Grid de Empleados */}
      {filteredEmployees.length === 0 ? (
        <div className="empty-state" style={{ padding: '3rem' }}>
          <UserCheck size={44} className="empty-icon" style={{ color: 'var(--accent-blue)' }} />
          <div className="empty-title">No hay empleados registrados</div>
          <p>Utiliza el botón "Nuevo Empleado" para registrar personal del estudio u oficiales de obra.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredEmployees.map(emp => (
            <div 
              key={emp.id}
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
                transition: 'transform 0.2s ease, border-color 0.2s ease'
              }}
            >
              {/* Info Superior */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: '700' }}>
                      {emp.nombre}
                    </h3>
                    <span className="badge badge-active" style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-blue)', marginTop: '0.35rem' }}>
                      💼 {emp.puesto_rol || 'Personal General'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button 
                      className="btn-icon-only edit" 
                      onClick={() => onEditEmployee(emp)}
                      title="Editar empleado"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      className="btn-icon-only delete" 
                      onClick={() => onDeleteEmployee(emp.id)}
                      title="Eliminar empleado"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Detalles de contacto */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                  {emp.dni_cuit && <div>📄 DNI/CUIT: <strong>{emp.dni_cuit}</strong></div>}
                  {emp.telefono && <div>📞 Tel: <strong>{emp.telefono}</strong></div>}
                  {emp.email && <div>✉️ Email: <strong>{emp.email}</strong></div>}
                  {emp.salario_base > 0 && (
                    <div style={{ color: 'var(--text-main)', marginTop: '0.2rem' }}>
                      💵 Sueldo Base: <strong>{formatCurrency(emp.salario_base)}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer de Tarjeta con Total Pagado y Botones de Acción */}
              <div style={{
                borderTop: '1px solid var(--border-color)',
                paddingTop: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Pagado</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--accent-rose)', fontFamily: 'var(--font-heading)' }}>
                    {formatCurrency(emp.total_pagado || 0)}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
                    onClick={() => onOpenAccountModal(emp.id)}
                    title="Ver Cuenta Corriente e Historial"
                  >
                    <Eye size={14} />
                    <span>Cta Cte</span>
                  </button>

                  <button 
                    className="btn btn-primary"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem', background: 'linear-gradient(135deg, var(--accent-amber), #d97706)', border: 'none' }}
                    onClick={() => onOpenPaymentModal(emp.id)}
                    title="Registrar Pago"
                  >
                    <DollarSign size={14} />
                    <span>Pagar</span>
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}

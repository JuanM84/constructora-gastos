import { useState, useEffect, useCallback } from 'react';
import { X, DollarSign, Wallet, Calendar, HardHat, Briefcase, Trash2, Plus, User, FileText } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

const API_BASE = 'http://localhost:3005/api';

export default function EmployeeAccountModal({
  isOpen,
  onClose,
  employeeId,
  onOpenPayment,
  onDeletePayment
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCuentaCorriente = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/empleados/${employeeId}/cuenta-corriente`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error cargando cuenta corriente:', err);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    if (isOpen && employeeId) {
      fetchCuentaCorriente();
    }
  }, [isOpen, employeeId, fetchCuentaCorriente]);

  if (!isOpen) return null;

  const empleado = data?.empleado;
  const pagos = data?.pagos || [];

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: '850px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <User size={24} color="var(--accent-blue)" />
            <div>
              <h3 className="modal-title">
                Cuenta Corriente: {empleado?.nombre || 'Cargando...'}
              </h3>
              {empleado?.puesto_rol && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Puesto / Rol: <strong>{empleado.puesto_rol}</strong>
                </div>
              )}
            </div>
          </div>
          <button className="btn-icon-only" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {loading && !data ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Cargando historial de cuenta corriente...
            </div>
          ) : (
            <>
              {/* Tarjeta Resumen */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Total Pagado Acumulado
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent-blue)', fontFamily: 'var(--font-heading)' }}>
                    {formatCurrency(empleado?.total_pagado || 0)}
                  </div>
                </div>

                {empleado?.salario_base > 0 && (
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Sueldo / Honorario Base
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>
                      {formatCurrency(empleado.salario_base)}
                    </div>
                  </div>
                )}

                <button 
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, var(--accent-amber), #d97706)', border: 'none' }}
                  onClick={() => {
                    onClose();
                    onOpenPayment(employeeId);
                  }}
                >
                  <Plus size={16} />
                  <span>Registrar Pago</span>
                </button>
              </div>

              {/* Tabla de Pagos */}
              <div style={{ marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                Historial de Pagos & Liquidaciones ({pagos.length})
              </div>

              {pagos.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <DollarSign size={36} className="empty-icon" style={{ color: 'var(--text-muted)' }} />
                  <div className="empty-title">Sin pagos registrados</div>
                  <p>No se registran egresos ni liquidaciones realizadas a este empleado.</p>
                </div>
              ) : (
                <div className="table-responsive" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Concepto / Detalle</th>
                        <th>Imputación</th>
                        <th>Cuenta Pagadora</th>
                        <th style={{ textAlign: 'right' }}>Monto Pagado</th>
                        <th style={{ textAlign: 'center' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagos.map(pago => (
                        <tr key={pago.id}>
                          <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {formatDate(pago.fecha)}
                          </td>
                          <td>
                            <strong style={{ color: 'var(--text-main)' }}>{pago.concepto}</strong>
                          </td>
                          <td>
                            {pago.proyecto_id ? (
                              <span className="badge badge-warning">
                                🏗️ {pago.proyecto_nombre}{pago.etapa_nombre ? ` (${pago.etapa_nombre})` : ''} (MDO)
                              </span>
                            ) : (
                              <span className="badge badge-purple">
                                💼 Sueldos / Estudio
                              </span>
                            )}
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', fontWeight: '600' }}>
                            {pago.cuenta_nombre || '-'}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--accent-rose)', whiteSpace: 'nowrap' }}>
                            - {formatCurrency(pago.monto)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              className="btn-icon-only delete"
                              onClick={async () => {
                                await onDeletePayment(pago.id);
                                fetchCuentaCorriente();
                              }}
                              title="Eliminar registro de pago y reintegrar saldo"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}

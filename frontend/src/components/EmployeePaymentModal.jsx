import { useState, useEffect } from 'react';
import { X, DollarSign, Wallet, Calendar, Building2, UserCheck, HardHat } from 'lucide-react';
import { API_BASE } from '../config';

export default function EmployeePaymentModal({
  isOpen,
  onClose,
  onSave,
  employees = [],
  projects = [],
  tesoreriaAccounts = [],
  selectedEmployeeId = null
}) {
  const [employeeId, setEmployeeId] = useState(selectedEmployeeId ? selectedEmployeeId.toString() : '');
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');
  const [proyectoId, setProyectoId] = useState('');
  const [etapaId, setEtapaId] = useState('');
  const [etapas, setEtapas] = useState([]);
  const [loadingEtapas, setLoadingEtapas] = useState(false);
  const [cuentaId, setCuentaId] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setEmployeeId(selectedEmployeeId ? selectedEmployeeId.toString() : (employees[0]?.id?.toString() || ''));
      setMonto('');
      setConcepto('');
      setProyectoId('');
      setEtapaId('');
      setEtapas([]);
      setFecha(new Date().toISOString().split('T')[0]);
      setErrorMsg('');

      // Auto-seleccionar primera cuenta de pesaje de tesorería
      const firstAccount = tesoreriaAccounts.find(c => c.moneda === 'ARS');
      if (firstAccount) {
        setCuentaId(firstAccount.id.toString());
      } else if (tesoreriaAccounts.length > 0) {
        setCuentaId(tesoreriaAccounts[0].id.toString());
      }
    }
  }, [isOpen, selectedEmployeeId, employees, tesoreriaAccounts]);

  useEffect(() => {
    if (proyectoId) {
      setLoadingEtapas(true);
      fetch(`${API_BASE}/proyectos/${proyectoId}/detalle`)
        .then(res => res.json())
        .then(data => {
          setEtapas(data.etapas || []);
        })
        .catch(err => console.error('Error al cargar etapas del proyecto:', err))
        .finally(() => setLoadingEtapas(false));
    } else {
      setEtapas([]);
      setEtapaId('');
    }
  }, [proyectoId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!employeeId) {
      setErrorMsg('Selecciona un empleado para registrar el pago.');
      return;
    }

    const numMonto = parseFloat(monto);
    if (isNaN(numMonto) || numMonto <= 0) {
      setErrorMsg('Ingresa un monto válido mayor a 0.');
      return;
    }

    if (!concepto || !concepto.trim()) {
      setErrorMsg('Por favor ingresa un concepto o detalle del pago.');
      return;
    }

    if (!cuentaId) {
      setErrorMsg('Selecciona una cuenta de tesorería de donde sale el dinero.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        empleado_id: parseInt(employeeId, 10),
        monto: numMonto,
        concepto: concepto.trim(),
        proyecto_id: proyectoId ? parseInt(proyectoId, 10) : null,
        etapa_id: (proyectoId && etapaId) ? parseInt(etapaId, 10) : null,
        cuenta_id: parseInt(cuentaId, 10),
        fecha
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error al procesar el pago al empleado.');
    } finally {
      setLoading(false);
    }
  };

  const selectedEmp = employees.find(e => e.id === parseInt(employeeId, 10));

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <DollarSign size={24} color="var(--accent-amber)" />
            <h3 className="modal-title">Registrar Pago a Empleado / Sueldo</h3>
          </div>
          <button className="btn-icon-only" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            
            {errorMsg && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: 'var(--accent-rose)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                marginBottom: '1rem'
              }}>
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Seleccionar Empleado */}
            <div className="form-group">
              <label className="form-label">Empleado / Personal Recepto *</label>
              <select
                className="form-control"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              >
                <option value="">-- Seleccionar Empleado --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre} {emp.puesto_rol ? `(${emp.puesto_rol})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Concepto / Descripción */}
            <div className="form-group">
              <label className="form-label">Detalle / Concepto del Pago *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej: Quincena 1 Agosto, Adelanto Mano de Obra, Jornales..."
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
              />
            </div>

            {/* Asignar a Proyecto (Opcional - MDO) */}
            <div className="form-group">
              <label className="form-label">Asignar a Proyecto (Imputable a Obra como MDO)</label>
              <select
                className="form-control"
                value={proyectoId}
                onChange={(e) => setProyectoId(e.target.value)}
              >
                <option value="">💼 Ninguno - Gasto General del Estudio (Sueldos)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    🏗️ {p.nombre} (Se descontará como Mano de Obra MDO)
                  </option>
                ))}
              </select>

              {proyectoId && (
                <div style={{ marginTop: '0.75rem' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>Etapa de la Obra (Opcional)</label>
                  <select
                    className="form-control"
                    value={etapaId}
                    onChange={(e) => setEtapaId(e.target.value)}
                    disabled={loadingEtapas}
                  >
                    <option value="">-- Toda la Obra / Sin Etapa Específica --</option>
                    {etapas.map(et => (
                      <option key={et.id} value={et.id}>
                        📐 {et.nombre} ({et.estado})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                💡 Si eliges un proyecto, el pago se computará automáticamente como gasto de obra bajo la categoría <strong>Mano de Obra (MDO)</strong>.
              </div>
            </div>

            {/* Monto & Cuenta Tesorería */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Monto a Pagar ($) *</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  placeholder="0.00"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                />
                {monto && !isNaN(parseFloat(monto)) && parseFloat(monto) > 0 && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-amber)', marginTop: '0.35rem', fontWeight: '600' }}>
                    💵 Vista previa: $ {parseFloat(monto).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Fecha del Pago</label>
                <input
                  type="date"
                  className="form-control"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>
            </div>

            {/* Cuenta Tesorería Pagadora */}
            <div className="form-group">
              <label className="form-label">Cuenta de Tesorería Pagadora (Egreso) *</label>
              <select
                className="form-control"
                value={cuentaId}
                onChange={(e) => setCuentaId(e.target.value)}
              >
                {tesoreriaAccounts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} (Saldo: {c.moneda === 'USD' ? `US$ ${parseFloat(c.saldo || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$ ${parseFloat(c.saldo || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`})
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, var(--accent-amber), #d97706)', border: 'none' }}
              disabled={loading}
            >
              <DollarSign size={16} />
              <span>{loading ? 'Procesando...' : 'Registrar Pago'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { X, DollarSign, Wallet, Calendar, FileText, Building2 } from 'lucide-react';
import CurrencyInput from './CurrencyInput';

export default function NewIncomeModal({
  isOpen,
  onClose,
  onSave,
  projects = [],
  tesoreriaAccounts = [],
  defaultProjectId = null,
  incomeToEdit = null
}) {
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [moneda, setMoneda] = useState('ARS');
  const [tipoOrigen, setTipoOrigen] = useState('estudio'); // 'estudio' | 'proyecto'
  const [proyectoId, setProyectoId] = useState(defaultProjectId || '');
  const [cuentaId, setCuentaId] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (incomeToEdit) {
        setConcepto(incomeToEdit.concepto || '');
        setMonto(incomeToEdit.monto ? incomeToEdit.monto.toString() : '');
        setMoneda(incomeToEdit.moneda || 'ARS');
        setTipoOrigen(incomeToEdit.proyecto_id ? 'proyecto' : 'estudio');
        setProyectoId(incomeToEdit.proyecto_id ? incomeToEdit.proyecto_id.toString() : (defaultProjectId ? defaultProjectId.toString() : ''));
        setCuentaId(incomeToEdit.cuenta_id ? incomeToEdit.cuenta_id.toString() : '');
        setFecha(incomeToEdit.fecha ? incomeToEdit.fecha.split('T')[0] : new Date().toISOString().split('T')[0]);
        setErrorMsg('');
      } else {
        setConcepto('');
        setMonto('');
        setMoneda('ARS');
        setTipoOrigen(defaultProjectId ? 'proyecto' : 'estudio');
        setProyectoId(defaultProjectId ? defaultProjectId.toString() : '');
        setFecha(new Date().toISOString().split('T')[0]);
        setErrorMsg('');

        // Auto-seleccionar primera cuenta de tesorería compatible
        const firstAccount = tesoreriaAccounts.find(c => c.moneda === 'ARS');
        if (firstAccount) {
          setCuentaId(firstAccount.id.toString());
        } else if (tesoreriaAccounts.length > 0) {
          setCuentaId(tesoreriaAccounts[0].id.toString());
        }
      }
    }
  }, [isOpen, defaultProjectId, tesoreriaAccounts, incomeToEdit]);

  // Actualizar cuenta por defecto si cambia la moneda
  useEffect(() => {
    const matchedAccount = tesoreriaAccounts.find(c => c.moneda === moneda);
    if (matchedAccount) {
      setCuentaId(matchedAccount.id.toString());
    }
  }, [moneda, tesoreriaAccounts]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!concepto || !concepto.trim()) {
      setErrorMsg('Por favor ingresa un concepto o descripción del ingreso.');
      return;
    }

    const numMonto = parseFloat(monto);
    if (isNaN(numMonto) || numMonto <= 0) {
      setErrorMsg('Ingresa un monto válido mayor a 0.');
      return;
    }

    if (!cuentaId) {
      setErrorMsg('Selecciona una cuenta de tesorería para acreditar el dinero.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        id: incomeToEdit ? incomeToEdit.id : undefined,
        concepto: concepto.trim(),
        monto: numMonto,
        moneda,
        cuenta_id: parseInt(cuentaId, 10),
        proyecto_id: tipoOrigen === 'proyecto' && proyectoId ? parseInt(proyectoId, 10) : null,
        es_ingreso_estudio: tipoOrigen === 'estudio',
        fecha
      });
      onClose();
    } catch (err) {
      console.error('Error guardando ingreso:', err);
      setErrorMsg(err.message || 'Error al guardar el ingreso.');
    } finally {
      setLoading(false);
    }
  };

  const availableAccounts = tesoreriaAccounts.filter(c => c.moneda === moneda);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <DollarSign size={24} color="var(--accent-emerald)" />
            <h3 className="modal-title">{incomeToEdit ? 'Editar Ingreso de Dinero' : 'Registrar Ingreso de Dinero'}</h3>
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

            {/* Concepto / Descripción */}
            <div className="form-group">
              <label className="form-label">Concepto / Descripción del Ingreso *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: Asesoría Técnica, Consulta de Arquitectura, Venta Servicio..."
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* Tipo de Origen */}
            <div className="form-group">
              <label className="form-label">Origen / Tipo de Ingreso</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setTipoOrigen('estudio')}
                  style={{
                    flex: 1,
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-md)',
                    border: tipoOrigen === 'estudio' ? '1px solid var(--accent-emerald)' : '1px solid var(--border-color)',
                    background: tipoOrigen === 'estudio' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                    color: tipoOrigen === 'estudio' ? 'var(--accent-emerald)' : 'var(--text-muted)',
                    fontWeight: tipoOrigen === 'estudio' ? '700' : '500',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  💼 Servicios / Estudio (Sin Obra)
                </button>

                <button
                  type="button"
                  onClick={() => setTipoOrigen('proyecto')}
                  style={{
                    flex: 1,
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-md)',
                    border: tipoOrigen === 'proyecto' ? '1px solid var(--accent-amber)' : '1px solid var(--border-color)',
                    background: tipoOrigen === 'proyecto' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                    color: tipoOrigen === 'proyecto' ? 'var(--accent-amber)' : 'var(--text-muted)',
                    fontWeight: tipoOrigen === 'proyecto' ? '700' : '500',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  🏗️ Cobro de Proyecto / Obra
                </button>
              </div>
            </div>

            {/* Seleccionar Proyecto (si aplica) */}
            {tipoOrigen === 'proyecto' && (
              <div className="form-group">
                <label className="form-label">Proyecto / Obra Asociado</label>
                <select
                  className="form-control"
                  value={proyectoId}
                  onChange={(e) => setProyectoId(e.target.value)}
                >
                  <option value="">-- Seleccionar Proyecto --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}{p.cliente_nombre ? ` (${p.cliente_nombre})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Cuenta Tesorería Acreditada */}
            <div className="form-group" style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <label className="form-label" style={{ color: 'var(--accent-emerald)', fontWeight: '700' }}>
                🏦 Cuenta Tesorería Acreditada *
              </label>
              <select
                className="form-control"
                value={cuentaId}
                onChange={(e) => {
                  const val = e.target.value;
                  setCuentaId(val);
                  if (val) {
                    const acc = tesoreriaAccounts.find(a => a.id === parseInt(val, 10));
                    if (acc) {
                      const cLower = (acc.nombre || '').toLowerCase();
                      const isUSD = acc.moneda === 'USD' || acc.tipo === 'efectivo_usd' || cLower.includes('usd') || cLower.includes('dolar') || cLower.includes('dólar');
                      setMoneda(isUSD ? 'USD' : 'ARS');
                    }
                  }
                }}
              >
                <option value="">-- Seleccionar cuenta --</option>
                {tesoreriaAccounts.map(c => {
                  const cLower = (c.nombre || '').toLowerCase();
                  const isUSD = c.moneda === 'USD' || c.tipo === 'efectivo_usd' || cLower.includes('usd') || cLower.includes('dolar') || cLower.includes('dólar');
                  return (
                    <option key={c.id} value={c.id}>
                      {c.nombre} (Saldo actual: {isUSD ? `US$ ${parseFloat(c.saldo || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$ ${parseFloat(c.saldo || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Monto */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Monto del Ingreso *</span>
                <span className={`badge ${moneda === 'USD' ? 'badge-emerald' : 'badge-neutral'}`} style={{ fontSize: '0.75rem' }}>
                  {moneda === 'USD' ? '💵 Dólares (US$)' : '🇦🇷 Pesos ($)'}
                </span>
              </label>
              <CurrencyInput
                value={monto}
                onChange={(val) => setMonto(val)}
                placeholder="0,00"
                currencySymbol={moneda === 'USD' ? 'US$' : '$'}
                required
              />
            </div>

            {/* Fecha */}
            <div className="form-group">
              <label className="form-label">Fecha del Ingreso</label>
              <input
                type="date"
                className="form-control"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
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
              style={{ background: 'linear-gradient(135deg, var(--accent-emerald), #059669)', border: 'none' }}
              disabled={loading}
            >
              <DollarSign size={16} />
              <span>{loading ? 'Guardando...' : (incomeToEdit ? 'Guardar Cambios' : 'Registrar Ingreso')}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { X, DollarSign } from 'lucide-react';
import CurrencyInput from './CurrencyInput';

export default function IngresoClienteModal({ isOpen, onClose, onSave, etapas = [], tesoreriaAccounts = [] }) {
  const [etapaId, setEtapaId] = useState('');
  const [monto, setMonto] = useState('');
  const [moneda, setMoneda] = useState('ARS');
  const [medioPago, setMedioPago] = useState('banco_ars');
  const [cuentaId, setCuentaId] = useState('');
  const [fecha, setFecha] = useState('');
  const [concepto, setConcepto] = useState('');
  const [comprobanteUrl, setComprobanteUrl] = useState('');

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (isOpen) {
      setEtapaId('');
      setMonto('');
      setMoneda('ARS');
      setMedioPago('banco_ars');
      setCuentaId(tesoreriaAccounts.length > 0 ? tesoreriaAccounts[0].id : '');
      setFecha(new Date().toISOString().split('T')[0]);
      setConcepto('');
      setComprobanteUrl('');
    }
  }, [isOpen, tesoreriaAccounts]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!monto || parseFloat(monto) <= 0) return;

    onSave({
      etapa_id: etapaId ? parseInt(etapaId, 10) : null,
      monto: parseFloat(monto),
      moneda,
      medio_pago: medioPago,
      cuenta_id: cuentaId ? parseInt(cuentaId, 10) : null,
      fecha,
      concepto: concepto.trim() || 'Entrega de dinero del cliente',
      comprobante_url: comprobanteUrl.trim()
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={20} color="var(--accent-emerald)" />
            <span>Registrar Entrega de Dinero del Cliente</span>
          </div>
          <button className="btn-icon-only" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Etapa Asignada */}
            <div className="form-group">
              <label className="form-label">Etapa / Fase a Imputar (Opcional)</label>
              <select 
                className="form-control"
                value={etapaId}
                onChange={(e) => setEtapaId(e.target.value)}
              >
                <option value="">-- Toda la Obra (Anticipo / General) --</option>
                {etapas.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.nombre} (${e.presupuesto ? e.presupuesto.toLocaleString('es-AR') : 0})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Monto de la Entrega *</span>
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

            {/* Medio de Pago y Cuenta de Tesorería */}
            <div className="form-group" style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <label className="form-label" style={{ color: 'var(--accent-emerald)', fontWeight: '700' }}>
                🏦 Acreditar en Cuenta de Tesorería (Suma Saldo)
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
                      if (isUSD) {
                        setMoneda('USD');
                        setMedioPago('efectivo_usd');
                      } else {
                        setMoneda('ARS');
                        setMedioPago('banco_ars');
                      }
                    }
                  }
                }}
              >
                <option value="">-- Sin ingresar a caja/banco --</option>
                {tesoreriaAccounts
                  .map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.nombre} ({acc.moneda === 'USD' || acc.tipo === 'efectivo_usd' || (acc.nombre || '').toLowerCase().includes('dolar') || (acc.nombre || '').toLowerCase().includes('dólar') ? `US$ ${acc.saldo}` : `$ ${acc.saldo}`})
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Concepto / Referencia del Cobro *</label>
              <textarea 
                className="form-control"
                rows="2"
                placeholder="Ej. Anticipo por firma de contrato / Pago de cuota 2 según certificación..."
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                required
              ></textarea>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Fecha de Cobro *</label>
                <input 
                  type="date" 
                  className="form-control"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">URL del Comprobante / Recibo</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej. https://drive.google.com/recibo-123.pdf"
                  value={comprobanteUrl}
                  onChange={(e) => setComprobanteUrl(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, var(--accent-emerald), #059669)' }}>
              Registrar Cobro / Entrega
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { X, Wallet } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import CurrencyInput from './CurrencyInput';

export default function TesoreriaModal({ isOpen, onClose, tesoreriaAccounts, onUpdateBalance }) {
  const [selectedCuentaId, setSelectedCuentaId] = useState(tesoreriaAccounts[0]?.id || '');
  const [nuevoSaldo, setNuevoSaldo] = useState('');
  const [concepto, setConcepto] = useState('');

  if (!isOpen) return null;

  const currentCuenta = tesoreriaAccounts.find(c => c.id === parseInt(selectedCuentaId, 10)) || tesoreriaAccounts[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedCuentaId || nuevoSaldo === '') return;

    onUpdateBalance({
      cuentaId: parseInt(selectedCuentaId, 10),
      saldo: parseFloat(nuevoSaldo),
      concepto: concepto.trim() || 'Ajuste manual de saldo en tesorería'
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wallet size={20} color="var(--accent-emerald)" />
            <span>Ajuste & Carga de Tesorería</span>
          </div>
          <button className="btn-icon-only" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Seleccionar Cuenta a Ajustar *</label>
              <select 
                className="form-control"
                value={selectedCuentaId}
                onChange={(e) => {
                  setSelectedCuentaId(e.target.value);
                  const acc = tesoreriaAccounts.find(c => c.id === parseInt(e.target.value, 10));
                  if (acc) setNuevoSaldo(acc.saldo);
                }}
              >
                {tesoreriaAccounts.map(cuenta => (
                  <option key={cuenta.id} value={cuenta.id}>
                    {cuenta.nombre} (Actual: {cuenta.moneda === 'USD' ? `US$ ${cuenta.saldo}` : formatCurrency(cuenta.saldo)})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Nuevo Saldo Total ({currentCuenta?.moneda || 'ARS'}) *</label>
              <CurrencyInput 
                value={nuevoSaldo}
                onChange={(val) => setNuevoSaldo(val)}
                placeholder="0,00"
                currencySymbol={currentCuenta?.moneda === 'USD' ? 'US$' : '$'}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Motivo / Concepto del Ajuste</label>
              <input 
                type="text" 
                className="form-control"
                placeholder="Ej. Depósito inicial, ingreso de capital, arqueo de caja..."
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, var(--accent-emerald), #059669)' }}>
              Actualizar Saldo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

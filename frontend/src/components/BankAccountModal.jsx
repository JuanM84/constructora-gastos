import { useState, useEffect } from 'react';
import { X, Building2 } from 'lucide-react';
import CurrencyInput from './CurrencyInput';

export default function BankAccountModal({ isOpen, onClose, onSave, accountToEdit }) {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('banco_ars');
  const [bancoNombre, setBancoNombre] = useState('');
  const [numeroCuentaCbu, setNumeroCuentaCbu] = useState('');
  const [saldo, setSaldo] = useState('');
  const [moneda, setMoneda] = useState('ARS');

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (accountToEdit) {
      setNombre(accountToEdit.nombre || '');
      setTipo(accountToEdit.tipo || 'banco_ars');
      setBancoNombre(accountToEdit.banco_nombre || '');
      setNumeroCuentaCbu(accountToEdit.numero_cuenta_cbu || '');
      setSaldo(accountToEdit.saldo !== undefined ? accountToEdit.saldo : '');
      setMoneda(accountToEdit.moneda || 'ARS');
    } else {
      setNombre('');
      setTipo('banco_ars');
      setBancoNombre('');
      setNumeroCuentaCbu('');
      setSaldo('0');
      setMoneda('ARS');
    }
  }, [accountToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    onSave({
      id: accountToEdit?.id,
      nombre: nombre.trim(),
      tipo,
      banco_nombre: bancoNombre.trim(),
      numero_cuenta_cbu: numeroCuentaCbu.trim(),
      saldo: parseFloat(saldo) || 0,
      moneda
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={20} color="var(--accent-blue)" />
            <span>{accountToEdit ? 'Editar Cuenta Bancaria / Caja' : 'Nueva Cuenta Bancaria o Tesorería'}</span>
          </div>
          <button className="btn-icon-only" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Nombre de Identificación de la Cuenta *</label>
              <input 
                type="text" 
                className="form-control"
                placeholder="Ej. Banco Galicia Cuenta Corriente ARS"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tipo de Cuenta *</label>
                <select 
                  className="form-control"
                  value={tipo}
                  onChange={(e) => {
                    setTipo(e.target.value);
                    if (e.target.value.includes('usd')) setMoneda('USD');
                    else setMoneda('ARS');
                  }}
                >
                  <option value="banco_ars">🏦 Cuenta Bancaria (Pesos ARS)</option>
                  <option value="banco_usd">🏦 Cuenta Bancaria (Dólares USD)</option>
                  <option value="efectivo_ars">💵 Caja / Efectivo (Pesos ARS)</option>
                  <option value="efectivo_usd">💵 Caja / Efectivo (Dólares USD)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Moneda *</label>
                <select 
                  className="form-control"
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value)}
                >
                  <option value="ARS">Pesos (ARS $)</option>
                  <option value="USD">Dólares (USD US$)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Entidad / Banco / Nombre Comercial</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej. Banco Galicia / Mercado Pago / Caja Chica"
                  value={bancoNombre}
                  onChange={(e) => setBancoNombre(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">CBU / CVU / N° de Cuenta (Opcional)</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej. 0070123400001234567890"
                  value={numeroCuentaCbu}
                  onChange={(e) => setNumeroCuentaCbu(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{accountToEdit ? 'Saldo Actual ($)' : 'Saldo Inicial ($) *'}</label>
              <CurrencyInput 
                value={saldo}
                onChange={(val) => setSaldo(val)}
                placeholder="0,00"
                currencySymbol={moneda === 'USD' ? 'US$' : '$'}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, var(--accent-blue), #2563eb)' }}>
              {accountToEdit ? 'Guardar Cambios' : 'Crear Cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

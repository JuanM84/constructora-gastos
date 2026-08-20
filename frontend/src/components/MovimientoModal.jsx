import { useState, useEffect } from 'react';
import { X, ArrowLeftRight, Landmark, Banknote, RefreshCw, Plus, Trash2, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import CurrencyInput from './CurrencyInput';
import { formatCurrency } from '../utils/formatters';

export default function MovimientoModal({ isOpen, onClose, onSave, onSaveCambio, tesoreriaAccounts = [] }) {
  const [tipoPreset, setTipoPreset] = useState('transferencia'); // 'transferencia', 'deposito', 'extraccion', 'cambio'

  // Estados para Movimiento Simple (Transferencia, Depósito, Extracción)
  const [cuentaOrigenId, setCuentaOrigenId] = useState('');
  const [cuentaDestinoId, setCuentaDestinoId] = useState('');
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');
  const [fecha, setFecha] = useState('');

  // Estados para Cambio de Moneda (USD -> ARS)
  const [cuentaOrigenUSDId, setCuentaOrigenUSDId] = useState('');
  const [montoUSD, setMontoUSD] = useState('');
  const [cotizacion, setCotizacion] = useState('');
  const [distribucion, setDistribucion] = useState([
    { cuenta_id: '', monto_ars: '', referencia: '' }
  ]);

  const usdAccounts = tesoreriaAccounts.filter(a => a.moneda === 'USD');
  const arsAccounts = tesoreriaAccounts.filter(a => a.moneda === 'ARS');

  const isOrigenAllowed = (acc) => {
    if (tipoPreset === 'transferencia') return acc.tipo.startsWith('banco');
    if (tipoPreset === 'deposito') return acc.tipo === 'efectivo_ars';
    if (tipoPreset === 'extraccion') return acc.tipo.startsWith('banco');
    return true;
  };

  const isDestinoAllowed = (acc) => {
    if (tipoPreset === 'transferencia') return acc.tipo.startsWith('banco');
    if (tipoPreset === 'deposito') return acc.tipo.startsWith('banco');
    if (tipoPreset === 'extraccion') return acc.tipo === 'efectivo_ars';
    return true;
  };

  const handleSelectPreset = (preset) => {
    setTipoPreset(preset);
    if (!tesoreriaAccounts || tesoreriaAccounts.length === 0) return;

    const bancoCuentas = tesoreriaAccounts.filter(a => a.tipo.startsWith('banco'));
    const efectPesos = tesoreriaAccounts.find(a => a.tipo === 'efectivo_ars');
    const efectUSD = tesoreriaAccounts.find(a => a.tipo === 'efectivo_usd') || usdAccounts[0];

    if (preset === 'deposito') {
      const orig = efectPesos || tesoreriaAccounts[0];
      const dest = bancoCuentas.length > 0 ? bancoCuentas[0] : tesoreriaAccounts[0];
      setCuentaOrigenId(String(orig.id));
      setCuentaDestinoId(String(dest.id));
      setConcepto('Depósito de efectivo en cuenta bancaria');
    } else if (preset === 'extraccion') {
      const orig = bancoCuentas.length > 0 ? bancoCuentas[0] : tesoreriaAccounts[0];
      const dest = efectPesos || tesoreriaAccounts[0];
      setCuentaOrigenId(String(orig.id));
      setCuentaDestinoId(String(dest.id));
      setConcepto('Extracción de dinero de banco para caja chica');
    } else if (preset === 'transferencia') {
      const orig = bancoCuentas.length > 0 ? bancoCuentas[0] : tesoreriaAccounts[0];
      const dest = bancoCuentas.length > 1 ? bancoCuentas[1] : (bancoCuentas[0] || tesoreriaAccounts[0]);
      setCuentaOrigenId(String(orig.id));
      setCuentaDestinoId(String(dest.id));
      setConcepto('Transferencia bancaria entre cuentas');
    } else if (preset === 'cambio') {
      if (efectUSD) setCuentaOrigenUSDId(String(efectUSD.id));
      const defaultARS = arsAccounts.length > 0 ? String(arsAccounts[0].id) : '';
      setDistribucion([
        { cuenta_id: defaultARS, monto_ars: '', referencia: '' }
      ]);
    }
  };

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (isOpen) {
      setMonto('');
      setMontoUSD('');
      setCotizacion('');
      setConcepto('');
      setFecha(new Date().toISOString().split('T')[0]);
      handleSelectPreset('transferencia');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tesoreriaAccounts]);

  if (!isOpen) return null;

  const cuentaOrigen = tesoreriaAccounts.find(a => String(a.id) === String(cuentaOrigenId));
  const cuentaDestino = tesoreriaAccounts.find(a => String(a.id) === String(cuentaDestinoId));
  const cuentaOrigenUSD = tesoreriaAccounts.find(a => String(a.id) === String(cuentaOrigenUSDId));

  // Cálculos para Cambio de Moneda
  const montoUsdNum = parseFloat(montoUSD) || 0;
  const cotizNum = parseFloat(cotizacion) || 0;
  const totalArsCalculado = montoUsdNum * cotizNum;
  const totalArsAsignado = distribucion.reduce((acc, item) => acc + (parseFloat(item.monto_ars) || 0), 0);
  const diferenciaARS = totalArsCalculado - totalArsAsignado;
  const isDistribucionValida = totalArsCalculado > 0 && Math.abs(diferenciaARS) < 0.05 && distribucion.every(d => d.cuenta_id && parseFloat(d.monto_ars) > 0);

  // Manejo de filas de distribución en Cambio de Moneda
  const handleAddDistribucionRow = () => {
    const defaultAccId = arsAccounts.length > 0 ? String(arsAccounts[0].id) : '';
    setDistribucion([...distribucion, { cuenta_id: defaultAccId, monto_ars: '', referencia: '' }]);
  };

  const handleRemoveDistribucionRow = (index) => {
    if (distribucion.length <= 1) return;
    const newDist = [...distribucion];
    newDist.splice(index, 1);
    setDistribucion(newDist);
  };

  const handleUpdateDistribucionRow = (index, field, value) => {
    const newDist = [...distribucion];
    newDist[index][field] = value;
    setDistribucion(newDist);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (tipoPreset === 'cambio') {
      if (!cuentaOrigenUSDId) {
        alert('Debes seleccionar la cuenta origen en USD.');
        return;
      }
      if (montoUsdNum <= 0) {
        alert('Ingresa una cantidad válida de Dólares a cambiar.');
        return;
      }
      if (cotizNum <= 0) {
        alert('Ingresa una cotización válida por Dólar.');
        return;
      }
      if (distribucion.some(d => !d.cuenta_id || !parseFloat(d.monto_ars))) {
        alert('Por favor completa la cuenta y el monto en cada fila de destino.');
        return;
      }
      if (Math.abs(diferenciaARS) >= 0.05) {
        alert(`La suma asignada ($ ${totalArsAsignado.toLocaleString('es-AR')}) debe ser idéntica al total de la venta ($ ${totalArsCalculado.toLocaleString('es-AR')}). Diferencia: $ ${diferenciaARS.toLocaleString('es-AR')}`);
        return;
      }

      onSaveCambio({
        cuenta_origen_id: parseInt(cuentaOrigenUSDId, 10),
        monto_usd: montoUsdNum,
        cotizacion: cotizNum,
        distribucion: distribucion.map(d => ({
          cuenta_id: parseInt(d.cuenta_id, 10),
          monto_ars: parseFloat(d.monto_ars),
          referencia: d.referencia
        })),
        fecha
      });
      return;
    }

    // Movimiento Simple (Transferencia, Depósito, Extracción)
    if (!cuentaOrigenId || !cuentaDestinoId) {
      alert('Debes seleccionar una cuenta de origen y una de destino.');
      return;
    }
    if (cuentaOrigenId === cuentaDestinoId) {
      alert('La cuenta de origen y de destino deben ser diferentes.');
      return;
    }
    if (!monto || parseFloat(monto) <= 0) {
      alert('Por favor ingresa un monto válido a transferir.');
      return;
    }

    onSave({
      cuenta_origen_id: parseInt(cuentaOrigenId, 10),
      cuenta_destino_id: parseInt(cuentaDestinoId, 10),
      monto: parseFloat(monto),
      concepto: concepto.trim() || 'Movimiento entre cuentas',
      fecha
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: tipoPreset === 'cambio' ? '750px' : '620px', transition: 'all 0.2s ease' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {tipoPreset === 'cambio' ? <RefreshCw size={20} color="var(--accent-amber)" /> : <ArrowLeftRight size={20} color="var(--accent-emerald)" />}
            <span>Registrar Movimiento de Tesorería</span>
          </div>
          <button className="btn-icon-only" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Presets / Selector de Tipo de Operación */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '700', textTransform: 'uppercase' }}>
                Tipo de Operación de Tesorería:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('transferencia')}
                  style={{
                    padding: '0.6rem 0.3rem',
                    borderRadius: 'var(--radius-sm)',
                    border: tipoPreset === 'transferencia' ? '1px solid var(--accent-emerald)' : '1px solid var(--border-light)',
                    background: tipoPreset === 'transferencia' ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
                    color: tipoPreset === 'transferencia' ? 'var(--accent-emerald)' : 'var(--text-muted)',
                    fontWeight: tipoPreset === 'transferencia' ? '700' : '400',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.2rem'
                  }}
                >
                  <ArrowLeftRight size={15} />
                  <span>Transferencia</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset('deposito')}
                  style={{
                    padding: '0.6rem 0.3rem',
                    borderRadius: 'var(--radius-sm)',
                    border: tipoPreset === 'deposito' ? '1px solid var(--accent-blue)' : '1px solid var(--border-light)',
                    background: tipoPreset === 'deposito' ? 'rgba(59, 130, 246, 0.18)' : 'transparent',
                    color: tipoPreset === 'deposito' ? 'var(--accent-blue)' : 'var(--text-muted)',
                    fontWeight: tipoPreset === 'deposito' ? '700' : '400',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.2rem'
                  }}
                >
                  <Landmark size={15} />
                  <span>Depósito</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset('extraccion')}
                  style={{
                    padding: '0.6rem 0.3rem',
                    borderRadius: 'var(--radius-sm)',
                    border: tipoPreset === 'extraccion' ? '1px solid var(--accent-purple)' : '1px solid var(--border-light)',
                    background: tipoPreset === 'extraccion' ? 'rgba(168, 85, 247, 0.18)' : 'transparent',
                    color: tipoPreset === 'extraccion' ? 'var(--accent-purple)' : 'var(--text-muted)',
                    fontWeight: tipoPreset === 'extraccion' ? '700' : '400',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.2rem'
                  }}
                >
                  <Banknote size={15} />
                  <span>Extracción</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset('cambio')}
                  style={{
                    padding: '0.6rem 0.3rem',
                    borderRadius: 'var(--radius-sm)',
                    border: tipoPreset === 'cambio' ? '1px solid var(--accent-amber)' : '1px solid var(--border-light)',
                    background: tipoPreset === 'cambio' ? 'rgba(245, 158, 11, 0.18)' : 'transparent',
                    color: tipoPreset === 'cambio' ? 'var(--accent-amber)' : 'var(--text-muted)',
                    fontWeight: tipoPreset === 'cambio' ? '700' : '400',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.2rem'
                  }}
                >
                  <RefreshCw size={15} />
                  <span>Cambio Moneda</span>
                </button>
              </div>
            </div>

            {/* SECCIÓN CAMBIO DE MONEDA (USD ➔ ARS) */}
            {tipoPreset === 'cambio' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                
                {/* 1. Datos Venta de Dólares */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ color: 'var(--accent-amber)', fontWeight: '700' }}>
                      💵 Origen (USD) *
                    </label>
                    <select
                      className="form-control"
                      value={cuentaOrigenUSDId}
                      onChange={(e) => setCuentaOrigenUSDId(e.target.value)}
                      required
                    >
                      <option value="" disabled>Seleccionar caja dólares</option>
                      {usdAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.nombre} (US$ {acc.saldo.toLocaleString('es-AR')})
                        </option>
                      ))}
                    </select>
                    {cuentaOrigenUSD && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Saldo: <strong>US$ {cuentaOrigenUSD.saldo.toLocaleString('es-AR')}</strong>
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Monto a Cambiar (US$) *</label>
                    <CurrencyInput
                      value={montoUSD}
                      onChange={(val) => setMontoUSD(val)}
                      placeholder="0,00"
                      currencySymbol="US$"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Cotización ($ ARS) *</label>
                    <CurrencyInput
                      value={cotizacion}
                      onChange={(val) => setCotizacion(val)}
                      placeholder="Ej. 1.500,00"
                      currencySymbol="$"
                      required
                    />
                  </div>
                </div>

                {/* Banner de Resultado Calculado */}
                {totalArsCalculado > 0 && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))',
                    border: '1px solid var(--accent-amber)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                        Total Pesos a Ingresar:
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-emerald)' }}>
                        {formatCurrency(totalArsCalculado)}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                      US$ {montoUsdNum.toLocaleString('es-AR')} ➔ Cotización $ {cotizNum.toLocaleString('es-AR')}
                    </div>
                  </div>
                )}

                {/* 2. Distribución de Pesos entre Cuentas/Cajas ARS */}
                <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <label className="form-label" style={{ margin: 0, fontWeight: '700', color: 'var(--accent-emerald)' }}>
                      🟢 Distribución de Pesos en Cuentas y Cajas ARS
                    </label>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                      onClick={handleAddDistribucionRow}
                    >
                      <Plus size={14} />
                      <span>Agregar otra cuenta</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {distribucion.map((row, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 34px', gap: '0.5rem', alignItems: 'center' }}>
                        <select
                          className="form-control"
                          style={{ fontSize: '0.82rem' }}
                          value={row.cuenta_id}
                          onChange={(e) => handleUpdateDistribucionRow(idx, 'cuenta_id', e.target.value)}
                          required
                        >
                          <option value="" disabled>Seleccionar destino</option>
                          {arsAccounts.map(acc => (
                            <option key={acc.id} value={acc.id}>
                              {acc.nombre} ({formatCurrency(acc.saldo)})
                            </option>
                          ))}
                        </select>

                        <CurrencyInput
                          value={row.monto_ars}
                          onChange={(val) => handleUpdateDistribucionRow(idx, 'monto_ars', val)}
                          placeholder="Monto ($)"
                          currencySymbol="$"
                          required
                        />

                        <input
                          type="text"
                          className="form-control"
                          style={{ fontSize: '0.82rem' }}
                          placeholder="Referencia (ej. Luis Alberto)"
                          value={row.referencia}
                          onChange={(e) => handleUpdateDistribucionRow(idx, 'referencia', e.target.value)}
                        />

                        {distribucion.length > 1 ? (
                          <button
                            type="button"
                            className="btn-icon-only delete"
                            onClick={() => handleRemoveDistribucionRow(idx)}
                            title="Quitar fila"
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : <div />}
                      </div>
                    ))}
                  </div>

                  {/* Resumen de Asignación y Alertas */}
                  {totalArsCalculado > 0 && (
                    <div style={{
                      marginTop: '0.85rem',
                      paddingTop: '0.65rem',
                      borderTop: '1px dashed var(--border-light)',
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.8rem'
                    }}>
                      <div style={{ color: 'var(--text-muted)' }}>
                        Asignado: <strong>{formatCurrency(totalArsAsignado)}</strong> / {formatCurrency(totalArsCalculado)}
                      </div>

                      {Math.abs(diferenciaARS) < 0.05 ? (
                        <div style={{ color: 'var(--accent-emerald)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCircle2 size={15} />
                          <span>¡Monto total completado!</span>
                        </div>
                      ) : (
                        <div style={{ color: 'var(--accent-rose)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <AlertCircle size={15} />
                          <span>
                            {diferenciaARS > 0 
                              ? `Falta asignar ${formatCurrency(diferenciaARS)}` 
                              : `Excedido por ${formatCurrency(Math.abs(diferenciaARS))}`}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Fecha de la Operación *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    required
                  />
                </div>

              </div>
            ) : (
              /* SECCIÓN MOVIMIENTO SIMPLE (Transferencia, Depósito, Extracción) */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <Info size={13} color="var(--accent-blue)" />
                  <span>
                    {tipoPreset === 'transferencia' && 'Transferencias habilitadas únicamente entre Cuentas Bancarias.'}
                    {tipoPreset === 'deposito' && 'Depósitos: Origen únicamente Efectivo Pesos ➔ Destino Cuentas Bancarias.'}
                    {tipoPreset === 'extraccion' && 'Extracciones: Origen Cuentas Bancarias ➔ Destino Efectivo Pesos.'}
                  </span>
                </div>

                {/* Selector de Cuentas: Origen y Destino */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ color: 'var(--accent-rose)', fontWeight: '700' }}>
                      🔴 Origen (Sale Dinero) *
                    </label>
                    <select
                      className="form-control"
                      value={cuentaOrigenId}
                      onChange={(e) => setCuentaOrigenId(e.target.value)}
                      required
                    >
                      <option value="" disabled>Seleccionar origen</option>
                      {tesoreriaAccounts.map(acc => {
                        const disabled = !isOrigenAllowed(acc);
                        return (
                          <option key={acc.id} value={acc.id} disabled={disabled}>
                            {acc.nombre} ({acc.moneda === 'USD' ? `US$ ${acc.saldo}` : formatCurrency(acc.saldo)}){disabled ? ' (Deshabilitado)' : ''}
                          </option>
                        );
                      })}
                    </select>
                    {cuentaOrigen && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                        Saldo disponible: <strong>{cuentaOrigen.moneda === 'USD' ? `US$ ${cuentaOrigen.saldo}` : formatCurrency(cuentaOrigen.saldo)}</strong>
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ color: 'var(--accent-emerald)', fontWeight: '700' }}>
                      🟢 Destino (Ingresa Dinero) *
                    </label>
                    <select
                      className="form-control"
                      value={cuentaDestinoId}
                      onChange={(e) => setCuentaDestinoId(e.target.value)}
                      required
                    >
                      <option value="" disabled>Seleccionar destino</option>
                      {tesoreriaAccounts.map(acc => {
                        const disabled = !isDestinoAllowed(acc) || String(acc.id) === String(cuentaOrigenId);
                        return (
                          <option key={acc.id} value={acc.id} disabled={disabled}>
                            {acc.nombre} ({acc.moneda === 'USD' ? `US$ ${acc.saldo}` : formatCurrency(acc.saldo)}){disabled && String(acc.id) !== String(cuentaOrigenId) ? ' (Deshabilitado)' : ''}
                          </option>
                        );
                      })}
                    </select>
                    {cuentaDestino && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                        Saldo actual: <strong>{cuentaDestino.moneda === 'USD' ? `US$ ${cuentaDestino.saldo}` : formatCurrency(cuentaDestino.saldo)}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Monto del Movimiento */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Monto del Movimiento / Transferencia ($) *</label>
                  <CurrencyInput
                    value={monto}
                    onChange={(val) => setMonto(val)}
                    placeholder="0,00"
                    currencySymbol={cuentaOrigen?.moneda === 'USD' ? 'US$' : '$'}
                    required
                    autoFocus
                  />
                </div>

                {/* Concepto y Fecha */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Concepto / Motivo de la Operación *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. Depósito en ventanilla, Extracción para caja chica, Transferencia a Galicia..."
                    value={concepto}
                    onChange={(e) => setConcepto(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Fecha del Movimiento *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

          </div>

          <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={tipoPreset === 'cambio' && !isDistribucionValida}
              style={{
                background: tipoPreset === 'cambio' 
                  ? 'linear-gradient(135deg, var(--accent-amber), #d97706)' 
                  : 'linear-gradient(135deg, var(--accent-emerald), #059669)',
                opacity: tipoPreset === 'cambio' && !isDistribucionValida ? 0.5 : 1
              }}
            >
              {tipoPreset === 'cambio' ? <RefreshCw size={15} /> : <ArrowLeftRight size={15} />}
              <span>{tipoPreset === 'cambio' ? 'Confirmar Cambio de Moneda' : 'Confirmar Movimiento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

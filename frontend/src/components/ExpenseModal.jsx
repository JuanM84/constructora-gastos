import { useState, useEffect } from 'react';
import { X, Receipt } from 'lucide-react';
import CurrencyInput from './CurrencyInput';

export default function ExpenseModal({ isOpen, onClose, onSave, projects, categories, tesoreriaAccounts = [], expenseToEdit, defaultProjectId, defaultEsEstudio = false }) {
  const [esGastoEstudio, setEsGastoEstudio] = useState(false);
  const [proyectoId, setProyectoId] = useState('');
  const [etapaId, setEtapaId] = useState('');
  const [etapasList, setEtapasList] = useState([]);
  const [categoriaId, setCategoriaId] = useState('');
  const [cuentaId, setCuentaId] = useState('');
  const [monto, setMonto] = useState('');
  const [moneda, setMoneda] = useState('ARS');
  const [descripcion, setDescripcion] = useState('');
  const [fechaGasto, setFechaGasto] = useState('');
  const [comprobanteUrl, setComprobanteUrl] = useState('');

  // Cargar etapas cuando cambia el proyecto seleccionado
  useEffect(() => {
    let active = true;
    if (proyectoId && !esGastoEstudio) {
      fetch(`http://localhost:3005/api/proyectos/${proyectoId}/detalle`)
        .then(res => res.json())
        .then(data => {
          if (active) {
            setEtapasList(data && data.etapas ? data.etapas : []);
          }
        })
        .catch(() => {
          if (active) setEtapasList([]);
        });
    } else {
      /* eslint-disable react-hooks/set-state-in-effect */
      setEtapasList([]);
    }
    return () => { active = false; };
  }, [proyectoId, esGastoEstudio]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (expenseToEdit) {
      setEsGastoEstudio(!!expenseToEdit.es_gasto_estudio);
      setProyectoId(expenseToEdit.proyecto_id || '');
      setEtapaId(expenseToEdit.etapa_id || '');
      setCategoriaId(expenseToEdit.categoria_id || '');
      setCuentaId(expenseToEdit.cuenta_id || '');
      setMonto(expenseToEdit.monto || '');
      
      const acc = tesoreriaAccounts.find(a => a.id === expenseToEdit.cuenta_id);
      const cLower = (acc?.nombre || '').toLowerCase();
      const isUSD = expenseToEdit.moneda === 'USD' || acc?.moneda === 'USD' || acc?.tipo === 'efectivo_usd' || cLower.includes('usd') || cLower.includes('dolar') || cLower.includes('dólar');
      setMoneda(isUSD ? 'USD' : (expenseToEdit.moneda || 'ARS'));

      setDescripcion(expenseToEdit.descripcion || '');
      setFechaGasto(expenseToEdit.fecha_gasto ? expenseToEdit.fecha_gasto.split('T')[0] : '');
      setComprobanteUrl(expenseToEdit.comprobante_url || '');
    } else {
      setEsGastoEstudio(!!defaultEsEstudio);
      const initialProy = defaultProjectId || (projects.length > 0 ? projects[0].id : '');
      setProyectoId(initialProy);
      setEtapaId('');
      setCategoriaId(categories.length > 0 ? categories[0].id : '');
      const defaultAcc = tesoreriaAccounts.length > 0 ? tesoreriaAccounts[0] : null;
      setCuentaId(defaultAcc ? defaultAcc.id : '');
      
      const cLower = (defaultAcc?.nombre || '').toLowerCase();
      const isUSD = defaultAcc?.moneda === 'USD' || defaultAcc?.tipo === 'efectivo_usd' || cLower.includes('usd') || cLower.includes('dolar') || cLower.includes('dólar');
      setMoneda(isUSD ? 'USD' : 'ARS');

      setMonto('');
      setDescripcion('');
      setFechaGasto(new Date().toISOString().split('T')[0]);
      setComprobanteUrl('');
    }
  }, [expenseToEdit, isOpen, projects, categories, tesoreriaAccounts, defaultProjectId, defaultEsEstudio]);

  if (!isOpen) return null;

  const handleAccountChange = (accId) => {
    setCuentaId(accId);
    if (accId) {
      const acc = tesoreriaAccounts.find(a => a.id === parseInt(accId, 10));
      if (acc) {
        const cLower = (acc.nombre || '').toLowerCase();
        const isUSD = acc.moneda === 'USD' || acc.tipo === 'efectivo_usd' || cLower.includes('usd') || cLower.includes('dolar') || cLower.includes('dólar');
        setMoneda(isUSD ? 'USD' : 'ARS');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!categoriaId || !monto || !descripcion.trim()) return;
    if (!esGastoEstudio && !proyectoId) return;

    onSave({
      id: expenseToEdit?.id,
      es_gasto_estudio: esGastoEstudio,
      proyecto_id: esGastoEstudio ? null : parseInt(proyectoId, 10),
      etapa_id: esGastoEstudio ? null : (etapaId ? parseInt(etapaId, 10) : null),
      categoria_id: parseInt(categoriaId, 10),
      cuenta_id: cuentaId ? parseInt(cuentaId, 10) : null,
      monto: parseFloat(monto),
      moneda: moneda,
      descripcion: descripcion.trim(),
      fecha_gasto: fechaGasto,
      comprobante_url: comprobanteUrl.trim()
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Receipt size={20} color="var(--accent-rose)" />
            <span>{expenseToEdit ? 'Editar Registro de Gasto' : 'Registrar Nuevo Gasto'}</span>
          </div>
          <button className="btn-icon-only" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">

            {/* Selector de Tipo: Obra vs Estudio */}
            <div className="form-group" style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <label className="form-label">Destino del Gasto *</label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.35rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem', color: !esGastoEstudio ? 'var(--accent-amber)' : 'var(--text-muted)', fontWeight: !esGastoEstudio ? '700' : '400' }}>
                  <input 
                    type="radio" 
                    name="tipo_gasto" 
                    checked={!esGastoEstudio} 
                    onChange={() => setEsGastoEstudio(false)} 
                  />
                  <span>🏗️ Gasto de Obra / Proyecto</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem', color: esGastoEstudio ? 'var(--accent-purple)' : 'var(--text-muted)', fontWeight: esGastoEstudio ? '700' : '400' }}>
                  <input 
                    type="radio" 
                    name="tipo_gasto" 
                    checked={esGastoEstudio} 
                    onChange={() => setEsGastoEstudio(true)} 
                  />
                  <span>🏢 Gasto del Estudio (Oficina / Operativo)</span>
                </label>
              </div>
            </div>

            {!esGastoEstudio && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Proyecto / Obra *</label>
                  <select 
                    className="form-control"
                    value={proyectoId}
                    onChange={(e) => setProyectoId(e.target.value)}
                    required={!esGastoEstudio}
                  >
                    <option value="" disabled>Seleccione un proyecto</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}{p.cliente_nombre ? ` (${p.cliente_nombre})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Etapa de la Obra (Opcional)</label>
                  <select 
                    className="form-control"
                    value={etapaId}
                    onChange={(e) => setEtapaId(e.target.value)}
                  >
                    <option value="">-- Sin etapa asignada --</option>
                    {etapasList.map(e => (
                      <option key={e.id} value={e.id}>{e.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Categoría *</label>
                <select 
                  className="form-control"
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  required
                >
                  <option value="" disabled>Seleccione categoría</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.es_estudio ? '(Estudio)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ flex: '1' }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Monto *</span>
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
            </div>

            {/* Cuenta de Tesorería (Pago) */}
            <div className="form-group">
              <label className="form-label">Medio de Pago / Cuenta de Tesorería (Descuento de Saldo)</label>
              <select 
                className="form-control"
                value={cuentaId}
                onChange={(e) => handleAccountChange(e.target.value)}
              >
                <option value="">-- Sin descontar de tesorería --</option>
                {tesoreriaAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.nombre} ({acc.moneda === 'USD' ? `US$ ${acc.saldo}` : `$ ${acc.saldo}`})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Descripción / Concepto / Proveedor *</label>
              <textarea 
                className="form-control"
                rows="2"
                placeholder="Ej. Compra de materiales / Alquiler de grúa..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                required
              ></textarea>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Fecha del Gasto *</label>
                <input 
                  type="date" 
                  className="form-control"
                  value={fechaGasto}
                  onChange={(e) => setFechaGasto(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">URL Comprobante (Opcional)</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej. https://drive.google.com/factura.pdf"
                  value={comprobanteUrl}
                  onChange={(e) => setComprobanteUrl(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, var(--accent-rose), #e11d48)' }}>
              {expenseToEdit ? 'Guardar Cambios' : 'Registrar Gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

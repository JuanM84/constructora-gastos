import { useState, useMemo } from 'react';
import { 
  ArrowLeftRight, 
  Search, 
  Filter, 
  RefreshCw, 
  Landmark, 
  Banknote, 
  Calendar,
  Wallet,
  DollarSign,
  UserCheck,
  ArrowUpRight,
  ArrowDownLeft,
  Printer,
  Pencil,
  Trash2
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function MovementsTab({ 
  movimientos = [], 
  tesoreriaAccounts = [],
  onOpenNewMovimiento,
  onEditCambio,
  onDeleteMovimiento
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('ALL');
  const [selectedOperation, setSelectedOperation] = useState('ALL');
  const [selectedFlow, setSelectedFlow] = useState('ALL'); // 'ALL', 'ingreso', 'egreso'

  // Clasificador de Operaciones
  const getOpCategory = (mov) => {
    const c = (mov.concepto || '').toLowerCase();
    if (c.includes('[cambio')) return { key: 'CAMBIO', label: 'Cambio de Moneda', icon: RefreshCw, color: 'var(--accent-amber)', bg: 'rgba(245, 158, 11, 0.15)' };
    if (c.includes('depósito') || c.includes('deposito') || (c.includes('[movimiento salida]') && c.includes('banco'))) {
      return { key: 'DEPOSITO', label: 'Depósito Bancario', icon: Landmark, color: 'var(--accent-blue)', bg: 'rgba(59, 130, 246, 0.15)' };
    }
    if (c.includes('extracción') || c.includes('extraccion')) {
      return { key: 'EXTRACCION', label: 'Extracción Efectivo', icon: Banknote, color: 'var(--accent-purple)', bg: 'rgba(168, 85, 247, 0.15)' };
    }
    if (c.includes('[movimiento')) {
      return { key: 'TRANSFERENCIA', label: 'Transferencia', icon: ArrowLeftRight, color: 'var(--accent-emerald)', bg: 'rgba(16, 185, 129, 0.15)' };
    }
    if (mov.ingreso_id || c.includes('entrega') || c.includes('cobro')) {
      return { key: 'INGRESO_CLIENTE', label: 'Cobro Cliente', icon: UserCheck, color: 'var(--accent-emerald)', bg: 'rgba(16, 185, 129, 0.15)' };
    }
    if (mov.gasto_id || c.includes('gasto')) {
      return { key: 'GASTO', label: 'Gasto Obra/Estudio', icon: DollarSign, color: 'var(--accent-rose)', bg: 'rgba(244, 63, 94, 0.15)' };
    }
    return { key: 'AJUSTE', label: 'Ajuste / Otro', icon: Wallet, color: 'var(--text-muted)', bg: 'rgba(148, 163, 184, 0.15)' };
  };

  // Filtrado dinámico
  const filteredMovimientos = useMemo(() => {
    return movimientos.filter(m => {
      // 1. Filtro por cuenta
      if (selectedAccount !== 'ALL' && String(m.cuenta_id) !== String(selectedAccount)) {
        return false;
      }

      // 2. Filtro por tipo de flujo (Ingreso / Egreso)
      if (selectedFlow !== 'ALL' && m.tipo !== selectedFlow) {
        return false;
      }

      // 3. Filtro por operación
      if (selectedOperation !== 'ALL') {
        const cat = getOpCategory(m);
        if (cat.key !== selectedOperation) return false;
      }

      // 4. Buscador por texto
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const conceptoMatch = (m.concepto || '').toLowerCase().includes(query);
        const cuentaMatch = (m.cuenta_nombre || '').toLowerCase().includes(query);
        const montoMatch = String(m.monto).includes(query);
        if (!conceptoMatch && !cuentaMatch && !montoMatch) return false;
      }

      return true;
    });
  }, [movimientos, selectedAccount, selectedOperation, selectedFlow, searchTerm]);

  // Totales estadísticos de la selección filtrada
  const totalIngresosARS = filteredMovimientos.filter(m => m.tipo === 'ingreso' && m.moneda === 'ARS').reduce((a, m) => a + m.monto, 0);
  const totalEgresosARS = filteredMovimientos.filter(m => m.tipo === 'egreso' && m.moneda === 'ARS').reduce((a, m) => a + m.monto, 0);
  const totalIngresosUSD = filteredMovimientos.filter(m => m.tipo === 'ingreso' && m.moneda === 'USD').reduce((a, m) => a + m.monto, 0);
  const totalEgresosUSD = filteredMovimientos.filter(m => m.tipo === 'egreso' && m.moneda === 'USD').reduce((a, m) => a + m.monto, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Encabezado Principal */}
      <div className="panel-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <ArrowLeftRight size={24} color="var(--accent-emerald)" />
              <h2 style={{ margin: 0, fontSize: '1.35rem', color: 'var(--text-main)' }}>Historial de Movimientos de Tesorería</h2>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Registro consolidado de transferencias entre cuentas, depósitos, extracciones, cambios de moneda e ingresos/egresos.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button 
              className="btn btn-secondary no-print"
              onClick={() => window.print()}
              title="Imprimir movimientos filtrados"
            >
              <Printer size={16} />
              <span>Imprimir</span>
            </button>

            <button 
              className="btn btn-primary" 
              style={{ background: 'linear-gradient(135deg, var(--accent-emerald), #059669)', gap: '0.5rem' }}
              onClick={onOpenNewMovimiento}
            >
              <ArrowLeftRight size={16} />
              <span>Registrar Nuevo Movimiento</span>
            </button>
          </div>
        </div>

        {/* Tarjetas Estadísticas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Movimientos Listados</div>
              <div className="stat-value" style={{ color: 'var(--accent-blue)', fontSize: '1.4rem' }}>
                {filteredMovimientos.length}
              </div>
              <div className="stat-sub">Registros coincidentes</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Total Entradas (ARS)</div>
              <div className="stat-value" style={{ color: 'var(--accent-emerald)', fontSize: '1.35rem' }}>
                {formatCurrency(totalIngresosARS)}
              </div>
              <div className="stat-sub">Ingresos + Acreditaciones</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Total Salidas (ARS)</div>
              <div className="stat-value" style={{ color: 'var(--accent-rose)', fontSize: '1.35rem' }}>
                {formatCurrency(totalEgresosARS)}
              </div>
              <div className="stat-sub">Egresos + Debitos</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Volumen en Dólares (USD)</div>
              <div className="stat-value" style={{ color: 'var(--accent-amber)', fontSize: '1.35rem' }}>
                US$ {(totalIngresosUSD + totalEgresosUSD).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>
              <div className="stat-sub">Operaciones US$</div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="panel-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          
          {/* Input Buscador */}
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '2.4rem' }}
              placeholder="Buscar concepto, referencia, cuenta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtro Operación */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={15} color="var(--text-muted)" />
            <select
              className="form-control"
              value={selectedOperation}
              onChange={(e) => setSelectedOperation(e.target.value)}
            >
              <option value="ALL">Todas las Operaciones</option>
              <option value="CAMBIO">💱 Cambio de Moneda (USD ➔ ARS)</option>
              <option value="TRANSFERENCIA">⇄ Transferencia Interna</option>
              <option value="DEPOSITO">🏦 Depósito Bancario</option>
              <option value="EXTRACCION">💵 Extracción Efectivo</option>
              <option value="INGRESO_CLIENTE">🟢 Cobro a Cliente</option>
              <option value="GASTO">🔴 Gasto Obra / Estudio</option>
              <option value="AJUSTE">⚡ Ajustes de Saldo</option>
            </select>
          </div>

          {/* Filtro Cuenta */}
          <div>
            <select
              className="form-control"
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
            >
              <option value="ALL">Todas las Cuentas / Cajas</option>
              {tesoreriaAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.nombre} ({acc.moneda})
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Flujo (Ingreso / Egreso) */}
          <div>
            <select
              className="form-control"
              value={selectedFlow}
              onChange={(e) => setSelectedFlow(e.target.value)}
            >
              <option value="ALL">Todos los Movimientos (+/-)</option>
              <option value="ingreso">🟢 Entradas / Ingresos (+)</option>
              <option value="egreso">🔴 Salidas / Egresos (-)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Movimientos */}
      <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
        {filteredMovimientos.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <ArrowLeftRight size={48} color="var(--text-muted)" style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>No se encontraron movimientos</h3>
            <p style={{ fontSize: '0.85rem', marginTop: '0.35rem' }}>Proba cambiando los filtros de búsqueda o registra un nuevo movimiento.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: '1.25rem' }}>Fecha</th>
                  <th>Operación</th>
                  <th>Cuenta Afectada</th>
                  <th>Concepto / Detalle / Referencia</th>
                  <th style={{ textAlign: 'right' }}>Monto</th>
                  <th style={{ textAlign: 'center', width: '100px', paddingRight: '1rem' }} className="no-print">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovimientos.map((mov) => {
                  const cat = getOpCategory(mov);
                  const IconComp = cat.icon;
                  const isIngreso = mov.tipo === 'ingreso';
                  const isUSD = mov.moneda === 'USD';
                  const fechaStr = formatDate(mov.fecha);

                  // Resaltar referencias si existen en el texto
                  const conceptoText = mov.concepto || '';
                  const hasRef = conceptoText.includes('| Ref:');
                  let mainText = conceptoText;
                  let refText = '';

                  if (hasRef) {
                    const parts = conceptoText.split('| Ref:');
                    mainText = parts[0];
                    refText = parts[1];
                  }

                  return (
                    <tr key={mov.id} style={{ transition: 'background 0.15s ease' }}>
                      <td style={{ paddingLeft: '1.25rem', whiteSpace: 'nowrap', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={13} color="var(--text-muted)" />
                          <span>{fechaStr}</span>
                        </div>
                      </td>

                      <td>
                        <span 
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            color: cat.color,
                            background: cat.bg,
                            border: `1px solid ${cat.color}`
                          }}
                        >
                          <IconComp size={13} />
                          <span>{cat.label}</span>
                        </span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>{mov.cuenta_nombre}</strong>
                          <span className={`badge ${isUSD ? 'badge-warning' : 'badge-active'}`} style={{ fontSize: '0.68rem', padding: '0.1rem 0.35rem' }}>
                            {mov.moneda}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                          {mainText}
                          {refText && (
                            <span style={{
                              marginLeft: '0.5rem',
                              background: 'rgba(59, 130, 246, 0.15)',
                              color: 'var(--accent-blue)',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              padding: '0.15rem 0.45rem',
                              borderRadius: 'var(--radius-sm)',
                              fontWeight: '700',
                              fontSize: '0.78rem'
                            }}>
                              👤 Ref: {refText}
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          {isIngreso ? <ArrowDownLeft size={16} color="var(--accent-emerald)" /> : <ArrowUpRight size={16} color="var(--accent-rose)" />}
                          <strong style={{
                            fontSize: '0.95rem',
                            color: isIngreso ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                          }}>
                            {isIngreso ? '+' : '-'} {isUSD ? `US$ ${mov.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : formatCurrency(mov.monto)}
                          </strong>
                        </div>
                      </td>

                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap', paddingRight: '1rem' }} className="no-print">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                          {cat.key === 'CAMBIO' && (
                            <button 
                              className="btn-icon-only edit" 
                              onClick={() => onEditCambio && onEditCambio(mov)}
                              title="Editar cambio de moneda"
                            >
                              <Pencil size={14} />
                            </button>
                          )}

                          {!mov.ingreso_id && !mov.gasto_id ? (
                            <button 
                              className="btn-icon-only delete" 
                              onClick={() => onDeleteMovimiento && onDeleteMovimiento(mov)}
                              title="Eliminar movimiento (revertir saldos)"
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              Comprobante
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

import { 
  Building2, 
  Receipt, 
  Wallet, 
  ArrowRight,
  Briefcase,
  PieChart
} from 'lucide-react';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../utils/formatters';

export default function DashboardTab({ summary, projects, expenses, onSelectTab, onOpenTesoreriaModal }) {
  if (!summary) return null;

  const {
    totalPresupuesto,
    totalGastado,
    totalObras,
    totalEstudio,
    presupuestoRestante,
    porcentajeGlobal,
    totalProyectos,
    totalGastos,
    totalClientes,
    tesoreria = [],
    gastosPorCategoria,
    topProyectos
  } = summary;

  // Cuentas de tesorería consolidadas por tipo
  const efecARS = tesoreria.filter(a => a.tipo === 'efectivo_ars').reduce((acc, a) => acc + (parseFloat(a.saldo) || 0), 0);
  const efecUSD = tesoreria.filter(a => a.tipo === 'efectivo_usd').reduce((acc, a) => acc + (parseFloat(a.saldo) || 0), 0);
  const bancoARS = tesoreria.filter(a => a.tipo === 'banco_ars').reduce((acc, a) => acc + (parseFloat(a.saldo) || 0), 0);

  const proyectosActivosCount = projects ? projects.filter(p => p.estado === 'Activo').length : 0;

  return (
    <div>
      {/* Sección Balance General / Tesorería */}
      <div className="panel-card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.7))', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
        <div className="panel-header" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
          <div className="panel-title">
            <Wallet size={22} color="var(--accent-emerald)" />
            <span>Balance General & Tesorería de la Empresa</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', background: 'linear-gradient(135deg, var(--accent-emerald), #059669)', gap: '0.4rem' }} onClick={() => onSelectTab('caja', 'movimientos')}>
              <ArrowRight size={14} /> Ir a Caja & Movimientos (/caja)
            </button>
            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={onOpenTesoreriaModal}>
              Ajustar Saldos
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>💵 Efectivo en Pesos (ARS)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent-emerald)' }}>{formatCurrency(efecARS)}</div>
          </div>

          <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>💵 Efectivo en Dólares (USD)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent-amber)' }}>US$ {efecUSD.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
          </div>

          <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>🏦 Cuentas Bancarias en Pesos (ARS)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent-blue)' }}>{formatCurrency(bancoARS)}</div>
          </div>
        </div>
      </div>

      {/* 4 Cards de Métricas Principales */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Presupuesto Total Obras</div>
            <div className="stat-value">{formatCurrency(totalPresupuesto)}</div>
            <div className="stat-sub">{totalProyectos} obras registradas</div>
          </div>
          <div className="stat-icon amber">
            <Building2 size={24} />
          </div>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onSelectTab('caja', 'obras')}>
          <div className="stat-info">
            <div className="stat-label">Gastos Ejecutados de Obras</div>
            <div className="stat-value" style={{ color: 'var(--accent-rose)' }}>
              {formatCurrency(totalObras)}
            </div>
            <div className="stat-sub">{porcentajeGlobal}% consumido del presupuesto</div>
          </div>
          <div className="stat-icon rose">
            <Receipt size={24} />
          </div>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onSelectTab('caja', 'estudio')}>
          <div className="stat-info">
            <div className="stat-label">Gastos del Estudio (Oficina)</div>
            <div className="stat-value" style={{ color: 'var(--accent-purple)' }}>
              {formatCurrency(totalEstudio)}
            </div>
            <div className="stat-sub">Alquiler, contador, servicios y varios</div>
          </div>
          <div className="stat-icon purple" style={{ background: 'rgba(168, 85, 247, 0.15)', color: 'var(--accent-purple)' }}>
            <Briefcase size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Proyectos Activos</div>
            <div className="stat-value" style={{ color: 'var(--accent-blue)' }}>{proyectosActivosCount}</div>
            <div className="stat-sub">Obras en ejecución actual</div>
          </div>
          <div className="stat-icon blue">
            <Building2 size={24} />
          </div>
        </div>
      </div>

      {/* Grid Principal Dashboard */}
      <div className="dashboard-grid">
        {/* Columna Izquierda: Estado Presupuestario por Proyecto */}
        <div>
          <div className="panel-card">
            <div className="panel-header">
              <div className="panel-title">
                <Building2 size={20} color="var(--accent-amber)" />
                <span>Ejecución por Proyecto</span>
              </div>
              <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => onSelectTab('proyectos')}>
                Ver Todos <ArrowRight size={14} />
              </button>
            </div>

            {projects.length === 0 ? (
              <p className="empty-state">No hay proyectos registrados aún.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {projects.map((proy) => {
                  const pct = proy.porcentaje_ejecutado || 0;
                  const isOver = pct > 100;
                  const barClass = isOver ? 'danger' : pct > 80 ? 'warning' : 'normal';

                  return (
                    <div key={proy.id} style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <div>
                          <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{proy.nombre}</strong>
                          {proy.cliente_nombre && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', marginLeft: '0.5rem' }}>👤 {proy.cliente_nombre}</span>
                          )}
                        </div>
                        <span className={`badge ${getStatusBadgeClass(proy.estado)}`}>{proy.estado}</span>
                      </div>

                      <div className="progress-bar-container">
                        <div className={`progress-bar-fill ${barClass}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span>Gastado: <strong style={{ color: isOver ? 'var(--accent-rose)' : 'var(--text-main)' }}>{formatCurrency(proy.total_gastado)}</strong></span>
                        <span>Presupuesto: <strong>{formatCurrency(proy.presupuesto_estimado)}</strong> ({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Últimos Gastos */}
          <div className="panel-card">
            <div className="panel-header">
              <div className="panel-title">
                <Receipt size={20} color="var(--accent-amber)" />
                <span>Últimos Gastos Registrados</span>
              </div>
              <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => onSelectTab('caja', 'obras')}>
                Ver Todos en Caja <ArrowRight size={14} />
              </button>
            </div>

            {expenses.length === 0 ? (
              <p className="empty-state">No hay gastos registrados aún.</p>
            ) : (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Origen / Destino</th>
                      <th>Categoría</th>
                      <th>Descripción</th>
                      <th style={{ textAlign: 'right' }}>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.slice(0, 5).map(gasto => (
                      <tr key={gasto.id}>
                        <td>{formatDate(gasto.fecha_gasto)}</td>
                        <td>
                          {gasto.es_gasto_estudio ? (
                            <span className="badge badge-warning" style={{ background: 'rgba(168, 85, 247, 0.2)', color: 'var(--accent-purple)' }}>🏢 Estudio</span>
                          ) : (
                            <strong>🏗️ {gasto.proyecto_nombre}</strong>
                          )}
                        </td>
                        <td><span className="badge badge-neutral">{gasto.categoria_nombre}</span></td>
                        <td>{gasto.descripcion}</td>
                        <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--accent-rose)' }}>
                          {formatCurrency(gasto.monto)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Desglose por Categorías */}
        <div>
          <div className="panel-card">
            <div className="panel-header">
              <div className="panel-title">
                <PieChart size={20} color="var(--accent-amber)" />
                <span>Gastos por Categoría</span>
              </div>
            </div>

            {gastosPorCategoria.length === 0 ? (
              <p className="empty-state">Sin categorías.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {gastosPorCategoria.map((cat) => {
                  const catPct = totalGastado > 0 ? ((cat.total / totalGastado) * 100).toFixed(1) : 0;
                  return (
                    <div key={cat.id} style={{ padding: '0.75rem', background: 'rgba(15, 23, 42, 0.4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                          {cat.nombre} {cat.es_estudio ? '🏢' : ''}
                        </span>
                        <span style={{ fontWeight: '700', color: cat.es_estudio ? 'var(--accent-purple)' : 'var(--accent-amber)' }}>{formatCurrency(cat.total)}</span>
                      </div>
                      <div className="progress-bar-container" style={{ height: '6px' }}>
                        <div className={`progress-bar-fill ${cat.es_estudio ? 'purple' : 'warning'}`} style={{ width: `${catPct}%`, background: cat.es_estudio ? 'var(--accent-purple)' : undefined }}></div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                        {catPct}% del gasto total
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

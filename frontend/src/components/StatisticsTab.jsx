import { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Receipt, 
  Building2, 
  Wallet, 
  Search, 
  ArrowLeftRight,
  Filter,
  PieChart,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Printer
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function StatisticsTab({
  expenses = [],
  ingresos = [],
  allMovements = [],
  projects = [],
  categories = []
}) {
  // Fechas por defecto: Inicio de mes actual y Hoy
  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayOfMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [fechaDesde, setFechaDesde] = useState(firstDayOfMonthStr);
  const [fechaHasta, setFechaHasta] = useState(todayStr);
  const [activeSection, setActiveSection] = useState('resumen'); // 'resumen', 'gastos_obra', 'gastos_estudio', 'ingresos', 'movimientos'
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Handlers para rangos rápidos
  const setQuickRange = (rangeType) => {
    const now = new Date();
    if (rangeType === 'mes_actual') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      setFechaDesde(first.toISOString().split('T')[0]);
      setFechaHasta(todayStr);
    } else if (rangeType === 'ultimos_30') {
      const past = new Date();
      past.setDate(now.getDate() - 30);
      setFechaDesde(past.toISOString().split('T')[0]);
      setFechaHasta(todayStr);
    } else if (rangeType === 'anio_actual') {
      const first = new Date(now.getFullYear(), 0, 1);
      setFechaDesde(first.toISOString().split('T')[0]);
      setFechaHasta(todayStr);
    } else if (rangeType === 'todo') {
      setFechaDesde('2020-01-01');
      setFechaHasta('2030-12-31');
    }
  };

  // Normalizar fechas para comparación YYYY-MM-DD
  const parseFecha = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
  };

  // Filtrado por fecha y proyecto de Ingresos
  const filteredIngresos = useMemo(() => {
    return ingresos.filter(ing => {
      const f = parseFecha(ing.fecha);
      if (fechaDesde && f < fechaDesde) return false;
      if (fechaHasta && f > fechaHasta) return false;
      if (selectedProjectFilter && ing.proyecto_id !== parseInt(selectedProjectFilter, 10)) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          (ing.concepto && ing.concepto.toLowerCase().includes(term)) ||
          (ing.proyecto_nombre && ing.proyecto_nombre.toLowerCase().includes(term))
        );
      }
      return true;
    });
  }, [ingresos, fechaDesde, fechaHasta, selectedProjectFilter, searchTerm]);

  // Filtrado por fecha y proyecto de Gastos
  const filteredExpenses = useMemo(() => {
    return expenses.filter(g => {
      const f = parseFecha(g.fecha_gasto);
      if (fechaDesde && f < fechaDesde) return false;
      if (fechaHasta && f > fechaHasta) return false;
      if (selectedProjectFilter && g.proyecto_id !== parseInt(selectedProjectFilter, 10)) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          (g.descripcion && g.descripcion.toLowerCase().includes(term)) ||
          (g.categoria_nombre && g.categoria_nombre.toLowerCase().includes(term)) ||
          (g.proyecto_nombre && g.proyecto_nombre.toLowerCase().includes(term))
        );
      }
      return true;
    });
  }, [expenses, fechaDesde, fechaHasta, selectedProjectFilter, searchTerm]);

  // Filtrado por fecha de Movimientos de Tesorería
  const filteredMovements = useMemo(() => {
    return allMovements.filter(m => {
      const f = parseFecha(m.fecha);
      if (fechaDesde && f < fechaDesde) return false;
      if (fechaHasta && f > fechaHasta) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          (m.concepto && m.concepto.toLowerCase().includes(term)) ||
          (m.cuenta_nombre && m.cuenta_nombre.toLowerCase().includes(term))
        );
      }
      return true;
    });
  }, [allMovements, fechaDesde, fechaHasta, searchTerm]);

  // Totales
  const totalIngresosARS = useMemo(() => {
    return filteredIngresos
      .filter(i => i.moneda !== 'USD')
      .reduce((sum, i) => sum + (parseFloat(i.monto) || 0), 0);
  }, [filteredIngresos]);

  const totalIngresosUSD = useMemo(() => {
    return filteredIngresos
      .filter(i => i.moneda === 'USD')
      .reduce((sum, i) => sum + (parseFloat(i.monto) || 0), 0);
  }, [filteredIngresos]);

  const gastosObraList = useMemo(() => filteredExpenses.filter(g => !g.es_gasto_estudio), [filteredExpenses]);
  const gastosEstudioList = useMemo(() => filteredExpenses.filter(g => g.es_gasto_estudio), [filteredExpenses]);

  const totalGastosObraARS = useMemo(() => {
    return gastosObraList.filter(g => g.moneda !== 'USD').reduce((sum, g) => sum + (parseFloat(g.monto) || 0), 0);
  }, [gastosObraList]);

  const totalGastosObraUSD = useMemo(() => {
    return gastosObraList.filter(g => g.moneda === 'USD').reduce((sum, g) => sum + (parseFloat(g.monto) || 0), 0);
  }, [gastosObraList]);

  const totalGastosEstudioARS = useMemo(() => {
    return gastosEstudioList.filter(g => g.moneda !== 'USD').reduce((sum, g) => sum + (parseFloat(g.monto) || 0), 0);
  }, [gastosEstudioList]);

  const totalGastosEstudioUSD = useMemo(() => {
    return gastosEstudioList.filter(g => g.moneda === 'USD').reduce((sum, g) => sum + (parseFloat(g.monto) || 0), 0);
  }, [gastosEstudioList]);

  const totalGastosGlobalARS = totalGastosObraARS + totalGastosEstudioARS;
  const totalGastosGlobalUSD = totalGastosObraUSD + totalGastosEstudioUSD;
  const balanceNetoARS = totalIngresosARS - totalGastosGlobalARS;

  // Desglose de gastos por Categoría
  const gastosPorCategoria = useMemo(() => {
    const map = {};
    filteredExpenses.forEach(g => {
      const cat = g.categoria_nombre || 'Sin Categoría';
      map[cat] = (map[cat] || 0) + (parseFloat(g.monto) || 0);
    });
    return Object.entries(map)
      .map(([nombre, monto]) => ({
        nombre,
        monto,
        porcentaje: totalGastosGlobalARS > 0 ? (monto / totalGastosGlobalARS) * 100 : 0
      }))
      .sort((a, b) => b.monto - a.monto);
  }, [filteredExpenses, totalGastosGlobalARS]);

  // Desglose de gastos por Proyecto
  const gastosPorProyecto = useMemo(() => {
    const map = {};
    gastosObraList.forEach(g => {
      const proy = g.proyecto_nombre || 'Obra General';
      map[proy] = (map[proy] || 0) + (parseFloat(g.monto) || 0);
    });
    return Object.entries(map)
      .map(([nombre, monto]) => ({
        nombre,
        monto,
        porcentaje: totalGastosObraARS > 0 ? (monto / totalGastosObraARS) * 100 : 0
      }))
      .sort((a, b) => b.monto - a.monto);
  }, [gastosObraList, totalGastosObraARS]);

  const handlePrint = () => {
    window.print();
  };

  const selectedProjectName = useMemo(() => {
    if (!selectedProjectFilter) return null;
    return projects.find(p => p.id === parseInt(selectedProjectFilter, 10))?.nombre;
  }, [selectedProjectFilter, projects]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* CABECERA PARA IMPRESIÓN IMPRESA (Solo visible al imprimir) */}
      <div className="print-only-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #111', paddingBottom: '12px', marginBottom: '20px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '18pt', color: '#000', fontWeight: '800' }}>ESTUDIO LK S.R.L.</h1>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '12pt', color: '#333', fontWeight: '600' }}>Arquitectura & Construcción — Informe de Balances Financieros</h3>
          </div>
          <div style={{ textAlign: 'right', fontSize: '9pt', color: '#444', lineHeight: '1.4' }}>
            <div><strong>Período Auditado:</strong> {formatDate(fechaDesde)} al {formatDate(fechaHasta)}</div>
            {selectedProjectName && <div><strong>Filtro por Obra:</strong> {selectedProjectName}</div>}
            <div><strong>Fecha de Emisión:</strong> {new Date().toLocaleDateString('es-AR')} {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
      </div>

      {/* CARD SUPERIOR: FILTRO DE FECHAS & RANGOS RÁPIDOS */}
      <div className="panel-card no-print" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <BarChart3 size={26} color="var(--accent-blue)" />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-main)' }}>
                Balances & Estadísticas Financieras
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Selecciona un rango de fechas para consultar los ingresos, egresos de obra, gastos del estudio y balance neto
              </div>
            </div>
          </div>

          {/* Botones de Rango Rápido e Impresión */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setQuickRange('mes_actual')}>
                Este Mes
              </button>
              <button className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setQuickRange('ultimos_30')}>
                Últimos 30 días
              </button>
              <button className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setQuickRange('anio_actual')}>
                Este Año
              </button>
              <button className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setQuickRange('todo')}>
                Ver Todo
              </button>
            </div>

            <button 
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, var(--accent-blue), #2563eb)', border: 'none', padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
              onClick={handlePrint}
            >
              <Printer size={16} />
              <span>Imprimir Balance</span>
            </button>
          </div>
        </div>

        {/* Formulario de Selección de Fechas & Proyecto */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', background: 'rgba(15, 23, 42, 0.5)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ flex: '1', minWidth: '170px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>📅 Fecha Desde</label>
            <input 
              type="date" 
              className="form-control" 
              value={fechaDesde} 
              onChange={(e) => setFechaDesde(e.target.value)} 
            />
          </div>

          <div style={{ flex: '1', minWidth: '170px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>📅 Fecha Hasta</label>
            <input 
              type="date" 
              className="form-control" 
              value={fechaHasta} 
              onChange={(e) => setFechaHasta(e.target.value)} 
            />
          </div>

          <div style={{ flex: '1.2', minWidth: '200px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>🏗️ Filtrar por Proyecto / Obra</label>
            <select 
              className="form-control" 
              value={selectedProjectFilter} 
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
            >
              <option value="">-- Todos los Proyectos & Estudio --</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>🏗️ {p.nombre}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: '1.5', minWidth: '220px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>🔍 Buscar por concepto o categoría</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Ej: Albañilería, Cemento, Honorarios..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>
      </div>

      {/* METRIC CARDS / BALANCES DEL PERÍODO */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginBottom: 0 }}>
        
        {/* Total Ingresos */}
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Ingresos Totales (Cobros)</div>
            <div className="stat-value" style={{ color: 'var(--accent-emerald)' }}>
              {formatCurrency(totalIngresosARS)}
            </div>
            {totalIngresosUSD > 0 && (
              <div style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', marginTop: '0.2rem', fontWeight: '600' }}>
                + US$ {totalIngresosUSD.toLocaleString('es-AR')}
              </div>
            )}
            <div className="stat-sub">{filteredIngresos.length} registros de ingresos</div>
          </div>
          <div className="stat-icon emerald">
            <ArrowUpRight size={24} />
          </div>
        </div>

        {/* Gastos de Obras (MDO + Compras) */}
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Gastos de Obras (MDO / Compras)</div>
            <div className="stat-value" style={{ color: 'var(--accent-amber)' }}>
              {formatCurrency(totalGastosObraARS)}
            </div>
            {totalGastosObraUSD > 0 && (
              <div style={{ fontSize: '0.85rem', color: 'var(--accent-amber)', marginTop: '0.2rem', fontWeight: '600' }}>
                + US$ {totalGastosObraUSD.toLocaleString('es-AR')}
              </div>
            )}
            <div className="stat-sub">{gastosObraList.length} comprobantes de obras</div>
          </div>
          <div className="stat-icon amber">
            <Building2 size={24} />
          </div>
        </div>

        {/* Gastos del Estudio (Sueldos + Grales) */}
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Gastos de Estudio / Oficina</div>
            <div className="stat-value" style={{ color: 'var(--accent-purple)' }}>
              {formatCurrency(totalGastosEstudioARS)}
            </div>
            {totalGastosEstudioUSD > 0 && (
              <div style={{ fontSize: '0.85rem', color: 'var(--accent-purple)', marginTop: '0.2rem', fontWeight: '600' }}>
                + US$ {totalGastosEstudioUSD.toLocaleString('es-AR')}
              </div>
            )}
            <div className="stat-sub">{gastosEstudioList.length} egresos administrativos</div>
          </div>
          <div className="stat-icon blue">
            <Receipt size={24} />
          </div>
        </div>

        {/* Balance Neto Período */}
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Balance Neto del Período</div>
            <div className="stat-value" style={{ color: balanceNetoARS >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
              {formatCurrency(balanceNetoARS)}
            </div>
            <div className="stat-sub">
              Ingresos ($ {totalIngresosARS.toLocaleString('es-AR')}) - Gastos ($ {totalGastosGlobalARS.toLocaleString('es-AR')})
            </div>
          </div>
          <div className={`stat-icon ${balanceNetoARS >= 0 ? 'emerald' : 'rose'}`}>
            {balanceNetoARS >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
          </div>
        </div>

      </div>

      {/* DESGROSES Y DISTRIBUCIONES (GRÁFICOS EN BARRAS) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.25rem' }}>
        
        {/* Gastos por Categoría */}
        <div className="panel-card" style={{ margin: 0 }}>
          <div className="panel-header" style={{ marginBottom: '1rem' }}>
            <div className="panel-title">
              <PieChart size={20} color="var(--accent-purple)" />
              <span>Distribución por Categorías ({gastosPorCategoria.length})</span>
            </div>
          </div>

          {gastosPorCategoria.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No hay gastos en el período seleccionado.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {gastosPorCategoria.slice(0, 6).map((cat, idx) => (
                <div key={cat.nombre}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{cat.nombre}</span>
                    <span style={{ fontWeight: '700', color: 'var(--accent-purple)' }}>
                      {formatCurrency(cat.monto)} ({cat.porcentaje.toFixed(1)}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', background: 'rgba(255,255,255,0.06)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${cat.porcentaje}%`,
                      background: idx === 0 ? 'var(--accent-purple)' : idx === 1 ? 'var(--accent-blue)' : idx === 2 ? 'var(--accent-amber)' : 'var(--accent-emerald)',
                      height: '100%',
                      borderRadius: '4px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gastos por Proyecto */}
        <div className="panel-card" style={{ margin: 0 }}>
          <div className="panel-header" style={{ marginBottom: '1rem' }}>
            <div className="panel-title">
              <Building2 size={20} color="var(--accent-amber)" />
              <span>Distribución de Gastos por Obra</span>
            </div>
          </div>

          {gastosPorProyecto.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No hay gastos imputados a obras en este período.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {gastosPorProyecto.slice(0, 6).map((proy, idx) => (
                <div key={proy.nombre}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{proy.nombre}</span>
                    <span style={{ fontWeight: '700', color: 'var(--accent-amber)' }}>
                      {formatCurrency(proy.monto)} ({proy.porcentaje.toFixed(1)}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', background: 'rgba(255,255,255,0.06)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${proy.porcentaje}%`,
                      background: 'linear-gradient(90deg, var(--accent-amber), #d97706)',
                      height: '100%',
                      borderRadius: '4px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* PESTAÑAS DETALLADAS DE LISTADO DE MOVIMIENTOS DEL PERÍODO */}
      <div className="panel-card" style={{ margin: 0 }}>
        
        {/* Navegación por Sub-secciones */}
        <div className="no-print" style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem', overflowX: 'auto' }}>
          <button 
            className={`btn ${activeSection === 'resumen' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSection('resumen')}
          >
            📋 Todos los Movimientos ({filteredIngresos.length + filteredExpenses.length})
          </button>

          <button 
            className={`btn ${activeSection === 'ingresos' ? 'btn-primary' : 'btn-secondary'}`}
            style={activeSection === 'ingresos' ? { background: 'var(--accent-emerald)', border: 'none' } : {}}
            onClick={() => setActiveSection('ingresos')}
          >
            💚 Ingresos ({filteredIngresos.length})
          </button>

          <button 
            className={`btn ${activeSection === 'gastos_obra' ? 'btn-primary' : 'btn-secondary'}`}
            style={activeSection === 'gastos_obra' ? { background: 'var(--accent-amber)', border: 'none' } : {}}
            onClick={() => setActiveSection('gastos_obra')}
          >
            🏗️ Gastos de Obras ({gastosObraList.length})
          </button>

          <button 
            className={`btn ${activeSection === 'gastos_estudio' ? 'btn-primary' : 'btn-secondary'}`}
            style={activeSection === 'gastos_estudio' ? { background: 'var(--accent-purple)', border: 'none' } : {}}
            onClick={() => setActiveSection('gastos_estudio')}
          >
            💼 Gastos de Estudio ({gastosEstudioList.length})
          </button>

          <button 
            className={`btn ${activeSection === 'movimientos' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSection('movimientos')}
          >
            🏦 Tesorería ({filteredMovements.length})
          </button>
        </div>

        {/* VISTA 1: INGRESOS DEL PERÍODO */}
        {(activeSection === 'resumen' || activeSection === 'ingresos') && filteredIngresos.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowUpRight size={18} /> Ingresos / Cobros Registrados en el Período
              </h4>
              <span style={{ fontWeight: '700', color: 'var(--accent-emerald)', fontSize: '0.95rem' }}>
                Subtotal: {formatCurrency(totalIngresosARS)} {totalIngresosUSD > 0 ? ` + US$ ${totalIngresosUSD.toLocaleString('es-AR')}` : ''}
              </span>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Concepto</th>
                    <th>Origen / Obra</th>
                    <th>Cuenta Acreditada</th>
                    <th style={{ textAlign: 'right' }}>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIngresos.map(ing => (
                    <tr key={ing.id}>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{formatDate(ing.fecha)}</td>
                      <td><strong style={{ color: 'var(--text-main)' }}>{ing.concepto}</strong></td>
                      <td>
                        {ing.proyecto_id ? (
                          <span className="badge badge-active">🏗️ {ing.proyecto_nombre}</span>
                        ) : (
                          <span className="badge badge-purple">💼 Estudio</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', fontWeight: '600' }}>
                        {ing.cuenta_nombre || 'Tesorería'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '800', color: 'var(--accent-emerald)', whiteSpace: 'nowrap' }}>
                        + {ing.moneda === 'USD' ? `US$ ${ing.monto.toLocaleString('es-AR')}` : formatCurrency(ing.monto)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VISTA 2: GASTOS DE OBRA DEL PERÍODO */}
        {(activeSection === 'resumen' || activeSection === 'gastos_obra') && gastosObraList.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={18} /> Gastos de Obras (MDO, Materiales y Subcontratos)
              </h4>
              <span style={{ fontWeight: '700', color: 'var(--accent-rose)', fontSize: '0.95rem' }}>
                Subtotal: {formatCurrency(totalGastosObraARS)} {totalGastosObraUSD > 0 ? ` + US$ ${totalGastosObraUSD.toLocaleString('es-AR')}` : ''}
              </span>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Obra / Proyecto</th>
                    <th>Etapa</th>
                    <th>Categoría</th>
                    <th>Descripción</th>
                    <th style={{ textAlign: 'right' }}>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {gastosObraList.map(g => (
                    <tr key={g.id}>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{formatDate(g.fecha_gasto)}</td>
                      <td><strong style={{ color: 'var(--text-main)' }}>{g.proyecto_nombre || 'General'}</strong></td>
                      <td>
                        {g.etapa_nombre ? (
                          <span className="badge badge-neutral">{g.etapa_nombre}</span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                      <td><span className="badge badge-active">{g.categoria_nombre}</span></td>
                      <td>{g.descripcion}</td>
                      <td style={{ textAlign: 'right', fontWeight: '800', color: g.moneda === 'USD' ? 'var(--accent-emerald)' : 'var(--accent-rose)', whiteSpace: 'nowrap' }}>
                        - {g.moneda === 'USD' ? `US$ ${g.monto.toLocaleString('es-AR')}` : formatCurrency(g.monto)}
                        {g.moneda === 'USD' && <span className="badge badge-emerald" style={{ marginLeft: '0.35rem', fontSize: '0.7rem' }}>USD</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VISTA 3: GASTOS DEL ESTUDIO EN EL PERÍODO */}
        {(activeSection === 'resumen' || activeSection === 'gastos_estudio') && gastosEstudioList.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Receipt size={18} /> Gastos del Estudio (Sueldos, Honorarios y Oficina)
              </h4>
              <span style={{ fontWeight: '700', color: 'var(--accent-rose)', fontSize: '0.95rem' }}>
                Subtotal: {formatCurrency(totalGastosEstudioARS)} {totalGastosEstudioUSD > 0 ? ` + US$ ${totalGastosEstudioUSD.toLocaleString('es-AR')}` : ''}
              </span>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Categoría</th>
                    <th>Descripción</th>
                    <th style={{ textAlign: 'right' }}>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {gastosEstudioList.map(g => (
                    <tr key={g.id}>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{formatDate(g.fecha_gasto)}</td>
                      <td><span className="badge badge-purple">{g.categoria_nombre}</span></td>
                      <td>{g.descripcion}</td>
                      <td style={{ textAlign: 'right', fontWeight: '800', color: g.moneda === 'USD' ? 'var(--accent-emerald)' : 'var(--accent-rose)', whiteSpace: 'nowrap' }}>
                        - {g.moneda === 'USD' ? `US$ ${g.monto.toLocaleString('es-AR')}` : formatCurrency(g.monto)}
                        {g.moneda === 'USD' && <span className="badge badge-emerald" style={{ marginLeft: '0.35rem', fontSize: '0.7rem' }}>USD</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VISTA 4: MOVIMIENTOS DE TESORERÍA EN EL PERÍODO */}
        {(activeSection === 'movimientos') && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wallet size={18} /> Movimientos de Cuentas de Tesorería en el Período
              </h4>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {filteredMovements.length} movimientos
              </span>
            </div>

            {filteredMovements.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No hay movimientos registrados en las fechas seleccionadas.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Cuenta</th>
                      <th>Tipo</th>
                      <th>Concepto / Referencia</th>
                      <th style={{ textAlign: 'right' }}>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMovements.map(m => (
                      <tr key={m.id}>
                        <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{formatDate(m.fecha)}</td>
                        <td><strong>{m.cuenta_nombre}</strong></td>
                        <td>
                          {m.tipo === 'ingreso' ? (
                            <span className="badge badge-success">💚 Ingreso</span>
                          ) : m.tipo === 'egreso' ? (
                            <span className="badge badge-danger">🔴 Egreso</span>
                          ) : (
                            <span className="badge badge-warning">🔄 Transferencia</span>
                          )}
                        </td>
                        <td>{m.concepto}</td>
                        <td style={{ textAlign: 'right', fontWeight: '800', color: m.tipo === 'ingreso' ? 'var(--accent-emerald)' : 'var(--accent-rose)', whiteSpace: 'nowrap' }}>
                          {m.tipo === 'ingreso' ? '+' : '-'} {formatCurrency(m.monto)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}

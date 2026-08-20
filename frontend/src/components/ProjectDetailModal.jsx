import { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Building2, 
  Plus, 
  Layers, 
  DollarSign, 
  Receipt, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  Wallet,
  Edit2,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../utils/formatters';

export default function ProjectDetailModal({ 
  isOpen, 
  onClose, 
  projectId,
  refreshKey,
  onOpenNewEtapa,
  onEditEtapa,
  onDeleteEtapa,
  onOpenNewIngreso,
  onDeleteIngreso,
  onOpenNewExpense,
  onDeleteExpense
}) {
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('etapas'); // 'etapas', 'ingresos', 'gastos'
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedEtapaFilter, setSelectedEtapaFilter] = useState('');
  const [expenseSearchTerm, setExpenseSearchTerm] = useState('');

  const fetchProjectDetail = useCallback(async (isSilent = false) => {
    if (!projectId) return;
    if (!isSilent) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const res = await fetch(`http://localhost:3005/api/proyectos/${projectId}/detalle`);
      if (res.ok) {
        const data = await res.json();
        setDetailData(data);
      }
    } catch (error) {
      console.error('Error al obtener detalle del proyecto:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    let isMounted = true;
    if (isOpen && projectId) {
      fetch(`http://localhost:3005/api/proyectos/${projectId}/detalle`)
        .then(res => res.json())
        .then(data => {
          if (isMounted) setDetailData(data);
        })
        .catch(err => console.error('Error al obtener detalle del proyecto:', err));
    } else {
      setDetailData(null);
    }
    return () => { isMounted = false; };
  }, [isOpen, projectId, refreshKey]);

  if (!isOpen) return null;

  const { proyecto, etapas = [], ingresos = [], gastos = [] } = detailData || {};

  const uniqueCategoriesInGastos = Array.from(
    new Set(gastos.map(g => g.categoria_nombre).filter(Boolean))
  ).sort();

  const uniqueEtapasInGastos = Array.from(
    new Set(gastos.map(g => g.etapa_nombre || 'Sin Etapa Imputada').filter(Boolean))
  ).sort();

  const filteredGastos = gastos.filter(g => {
    if (selectedCategoryFilter && g.categoria_nombre !== selectedCategoryFilter) return false;
    const etapaVal = g.etapa_nombre || 'Sin Etapa Imputada';
    if (selectedEtapaFilter && etapaVal !== selectedEtapaFilter) return false;
    if (expenseSearchTerm) {
      const term = expenseSearchTerm.toLowerCase();
      return (
        (g.descripcion && g.descripcion.toLowerCase().includes(term)) ||
        (g.categoria_nombre && g.categoria_nombre.toLowerCase().includes(term))
      );
    }
    return true;
  });

  const totalFilteredGastos = filteredGastos.reduce((acc, g) => acc + (parseFloat(g.monto) || 0), 0);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="modal-content" style={{ maxWidth: '1100px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Building2 size={24} color="var(--accent-amber)" />
              <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-main)' }}>
                {proyecto ? proyecto.nombre : 'Cargando Proyecto...'}
              </h2>
              {proyecto && (
                <span className={`badge ${getStatusBadgeClass(proyecto.estado)}`}>
                  {proyecto.estado}
                </span>
              )}
              {isRefreshing && (
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Actualizando datos...
                </span>
              )}
            </div>
            {proyecto?.ubicacion && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <MapPin size={14} /> {proyecto.ubicacion}
              </div>
            )}
          </div>
          <button className="btn-icon-only" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {loading || !proyecto ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Building2 size={40} className="empty-icon" style={{ animation: 'spin 1s linear infinite' }} />
            <p>Cargando información y desglose financiero de la obra...</p>
          </div>
        ) : (
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Ficha del Cliente Asignado */}
            {proyecto.cliente_nombre ? (
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <User size={18} color="var(--accent-blue)" />
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Cliente / Comitente:</span>
                    <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-main)' }}>
                      {proyecto.cliente_nombre} {proyecto.cliente_dni_cuit ? `(${proyecto.cliente_dni_cuit})` : ''}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.85rem' }}>
                  {proyecto.cliente_telefono && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)' }}>
                      <Phone size={14} color="var(--accent-amber)" /> {proyecto.cliente_telefono}
                    </span>
                  )}
                  {proyecto.cliente_email && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)' }}>
                      <Mail size={14} color="var(--accent-blue)" /> {proyecto.cliente_email}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                ⚠️ Proyecto sin cliente o comitente asignado.
              </div>
            )}

            {/* Tarjetas de Métricas Financieras del Proyecto */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              
              <div className="stat-card" style={{ padding: '0.9rem' }}>
                <div className="stat-info">
                  <div className="stat-label">Presupuesto (Etapas)</div>
                  <div className="stat-value" style={{ fontSize: '1.25rem' }}>{formatCurrency(proyecto.presupuesto_estimado)}</div>
                  <div className="stat-sub">{etapas.length} etapas presupuestadas</div>
                </div>
              </div>

              <div className="stat-card" style={{ padding: '0.9rem' }}>
                <div className="stat-info">
                  <div className="stat-label">Total Cobrado (Cliente)</div>
                  <div className="stat-value" style={{ color: 'var(--accent-emerald)', fontSize: '1.25rem' }}>
                    {formatCurrency(proyecto.total_cobrado_ars)}
                  </div>
                  {proyecto.total_cobrado_usd > 0 && (
                    <div className="stat-sub" style={{ color: 'var(--accent-amber)' }}>
                      + US$ {proyecto.total_cobrado_usd.toLocaleString('es-AR')}
                    </div>
                  )}
                </div>
              </div>

              <div className="stat-card" style={{ padding: '0.9rem' }}>
                <div className="stat-info">
                  <div className="stat-label">Total Gastado en Obra</div>
                  <div className="stat-value" style={{ color: 'var(--accent-rose)', fontSize: '1.25rem' }}>
                    {formatCurrency(proyecto.total_gastado)}
                  </div>
                  <div className="stat-sub">{gastos.length} gastos cargados</div>
                </div>
              </div>

              <div className="stat-card" style={{ padding: '0.9rem' }}>
                <div className="stat-info">
                  <div className="stat-label">Saldo por Cobrar</div>
                  <div className="stat-value" style={{ color: proyecto.saldo_pendiente_cobro > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)', fontSize: '1.25rem' }}>
                    {formatCurrency(proyecto.saldo_pendiente_cobro)}
                  </div>
                  <div className="stat-sub">Pendiente de cobro</div>
                </div>
              </div>

              <div className="stat-card" style={{ padding: '0.9rem' }}>
                <div className="stat-info">
                  <div className="stat-label">Balance de Caja Obra</div>
                  <div className="stat-value" style={{ color: proyecto.resultado_caja >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontSize: '1.25rem' }}>
                    {formatCurrency(proyecto.resultado_caja)}
                  </div>
                  <div className="stat-sub">Cobrado menos Gastado</div>
                </div>
              </div>

            </div>

            {/* Pestañas de Navegación del Detalle */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              background: 'rgba(15, 23, 42, 0.7)',
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              flexWrap: 'wrap',
              margin: '0.5rem 0'
            }}>
              <button 
                onClick={() => setActiveSubTab('etapas')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  border: activeSubTab === 'etapas' ? '1px solid var(--accent-amber)' : '1px solid transparent',
                  background: activeSubTab === 'etapas' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                  color: activeSubTab === 'etapas' ? 'var(--accent-amber)' : 'var(--text-muted)',
                  fontWeight: activeSubTab === 'etapas' ? '700' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '0.9rem'
                }}
              >
                <Layers size={17} />
                <span>Etapas de la Obra ({etapas.length})</span>
              </button>

              <button 
                onClick={() => setActiveSubTab('ingresos')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  border: activeSubTab === 'ingresos' ? '1px solid var(--accent-emerald)' : '1px solid transparent',
                  background: activeSubTab === 'ingresos' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                  color: activeSubTab === 'ingresos' ? 'var(--accent-emerald)' : 'var(--text-muted)',
                  fontWeight: activeSubTab === 'ingresos' ? '700' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '0.9rem'
                }}
              >
                <DollarSign size={17} />
                <span>Entregas de Dinero del Cliente ({ingresos.length})</span>
              </button>

              <button 
                onClick={() => setActiveSubTab('gastos')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  border: activeSubTab === 'gastos' ? '1px solid var(--accent-rose)' : '1px solid transparent',
                  background: activeSubTab === 'gastos' ? 'rgba(244, 63, 94, 0.2)' : 'transparent',
                  color: activeSubTab === 'gastos' ? 'var(--accent-rose)' : 'var(--text-muted)',
                  fontWeight: activeSubTab === 'gastos' ? '700' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '0.9rem'
                }}
              >
                <Receipt size={17} />
                <span>Gastos de la Obra ({gastos.length})</span>
              </button>
            </div>

            {/* SUB-TAB 1: ETAPAS DE LA OBRA */}
            {activeSubTab === 'etapas' && (
              <div className="panel-card" style={{ margin: 0 }}>
                <div className="panel-header" style={{ marginBottom: '1rem' }}>
                  <div className="panel-title">
                    <Layers size={20} color="var(--accent-amber)" />
                    <span>Desglose de Etapas y Presupuestos</span>
                  </div>
                  <button className="btn btn-primary" onClick={() => onOpenNewEtapa(proyecto.id)}>
                    <Plus size={15} />
                    <span>Nueva Etapa</span>
                  </button>
                </div>

                {etapas.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2rem' }}>
                    <Layers size={36} className="empty-icon" />
                    <div className="empty-title">No hay etapas creadas en este proyecto</div>
                    <p>Agrega etapas (Fases 1, 2, 3...) para llevar un control presupuestario detallado.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th style={{ width: '40px' }}>Ord.</th>
                          <th>Nombre de la Etapa</th>
                          <th>Estado</th>
                          <th style={{ textAlign: 'right' }}>Presupuesto</th>
                          <th style={{ textAlign: 'right' }}>Cobrado</th>
                          <th style={{ textAlign: 'right' }}>Gastado</th>
                          <th style={{ width: '150px' }}>Avance %</th>
                          <th style={{ textAlign: 'center' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {etapas.map(etapa => {
                          const pct = etapa.porcentaje || 0;
                          const isOver = pct > 100;
                          return (
                            <tr key={etapa.id}>
                              <td style={{ textAlign: 'center', fontWeight: '700', color: 'var(--text-muted)' }}>{etapa.orden}</td>
                              <td>
                                <strong style={{ color: 'var(--text-main)' }}>{etapa.nombre}</strong>
                                {etapa.descripcion && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{etapa.descripcion}</div>}
                              </td>
                              <td>
                                <span className={`badge ${getStatusBadgeClass(etapa.estado)}`}>
                                  {etapa.estado}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: '700' }}>
                                {formatCurrency(etapa.presupuesto)}
                              </td>
                              <td style={{ textAlign: 'right', color: 'var(--accent-emerald)', fontWeight: '600' }}>
                                {formatCurrency(etapa.total_cobrado)}
                              </td>
                              <td style={{ textAlign: 'right', color: isOver ? 'var(--accent-rose)' : 'var(--text-main)', fontWeight: '600' }}>
                                {formatCurrency(etapa.total_gastado)}
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                  <div className="progress-bar-container" style={{ height: '6px' }}>
                                    <div className={`progress-bar-fill ${isOver ? 'danger' : 'normal'}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                                  </div>
                                  <span style={{ fontSize: '0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>{pct}%</span>
                                </div>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem' }}>
                                  <button className="btn-icon-only" onClick={() => onEditEtapa(etapa)} title="Editar etapa">
                                    <Edit2 size={14} />
                                  </button>
                                  <button className="btn-icon-only delete" onClick={() => onDeleteEtapa(etapa.id)} title="Eliminar etapa">
                                    <Trash2 size={14} />
                                  </button>
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
            )}

            {/* SUB-TAB 2: ENTREGAS DE DINERO DEL CLIENTE */}
            {activeSubTab === 'ingresos' && (
              <div className="panel-card" style={{ margin: 0 }}>
                <div className="panel-header" style={{ marginBottom: '1rem' }}>
                  <div className="panel-title">
                    <DollarSign size={20} color="var(--accent-emerald)" />
                    <span>Registro de Entregas y Pagos del Cliente</span>
                  </div>
                  <button className="btn btn-primary" style={{ background: 'linear-gradient(135deg, var(--accent-emerald), #059669)' }} onClick={() => onOpenNewIngreso(proyecto.id)}>
                    <Plus size={15} />
                    <span>Registrar Entrega de Dinero</span>
                  </button>
                </div>

                {ingresos.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2rem' }}>
                    <DollarSign size={36} className="empty-icon" />
                    <div className="empty-title">No hay entregas de dinero registradas</div>
                    <p>Registra las entregas del cliente en efectivo o banco para actualizar la tesorería.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Etapa Imputada</th>
                          <th>Concepto / Referencia</th>
                          <th>Cuenta Tesorería Acreditada</th>
                          <th style={{ textAlign: 'right' }}>Monto Entrega</th>
                          <th style={{ textAlign: 'center' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ingresos.map(ing => (
                          <tr key={ing.id}>
                            <td style={{ whiteSpace: 'nowrap' }}>{formatDate(ing.fecha)}</td>
                            <td>
                              {ing.etapa_nombre ? (
                                <span className="badge badge-neutral">{ing.etapa_nombre}</span>
                              ) : (
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Toda la Obra (General)</span>
                              )}
                            </td>
                            <td>{ing.concepto}</td>
                            <td>
                              {ing.cuenta_nombre ? (
                                <span style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Wallet size={12} /> {ing.cuenta_nombre}
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>-</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--accent-emerald)', whiteSpace: 'nowrap' }}>
                              {ing.moneda === 'USD' ? `US$ ${ing.monto.toLocaleString('es-AR')}` : formatCurrency(ing.monto)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button className="btn-icon-only delete" onClick={() => onDeleteIngreso(ing.id)} title="Eliminar cobro">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 3: GASTOS DE LA OBRA */}
            {activeSubTab === 'gastos' && (
              <div className="panel-card" style={{ margin: 0 }}>
                <div className="panel-header" style={{ marginBottom: '1rem' }}>
                  <div className="panel-title">
                    <Receipt size={20} color="var(--accent-rose)" />
                    <span>Comprobantes de Gasto de esta Obra ({filteredGastos.length})</span>
                  </div>
                  <button className="btn btn-primary" onClick={() => onOpenNewExpense(proyecto.id)}>
                    <Plus size={15} />
                    <span>Registrar Gasto</span>
                  </button>
                </div>

                {/* Filtros de Gastos */}
                {gastos.length > 0 && (
                  <div style={{
                    display: 'flex',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                    marginBottom: '1rem',
                    alignItems: 'center',
                    background: 'rgba(15, 23, 42, 0.4)',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="🔍 Buscar por descripción..." 
                        value={expenseSearchTerm} 
                        onChange={(e) => setExpenseSearchTerm(e.target.value)} 
                      />
                    </div>

                    <select 
                      className="form-control" 
                      style={{ width: 'auto', minWidth: '170px' }}
                      value={selectedCategoryFilter} 
                      onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    >
                      <option value="">🏷️ Categorías (Todas)</option>
                      {uniqueCategoriesInGastos.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>

                    <select 
                      className="form-control" 
                      style={{ width: 'auto', minWidth: '170px' }}
                      value={selectedEtapaFilter} 
                      onChange={(e) => setSelectedEtapaFilter(e.target.value)}
                    >
                      <option value="">📐 Etapas (Todas)</option>
                      {uniqueEtapasInGastos.map(etapa => (
                        <option key={etapa} value={etapa}>{etapa}</option>
                      ))}
                    </select>

                    {(selectedCategoryFilter || selectedEtapaFilter || expenseSearchTerm) && (
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }} 
                        onClick={() => {
                          setSelectedCategoryFilter('');
                          setSelectedEtapaFilter('');
                          setExpenseSearchTerm('');
                        }}
                      >
                        Limpiar Filtros
                      </button>
                    )}

                    <div style={{ marginLeft: 'auto', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      Total Filtrado: <strong style={{ color: 'var(--accent-rose)', fontSize: '1rem' }}>{formatCurrency(totalFilteredGastos)}</strong>
                    </div>
                  </div>
                )}

                {gastos.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2rem' }}>
                    <Receipt size={36} className="empty-icon" />
                    <div className="empty-title">No hay gastos imputados a esta obra</div>
                    <p>Utiliza el botón "Registrar Gasto" para asociar compras o subcontratos a este proyecto.</p>
                  </div>
                ) : filteredGastos.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2rem' }}>
                    <Receipt size={36} className="empty-icon" />
                    <div className="empty-title">Sin resultados con los filtros aplicados</div>
                    <p>Intenta seleccionar otra categoría o etapa, o borrar el término de búsqueda.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Etapa</th>
                          <th>Categoría</th>
                          <th>Descripción</th>
                          <th style={{ textAlign: 'right' }}>Monto</th>
                          <th style={{ textAlign: 'center' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredGastos.map(gasto => (
                          <tr key={gasto.id}>
                            <td style={{ whiteSpace: 'nowrap' }}>{formatDate(gasto.fecha_gasto)}</td>
                            <td>
                              {gasto.etapa_nombre ? (
                                <span className="badge badge-neutral">{gasto.etapa_nombre}</span>
                              ) : (
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>-</span>
                              )}
                            </td>
                            <td><span className="badge badge-active">{gasto.categoria_nombre}</span></td>
                            <td>{gasto.descripcion}</td>
                            <td style={{ textAlign: 'right', fontWeight: '700', color: gasto.moneda === 'USD' ? 'var(--accent-emerald)' : 'var(--accent-rose)', whiteSpace: 'nowrap' }}>
                              {gasto.moneda === 'USD' ? `US$ ${gasto.monto.toLocaleString('es-AR')}` : formatCurrency(gasto.monto)}
                              {gasto.moneda === 'USD' && <span className="badge badge-emerald" style={{ marginLeft: '0.35rem', fontSize: '0.7rem' }}>USD</span>}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button className="btn-icon-only delete" onClick={() => onDeleteExpense(gasto.id)} title="Eliminar gasto">
                                <Trash2 size={14} />
                              </button>
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
        )}

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

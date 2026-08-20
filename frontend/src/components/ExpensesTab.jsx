import { useState, useEffect } from 'react';
import { Receipt, Plus, Search, Edit2, Trash2, Filter, Wallet, HardHat, Briefcase } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function ExpensesTab({ 
  expenses, 
  projects, 
  categories, 
  onOpenNewExpense, 
  onEditExpense, 
  onDeleteExpense,
  initialSubTab = 'obras'
}) {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab); // 'obras', 'estudio', 'todos'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Sincronizar si cambia initialSubTab desde la navegación principal
  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
      setSelectedProject('');
      setSelectedCategory('');
    }
  }, [initialSubTab]);

  // Conteos globales
  const obrasCount = expenses.filter(g => !g.es_gasto_estudio).length;
  const estudioCount = expenses.filter(g => g.es_gasto_estudio).length;
  const totalCount = expenses.length;

  // Filtrado de gastos según sub-pestaña y filtros secundarios
  const filteredExpenses = expenses.filter(gasto => {
    // Filtro por sub-pestaña activa
    if (activeSubTab === 'obras' && gasto.es_gasto_estudio) return false;
    if (activeSubTab === 'estudio' && !gasto.es_gasto_estudio) return false;

    // Buscador general
    const matchesSearch = gasto.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (gasto.proyecto_nombre && gasto.proyecto_nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (gasto.categoria_nombre && gasto.categoria_nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filtro por proyecto (solo aplica cuando no estamos estrictamente en Estudio)
    const matchesProject = !selectedProject || gasto.proyecto_id === parseInt(selectedProject, 10);

    // Filtro por categoría
    const matchesCategory = !selectedCategory || gasto.categoria_id === parseInt(selectedCategory, 10);

    return matchesSearch && matchesProject && matchesCategory;
  });

  const totalFiltrado = filteredExpenses.reduce((acc, curr) => acc + (curr.monto || 0), 0);

  // Categorías filtradas según la sub-pestaña para mejorar la UX
  const availableCategories = categories.filter(c => {
    if (activeSubTab === 'obras') return !c.es_estudio;
    if (activeSubTab === 'estudio') return c.es_estudio;
    return true;
  });

  return (
    <div className="panel-card">
      {/* Encabezado del Panel según Sub-Pestaña Activa */}
      <div className="panel-header" style={{ marginBottom: '1.25rem' }}>
        <div className="panel-title">
          {activeSubTab === 'obras' && <HardHat size={22} color="var(--accent-amber)" />}
          {activeSubTab === 'estudio' && <Briefcase size={22} color="var(--accent-purple)" />}
          {activeSubTab === 'todos' && <Receipt size={22} color="var(--accent-rose)" />}
          
          <span>
            {activeSubTab === 'obras' && `Gastos de Obras (${filteredExpenses.length})`}
            {activeSubTab === 'estudio' && `Gastos Operativos del Estudio (${filteredExpenses.length})`}
            {activeSubTab === 'todos' && `Registro General de Gastos (${filteredExpenses.length})`}
          </span>
        </div>

        <button 
          className="btn btn-primary"
          style={{
            background: activeSubTab === 'estudio' 
              ? 'linear-gradient(135deg, var(--accent-purple), #9333ea)' 
              : activeSubTab === 'obras'
              ? 'linear-gradient(135deg, var(--accent-amber), #d97706)'
              : undefined
          }}
          onClick={() => onOpenNewExpense(activeSubTab === 'estudio')}
        >
          <Plus size={16} />
          <span>
            {activeSubTab === 'estudio' ? 'Registrar Gasto de Estudio' : activeSubTab === 'obras' ? 'Registrar Gasto de Obra' : 'Registrar Nuevo Gasto'}
          </span>
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder={
              activeSubTab === 'obras' 
                ? "Buscar por concepto, proveedor u obra..." 
                : activeSubTab === 'estudio'
                ? "Buscar por concepto, proveedor o categoría..."
                : "Buscar por concepto, proveedor o proyecto..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* El selector de proyectos solo tiene sentido en Obras o Todos */}
        {activeSubTab !== 'estudio' && (
          <select 
            className="select-filter"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="">Todos los Proyectos / Obras</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        )}

        <select 
          className="select-filter"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">Todas las Categorías</option>
          {availableCategories.map(c => (
            <option key={c.id} value={c.id}>
              {c.nombre} {c.es_estudio ? '(Estudio)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Banner Resumen Total del Filtro Activo */}
      <div style={{
        background: activeSubTab === 'estudio' 
          ? 'rgba(168, 85, 247, 0.1)' 
          : activeSubTab === 'obras'
          ? 'rgba(245, 158, 11, 0.1)'
          : 'rgba(15, 23, 42, 0.6)',
        padding: '0.85rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        border: activeSubTab === 'estudio' 
          ? '1px solid rgba(168, 85, 247, 0.3)' 
          : activeSubTab === 'obras'
          ? '1px solid rgba(245, 158, 11, 0.3)'
          : '1px solid var(--border-color)',
        marginBottom: '1.25rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color={activeSubTab === 'estudio' ? 'var(--accent-purple)' : 'var(--accent-amber)'} />
          Total gastado acumulado ({activeSubTab === 'obras' ? 'Obras' : activeSubTab === 'estudio' ? 'Estudio' : 'General'}):
        </span>
        <span style={{ 
          fontFamily: 'var(--font-heading)', 
          fontSize: '1.35rem', 
          fontWeight: '800', 
          color: activeSubTab === 'estudio' ? 'var(--accent-purple)' : activeSubTab === 'obras' ? 'var(--accent-amber)' : 'var(--accent-rose)' 
        }}>
          {formatCurrency(totalFiltrado)}
        </span>
      </div>

      {/* Listado de Gastos en Tabla */}
      {filteredExpenses.length === 0 ? (
        <div className="empty-state">
          <Receipt size={48} className="empty-icon" />
          <div className="empty-title">
            No hay gastos registrados en esta categoría ({activeSubTab === 'obras' ? 'Obras' : activeSubTab === 'estudio' ? 'Estudio' : 'Filtro actual'})
          </div>
          <p>Utiliza el botón para registrar nuevos comprobantes de {activeSubTab === 'estudio' ? 'gastos del estudio' : 'obras'}.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Fecha</th>
                {activeSubTab === 'todos' && <th>Tipo</th>}
                {activeSubTab !== 'estudio' && <th>Obra / Proyecto</th>}
                <th>Categoría</th>
                <th>Descripción / Concepto</th>
                <th>Pago desde Tesorería</th>
                <th style={{ textAlign: 'right' }}>Monto</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(gasto => (
                <tr key={gasto.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(gasto.fecha_gasto)}</td>
                  
                  {activeSubTab === 'todos' && (
                    <td>
                      {gasto.es_gasto_estudio ? (
                        <span className="badge badge-warning" style={{ background: 'rgba(168, 85, 247, 0.2)', color: 'var(--accent-purple)' }}>🏢 Estudio</span>
                      ) : (
                        <span className="badge badge-neutral" style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-amber)' }}>🏗️ Obra</span>
                      )}
                    </td>
                  )}

                  {activeSubTab !== 'estudio' && (
                    <td>
                      {gasto.es_gasto_estudio ? (
                        <span style={{ fontSize: '0.8rem', color: 'var(--accent-purple)' }}>🏢 Oficina / Estudio</span>
                      ) : (
                        <strong style={{ color: 'var(--text-main)' }}>🏗️ {gasto.proyecto_nombre}</strong>
                      )}
                    </td>
                  )}

                  <td><span className="badge badge-neutral">{gasto.categoria_nombre}</span></td>
                  <td>{gasto.descripcion}</td>
                  <td>
                    {gasto.cuenta_nombre ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Wallet size={12} /> {gasto.cuenta_nombre}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>-</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '700', color: gasto.moneda === 'USD' ? 'var(--accent-emerald)' : (gasto.es_gasto_estudio ? 'var(--accent-purple)' : 'var(--accent-amber)'), whiteSpace: 'nowrap' }}>
                    {gasto.moneda === 'USD' ? `US$ ${gasto.monto.toLocaleString('es-AR')}` : formatCurrency(gasto.monto)}
                    {gasto.moneda === 'USD' && <span className="badge badge-emerald" style={{ marginLeft: '0.35rem', fontSize: '0.7rem' }}>USD</span>}
                  </td>
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem' }}>
                      <button className="btn-icon-only" onClick={() => onEditExpense(gasto)} title="Editar gasto">
                        <Edit2 size={15} />
                      </button>
                      <button className="btn-icon-only delete" onClick={() => onDeleteExpense(gasto.id)} title="Eliminar gasto">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

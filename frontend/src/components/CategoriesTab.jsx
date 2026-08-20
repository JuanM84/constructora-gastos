import { Tag, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function CategoriesTab({ categories, onOpenNewCategory, onDeleteCategory }) {
  return (
    <div className="panel-card">
      <div className="panel-header">
        <div className="panel-title">
          <Tag size={22} color="var(--accent-amber)" />
          <span>Categorías de Gastos ({categories.length})</span>
        </div>
        <button className="btn btn-primary" onClick={onOpenNewCategory}>
          <Plus size={16} />
          <span>Nueva Categoría</span>
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="empty-state">
          <Tag size={48} className="empty-icon" />
          <div className="empty-title">No hay categorías registradas</div>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre de la Categoría</th>
                <th style={{ textAlign: 'center' }}>Registros Asociados</th>
                <th style={{ textAlign: 'right' }}>Total Acumulado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>#{cat.id}</td>
                  <td>
                    <span style={{ fontWeight: '600', color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Tag size={14} color="var(--accent-amber)" />
                      {cat.nombre}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge badge-neutral">{cat.total_registros || 0} comprobantes</span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--accent-amber)' }}>
                    {formatCurrency(cat.total_monto || 0)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      className="btn-icon-only delete" 
                      onClick={() => onDeleteCategory(cat.id)}
                      title={cat.total_registros > 0 ? "No se puede eliminar si tiene gastos asociados" : "Eliminar categoría"}
                    >
                      <Trash2 size={16} />
                    </button>
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

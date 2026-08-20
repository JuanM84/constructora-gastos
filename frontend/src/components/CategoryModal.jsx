import { useState } from 'react';
import { X, Tag } from 'lucide-react';

export default function CategoryModal({ isOpen, onClose, onSave }) {
  const [nombre, setNombre] = useState('');
  const [esEstudio, setEsEstudio] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    onSave({ nombre: nombre.trim(), es_estudio: esEstudio });
    setNombre('');
    setEsEstudio(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Tag size={20} color="var(--accent-amber)" />
            <span>Agregar Nueva Categoría</span>
          </div>
          <button className="btn-icon-only" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Nombre de la Categoría *</label>
              <input 
                type="text" 
                className="form-control"
                placeholder="Ej. Honorarios Profesionales, Alquileres, Encofrados..."
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group" style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <label className="form-label">Ámbito de la Categoría *</label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.35rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem', color: !esEstudio ? 'var(--accent-amber)' : 'var(--text-muted)' }}>
                  <input 
                    type="radio" 
                    name="es_estudio_cat" 
                    checked={!esEstudio} 
                    onChange={() => setEsEstudio(false)} 
                  />
                  <span>🏗️ Gasto de Obra / Proyecto</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem', color: esEstudio ? 'var(--accent-purple)' : 'var(--text-muted)' }}>
                  <input 
                    type="radio" 
                    name="es_estudio_cat" 
                    checked={esEstudio} 
                    onChange={() => setEsEstudio(true)} 
                  />
                  <span>🏢 Gasto del Estudio</span>
                </label>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Crear Categoría</button>
          </div>
        </form>
      </div>
    </div>
  );
}

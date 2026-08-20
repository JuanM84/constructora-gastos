import { useState, useEffect } from 'react';
import { X, Layers } from 'lucide-react';
import CurrencyInput from './CurrencyInput';

export default function EtapaModal({ isOpen, onClose, onSave, etapaToEdit }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [presupuesto, setPresupuesto] = useState('');
  const [orden, setOrden] = useState(1);
  const [estado, setEstado] = useState('En Curso');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (etapaToEdit) {
      setNombre(etapaToEdit.nombre || '');
      setDescripcion(etapaToEdit.descripcion || '');
      setPresupuesto(etapaToEdit.presupuesto || '');
      setOrden(etapaToEdit.orden || 1);
      setEstado(etapaToEdit.estado || 'En Curso');
      setFechaInicio(etapaToEdit.fecha_inicio ? etapaToEdit.fecha_inicio.split('T')[0] : '');
      setFechaFin(etapaToEdit.fecha_fin ? etapaToEdit.fecha_fin.split('T')[0] : '');
    } else {
      setNombre('');
      setDescripcion('');
      setPresupuesto('');
      setOrden(1);
      setEstado('En Curso');
      setFechaInicio(new Date().toISOString().split('T')[0]);
      setFechaFin('');
    }
  }, [etapaToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    onSave({
      id: etapaToEdit?.id,
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      presupuesto: parseFloat(presupuesto) || 0,
      orden: parseInt(orden, 10) || 1,
      estado,
      fecha_inicio: fechaInicio || null,
      fecha_fin: fechaFin || null
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={20} color="var(--accent-amber)" />
            <span>{etapaToEdit ? 'Editar Etapa / Fase' : 'Nueva Etapa del Proyecto'}</span>
          </div>
          <button className="btn-icon-only" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Nombre de la Etapa *</label>
              <input 
                type="text" 
                className="form-control"
                placeholder="Ej. Fase 1: Excavación y Cimientos"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Presupuesto de la Etapa ($) *</label>
                <CurrencyInput 
                  value={presupuesto}
                  onChange={(val) => setPresupuesto(val)}
                  placeholder="0,00"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Orden / N° Secuencia</label>
                <input 
                  type="number" 
                  min="1"
                  className="form-control"
                  value={orden}
                  onChange={(e) => setOrden(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Estado de la Etapa</label>
                <select 
                  className="form-control"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="En Curso">En Curso</option>
                  <option value="Completada">Completada</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Fecha Estimada Fin</label>
                <input 
                  type="date" 
                  className="form-control"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Descripción de Trabajos y Alcance</label>
              <textarea 
                className="form-control"
                rows="2"
                placeholder="Detalle de ítems, materiales o subcontratos incluidos en esta etapa..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              ></textarea>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, var(--accent-amber), #d97706)' }}>
              {etapaToEdit ? 'Guardar Cambios' : 'Crear Etapa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

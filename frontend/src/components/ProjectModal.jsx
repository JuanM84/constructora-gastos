import { useState, useEffect } from 'react';
import { X, Building2 } from 'lucide-react';
import CurrencyInput from './CurrencyInput';

export default function ProjectModal({ isOpen, onClose, onSave, projectToEdit, clients = [] }) {
  const [nombre, setNombre] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [presupuestoEstimado, setPresupuestoEstimado] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [estado, setEstado] = useState('Activo');
  const [clienteId, setClienteId] = useState('');

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!isOpen) return;
    if (projectToEdit) {
      setNombre(projectToEdit.nombre || '');
      setUbicacion(projectToEdit.ubicacion || '');
      setPresupuestoEstimado(projectToEdit.presupuesto_estimado || '');
      setFechaInicio(projectToEdit.fecha_inicio ? projectToEdit.fecha_inicio.split('T')[0] : '');
      setEstado(projectToEdit.estado || 'Activo');
      setClienteId(projectToEdit.cliente_id || '');
    } else {
      setNombre('');
      setUbicacion('');
      setPresupuestoEstimado('');
      setFechaInicio(new Date().toISOString().split('T')[0]);
      setEstado('Activo');
      setClienteId('');
    }
  }, [projectToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    onSave({
      id: projectToEdit?.id,
      nombre: nombre.trim(),
      ubicacion: ubicacion.trim(),
      presupuesto_estimado: parseFloat(presupuestoEstimado) || 0,
      fecha_inicio: fechaInicio,
      estado,
      cliente_id: clienteId ? parseInt(clienteId, 10) : null
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={20} color="var(--accent-amber)" />
            <span>{projectToEdit ? 'Editar Proyecto' : 'Nuevo Proyecto de Obra'}</span>
          </div>
          <button className="btn-icon-only" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Nombre del Proyecto / Obra *</label>
              <input 
                type="text" 
                className="form-control"
                placeholder="Ej. Torre Residencial Los Olivos"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Cliente / Comitente Asignado</label>
              <select 
                className="form-control"
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
              >
                <option value="">-- Sin Cliente Asignado --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.dni_cuit ? `(${c.dni_cuit})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Ubicación / Dirección</label>
              <input 
                type="text" 
                className="form-control"
                placeholder="Ej. Av. San Martín 1450, Barrio Norte"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Presupuesto Estimado ($)</label>
                <CurrencyInput 
                  value={presupuestoEstimado}
                  onChange={(val) => setPresupuestoEstimado(val)}
                  placeholder="0,00"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Fecha de Inicio</label>
                <input 
                  type="date" 
                  className="form-control"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Estado del Proyecto</label>
              <select 
                className="form-control"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              >
                <option value="Activo">Activo</option>
                <option value="En Pausa">En Pausa</option>
                <option value="Finalizado">Finalizado</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">
              {projectToEdit ? 'Guardar Cambios' : 'Crear Proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

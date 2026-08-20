import { useState, useEffect } from 'react';
import { X, Users } from 'lucide-react';

export default function ClientModal({ isOpen, onClose, onSave, clientToEdit }) {
  const [nombre, setNombre] = useState('');
  const [dniCuit, setDniCuit] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [notas, setNotas] = useState('');

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (clientToEdit) {
      setNombre(clientToEdit.nombre || '');
      setDniCuit(clientToEdit.dni_cuit || '');
      setTelefono(clientToEdit.telefono || '');
      setEmail(clientToEdit.email || '');
      setDireccion(clientToEdit.direccion || '');
      setNotas(clientToEdit.notas || '');
    } else {
      setNombre('');
      setDniCuit('');
      setTelefono('');
      setEmail('');
      setDireccion('');
      setNotas('');
    }
  }, [clientToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    onSave({
      id: clientToEdit?.id,
      nombre: nombre.trim(),
      dni_cuit: dniCuit.trim(),
      telefono: telefono.trim(),
      email: email.trim(),
      direccion: direccion.trim(),
      notas: notas.trim()
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={20} color="var(--accent-blue)" />
            <span>{clientToEdit ? 'Editar Cliente' : 'Nuevo Cliente / Comitente'}</span>
          </div>
          <button className="btn-icon-only" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Nombre / Razón Social *</label>
              <input 
                type="text" 
                className="form-control"
                placeholder="Ej. Fideicomiso Los Olivos S.A. / Juan Pérez"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">CUIT / DNI</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="30-12345678-9"
                  value={dniCuit}
                  onChange={(e) => setDniCuit(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="+54 11 4000-0000"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email de Contacto</label>
                <input 
                  type="email" 
                  className="form-control"
                  placeholder="contacto@cliente.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Dirección Fiscal / Domicilio</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Av. Santa Fe 1234, CABA"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notas Adicionales</label>
              <textarea 
                className="form-control"
                rows="2"
                placeholder="Observaciones sobre el contrato o representante de la firma..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
              ></textarea>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, var(--accent-blue), #2563eb)' }}>
              {clientToEdit ? 'Guardar Cambios' : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

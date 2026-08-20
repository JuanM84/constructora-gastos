import { useState, useEffect } from 'react';
import { X, User, Phone, Mail, FileText, Briefcase, DollarSign } from 'lucide-react';

export default function EmployeeModal({
  isOpen,
  onClose,
  onSave,
  employeeToEdit = null
}) {
  const [nombre, setNombre] = useState('');
  const [dniCuit, setDniCuit] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [puestoRol, setPuestoRol] = useState('');
  const [salarioBase, setSalarioBase] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (employeeToEdit) {
        setNombre(employeeToEdit.nombre || '');
        setDniCuit(employeeToEdit.dni_cuit || '');
        setTelefono(employeeToEdit.telefono || '');
        setEmail(employeeToEdit.email || '');
        setPuestoRol(employeeToEdit.puesto_rol || '');
        setSalarioBase(employeeToEdit.salario_base ? employeeToEdit.salario_base.toString() : '');
        setNotas(employeeToEdit.notas || '');
      } else {
        setNombre('');
        setDniCuit('');
        setTelefono('');
        setEmail('');
        setPuestoRol('');
        setSalarioBase('');
        setNotas('');
      }
      setErrorMsg('');
    }
  }, [isOpen, employeeToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nombre || !nombre.trim()) {
      setErrorMsg('El nombre completo o Razón Social es obligatorio.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        id: employeeToEdit ? employeeToEdit.id : undefined,
        nombre: nombre.trim(),
        dni_cuit: dniCuit.trim(),
        telefono: telefono.trim(),
        email: email.trim(),
        puesto_rol: puestoRol.trim(),
        salario_base: parseFloat(salarioBase) || 0,
        notas: notas.trim()
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar el empleado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <User size={24} color="var(--accent-blue)" />
            <h3 className="modal-title">
              {employeeToEdit ? 'Editar Empleado / Personal' : 'Nuevo Empleado / Personal'}
            </h3>
          </div>
          <button className="btn-icon-only" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            
            {errorMsg && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: 'var(--accent-rose)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                marginBottom: '1rem'
              }}>
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Nombre Completo */}
            <div className="form-group">
              <label className="form-label">Nombre y Apellido / Razón Social *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej: Carlos Gómez, Juan Pérez"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                autoFocus
              />
            </div>

            {/* Puesto / Rol & DNI/CUIT */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Puesto / Rol en la Constructora</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: Oficial Albañil, Capataz, Arq. Junior, Pintor..."
                  value={puestoRol}
                  onChange={(e) => setPuestoRol(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">DNI / CUIT</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: 20-34567890-9"
                  value={dniCuit}
                  onChange={(e) => setDniCuit(e.target.value)}
                />
              </div>
            </div>

            {/* Teléfono & Email */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: +54 9 11 2345-6789"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Salario Base / Honorarios Estimados */}
            <div className="form-group">
              <label className="form-label">Sueldo Base / Honorario Acordado ($)</label>
              <input
                type="number"
                step="any"
                className="form-control"
                placeholder="0.00"
                value={salarioBase}
                onChange={(e) => setSalarioBase(e.target.value)}
              />
            </div>

            {/* Notas */}
            <div className="form-group">
              <label className="form-label">Notas u Observaciones</label>
              <textarea
                className="form-control"
                rows="2"
                placeholder="Detalles del acuerdo laboral, especialidad o notas adicionales..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
              ></textarea>
            </div>

          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <User size={16} />
              <span>{loading ? 'Guardando...' : (employeeToEdit ? 'Guardar Cambios' : 'Crear Empleado')}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

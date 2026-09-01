import { HardHat, PlusCircle, DollarSign, Wallet, ArrowLeftRight, LogOut, User, Shield } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function Header({
  isOnline,
  tesoreriaAccounts = [],
  currentUser = null,
  onLogout,
  onOpenTesoreria,
  onOpenNewProject,
  onOpenNewExpense,
  onOpenNewMovimiento
}) {
  // Suma de cuentas según tipo (la cuenta Banco refleja la suma de TODAS las cuentas bancarias del estudio)
  const efecARS = tesoreriaAccounts.filter(a => a.tipo === 'efectivo_ars').reduce((acc, a) => acc + (parseFloat(a.saldo) || 0), 0);
  const efecUSD = tesoreriaAccounts.filter(a => a.tipo === 'efectivo_usd').reduce((acc, a) => acc + (parseFloat(a.saldo) || 0), 0);
  const bancoARS = tesoreriaAccounts.filter(a => a.tipo === 'banco_ars').reduce((acc, a) => acc + (parseFloat(a.saldo) || 0), 0);

  const isAdmin = currentUser?.rol === 'admin';

  return (
    <header className="app-header">
      <div className="header-inner" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div className="brand-logo">
          <div className="brand-icon">
            <HardHat size={26} />
          </div>
          <div className="brand-title">
            <span>ESTUDIO LK S.R.L.</span>
            <span className="brand-subtitle">Arquitectura & Construcción</span>
          </div>
        </div>

        {/* Bar de Balance General / Tesorería */}
        <div
          onClick={onOpenTesoreria}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '0.45rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
          title="Hacé clic para gestionar o ajustar los saldos de Tesorería"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Wallet size={16} color="var(--accent-emerald)" />
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tesorería:</span>
          </div>

          <div style={{ display: 'flex', gap: '0.85rem', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>💵 Ef. ARS:</span>
              <strong style={{ color: 'var(--accent-emerald)' }}>{formatCurrency(efecARS)}</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>💵 Ef. USD:</span>
              <strong style={{ color: 'var(--accent-amber)' }}>US$ {efecUSD.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>🏦 Bancos:</span>
              <strong style={{ color: 'var(--accent-blue)' }}>{formatCurrency(bancoARS)}</strong>
            </div>
          </div>
        </div>

        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className={`server-status ${isOnline ? '' : 'offline'}`}>
            <span className="status-dot"></span>
            <span>{isOnline ? 'Online' : 'Desconectado'}</span>
          </div>

          <button className="btn btn-secondary" onClick={onOpenNewProject}>
            <PlusCircle size={15} />
            <span>Nuevo Proyecto</span>
          </button>

          <button
            className="btn btn-secondary"
            style={{ border: '1px solid var(--accent-emerald)', color: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.12)' }}
            onClick={onOpenNewMovimiento}
          >
            <ArrowLeftRight size={15} />
            <span>Registrar Movimiento</span>
          </button>

          <button className="btn btn-primary" onClick={onOpenNewExpense}>
            <DollarSign size={15} />
            <span>Registrar Gasto</span>
          </button>

          {/* Perfil de Usuario y Logout */}
          {currentUser && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              marginLeft: '0.5rem',
              paddingLeft: '0.75rem',
              borderLeft: '1px solid rgba(255, 255, 255, 0.15)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: isAdmin ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '0.85rem'
                }}>
                  {currentUser.nombre?.charAt(0).toUpperCase() || <User size={16} />}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: '600', fontSize: '0.85rem', color: '#f8fafc', lineHeight: 1.2 }}>
                    {currentUser.nombre}
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    color: isAdmin ? '#fbbf24' : '#60a5fa',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem'
                  }}>
                    {isAdmin && <Shield size={10} />}
                    {isAdmin ? 'Admin' : 'Usuario'}
                  </span>
                </div>
              </div>

              <button
                onClick={onLogout}
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  padding: '0.45rem 0.65rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  marginLeft: '0.25rem'
                }}
                title="Cerrar Sesión"
              >
                <LogOut size={14} />
                <span>Salir</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

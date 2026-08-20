import { HardHat, PlusCircle, DollarSign, Wallet, ArrowLeftRight } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function Header({ isOnline, tesoreriaAccounts = [], onOpenTesoreria, onOpenNewProject, onOpenNewExpense, onOpenNewMovimiento }) {
  // Suma de cuentas según tipo (la cuenta Banco refleja la suma de TODAS las cuentas bancarias del estudio)
  const efecARS = tesoreriaAccounts.filter(a => a.tipo === 'efectivo_ars').reduce((acc, a) => acc + (parseFloat(a.saldo) || 0), 0);
  const efecUSD = tesoreriaAccounts.filter(a => a.tipo === 'efectivo_usd').reduce((acc, a) => acc + (parseFloat(a.saldo) || 0), 0);
  const bancoARS = tesoreriaAccounts.filter(a => a.tipo === 'banco_ars').reduce((acc, a) => acc + (parseFloat(a.saldo) || 0), 0);

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

        <div className="header-actions">
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
        </div>
      </div>
    </header>
  );
}

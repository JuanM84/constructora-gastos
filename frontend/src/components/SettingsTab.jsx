import { useState } from 'react';
import { Settings, Building2, Tag, Plus, Edit2, Trash2, Wallet, DollarSign, ArrowLeftRight, Shield } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import UsersTab from './UsersTab';

export default function SettingsTab({ 
  tesoreriaAccounts = [], 
  categories = [],
  currentUser = null,
  showToast,
  onOpenNewBankAccount,
  onEditBankAccount,
  onAdjustBalanceAccount,
  onDeleteBankAccount,
  onOpenNewCategory,
  onDeleteCategory,
  onOpenNewMovimiento
}) {
  const [subTab, setSubTab] = useState('bancos'); // 'bancos', 'categorias', 'usuarios'
  const isAdmin = currentUser?.rol === 'admin';

  // Totales
  const totalBancosARS = tesoreriaAccounts.filter(a => a.tipo === 'banco_ars').reduce((acc, a) => acc + (parseFloat(a.saldo) || 0), 0);
  const totalEfectivoARS = tesoreriaAccounts.filter(a => a.tipo === 'efectivo_ars').reduce((acc, a) => acc + (parseFloat(a.saldo) || 0), 0);
  const totalEfectivoUSD = tesoreriaAccounts.filter(a => a.tipo === 'efectivo_usd').reduce((acc, a) => acc + (parseFloat(a.saldo) || 0), 0);
  const totalGeneralARS = totalBancosARS + totalEfectivoARS;

  return (
    <div className="panel-card">
      <div className="panel-header">
        <div className="panel-title">
          <Settings size={22} color="var(--accent-purple)" />
          <span>Configuración del Sistema</span>
        </div>
      </div>

      {/* Navegación interna entre Cuentas Bancarias, Categorías y Usuarios (Admin) */}
      <div className="nav-tabs" style={{ marginBottom: '1.5rem' }}>
        <button 
          className={`tab-btn ${subTab === 'bancos' ? 'active' : ''}`}
          onClick={() => setSubTab('bancos')}
        >
          <Building2 size={16} />
          <span>Cuentas Bancarias y Tesorería ({tesoreriaAccounts.length})</span>
        </button>

        <button 
          className={`tab-btn ${subTab === 'categorias' ? 'active' : ''}`}
          onClick={() => setSubTab('categorias')}
        >
          <Tag size={16} />
          <span>Categorías de Gastos ({categories.length})</span>
        </button>

        {isAdmin && (
          <button 
            className={`tab-btn admin-tab ${subTab === 'usuarios' ? 'active' : ''}`}
            onClick={() => setSubTab('usuarios')}
          >
            <Shield size={16} />
            <span>Gestión de Usuarios (Admin)</span>
          </button>
        )}
      </div>

      {/* SECCION 1: CUENTAS BANCARIAS Y TESORERIA */}
      {subTab === 'bancos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Tarjetas de Resumen de Cuentas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Total en Bancos (Suma)</div>
                <div className="stat-value" style={{ color: 'var(--accent-blue)', fontSize: '1.35rem' }}>
                  {formatCurrency(totalBancosARS)}
                </div>
                <div className="stat-sub">{tesoreriaAccounts.filter(a => a.tipo.startsWith('banco')).length} cuentas bancarias activas</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Efectivo Pesos (Caja)</div>
                <div className="stat-value" style={{ color: 'var(--accent-emerald)', fontSize: '1.35rem' }}>
                  {formatCurrency(totalEfectivoARS)}
                </div>
                <div className="stat-sub">Caja chica y efectivo</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Efectivo Dólares (Caja USD)</div>
                <div className="stat-value" style={{ color: 'var(--accent-amber)', fontSize: '1.35rem' }}>
                  US$ {totalEfectivoUSD.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </div>
                <div className="stat-sub">Reserva billetes dólares</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Total Liquidez Pesos</div>
                <div className="stat-value" style={{ color: 'var(--accent-purple)', fontSize: '1.35rem' }}>
                  {formatCurrency(totalGeneralARS)}
                </div>
                <div className="stat-sub">Bancos + Cajas ARS</div>
              </div>
            </div>
          </div>

          {/* Encabezado con Botón Crear */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Listado de Cuentas Bancarias y Cajas</h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Podés crear múltiples cuentas corrientes, cajas de ahorro o billeteras virtuales (Mercado Pago, etc.).
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                className="btn btn-secondary" 
                style={{ border: '1px solid var(--accent-emerald)', color: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.12)' }}
                onClick={onOpenNewMovimiento}
              >
                <ArrowLeftRight size={16} />
                <span>Registrar Movimiento / Transferencia</span>
              </button>

              <button className="btn btn-primary" onClick={onOpenNewBankAccount}>
                <Plus size={16} />
                <span>Nueva Cuenta Bancaria</span>
              </button>
            </div>
          </div>

          {/* Grilla de Cuentas Bancarias */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {tesoreriaAccounts.map(account => {
              const isBanco = account.tipo.startsWith('banco');
              const isUSD = account.moneda === 'USD';

              return (
                <div 
                  key={account.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.55)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-main)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isBanco ? <Building2 size={20} color="var(--accent-blue)" /> : <Wallet size={20} color="var(--accent-emerald)" />}
                        <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)' }}>{account.nombre}</h4>
                      </div>
                      <span className={`badge ${isUSD ? 'badge-warning' : 'badge-active'}`}>
                        {account.moneda}
                      </span>
                    </div>

                    {account.banco_nombre && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        Entidad: <strong style={{ color: 'var(--text-main)' }}>{account.banco_nombre}</strong>
                      </div>
                    )}

                    {account.numero_cuenta_cbu && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontFamily: 'monospace' }}>
                        CBU/CVU: {account.numero_cuenta_cbu}
                      </div>
                    )}

                    <div style={{
                      background: 'rgba(30, 41, 59, 0.7)',
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-md)',
                      marginTop: '0.75rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Saldo Disponible</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: '800', color: isUSD ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
                        {isUSD ? `US$ ${account.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : formatCurrency(account.saldo)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                      onClick={() => onAdjustBalanceAccount(account)}
                    >
                      <DollarSign size={13} />
                      <span>Ajustar Saldo</span>
                    </button>

                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button className="btn-icon-only" onClick={() => onEditBankAccount(account)} title="Editar datos de la cuenta">
                        <Edit2 size={15} />
                      </button>
                      <button className="btn-icon-only delete" onClick={() => onDeleteBankAccount(account.id)} title="Eliminar cuenta">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* SECCION 2: CATEGORIAS DE GASTOS */}
      {subTab === 'categorias' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Categorías de Gastos</h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Organiza las compras por categorías tanto para proyectos de obra como para la gestión del estudio.
              </div>
            </div>
            <button className="btn btn-primary" onClick={onOpenNewCategory}>
              <Plus size={16} />
              <span>Nueva Categoría</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {categories.map((cat) => (
              <div 
                key={cat.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  boxShadow: 'var(--shadow-main)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <Tag size={18} color={cat.es_estudio ? 'var(--accent-purple)' : 'var(--accent-amber)'} />
                    <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>{cat.nombre}</h4>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {cat.es_estudio ? (
                      <span className="badge badge-warning" style={{ background: 'rgba(168, 85, 247, 0.15)', color: 'var(--accent-purple)', borderColor: 'var(--accent-purple)' }}>🏢 Gasto del Estudio</span>
                    ) : (
                      <span className="badge badge-active">🏗️ Gasto de Obra</span>
                    )}
                    <span style={{ marginLeft: '0.5rem' }}>{cat.total_registros || 0} comprobantes</span>
                  </div>
                </div>

                <button 
                  className="btn-icon-only delete"
                  onClick={() => onDeleteCategory(cat.id)}
                  title="Eliminar categoría"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECCION 3: GESTION DE USUARIOS (Exclusivo Administradores) */}
      {subTab === 'usuarios' && isAdmin && (
        <UsersTab showToast={showToast} />
      )}

    </div>
  );
}

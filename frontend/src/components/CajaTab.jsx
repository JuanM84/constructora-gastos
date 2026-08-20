import { useState, useEffect } from 'react';
import { Wallet, HardHat, Briefcase, Receipt, ArrowLeftRight, DollarSign } from 'lucide-react';
import ExpensesTab from './ExpensesTab';
import MovementsTab from './MovementsTab';
import IncomeTab from './IncomeTab';

export default function CajaTab({
  expenses = [],
  projects = [],
  categories = [],
  movimientos = [],
  ingresos = [],
  tesoreriaAccounts = [],
  initialSubTab = 'obras',
  onOpenNewExpense,
  onEditExpense,
  onDeleteExpense,
  onOpenNewMovimiento,
  onOpenNewIncome,
  onDeleteIncome
}) {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const obrasCount = expenses.filter(g => !g.es_gasto_estudio).length;
  const estudioCount = expenses.filter(g => g.es_gasto_estudio).length;
  const ingresosCount = ingresos.length;
  const todosCount = expenses.length;
  const movimientosCount = movimientos.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Encabezado General de Caja y Sub-Pestañas */}
      <div className="panel-card" style={{ padding: '1.25rem 1.5rem', marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
              <Wallet size={26} color="var(--accent-emerald)" />
              <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
                Gestión de Caja, Gastos & Movimientos
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Módulo central de tesorería: auditoría de gastos de obras, gastos del estudio, ingresos varios y movimientos de cuentas bancarias/efectivo.
            </p>
          </div>
        </div>

        {/* Sub-Pestañas de la página /caja */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '1rem',
          flexWrap: 'wrap'
        }}>
          <button 
            onClick={() => setActiveSubTab('obras')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.35rem',
              borderRadius: 'var(--radius-md)',
              border: activeSubTab === 'obras' ? '1px solid var(--accent-amber)' : '1px solid var(--border-color)',
              background: activeSubTab === 'obras' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(15, 23, 42, 0.6)',
              color: activeSubTab === 'obras' ? 'var(--accent-amber)' : 'var(--text-muted)',
              fontWeight: activeSubTab === 'obras' ? '700' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '0.92rem'
            }}
          >
            <HardHat size={18} />
            <span>Gastos de Obra ({obrasCount})</span>
          </button>

          <button 
            onClick={() => setActiveSubTab('estudio')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.35rem',
              borderRadius: 'var(--radius-md)',
              border: activeSubTab === 'estudio' ? '1px solid var(--accent-purple)' : '1px solid var(--border-color)',
              background: activeSubTab === 'estudio' ? 'rgba(168, 85, 247, 0.18)' : 'rgba(15, 23, 42, 0.6)',
              color: activeSubTab === 'estudio' ? 'var(--accent-purple)' : 'var(--text-muted)',
              fontWeight: activeSubTab === 'estudio' ? '700' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '0.92rem'
            }}
          >
            <Briefcase size={18} />
            <span>Gastos de Estudio ({estudioCount})</span>
          </button>

          <button 
            onClick={() => setActiveSubTab('ingresos')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.35rem',
              borderRadius: 'var(--radius-md)',
              border: activeSubTab === 'ingresos' ? '1px solid var(--accent-emerald)' : '1px solid var(--border-color)',
              background: activeSubTab === 'ingresos' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(15, 23, 42, 0.6)',
              color: activeSubTab === 'ingresos' ? 'var(--accent-emerald)' : 'var(--text-muted)',
              fontWeight: activeSubTab === 'ingresos' ? '700' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '0.92rem'
            }}
          >
            <DollarSign size={18} />
            <span>Ingresos ({ingresosCount})</span>
          </button>

          <button 
            onClick={() => setActiveSubTab('todos')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.35rem',
              borderRadius: 'var(--radius-md)',
              border: activeSubTab === 'todos' ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
              background: activeSubTab === 'todos' ? 'rgba(59, 130, 246, 0.18)' : 'rgba(15, 23, 42, 0.6)',
              color: activeSubTab === 'todos' ? 'var(--accent-blue)' : 'var(--text-muted)',
              fontWeight: activeSubTab === 'todos' ? '700' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '0.92rem'
            }}
          >
            <Receipt size={18} />
            <span>Ver Todos los Gastos ({todosCount})</span>
          </button>

          <button 
            onClick={() => setActiveSubTab('movimientos')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.35rem',
              borderRadius: 'var(--radius-md)',
              border: activeSubTab === 'movimientos' ? '1px solid var(--accent-emerald)' : '1px solid var(--border-color)',
              background: activeSubTab === 'movimientos' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(15, 23, 42, 0.6)',
              color: activeSubTab === 'movimientos' ? 'var(--accent-emerald)' : 'var(--text-muted)',
              fontWeight: activeSubTab === 'movimientos' ? '700' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '0.92rem'
            }}
          >
            <ArrowLeftRight size={18} />
            <span>Movimientos de Tesoreria ({movimientosCount})</span>
          </button>
        </div>
      </div>

      {/* Renderizado del contenido según la sub-pestaña activa */}
      {(activeSubTab === 'obras' || activeSubTab === 'estudio' || activeSubTab === 'todos') && (
        <ExpensesTab 
          expenses={expenses}
          projects={projects}
          categories={categories}
          initialSubTab={activeSubTab}
          onOpenNewExpense={onOpenNewExpense}
          onEditExpense={onEditExpense}
          onDeleteExpense={onDeleteExpense}
        />
      )}

      {activeSubTab === 'ingresos' && (
        <IncomeTab 
          ingresos={ingresos}
          projects={projects}
          tesoreriaAccounts={tesoreriaAccounts}
          onOpenNewIncome={onOpenNewIncome}
          onDeleteIncome={onDeleteIncome}
        />
      )}

      {activeSubTab === 'movimientos' && (
        <MovementsTab 
          movimientos={movimientos}
          tesoreriaAccounts={tesoreriaAccounts}
          onOpenNewMovimiento={onOpenNewMovimiento}
        />
      )}
    </div>
  );
}

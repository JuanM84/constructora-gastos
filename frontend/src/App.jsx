import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import DashboardTab from './components/DashboardTab';
import ProjectsTab from './components/ProjectsTab';
import ExpensesTab from './components/ExpensesTab';
import SettingsTab from './components/SettingsTab';
import ClientsTab from './components/ClientsTab';
import MovementsTab from './components/MovementsTab';
import CajaTab from './components/CajaTab';

import EmployeesTab from './components/EmployeesTab';
import StatisticsTab from './components/StatisticsTab';
import UsersTab from './components/UsersTab';
import LoginScreen from './components/LoginScreen';
import { getCurrentUser, clearAuthData, authFetch } from './utils/auth';

import ProjectModal from './components/ProjectModal';
import ProjectDetailModal from './components/ProjectDetailModal';
import EtapaModal from './components/EtapaModal';
import IngresoClienteModal from './components/IngresoClienteModal';
import ExpenseModal from './components/ExpenseModal';
import CategoryModal from './components/CategoryModal';
import BankAccountModal from './components/BankAccountModal';
import ClientModal from './components/ClientModal';
import TesoreriaModal from './components/TesoreriaModal';
import MovimientoModal from './components/MovimientoModal';
import NewIncomeModal from './components/NewIncomeModal';
import EmployeeModal from './components/EmployeeModal';
import EmployeePaymentModal from './components/EmployeePaymentModal';
import EmployeeAccountModal from './components/EmployeeAccountModal';
import NotificationToast from './components/NotificationToast';

import {
  LayoutDashboard,
  Building2,
  Receipt,
  Settings,
  Users,
  UserCheck,
  ArrowLeftRight,
  HardHat,
  Briefcase,
  Wallet,
  BarChart3,
  Shield
} from 'lucide-react';
import { API_BASE } from './config';

function App() {
  const [currentUser, setCurrentUser] = useState(getCurrentUser);

  const handleLogout = () => {
    clearAuthData();
    setCurrentUser(null);
  };

  const getTabFromPath = () => {
    const p = window.location.pathname;
    if (p === '/caja') return 'caja';
    if (p === '/proyectos') return 'proyectos';
    if (p === '/clientes') return 'clientes';
    if (p === '/empleados') return 'empleados';
    if (p === '/estadisticas') return 'estadisticas';
    if (p === '/configuracion') return 'configuracion';
    if (p === '/usuarios') return 'usuarios';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath);

  const [cajaSubTab, setCajaSubTab] = useState('obras');

  const navigateTab = useCallback((tab, subTab = null) => {
    setActiveTab(tab);
    if (subTab) setCajaSubTab(subTab);
    let path = '/';
    if (tab === 'caja') path = '/caja';
    else if (tab === 'proyectos') path = '/proyectos';
    else if (tab === 'clientes') path = '/clientes';
    else if (tab === 'empleados') path = '/empleados';
    else if (tab === 'estadisticas') path = '/estadisticas';
    else if (tab === 'configuracion') path = '/configuracion';
    else if (tab === 'usuarios') path = '/usuarios';

    if (window.location.pathname !== path) {
      window.history.pushState({ tab, subTab }, '', path);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getTabFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [isOnline, setIsOnline] = useState(true);

  // Estados de datos
  const [summary, setSummary] = useState(null);
  const [projects, setProjects] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [clients, setClients] = useState([]);
  const [tesoreriaAccounts, setTesoreriaAccounts] = useState([]);
  const [allMovements, setAllMovements] = useState([]);
  const [ingresos, setIngresos] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Modales principales
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);

  // Modal de Detalle de Proyecto & Etapas & Entregas de Cliente
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [isProjectDetailOpen, setIsProjectDetailOpen] = useState(false);

  // Modales de Etapas e Ingresos de Cliente
  const [isEtapaModalOpen, setIsEtapaModalOpen] = useState(false);
  const [etapaToEdit, setEtapaToEdit] = useState(null);
  const [targetProjectIdForEtapa, setTargetProjectIdForEtapa] = useState(null);

  const [isIngresoModalOpen, setIsIngresoModalOpen] = useState(false);
  const [targetProjectIdForIngreso, setTargetProjectIdForIngreso] = useState(null);
  const [projectEtapasForIngreso, setProjectEtapasForIngreso] = useState([]);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [defaultExpenseProjectId, setDefaultExpenseProjectId] = useState(null);
  const [defaultExpenseEsEstudio, setDefaultExpenseEsEstudio] = useState(false);

  const handleOpenNewExpense = (esEstudio = false) => {
    setExpenseToEdit(null);
    setDefaultExpenseProjectId(null);
    setDefaultExpenseEsEstudio(!!esEstudio);
    setIsExpenseModalOpen(true);
  };

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Modal de Cuentas Bancarias
  const [isBankAccountModalOpen, setIsBankAccountModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState(null);

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState(null);

  const [isTesoreriaModalOpen, setIsTesoreriaModalOpen] = useState(false);
  const [isMovimientoModalOpen, setIsMovimientoModalOpen] = useState(false);
  const [cambioToEdit, setCambioToEdit] = useState(null);
  const [isNewIncomeModalOpen, setIsNewIncomeModalOpen] = useState(false);
  const [incomeToEdit, setIncomeToEdit] = useState(null);

  // Modales de empleados
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState(null);
  const [isEmployeePaymentModalOpen, setIsEmployeePaymentModalOpen] = useState(false);
  const [selectedEmployeeForPayment, setSelectedEmployeeForPayment] = useState(null);
  const [isEmployeeAccountModalOpen, setIsEmployeeAccountModalOpen] = useState(false);
  const [selectedEmployeeForAccount, setSelectedEmployeeForAccount] = useState(null);

  // Notificaciones Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Trigger de actualización en tiempo real para modales
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);

  // Carga masiva de datos desde el backend
  const loadAllData = useCallback(async () => {
    if (!getCurrentUser()) return;
    try {
      const [sumRes, proyRes, gasRes, catRes, cliRes, tesRes, movRes, ingRes, empRes] = await Promise.all([
        authFetch(`${API_BASE}/dashboard/summary`),
        authFetch(`${API_BASE}/proyectos`),
        authFetch(`${API_BASE}/gastos`),
        authFetch(`${API_BASE}/categorias`),
        authFetch(`${API_BASE}/clientes`),
        authFetch(`${API_BASE}/tesoreria`),
        authFetch(`${API_BASE}/tesoreria/movimientos`),
        authFetch(`${API_BASE}/ingresos`),
        authFetch(`${API_BASE}/empleados`)
      ]);


      if (sumRes.ok && proyRes.ok && gasRes.ok && catRes.ok && cliRes.ok && tesRes.ok && movRes.ok && ingRes.ok && empRes.ok) {
        const sumData = await sumRes.json();
        const proyData = await proyRes.json();
        const gasData = await gasRes.json();
        const catData = await catRes.json();
        const cliData = await cliRes.json();
        const tesData = await tesRes.json();
        const movData = await movRes.json();
        const ingData = await ingRes.json();
        const empData = await empRes.json();

        setSummary(sumData);
        setProjects(proyData);
        setExpenses(gasData);
        setCategories(catData);
        setClients(cliData);
        setTesoreriaAccounts(tesData.cuentas || []);
        setAllMovements(movData);
        setIngresos(ingData);
        setEmployees(empData);
        setIsOnline(true);

        // Incrementar key para refrescar automáticamente el modal de detalle si está abierto
        setDetailRefreshKey(prev => prev + 1);
      } else {
        setIsOnline(false);
      }
    } catch (error) {
      console.error('Error al conectar con la API de Node/PostgreSQL:', error);
      setIsOnline(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // --------------------------------------------------
  // ACCIONES DE DETALLE DE PROYECTO & ETAPAS
  // --------------------------------------------------
  const handleOpenProjectDetail = (projectId) => {
    setSelectedProjectId(projectId);
    setIsProjectDetailOpen(true);
  };

  const handleOpenNewEtapa = (projectId) => {
    setTargetProjectIdForEtapa(projectId);
    setEtapaToEdit(null);
    setIsEtapaModalOpen(true);
  };

  const handleOpenEditEtapa = (etapa) => {
    setEtapaToEdit(etapa);
    setTargetProjectIdForEtapa(etapa.proyecto_id);
    setIsEtapaModalOpen(true);
  };

  const handleSaveEtapa = async (etapaData) => {
    const isEdit = !!etapaData.id;
    const url = isEdit
      ? `${API_BASE}/etapas/${etapaData.id}`
      : `${API_BASE}/proyectos/${targetProjectIdForEtapa}/etapas`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(etapaData)
      });

      if (res.ok) {
        showToast(isEdit ? '¡Etapa del proyecto modificada con éxito!' : '¡Etapa creada con éxito!');
        setIsEtapaModalOpen(false);
        setEtapaToEdit(null);
        loadAllData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al guardar la etapa', 'error');
      }
    } catch (error) {
      showToast('Error de conexión al servidor', 'error');
    }
  };

  const handleDeleteEtapa = async (etapaId) => {
    if (!window.confirm('¿Deseas eliminar esta etapa del proyecto?')) return;

    try {
      const res = await fetch(`${API_BASE}/etapas/${etapaId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Etapa eliminada correctamente');
        loadAllData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al eliminar la etapa', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    }
  };

  // --------------------------------------------------
  // ACCIONES DE ENTREGAS / COBROS DE CLIENTE
  // --------------------------------------------------
  const handleOpenNewIngreso = async (projectId) => {
    setTargetProjectIdForIngreso(projectId);
    try {
      const res = await fetch(`${API_BASE}/proyectos/${projectId}/detalle`);
      if (res.ok) {
        const data = await res.json();
        setProjectEtapasForIngreso(data.etapas || []);
      }
    } catch (err) {
      setProjectEtapasForIngreso([]);
    }
    setIsIngresoModalOpen(true);
  };

  const handleSaveIngreso = async (ingresoData) => {
    try {
      const res = await fetch(`${API_BASE}/proyectos/${targetProjectIdForIngreso}/ingresos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ingresoData)
      });

      if (res.ok) {
        showToast('¡Entrega de dinero registrada e ingresada a Tesorería!');
        setIsIngresoModalOpen(false);
        loadAllData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al registrar la entrega de dinero', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    }
  };

  const handleSaveNewIncome = async (incomeData) => {
    const isEdit = !!incomeData.id;
    const url = isEdit ? `${API_BASE}/ingresos/${incomeData.id}` : `${API_BASE}/ingresos`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incomeData)
      });

      if (res.ok) {
        showToast(isEdit ? '¡Ingreso modificado con éxito!' : '¡Ingreso registrado e ingresado a Tesorería!');
        setIsNewIncomeModalOpen(false);
        setIncomeToEdit(null);
        loadAllData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al guardar el ingreso', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    }
  };

  const handleDeleteIncome = async (ingresoId) => {
    if (!window.confirm('¿Deseas eliminar este ingreso y ajustar el saldo de tesorería?')) return;

    try {
      const res = await fetch(`${API_BASE}/ingresos/${ingresoId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Ingreso eliminado correctamente');
        loadAllData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al eliminar el ingreso', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    }
  };

  // --------------------------------------------------
  // ACCIONES DE EMPLEADOS & PAGOS & CUENTA CORRIENTE
  // --------------------------------------------------
  const handleSaveEmployee = async (employeeData) => {
    const isEdit = !!employeeData.id;
    const url = isEdit ? `${API_BASE}/empleados/${employeeData.id}` : `${API_BASE}/empleados`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeData)
      });

      if (res.ok) {
        showToast(isEdit ? '¡Empleado modificado con éxito!' : '¡Empleado creado con éxito!');
        setIsEmployeeModalOpen(false);
        setEmployeeToEdit(null);
        loadAllData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al guardar el empleado', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (!window.confirm('¿Deseas eliminar este empleado?')) return;

    try {
      const res = await fetch(`${API_BASE}/empleados/${employeeId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Empleado eliminado correctamente');
        loadAllData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al eliminar empleado', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    }
  };

  const handleSaveEmployeePayment = async (paymentData) => {
    try {
      const res = await fetch(`${API_BASE}/empleados/${paymentData.empleado_id}/pagos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      if (res.ok) {
        showToast('¡Pago a empleado registrado exitosamente!');
        setIsEmployeePaymentModalOpen(false);
        loadAllData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al registrar el pago', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    }
  };

  const handleDeleteEmployeePayment = async (paymentId) => {
    if (!window.confirm('¿Deseas eliminar este registro de pago y reintegrar el monto a la tesorería?')) return;

    try {
      const res = await fetch(`${API_BASE}/pagos-empleados/${paymentId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Registro de pago eliminado y saldo reintegrado correctamente');
        loadAllData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al eliminar el pago', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    }
  };

  const handleDeleteIngreso = async (ingresoId) => {
    if (!window.confirm('¿Deseas eliminar este registro de entrega del cliente? Se reajustará el saldo de Tesorería.')) return;

    try {
      const res = await fetch(`${API_BASE}/ingresos/${ingresoId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Entrega de cliente eliminada');
        loadAllData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al eliminar la entrega de dinero', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    }
  };

  // --------------------------------------------------
  // ACCIONES DE TESORERÍA / CUENTAS BANCARIAS
  // --------------------------------------------------
  const handleSaveBankAccount = async (accountData) => {
    const isEdit = !!accountData.id;
    const url = isEdit ? `${API_BASE}/tesoreria/${accountData.id}` : `${API_BASE}/tesoreria`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData)
      });

      if (res.ok) {
        showToast(isEdit ? '¡Cuenta bancaria modificada con éxito!' : '¡Cuenta bancaria creada con éxito!');
        setIsBankAccountModalOpen(false);
        setAccountToEdit(null);
        loadAllData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al guardar la cuenta bancaria', 'error');
      }
    } catch (error) {
      showToast('Error de conexión al servidor', 'error');
    }
  };

  const handleDeleteBankAccount = async (id) => {
    if (!window.confirm('¿Deseas eliminar esta cuenta de tesorería?')) return;

    try {
      const res = await fetch(`${API_BASE}/tesoreria/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Cuenta eliminada correctamente');
        loadAllData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al eliminar la cuenta bancaria', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    }
  };

  const handleUpdateTesoreriaBalance = async ({ cuentaId, saldo, concepto }) => {
    try {
      const res = await fetch(`${API_BASE}/tesoreria/${cuentaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saldo, concepto })
      });

      if (res.ok) {
        showToast('¡Saldo de Tesorería actualizado exitosamente!');
        setIsTesoreriaModalOpen(false);
        loadAllData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al actualizar tesorería', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    }
  };

  // --------------------------------------------------
  // ACCIONES PARA CLIENTES
  // --------------------------------------------------
  const handleSaveClient = async (clientData) => {
    const isEdit = !!clientData.id;
    const url = isEdit ? `${API_BASE}/clientes/${clientData.id}` : `${API_BASE}/clientes`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData)
      });

      if (res.ok) {
        showToast(isEdit ? '¡Cliente modificado con éxito!' : '¡Cliente creado correctamente!');
        setIsClientModalOpen(false);
        setClientToEdit(null);
        loadAllData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al guardar el cliente', 'error');
      }
    } catch (error) {
      showToast('Error de conexión al servidor', 'error');
    }
  };

  const handleDeleteClient = async (id) => {
    if (!window.confirm('¿Deseas eliminar este cliente? Los proyectos asociados pasarán a estar sin cliente asignado.')) return;

    try {
      const res = await fetch(`${API_BASE}/clientes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Cliente eliminado correctamente');
        loadAllData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al eliminar cliente', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    }
  };

  // --------------------------------------------------
  // ACCIONES PARA PROYECTOS
  // --------------------------------------------------
  const handleSaveProject = async (projectData) => {
    const isEdit = !!projectData.id;
    const url = isEdit ? `${API_BASE}/proyectos/${projectData.id}` : `${API_BASE}/proyectos`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });

      if (res.ok) {
        showToast(isEdit ? '¡Proyecto actualizado con éxito!' : '¡Proyecto creado con éxito!');
        setIsProjectModalOpen(false);
        setProjectToEdit(null);
        loadAllData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al guardar el proyecto', 'error');
      }
    } catch (error) {
      showToast('Error de conexión al servidor', 'error');
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este proyecto? Todos los gastos asociados también se eliminarán.')) return;

    try {
      const res = await fetch(`${API_BASE}/proyectos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Proyecto eliminado correctamente');
        loadAllData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al eliminar proyecto', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    }
  };

  // --------------------------------------------------
  // ACCIONES PARA GASTOS
  // --------------------------------------------------
  const handleSaveExpense = async (expenseData) => {
    const isEdit = !!expenseData.id;
    const url = isEdit ? `${API_BASE}/gastos/${expenseData.id}` : `${API_BASE}/gastos`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData)
      });

      if (res.ok) {
        showToast(isEdit ? '¡Gasto modificado correctamente!' : '¡Gasto registrado con éxito!');
        setIsExpenseModalOpen(false);
        setExpenseToEdit(null);
        setDefaultExpenseProjectId(null);
        loadAllData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al guardar el gasto', 'error');
      }
    } catch (error) {
      showToast('Error de conexión al servidor', 'error');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('¿Deseas eliminar este comprobante de gasto?')) return;

    try {
      const res = await fetch(`${API_BASE}/gastos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Gasto eliminado correctamente');
        loadAllData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al eliminar el gasto', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    }
  };

  // --------------------------------------------------
  // ACCIONES PARA CATEGORIAS
  // --------------------------------------------------
  const handleSaveCategory = async (catData) => {
    const payload = typeof catData === 'string' ? { nombre: catData, es_estudio: false } : catData;

    try {
      const res = await fetch(`${API_BASE}/categorias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('¡Categoría agregada exitosamente!');
        setIsCategoryModalOpen(false);
        loadAllData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al crear la categoría', 'error');
      }
    } catch (error) {
      showToast('Error de conexión al servidor', 'error');
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/categorias/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Categoría eliminada');
        loadAllData();
      } else {
        const err = await res.json();
        showToast(err.error || 'No se pudo eliminar la categoría', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    }
  };

  const handleSaveMovimiento = async (movData) => {
    try {
      const res = await fetch(`${API_BASE}/tesoreria/movimiento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movData)
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Error al procesar movimiento', 'error');
        return;
      }

      showToast(`¡Movimiento registrado! Salida de ${data.cuenta_origen} ➔ Entrada en ${data.cuenta_destino}.`, 'success');
      setIsMovimientoModalOpen(false);
      loadAllData();
    } catch (error) {
      console.error('Error al guardar movimiento:', error);
      showToast('Error de red al procesar el movimiento', 'error');
    }
  };

  const handleSaveCambioMoneda = async (cambioData) => {
    try {
      const isEdit = Boolean(cambioData.operacion_id);
      const url = isEdit 
        ? `${API_BASE}/tesoreria/cambio-moneda/${cambioData.operacion_id}`
        : `${API_BASE}/tesoreria/cambio-moneda`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cambioData)
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Error al procesar el cambio de moneda', 'error');
        return;
      }

      showToast(
        isEdit 
          ? `¡Cambio de moneda actualizado correctamente! Cotización: $ ${data.cotizacion.toLocaleString('es-AR')}.` 
          : `¡Cambio de moneda registrado! Se cambiaron US$ ${data.monto_usd.toLocaleString('es-AR')} a cotización $ ${data.cotizacion.toLocaleString('es-AR')}.`, 
        'success'
      );
      setIsMovimientoModalOpen(false);
      setCambioToEdit(null);
      loadAllData();
    } catch (error) {
      console.error('Error al guardar cambio de moneda:', error);
      showToast('Error de red al procesar el cambio de moneda', 'error');
    }
  };

  const handleOpenEditCambio = (mov) => {
    const opId = mov.operacion_id;
    let relatedMovs = [];

    if (opId) {
      relatedMovs = allMovements.filter(m => m.operacion_id === opId);
    }

    if (relatedMovs.length === 0) {
      const movDate = new Date(mov.fecha || mov.creado_en).getTime();
      relatedMovs = allMovements.filter(m => {
        const d = new Date(m.fecha || m.creado_en).getTime();
        return Math.abs(d - movDate) < 120000 && (m.concepto?.includes('[Cambio USD -> ARS]') || m.concepto?.includes('[Cambio Moneda Entrada]'));
      });
    }

    if (relatedMovs.length === 0) relatedMovs = [mov];

    const egresoUSD = relatedMovs.find(m => m.tipo === 'egreso' && m.moneda === 'USD') || relatedMovs.find(m => m.tipo === 'egreso') || mov;
    const ingresosARS = relatedMovs.filter(m => m.tipo === 'ingreso');

    const cuentaOrigenUSDId = egresoUSD.cuenta_id;
    const montoUSD = egresoUSD.monto;

    let cotiz = 0;
    if (egresoUSD.concepto && egresoUSD.concepto.includes('@ Cotiz. $')) {
      const match = egresoUSD.concepto.match(/@ Cotiz\.\s*\$\s*([\d\.,]+)/);
      if (match && match[1]) {
        cotiz = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
      }
    }

    const totalArsSum = ingresosARS.reduce((acc, curr) => acc + curr.monto, 0);

    if (!cotiz || isNaN(cotiz)) {
      cotiz = montoUSD > 0 ? (totalArsSum / montoUSD) : 0;
    }

    const distribucion = ingresosARS.length > 0 
      ? ingresosARS.map(m => {
          let ref = '';
          if (m.concepto && m.concepto.includes('| Ref:')) {
            ref = m.concepto.split('| Ref:')[1].trim();
          }
          return {
            cuenta_id: m.cuenta_id,
            monto_ars: m.monto,
            referencia: ref
          };
        })
      : [{ cuenta_id: '', monto_ars: totalArsSum || '', referencia: '' }];

    setCambioToEdit({
      operacion_id: opId || mov.id,
      cuenta_origen_id: cuentaOrigenUSDId,
      monto_usd: montoUSD,
      cotizacion: cotiz,
      distribucion,
      fecha: mov.fecha
    });

    setIsMovimientoModalOpen(true);
  };

  const handleDeleteMovimiento = async (mov) => {
    if (mov.ingreso_id || mov.gasto_id) {
      showToast('Este movimiento proviene de un comprobante de Ingreso o Gasto. Edítelo o elimínelo desde su pestaña respectiva.', 'error');
      return;
    }

    const esCambio = mov.concepto?.includes('[Cambio') || mov.operacion_id?.startsWith('cambio');
    const confirmMsg = esCambio
      ? '¿Estás seguro de eliminar esta operación de Cambio de Moneda? Se devolverán los Dólares a la cuenta origen y se descontarán los Pesos de las cuentas destino.'
      : '¿Estás seguro de eliminar este movimiento de tesorería? El saldo de la cuenta involucrada será revertido automáticamente.';

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`${API_BASE}/tesoreria/movimientos/${mov.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Error al eliminar el movimiento', 'error');
        return;
      }

      showToast('¡Movimiento eliminado y saldos revertidos con éxito!', 'success');
      loadAllData();
    } catch (error) {
      console.error('Error al eliminar movimiento:', error);
      showToast('Error de red al eliminar el movimiento', 'error');
    }
  };

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={(user) => { setCurrentUser(user); loadAllData(); }} />;
  }

  return (
    <div>
      <Header
        isOnline={isOnline}
        tesoreriaAccounts={tesoreriaAccounts}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenTesoreria={() => navigateTab('configuracion')}
        onOpenNewProject={() => { setProjectToEdit(null); setIsProjectModalOpen(true); }}
        onOpenNewExpense={() => handleOpenNewExpense(false)}
        onOpenNewMovimiento={() => setIsMovimientoModalOpen(true)}
      />

      <div className="app-container">
        {/* Navegación por pestañas */}
        <div className="nav-tabs">
          <button
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => navigateTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Panel General</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'proyectos' ? 'active' : ''}`}
            onClick={() => navigateTab('proyectos')}
          >
            <Building2 size={18} />
            <span>Proyectos ({projects.length})</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'clientes' ? 'active' : ''}`}
            onClick={() => navigateTab('clientes')}
          >
            <Users size={18} />
            <span>Clientes ({clients.length})</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'empleados' ? 'active' : ''}`}
            onClick={() => navigateTab('empleados')}
          >
            <UserCheck size={18} />
            <span>Empleados ({employees.length})</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'caja' ? 'active' : ''}`}
            onClick={() => navigateTab('caja', 'obras')}
          >
            <Wallet size={18} />
            <span>Caja & Movimientos ({expenses.length + allMovements.length})</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'estadisticas' ? 'active' : ''}`}
            onClick={() => navigateTab('estadisticas')}
          >
            <BarChart3 size={18} />
            <span>Estadísticas</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'configuracion' ? 'active' : ''}`}
            onClick={() => navigateTab('configuracion')}
          >
            <Settings size={18} />
            <span>Configuración</span>
          </button>
        </div>


        {/* Alerta de Desconexión */}
        {!isOnline && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid var(--accent-rose)',
            color: 'var(--text-main)',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <strong>⚠️ No se pudo conectar con el servidor backend ({API_BASE}).</strong>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Asegúrate de que la base de datos PostgreSQL y el servidor backend estén ejecutándose correctamente.
              </div>
            </div>
            <button className="btn btn-secondary" onClick={loadAllData}>Reintentar Conexión</button>
          </div>
        )}

        {/* Vistas según pestaña activa */}
        {activeTab === 'dashboard' && (
          <DashboardTab
            summary={summary}
            projects={projects}
            expenses={expenses}
            onSelectTab={(tab, subTab) => navigateTab(tab, subTab)}
            onOpenExpenseModal={() => handleOpenNewExpense(false)}
            onOpenTesoreriaModal={() => navigateTab('configuracion')}
          />
        )}

        {activeTab === 'proyectos' && (
          <ProjectsTab
            projects={projects}
            onOpenNewProject={() => { setProjectToEdit(null); setIsProjectModalOpen(true); }}
            onEditProject={(proy) => { setProjectToEdit(proy); setIsProjectModalOpen(true); }}
            onDeleteProject={handleDeleteProject}
            onSelectProject={handleOpenProjectDetail}
          />
        )}

        {activeTab === 'clientes' && (
          <ClientsTab
            clients={clients}
            onOpenNewClient={() => { setClientToEdit(null); setIsClientModalOpen(true); }}
            onEditClient={(client) => { setClientToEdit(client); setIsClientModalOpen(true); }}
            onDeleteClient={handleDeleteClient}
          />
        )}

        {activeTab === 'empleados' && (
          <EmployeesTab
            employees={employees}
            onOpenNewEmployee={() => { setEmployeeToEdit(null); setIsEmployeeModalOpen(true); }}
            onEditEmployee={(emp) => { setEmployeeToEdit(emp); setIsEmployeeModalOpen(true); }}
            onDeleteEmployee={handleDeleteEmployee}
            onOpenPaymentModal={(empId) => { setSelectedEmployeeForPayment(empId); setIsEmployeePaymentModalOpen(true); }}
            onOpenAccountModal={(empId) => { setSelectedEmployeeForAccount(empId); setIsEmployeeAccountModalOpen(true); }}
          />
        )}

        {(activeTab === 'caja' || activeTab === 'gastos' || activeTab === 'gastos_obras' || activeTab === 'gastos_estudio' || activeTab === 'movimientos') && (
          <CajaTab
            expenses={expenses}
            projects={projects}
            categories={categories}
            movimientos={allMovements}
            ingresos={ingresos}
            tesoreriaAccounts={tesoreriaAccounts}
            initialSubTab={cajaSubTab}
            onOpenNewExpense={(esEstudio) => handleOpenNewExpense(esEstudio)}
            onEditExpense={(gasto) => { setExpenseToEdit(gasto); setIsExpenseModalOpen(true); }}
            onDeleteExpense={handleDeleteExpense}
            onOpenNewMovimiento={() => { setCambioToEdit(null); setIsMovimientoModalOpen(true); }}
            onOpenNewIncome={() => { setIncomeToEdit(null); setIsNewIncomeModalOpen(true); }}
            onEditIncome={(ing) => { setIncomeToEdit(ing); setIsNewIncomeModalOpen(true); }}
            onDeleteIncome={handleDeleteIncome}
            onEditCambio={handleOpenEditCambio}
            onDeleteMovimiento={handleDeleteMovimiento}
          />
        )}

        {activeTab === 'estadisticas' && (
          <StatisticsTab
            expenses={expenses}
            ingresos={ingresos}
            allMovements={allMovements}
            projects={projects}
            categories={categories}
          />
        )}

        {activeTab === 'configuracion' && (
          <SettingsTab
            tesoreriaAccounts={tesoreriaAccounts}
            categories={categories}
            currentUser={currentUser}
            showToast={showToast}
            onOpenNewBankAccount={() => { setAccountToEdit(null); setIsBankAccountModalOpen(true); }}
            onEditBankAccount={(acc) => { setAccountToEdit(acc); setIsBankAccountModalOpen(true); }}
            onAdjustBalanceAccount={() => setIsTesoreriaModalOpen(true)}
            onDeleteBankAccount={handleDeleteBankAccount}
            onOpenNewCategory={() => setIsCategoryModalOpen(true)}
            onDeleteCategory={handleDeleteCategory}
            onOpenNewMovimiento={() => setIsMovimientoModalOpen(true)}
          />
        )}
      </div>

      {/* Modales Dialogs */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => { setIsProjectModalOpen(false); setProjectToEdit(null); }}
        onSave={handleSaveProject}
        projectToEdit={projectToEdit}
        clients={clients}
      />

      {/* Detalle Financiero del Proyecto, Etapas y Cobros */}
      <ProjectDetailModal
        isOpen={isProjectDetailOpen}
        onClose={() => { setIsProjectDetailOpen(false); setSelectedProjectId(null); }}
        projectId={selectedProjectId}
        refreshKey={detailRefreshKey}
        tesoreriaAccounts={tesoreriaAccounts}
        onOpenNewEtapa={handleOpenNewEtapa}
        onEditEtapa={handleOpenEditEtapa}
        onDeleteEtapa={handleDeleteEtapa}
        onOpenNewIngreso={handleOpenNewIngreso}
        onDeleteIngreso={handleDeleteIngreso}
        onOpenNewExpense={(proyId) => {
          setDefaultExpenseProjectId(proyId);
          setExpenseToEdit(null);
          setIsExpenseModalOpen(true);
        }}
        onDeleteExpense={handleDeleteExpense}
      />

      {/* Modal de Etapas */}
      <EtapaModal
        isOpen={isEtapaModalOpen}
        onClose={() => { setIsEtapaModalOpen(false); setEtapaToEdit(null); }}
        onSave={handleSaveEtapa}
        etapaToEdit={etapaToEdit}
      />

      {/* Modal de Entregas de Dinero del Cliente */}
      <IngresoClienteModal
        isOpen={isIngresoModalOpen}
        onClose={() => setIsIngresoModalOpen(false)}
        onSave={handleSaveIngreso}
        etapas={projectEtapasForIngreso}
        tesoreriaAccounts={tesoreriaAccounts}
      />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => { setIsExpenseModalOpen(false); setExpenseToEdit(null); setDefaultExpenseProjectId(null); }}
        onSave={handleSaveExpense}
        projects={projects}
        categories={categories}
        tesoreriaAccounts={tesoreriaAccounts}
        expenseToEdit={expenseToEdit}
        defaultProjectId={defaultExpenseProjectId}
        defaultEsEstudio={defaultExpenseEsEstudio}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleSaveCategory}
      />

      <BankAccountModal
        isOpen={isBankAccountModalOpen}
        onClose={() => { setIsBankAccountModalOpen(false); setAccountToEdit(null); }}
        onSave={handleSaveBankAccount}
        accountToEdit={accountToEdit}
      />

      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => { setIsClientModalOpen(false); setClientToEdit(null); }}
        onSave={handleSaveClient}
        clientToEdit={clientToEdit}
      />

      <TesoreriaModal
        isOpen={isTesoreriaModalOpen}
        onClose={() => setIsTesoreriaModalOpen(false)}
        tesoreriaAccounts={tesoreriaAccounts}
        onUpdateBalance={handleUpdateTesoreriaBalance}
      />

      <MovimientoModal
        isOpen={isMovimientoModalOpen}
        onClose={() => { setIsMovimientoModalOpen(false); setCambioToEdit(null); }}
        onSave={handleSaveMovimiento}
        onSaveCambio={handleSaveCambioMoneda}
        tesoreriaAccounts={tesoreriaAccounts}
        cambioToEdit={cambioToEdit}
      />

      <NewIncomeModal
        isOpen={isNewIncomeModalOpen}
        onClose={() => { setIsNewIncomeModalOpen(false); setIncomeToEdit(null); }}
        onSave={handleSaveNewIncome}
        projects={projects}
        tesoreriaAccounts={tesoreriaAccounts}
        incomeToEdit={incomeToEdit}
      />

      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => { setIsEmployeeModalOpen(false); setEmployeeToEdit(null); }}
        onSave={handleSaveEmployee}
        employeeToEdit={employeeToEdit}
      />

      <EmployeePaymentModal
        isOpen={isEmployeePaymentModalOpen}
        onClose={() => setIsEmployeePaymentModalOpen(false)}
        onSave={handleSaveEmployeePayment}
        employees={employees}
        projects={projects}
        tesoreriaAccounts={tesoreriaAccounts}
        selectedEmployeeId={selectedEmployeeForPayment}
      />

      <EmployeeAccountModal
        isOpen={isEmployeeAccountModalOpen}
        onClose={() => { setIsEmployeeAccountModalOpen(false); setSelectedEmployeeForAccount(null); }}
        employeeId={selectedEmployeeForAccount}
        onOpenPayment={(empId) => { setSelectedEmployeeForPayment(empId); setIsEmployeePaymentModalOpen(true); }}
        onDeletePayment={handleDeleteEmployeePayment}
      />

      {/* Notificación Toast */}
      <NotificationToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default App;
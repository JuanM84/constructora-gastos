require('dotenv').config({ path: __dirname + '/.env' });
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

const crearTablasYDatos = async () => {
  const querySchema = `
    -- 0. Tabla de Usuarios
    CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        rol VARCHAR(20) NOT NULL DEFAULT 'usuario',
        activo BOOLEAN DEFAULT TRUE,
        creado_en TIMESTAMP DEFAULT NOW()
    );

    -- 1. Tabla de Clientes
    CREATE TABLE IF NOT EXISTS clientes (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        dni_cuit VARCHAR(30),
        telefono VARCHAR(50),
        email VARCHAR(100),
        direccion VARCHAR(255),
        notas TEXT,
        creado_en TIMESTAMP DEFAULT NOW()
    );

    -- 2. Tabla de Proyectos
    CREATE TABLE IF NOT EXISTS proyectos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        ubicacion VARCHAR(255),
        presupuesto_estimado DECIMAL(15, 2),
        fecha_inicio DATE DEFAULT CURRENT_DATE,
        estado VARCHAR(20) DEFAULT 'Activo',
        cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL
    );

    -- 3. Tabla de Etapas del Proyecto
    CREATE TABLE IF NOT EXISTS etapas (
        id SERIAL PRIMARY KEY,
        proyecto_id INTEGER REFERENCES proyectos(id) ON DELETE CASCADE,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        presupuesto DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        orden INTEGER DEFAULT 1,
        estado VARCHAR(20) DEFAULT 'En Curso',
        fecha_inicio DATE,
        fecha_fin DATE,
        creado_en TIMESTAMP DEFAULT NOW()
    );

    -- 4. Tabla de Categorías
    CREATE TABLE IF NOT EXISTS categorias (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL UNIQUE,
        es_estudio BOOLEAN DEFAULT FALSE
    );

    -- 5. Tabla de Cuentas de Tesorería (Cuentas Bancarias y Cajas de Efectivo)
    CREATE TABLE IF NOT EXISTS cuentas_tesoreria (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL UNIQUE,
        tipo VARCHAR(30) NOT NULL, -- 'banco_ars', 'banco_usd', 'efectivo_ars', 'efectivo_usd'
        banco_nombre VARCHAR(100),
        numero_cuenta_cbu VARCHAR(50),
        saldo DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        moneda VARCHAR(5) NOT NULL DEFAULT 'ARS',
        creado_en TIMESTAMP DEFAULT NOW()
    );

    -- 6. Tabla de Gastos
    CREATE TABLE IF NOT EXISTS gastos (
        id SERIAL PRIMARY KEY,
        proyecto_id INTEGER REFERENCES proyectos(id) ON DELETE CASCADE,
        etapa_id INTEGER REFERENCES etapas(id) ON DELETE SET NULL,
        categoria_id INTEGER REFERENCES categorias(id) ON DELETE RESTRICT,
        monto DECIMAL(15, 2) NOT NULL,
        descripcion TEXT NOT NULL,
        fecha_gasto DATE NOT NULL DEFAULT CURRENT_DATE,
        comprobante_url VARCHAR(255),
        es_gasto_estudio BOOLEAN DEFAULT FALSE,
        cuenta_id INTEGER REFERENCES cuentas_tesoreria(id) ON DELETE SET NULL,
        creado_en TIMESTAMP DEFAULT NOW()
    );

    -- 7. Tabla de Ingresos / Entregas de Dinero del Cliente
    CREATE TABLE IF NOT EXISTS ingresos_cliente (
        id SERIAL PRIMARY KEY,
        proyecto_id INTEGER REFERENCES proyectos(id) ON DELETE CASCADE,
        etapa_id INTEGER REFERENCES etapas(id) ON DELETE SET NULL,
        monto DECIMAL(15, 2) NOT NULL,
        moneda VARCHAR(5) NOT NULL DEFAULT 'ARS',
        medio_pago VARCHAR(30) NOT NULL DEFAULT 'efectivo_ars',
        cuenta_id INTEGER REFERENCES cuentas_tesoreria(id) ON DELETE SET NULL,
        fecha DATE NOT NULL DEFAULT CURRENT_DATE,
        concepto TEXT,
        comprobante_url VARCHAR(255),
        creado_en TIMESTAMP DEFAULT NOW()
    );

    -- 8. Historial de Movimientos de Tesorería
    CREATE TABLE IF NOT EXISTS movimientos_tesoreria (
        id SERIAL PRIMARY KEY,
        cuenta_id INTEGER REFERENCES cuentas_tesoreria(id) ON DELETE CASCADE,
        tipo VARCHAR(15) NOT NULL, -- 'ingreso', 'egreso', 'ajuste'
        monto DECIMAL(15, 2) NOT NULL,
        concepto TEXT NOT NULL,
        gasto_id INTEGER REFERENCES gastos(id) ON DELETE SET NULL,
        ingreso_id INTEGER REFERENCES ingresos_cliente(id) ON DELETE SET NULL,
        fecha TIMESTAMP DEFAULT NOW()
    );
  `;

  try {
    console.log('Actualizando esquema para Cuentas Bancarias y Tesorería...');
    await pool.query(querySchema);

    // Migraciones seguras
    await pool.query(`ALTER TABLE cuentas_tesoreria ADD COLUMN IF NOT EXISTS banco_nombre VARCHAR(100);`);
    await pool.query(`ALTER TABLE cuentas_tesoreria ADD COLUMN IF NOT EXISTS numero_cuenta_cbu VARCHAR(50);`);

    // 1. Cuentas Bancarias y Cajas de Tesorería Semilla
    const tesoreriaSemilla = [
      { nombre: 'Efectivo Pesos (ARS)', tipo: 'efectivo_ars', banco: 'Caja Chica Oficina', cbu: '', saldo: 18500000.00, moneda: 'ARS' },
      { nombre: 'Efectivo Dólares (USD)', tipo: 'efectivo_usd', banco: 'Caja Fuerte Estudio', cbu: '', saldo: 45000.00, moneda: 'USD' },
      { nombre: 'Banco Galicia ARS', tipo: 'banco_ars', banco: 'Banco Galicia', cbu: '0070123400001234567890', saldo: 24400000.00, moneda: 'ARS' },
      { nombre: 'Banco Santander ARS', tipo: 'banco_ars', banco: 'Banco Santander', cbu: '0720987600008765432109', saldo: 8000000.00, moneda: 'ARS' },
      { nombre: 'Mercado Pago Estudio', tipo: 'banco_ars', banco: 'Mercado Pago', cbu: '0000003100099887766554', saldo: 1500000.00, moneda: 'ARS' }
    ];

    for (const cuenta of tesoreriaSemilla) {
      await pool.query(
        `INSERT INTO cuentas_tesoreria (nombre, tipo, banco_nombre, numero_cuenta_cbu, saldo, moneda)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (nombre) DO UPDATE SET
           banco_nombre = EXCLUDED.banco_nombre,
           numero_cuenta_cbu = EXCLUDED.numero_cuenta_cbu`,
        [cuenta.nombre, cuenta.tipo, cuenta.banco, cuenta.cbu, cuenta.saldo, cuenta.moneda]
      );
    }

    console.log('¡Esquema de Cuentas Bancarias actualizado exitosamente! 🏦');
  } catch (error) {
    console.error('Error al configurar la base de datos:', error);
  } finally {
    await pool.end();
  }
};

crearTablasYDatos();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Configuración Pool de PostgreSQL
const dbUrl = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
const pool = new Pool({
  connectionString: dbUrl,
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
});

// Inicializar tablas de empleados si no existen
const initEmpleadosDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS empleados (
          id SERIAL PRIMARY KEY,
          nombre VARCHAR(100) NOT NULL,
          dni_cuit VARCHAR(30),
          telefono VARCHAR(50),
          email VARCHAR(100),
          puesto_rol VARCHAR(100),
          salario_base DECIMAL(15, 2) DEFAULT 0.00,
          notas TEXT,
          creado_en TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS pagos_empleados (
          id SERIAL PRIMARY KEY,
          empleado_id INTEGER REFERENCES empleados(id) ON DELETE CASCADE,
          monto DECIMAL(15, 2) NOT NULL,
          fecha DATE NOT NULL DEFAULT CURRENT_DATE,
          concepto TEXT NOT NULL,
          proyecto_id INTEGER REFERENCES proyectos(id) ON DELETE SET NULL,
          etapa_id INTEGER REFERENCES etapas(id) ON DELETE SET NULL,
          cuenta_id INTEGER REFERENCES cuentas_tesoreria(id) ON DELETE SET NULL,
          gasto_id INTEGER REFERENCES gastos(id) ON DELETE SET NULL,
          creado_en TIMESTAMP DEFAULT NOW()
      );

      ALTER TABLE pagos_empleados ADD COLUMN IF NOT EXISTS etapa_id INTEGER REFERENCES etapas(id) ON DELETE SET NULL;
      ALTER TABLE gastos ADD COLUMN IF NOT EXISTS moneda VARCHAR(10) DEFAULT 'ARS';

      INSERT INTO categorias (nombre, es_estudio)
      VALUES ('Mano de Obra (MDO)', FALSE)
      ON CONFLICT (nombre) DO NOTHING;

      INSERT INTO categorias (nombre, es_estudio)
      VALUES ('Sueldos y Honorarios (Estudio)', TRUE)
      ON CONFLICT (nombre) DO NOTHING;
    `);
    console.log('Tablas de empleados y categorias MDO verificadas correctamente.');
  } catch (err) {
    console.error('Error al inicializar esquema de empleados:', err);
  }
};
initEmpleadosDB();

// ---------------------------------------------------
// RUTA DE PRUEBA Y SALUD
// ---------------------------------------------------
app.get('/api/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      estado: 'online',
      mensaje: '¡Conexión exitosa a PostgreSQL! 🚀',
      horaServidorDB: result.rows[0].now
    });
  } catch (error) {
    console.error('Error en /api/test:', error);
    res.status(500).json({ error: 'Error al conectar con la base de datos' });
  }
});

// ---------------------------------------------------
// METRICAS / DASHBOARD API
// ---------------------------------------------------
app.get('/api/dashboard/summary', async (req, res) => {
  try {
    const totalPresupuestoRes = await pool.query(
      `SELECT COALESCE(SUM(p.presupuesto_estimado), 0) AS total_presupuesto, COUNT(p.id) AS total_proyectos FROM proyectos p`
    );

    const totalGastadoRes = await pool.query(
      `SELECT 
         COALESCE(SUM(monto), 0) AS total_gastado,
         COALESCE(SUM(CASE WHEN es_gasto_estudio = FALSE THEN monto ELSE 0 END), 0) AS total_obras,
         COALESCE(SUM(CASE WHEN es_gasto_estudio = TRUE THEN monto ELSE 0 END), 0) AS total_estudio,
         COUNT(id) AS total_gastos 
       FROM gastos`
    );

    const totalCobradoRes = await pool.query(
      `SELECT COALESCE(SUM(monto), 0) AS total_cobrado FROM ingresos_cliente WHERE moneda = 'ARS'`
    );

    const tesoreriaRes = await pool.query(`SELECT * FROM cuentas_tesoreria ORDER BY id ASC`);
    const clientesCountRes = await pool.query(`SELECT COUNT(*) FROM clientes`);

    const gastosPorCategoriaRes = await pool.query(
      `SELECT c.id, c.nombre, c.es_estudio, COALESCE(SUM(g.monto), 0) AS total
       FROM categorias c
       LEFT JOIN gastos g ON g.categoria_id = c.id
       GROUP BY c.id, c.nombre, c.es_estudio
       ORDER BY total DESC`
    );

    const topProyectosRes = await pool.query(
      `SELECT p.id, p.nombre, p.presupuesto_estimado, p.estado, c.nombre AS cliente_nombre,
              COALESCE(SUM(g.monto), 0) AS total_gastado
       FROM proyectos p
       LEFT JOIN clientes c ON p.cliente_id = c.id
       LEFT JOIN gastos g ON g.proyecto_id = p.id
       GROUP BY p.id, c.nombre
       ORDER BY total_gastado DESC
       LIMIT 5`
    );

    const totalPresupuesto = parseFloat(totalPresupuestoRes.rows[0].total_presupuesto);
    const totalGastado = parseFloat(totalGastadoRes.rows[0].total_gastado);
    const totalObras = parseFloat(totalGastadoRes.rows[0].total_obras);
    const totalEstudio = parseFloat(totalGastadoRes.rows[0].total_estudio);
    const totalCobrado = parseFloat(totalCobradoRes.rows[0].total_cobrado);
    const presupuestoRestante = totalPresupuesto - totalObras;
    const porcentajeGlobal = totalPresupuesto > 0 ? ((totalObras / totalPresupuesto) * 100).toFixed(1) : 0;

    const cuentas = tesoreriaRes.rows.map(t => ({ ...t, saldo: parseFloat(t.saldo) }));
    const totalEfectivoARS = cuentas.filter(c => c.tipo === 'efectivo_ars').reduce((a, c) => a + c.saldo, 0);
    const totalEfectivoUSD = cuentas.filter(c => c.tipo === 'efectivo_usd').reduce((a, c) => a + c.saldo, 0);
    const totalBancosARS = cuentas.filter(c => c.tipo === 'banco_ars').reduce((a, c) => a + c.saldo, 0);

    res.json({
      totalPresupuesto,
      totalGastado,
      totalObras,
      totalEstudio,
      totalCobrado,
      presupuestoRestante,
      porcentajeGlobal,
      totalProyectos: parseInt(totalPresupuestoRes.rows[0].total_proyectos, 10),
      totalGastos: parseInt(totalGastadoRes.rows[0].total_gastos, 10),
      totalClientes: parseInt(clientesCountRes.rows[0].count, 10),
      tesoreria: cuentas,
      totalEfectivoARS,
      totalEfectivoUSD,
      totalBancosARS,
      gastosPorCategoria: gastosPorCategoriaRes.rows.map(r => ({
        ...r,
        total: parseFloat(r.total)
      })),
      topProyectos: topProyectosRes.rows.map(r => ({
        ...r,
        presupuesto_estimado: parseFloat(r.presupuesto_estimado),
        total_gastado: parseFloat(r.total_gastado),
        porcentaje: parseFloat(r.presupuesto_estimado) > 0 
          ? ((parseFloat(r.total_gastado) / parseFloat(r.presupuesto_estimado)) * 100).toFixed(1)
          : 0
      }))
    });
  } catch (error) {
    console.error('Error al generar resumen de dashboard:', error);
    res.status(500).json({ error: 'Error al obtener resumen financiero' });
  }
});

// ---------------------------------------------------
// TESORERIA & CUENTAS BANCARIAS API
// ---------------------------------------------------

// 1. Obtener todas las cuentas y balances
app.get('/api/tesoreria', async (req, res) => {
  try {
    const cuentasRes = await pool.query('SELECT * FROM cuentas_tesoreria ORDER BY tipo DESC, nombre ASC');
    const movimientosRes = await pool.query(
      `SELECT m.*, c.nombre AS cuenta_nombre, c.moneda
       FROM movimientos_tesoreria m
       JOIN cuentas_tesoreria c ON m.cuenta_id = c.id
       ORDER BY m.fecha DESC
       LIMIT 30`
    );

    const cuentas = cuentasRes.rows.map(c => ({ ...c, saldo: parseFloat(c.saldo) }));
    
    // Desglose de totales
    const totalEfectivoARS = cuentas.filter(c => c.tipo === 'efectivo_ars').reduce((acc, c) => acc + c.saldo, 0);
    const totalEfectivoUSD = cuentas.filter(c => c.tipo === 'efectivo_usd').reduce((acc, c) => acc + c.saldo, 0);
    const totalBancosARS = cuentas.filter(c => c.tipo === 'banco_ars').reduce((acc, c) => acc + c.saldo, 0);
    const totalBancosUSD = cuentas.filter(c => c.tipo === 'banco_usd').reduce((acc, c) => acc + c.saldo, 0);
    const totalARS = totalEfectivoARS + totalBancosARS;
    const totalUSD = totalEfectivoUSD + totalBancosUSD;

    res.json({
      cuentas,
      totalEfectivoARS,
      totalEfectivoUSD,
      totalBancosARS,
      totalBancosUSD,
      totalARS,
      totalUSD,
      movimientos: movimientosRes.rows.map(m => ({ ...m, monto: parseFloat(m.monto) }))
    });
  } catch (error) {
    console.error('Error obteniendo datos de tesorería:', error);
    res.status(500).json({ error: 'Error al obtener saldos de tesorería' });
  }
});

// 1.b Obtener el listado completo de todos los movimientos de tesorería
app.get('/api/tesoreria/movimientos', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, c.nombre AS cuenta_nombre, c.moneda, c.tipo AS cuenta_tipo
       FROM movimientos_tesoreria m
       JOIN cuentas_tesoreria c ON m.cuenta_id = c.id
       ORDER BY m.fecha DESC, m.id DESC`
    );

    res.json(result.rows.map(m => ({
      ...m,
      monto: parseFloat(m.monto)
    })));
  } catch (error) {
    console.error('Error obteniendo listado completo de movimientos:', error);
    res.status(500).json({ error: 'Error al obtener historial de movimientos de tesorería' });
  }
});

// 2. Crear nueva cuenta bancaria o de efectivo
app.post('/api/tesoreria', async (req, res) => {
  const { nombre, tipo, banco_nombre, numero_cuenta_cbu, saldo, moneda } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre de la cuenta es obligatorio' });
  }

  const saldoInicial = parseFloat(saldo) || 0;
  const monedaVal = moneda || 'ARS';
  const tipoVal = tipo || 'banco_ars';

  try {
    const result = await pool.query(
      `INSERT INTO cuentas_tesoreria (nombre, tipo, banco_nombre, numero_cuenta_cbu, saldo, moneda)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nombre.trim(), tipoVal, banco_nombre ? banco_nombre.trim() : null, numero_cuenta_cbu ? numero_cuenta_cbu.trim() : null, saldoInicial, monedaVal]
    );

    const cuentaCreada = result.rows[0];

    if (saldoInicial > 0) {
      await pool.query(
        `INSERT INTO movimientos_tesoreria (cuenta_id, tipo, monto, concepto)
         VALUES ($1, 'ingreso', $2, 'Saldo inicial al crear cuenta')`,
        [cuentaCreada.id, saldoInicial]
      );
    }

    res.status(201).json({
      ...cuentaCreada,
      saldo: parseFloat(cuentaCreada.saldo)
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Ya existe una cuenta con ese nombre' });
    }
    console.error('Error creando cuenta de tesorería:', error);
    res.status(500).json({ error: 'Error al guardar la cuenta bancaria' });
  }
});

// 3. Actualizar cuenta bancaria o ajustar saldo
app.put('/api/tesoreria/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, tipo, banco_nombre, numero_cuenta_cbu, saldo, concepto } = req.body;

  try {
    const cuentaPrev = await pool.query('SELECT * FROM cuentas_tesoreria WHERE id = $1', [id]);
    if (cuentaPrev.rows.length === 0) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }

    const cuentaActual = cuentaPrev.rows[0];
    const nuevoSaldo = saldo !== undefined ? parseFloat(saldo) : parseFloat(cuentaActual.saldo);
    const saldoAnterior = parseFloat(cuentaActual.saldo);
    const diferencia = nuevoSaldo - saldoAnterior;

    const result = await pool.query(
      `UPDATE cuentas_tesoreria
       SET nombre = COALESCE($1, nombre),
           tipo = COALESCE($2, tipo),
           banco_nombre = $3,
           numero_cuenta_cbu = $4,
           saldo = $5
       WHERE id = $6 RETURNING *`,
      [nombre ? nombre.trim() : null, tipo, banco_nombre ? banco_nombre.trim() : null, numero_cuenta_cbu ? numero_cuenta_cbu.trim() : null, nuevoSaldo, id]
    );

    if (Math.abs(diferencia) > 0.001) {
      await pool.query(
        `INSERT INTO movimientos_tesoreria (cuenta_id, tipo, monto, concepto)
         VALUES ($1, $2, $3, $4)`,
        [id, diferencia >= 0 ? 'ingreso' : 'egreso', Math.abs(diferencia), concepto || 'Ajuste manual de saldo']
      );
    }

    res.json({
      ...result.rows[0],
      saldo: parseFloat(result.rows[0].saldo)
    });
  } catch (error) {
    console.error('Error actualizando tesorería:', error);
    res.status(500).json({ error: 'Error al actualizar saldo de tesorería' });
  }
});

// 4. Eliminar cuenta de tesorería
app.delete('/api/tesoreria/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const checkGastos = await pool.query('SELECT COUNT(*) FROM gastos WHERE cuenta_id = $1', [id]);
    const checkIngresos = await pool.query('SELECT COUNT(*) FROM ingresos_cliente WHERE cuenta_id = $1', [id]);

    if (parseInt(checkGastos.rows[0].count, 10) > 0 || parseInt(checkIngresos.rows[0].count, 10) > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar la cuenta bancaria porque tiene movimientos de dinero o gastos asociados'
      });
    }

    const result = await pool.query('DELETE FROM cuentas_tesoreria WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }

    res.json({ mensaje: 'Cuenta eliminada con éxito', id: parseInt(id, 10) });
  } catch (error) {
    console.error('Error eliminando cuenta:', error);
    res.status(500).json({ error: 'Error al eliminar la cuenta bancaria' });
  }
});

// 5. Registrar movimiento interno entre cuentas (Transferencia, Depósito, Extracción)
app.post('/api/tesoreria/movimiento', async (req, res) => {
  const { cuenta_origen_id, cuenta_destino_id, monto, concepto, tipo_movimiento } = req.body;

  const cuentaOrigenId = parseInt(cuenta_origen_id, 10);
  const cuentaDestinoId = parseInt(cuenta_destino_id, 10);
  const montoNum = parseFloat(monto);

  if (!cuentaOrigenId || !cuentaDestinoId) {
    return res.status(400).json({ error: 'Debe seleccionar una cuenta de origen y una de destino' });
  }

  if (cuentaOrigenId === cuentaDestinoId) {
    return res.status(400).json({ error: 'La cuenta de origen y destino deben ser diferentes' });
  }

  if (isNaN(montoNum) || montoNum <= 0) {
    return res.status(400).json({ error: 'El monto a transferir debe ser mayor a 0' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Obtener cuentas
    const resOrigen = await client.query('SELECT * FROM cuentas_tesoreria WHERE id = $1', [cuentaOrigenId]);
    const resDestino = await client.query('SELECT * FROM cuentas_tesoreria WHERE id = $1', [cuentaDestinoId]);

    if (resOrigen.rows.length === 0 || resDestino.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Una o ambas cuentas no existen' });
    }

    const cuentaOrigen = resOrigen.rows[0];
    const cuentaDestino = resDestino.rows[0];

    // 2. Descontar de cuenta origen
    await client.query(
      'UPDATE cuentas_tesoreria SET saldo = saldo - $1 WHERE id = $2',
      [montoNum, cuentaOrigenId]
    );

    // 3. Acreditar en cuenta destino
    await client.query(
      'UPDATE cuentas_tesoreria SET saldo = saldo + $1 WHERE id = $2',
      [montoNum, cuentaDestinoId]
    );

    // 4. Registrar movimientos en historial
    const motivoText = concepto && concepto.trim() ? concepto.trim() : 'Movimiento interno entre cuentas';
    
    // Egreso en origen
    await client.query(
      `INSERT INTO movimientos_tesoreria (cuenta_id, tipo, monto, concepto)
       VALUES ($1, 'egreso', $2, $3)`,
      [cuentaOrigenId, montoNum, `[Movimiento Salida] -> A ${cuentaDestino.nombre}: ${motivoText}`]
    );

    // Ingreso en destino
    await client.query(
      `INSERT INTO movimientos_tesoreria (cuenta_id, tipo, monto, concepto)
       VALUES ($1, 'ingreso', $2, $3)`,
      [cuentaDestinoId, montoNum, `[Movimiento Entrada] <- De ${cuentaOrigen.nombre}: ${motivoText}`]
    );

    await client.query('COMMIT');

    res.status(201).json({
      mensaje: 'Movimiento entre cuentas registrado con éxito',
      cuenta_origen: cuentaOrigen.nombre,
      cuenta_destino: cuentaDestino.nombre,
      monto: montoNum
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al procesar movimiento interno:', error);
    res.status(500).json({ error: 'Error interno al procesar el movimiento de tesorería' });
  } finally {
    client.release();
  }
});

// 6. Registrar cambio de moneda (Venta USD ➔ ARS distribuido en cuentas con Referencia)
app.post('/api/tesoreria/cambio-moneda', async (req, res) => {
  const { cuenta_origen_id, monto_usd, cotizacion, distribucion, fecha } = req.body;

  const cuentaOrigenId = parseInt(cuenta_origen_id, 10);
  const montoUsdNum = parseFloat(monto_usd);
  const cotizNum = parseFloat(cotizacion);

  if (!cuentaOrigenId || isNaN(montoUsdNum) || montoUsdNum <= 0 || isNaN(cotizNum) || cotizNum <= 0) {
    return res.status(400).json({ error: 'Monto en USD y Cotización deben ser números mayores a 0' });
  }

  if (!Array.isArray(distribucion) || distribucion.length === 0) {
    return res.status(400).json({ error: 'Debe especificar al menos una cuenta de destino para los pesos' });
  }

  const totalArsEsperado = montoUsdNum * cotizNum;
  const totalArsDistribucion = distribucion.reduce((acc, d) => acc + (parseFloat(d.monto_ars) || 0), 0);

  if (Math.abs(totalArsEsperado - totalArsDistribucion) > 0.05) {
    return res.status(400).json({
      error: `La suma de pesos asignados ($ ${totalArsDistribucion.toLocaleString('es-AR')}) no coincide con el total de la operación ($ ${totalArsEsperado.toLocaleString('es-AR')})`
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Obtener cuenta origen USD
    const resOrigen = await client.query('SELECT * FROM cuentas_tesoreria WHERE id = $1', [cuentaOrigenId]);
    if (resOrigen.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'La cuenta origen USD no existe' });
    }
    const cuentaOrigen = resOrigen.rows[0];

    // 2. Descontar Dólares de origen
    await client.query('UPDATE cuentas_tesoreria SET saldo = saldo - $1 WHERE id = $2', [montoUsdNum, cuentaOrigenId]);

    // 3. Registrar egreso en USD
    await client.query(
      `INSERT INTO movimientos_tesoreria (cuenta_id, tipo, monto, concepto)
       VALUES ($1, 'egreso', $2, $3)`,
      [cuentaOrigenId, montoUsdNum, `[Cambio USD -> ARS] Venta US$ ${montoUsdNum.toLocaleString('es-AR')} @ Cotiz. $ ${cotizNum.toLocaleString('es-AR')}`]
    );

    // 4. Acreditar Pesos en cada cuenta de destino
    for (const item of distribucion) {
      const destId = parseInt(item.cuenta_id, 10);
      const montoArs = parseFloat(item.monto_ars);
      const ref = item.referencia ? item.referencia.trim() : '';

      if (destId && montoArs > 0) {
        const resDest = await client.query('SELECT * FROM cuentas_tesoreria WHERE id = $1', [destId]);
        const nombreDest = resDest.rows.length > 0 ? resDest.rows[0].nombre : 'Cuenta Pesos';

        await client.query('UPDATE cuentas_tesoreria SET saldo = saldo + $1 WHERE id = $2', [montoArs, destId]);

        const detalleConcepto = `[Cambio Moneda Entrada] Ingreso $ ${montoArs.toLocaleString('es-AR')} (Venta US$ ${montoUsdNum} @ $ ${cotizNum})` + (ref ? ` | Ref: ${ref}` : '');

        await client.query(
          `INSERT INTO movimientos_tesoreria (cuenta_id, tipo, monto, concepto)
           VALUES ($1, 'ingreso', $2, $3)`,
          [destId, montoArs, detalleConcepto]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      mensaje: 'Cambio de moneda registrado con éxito',
      monto_usd: montoUsdNum,
      cotizacion: cotizNum,
      total_ars: totalArsEsperado
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error procesando cambio de moneda:', error);
    res.status(500).json({ error: 'Error al procesar la operación de cambio de moneda' });
  } finally {
    client.release();
  }
});

// ---------------------------------------------------
// RUTAS DE CLIENTES
// ---------------------------------------------------
app.get('/api/clientes', async (req, res) => {
  try {
    const query = `
      SELECT c.*,
             COUNT(p.id) AS proyectos_count
      FROM clientes c
      LEFT JOIN proyectos p ON p.cliente_id = c.id
      GROUP BY c.id
      ORDER BY c.nombre ASC
    `;
    const result = await pool.query(query);
    res.json(result.rows.map(c => ({
      ...c,
      proyectos_count: parseInt(c.proyectos_count, 10)
    })));
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

app.post('/api/clientes', async (req, res) => {
  const { nombre, dni_cuit, telefono, email, direccion, notas } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre o Razón Social del cliente es obligatorio' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO clientes (nombre, dni_cuit, telefono, email, direccion, notas)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nombre.trim(), dni_cuit ? dni_cuit.trim() : null, telefono ? telefono.trim() : null, email ? email.trim() : null, direccion ? direccion.trim() : null, notas ? notas.trim() : null]
    );
    res.status(201).json({ ...result.rows[0], proyectos_count: 0 });
  } catch (error) {
    console.error('Error creando cliente:', error);
    res.status(500).json({ error: 'Error al guardar el cliente' });
  }
});

app.put('/api/clientes/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, dni_cuit, telefono, email, direccion, notas } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del cliente es obligatorio' });
  }

  try {
    const result = await pool.query(
      `UPDATE clientes
       SET nombre = $1, dni_cuit = $2, telefono = $3, email = $4, direccion = $5, notas = $6
       WHERE id = $7 RETURNING *`,
      [nombre.trim(), dni_cuit, telefono, email, direccion, notas, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    res.status(500).json({ error: 'Error al modificar el cliente' });
  }
});

app.delete('/api/clientes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM clientes WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json({ mensaje: 'Cliente eliminado con éxito', id: parseInt(id, 10) });
  } catch (error) {
    console.error('Error eliminando cliente:', error);
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
});

// ---------------------------------------------------
// RUTAS DE PROYECTOS & ETAPAS & ENTREGAS DE CLIENTE
// ---------------------------------------------------

app.get('/api/proyectos', async (req, res) => {
  try {
    const query = `
      SELECT p.id, p.nombre, p.ubicacion, p.fecha_inicio, p.estado, p.cliente_id,
             c.nombre AS cliente_nombre,
             c.dni_cuit AS cliente_dni_cuit,
             COALESCE(
               NULLIF((SELECT SUM(presupuesto) FROM etapas WHERE proyecto_id = p.id), 0),
               p.presupuesto_estimado,
               0
             ) AS presupuesto_estimado,
             COALESCE((SELECT SUM(monto) FROM gastos WHERE proyecto_id = p.id), 0) AS total_gastado,
             COALESCE((SELECT SUM(monto) FROM ingresos_cliente WHERE proyecto_id = p.id AND moneda = 'ARS'), 0) AS total_cobrado,
             (SELECT COUNT(*) FROM etapas WHERE proyecto_id = p.id) AS total_etapas,
             (SELECT COUNT(*) FROM gastos WHERE proyecto_id = p.id) AS cantidad_gastos
      FROM proyectos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      ORDER BY p.id DESC
    `;
    const result = await pool.query(query);
    const proyectos = result.rows.map(p => {
      const pres = parseFloat(p.presupuesto_estimado) || 0;
      const gast = parseFloat(p.total_gastado) || 0;
      const cobr = parseFloat(p.total_cobrado) || 0;
      return {
        ...p,
        presupuesto_estimado: pres,
        total_gastado: gast,
        total_cobrado: cobr,
        saldo_pendiente_cobro: pres - cobr,
        cantidad_gastos: parseInt(p.cantidad_gastos, 10),
        total_etapas: parseInt(p.total_etapas, 10),
        porcentaje_ejecutado: pres > 0 ? parseFloat(((gast / pres) * 100).toFixed(1)) : 0
      };
    });
    res.json(proyectos);
  } catch (error) {
    console.error('Error obteniendo proyectos:', error);
    res.status(500).json({ error: 'Error interno al obtener los proyectos' });
  }
});

app.get('/api/proyectos/:id/detalle', async (req, res) => {
  const { id } = req.params;
  try {
    const proyResult = await pool.query(
      `SELECT p.*, c.nombre AS cliente_nombre, c.dni_cuit AS cliente_dni_cuit, c.telefono AS cliente_telefono, c.email AS cliente_email
       FROM proyectos p
       LEFT JOIN clientes c ON p.cliente_id = c.id
       WHERE p.id = $1`,
      [id]
    );

    if (proyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const proyecto = proyResult.rows[0];

    const etapasResult = await pool.query(
      `SELECT e.*,
              COALESCE((SELECT SUM(monto) FROM gastos WHERE etapa_id = e.id), 0) AS total_gastado,
              COALESCE((SELECT SUM(monto) FROM ingresos_cliente WHERE etapa_id = e.id), 0) AS total_cobrado
       FROM etapas e
       WHERE e.proyecto_id = $1
       ORDER BY e.orden ASC, e.id ASC`,
      [id]
    );

    const etapas = etapasResult.rows.map(e => {
      const pres = parseFloat(e.presupuesto) || 0;
      const gast = parseFloat(e.total_gastado) || 0;
      const cobr = parseFloat(e.total_cobrado) || 0;
      return {
        ...e,
        presupuesto: pres,
        total_gastado: gast,
        total_cobrado: cobr,
        porcentaje: pres > 0 ? parseFloat(((gast / pres) * 100).toFixed(1)) : 0
      };
    });

    const ingresosResult = await pool.query(
      `SELECT ic.*, e.nombre AS etapa_nombre, ct.nombre AS cuenta_nombre
       FROM ingresos_cliente ic
       LEFT JOIN etapas e ON ic.etapa_id = e.id
       LEFT JOIN cuentas_tesoreria ct ON ic.cuenta_id = ct.id
       WHERE ic.proyecto_id = $1
       ORDER BY ic.fecha DESC, ic.id DESC`,
      [id]
    );

    const ingresos = ingresosResult.rows.map(i => ({
      ...i,
      monto: parseFloat(i.monto)
    }));

    const gastosResult = await pool.query(
      `SELECT g.*, cat.nombre AS categoria_nombre, e.nombre AS etapa_nombre, ct.nombre AS cuenta_nombre
       FROM gastos g
       JOIN categorias cat ON g.categoria_id = cat.id
       LEFT JOIN etapas e ON g.etapa_id = e.id
       LEFT JOIN cuentas_tesoreria ct ON g.cuenta_id = ct.id
       WHERE g.proyecto_id = $1
       ORDER BY g.fecha_gasto DESC, g.id DESC`,
      [id]
    );

    const gastos = gastosResult.rows.map(g => {
      const mon = g.moneda || (g.cuenta_nombre && g.cuenta_nombre.toLowerCase().includes('usd') ? 'USD' : 'ARS');
      return {
        ...g,
        moneda: mon,
        monto: parseFloat(g.monto)
      };
    });

    const presupuestoEtapasTotal = etapas.reduce((acc, e) => acc + e.presupuesto, 0);
    const presupuestoFinal = presupuestoEtapasTotal > 0 ? presupuestoEtapasTotal : (parseFloat(proyecto.presupuesto_estimado) || 0);

    const totalCobradoARS = ingresos.filter(i => i.moneda === 'ARS').reduce((acc, i) => acc + i.monto, 0);
    const totalCobradoUSD = ingresos.filter(i => i.moneda === 'USD').reduce((acc, i) => acc + i.monto, 0);
    const totalGastadoARS = gastos.filter(g => g.moneda === 'ARS').reduce((acc, g) => acc + g.monto, 0);
    const totalGastadoUSD = gastos.filter(g => g.moneda === 'USD').reduce((acc, g) => acc + g.monto, 0);

    res.json({
      proyecto: {
        ...proyecto,
        presupuesto_estimado: presupuestoFinal,
        total_gastado: totalGastadoARS,
        total_gastado_ars: totalGastadoARS,
        total_gastado_usd: totalGastadoUSD,
        total_cobrado_ars: totalCobradoARS,
        total_cobrado_usd: totalCobradoUSD,
        saldo_pendiente_cobro: presupuestoFinal - totalCobradoARS,
        resultado_caja: totalCobradoARS - totalGastadoARS
      },
      etapas,
      ingresos,
      gastos
    });
  } catch (error) {
    console.error('Error obteniendo detalle de proyecto:', error);
    res.status(500).json({ error: 'Error al obtener detalle del proyecto' });
  }
});

app.post('/api/proyectos', async (req, res) => {
  const { nombre, ubicacion, presupuesto_estimado, fecha_inicio, estado, cliente_id } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del proyecto es obligatorio' });
  }

  const presupuesto = parseFloat(presupuesto_estimado) || 0;
  const fecha = fecha_inicio || new Date().toISOString().split('T')[0];
  const estadoProy = estado || 'Activo';
  const clienteIdNum = cliente_id ? parseInt(cliente_id, 10) : null;

  try {
    const result = await pool.query(
      `INSERT INTO proyectos (nombre, ubicacion, presupuesto_estimado, fecha_inicio, estado, cliente_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nombre.trim(), ubicacion ? ubicacion.trim() : '', presupuesto, fecha, estadoProy, clienteIdNum]
    );

    let clienteNombre = null;
    if (clienteIdNum) {
      const cliRes = await pool.query('SELECT nombre FROM clientes WHERE id = $1', [clienteIdNum]);
      clienteNombre = cliRes.rows[0]?.nombre || null;
    }

    res.status(201).json({
      ...result.rows[0],
      cliente_nombre: clienteNombre,
      presupuesto_estimado: parseFloat(result.rows[0].presupuesto_estimado),
      total_gastado: 0,
      total_cobrado: 0,
      porcentaje_ejecutado: 0
    });
  } catch (error) {
    console.error('Error creando proyecto:', error);
    res.status(500).json({ error: 'Error al guardar el proyecto en la base de datos' });
  }
});

app.put('/api/proyectos/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, ubicacion, presupuesto_estimado, fecha_inicio, estado, cliente_id } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del proyecto es obligatorio' });
  }

  const clienteIdNum = cliente_id ? parseInt(cliente_id, 10) : null;

  try {
    const result = await pool.query(
      `UPDATE proyectos
       SET nombre = $1, ubicacion = $2, presupuesto_estimado = $3, fecha_inicio = $4, estado = $5, cliente_id = $6
       WHERE id = $7 RETURNING *`,
      [nombre.trim(), ubicacion, parseFloat(presupuesto_estimado) || 0, fecha_inicio, estado, clienteIdNum, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    res.json({
      ...result.rows[0],
      presupuesto_estimado: parseFloat(result.rows[0].presupuesto_estimado)
    });
  } catch (error) {
    console.error('Error actualizando proyecto:', error);
    res.status(500).json({ error: 'Error al modificar el proyecto' });
  }
});

app.delete('/api/proyectos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM proyectos WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    res.json({ mensaje: 'Proyecto eliminado con éxito', id: parseInt(id, 10) });
  } catch (error) {
    console.error('Error eliminando proyecto:', error);
    res.status(500).json({ error: 'Error al eliminar el proyecto' });
  }
});

// ---------------------------------------------------
// RUTAS DE ETAPAS DEL PROYECTO
// ---------------------------------------------------

app.post('/api/proyectos/:proyectoId/etapas', async (req, res) => {
  const { proyectoId } = req.params;
  const { nombre, descripcion, presupuesto, orden, estado, fecha_inicio, fecha_fin } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre de la etapa es obligatorio' });
  }

  const numPresupuesto = parseFloat(presupuesto) || 0;
  const numOrden = parseInt(orden, 10) || 1;

  try {
    const result = await pool.query(
      `INSERT INTO etapas (proyecto_id, nombre, descripcion, presupuesto, orden, estado, fecha_inicio, fecha_fin)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [proyectoId, nombre.trim(), descripcion ? descripcion.trim() : null, numPresupuesto, numOrden, estado || 'En Curso', fecha_inicio || null, fecha_fin || null]
    );

    await pool.query(
      `UPDATE proyectos
       SET presupuesto_estimado = (SELECT COALESCE(SUM(presupuesto), 0) FROM etapas WHERE proyecto_id = $1)
       WHERE id = $1`,
      [proyectoId]
    );

    res.status(201).json({
      ...result.rows[0],
      presupuesto: parseFloat(result.rows[0].presupuesto)
    });
  } catch (error) {
    console.error('Error creando etapa:', error);
    res.status(500).json({ error: 'Error al crear la etapa del proyecto' });
  }
});

app.put('/api/etapas/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, presupuesto, orden, estado, fecha_inicio, fecha_fin } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre de la etapa es obligatorio' });
  }

  const numPresupuesto = parseFloat(presupuesto) || 0;

  try {
    const result = await pool.query(
      `UPDATE etapas
       SET nombre = $1, descripcion = $2, presupuesto = $3, orden = $4, estado = $5, fecha_inicio = $6, fecha_fin = $7
       WHERE id = $8 RETURNING *`,
      [nombre.trim(), descripcion, numPresupuesto, orden || 1, estado, fecha_inicio || null, fecha_fin || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Etapa no encontrada' });
    }

    const proyId = result.rows[0].proyecto_id;
    await pool.query(
      `UPDATE proyectos
       SET presupuesto_estimado = (SELECT COALESCE(SUM(presupuesto), 0) FROM etapas WHERE proyecto_id = $1)
       WHERE id = $1`,
      [proyId]
    );

    res.json({
      ...result.rows[0],
      presupuesto: parseFloat(result.rows[0].presupuesto)
    });
  } catch (error) {
    console.error('Error actualizando etapa:', error);
    res.status(500).json({ error: 'Error al modificar la etapa' });
  }
});

app.delete('/api/etapas/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const checkEtapa = await pool.query('SELECT proyecto_id FROM etapas WHERE id = $1', [id]);
    if (checkEtapa.rows.length === 0) {
      return res.status(404).json({ error: 'Etapa no encontrada' });
    }

    const proyId = checkEtapa.rows[0].proyecto_id;
    await pool.query('DELETE FROM etapas WHERE id = $1', [id]);

    await pool.query(
      `UPDATE proyectos
       SET presupuesto_estimado = (SELECT COALESCE(SUM(presupuesto), 0) FROM etapas WHERE proyecto_id = $1)
       WHERE id = $1`,
      [proyId]
    );

    res.json({ mensaje: 'Etapa eliminada correctamente', id: parseInt(id, 10) });
  } catch (error) {
    console.error('Error eliminando etapa:', error);
    res.status(500).json({ error: 'Error al eliminar la etapa' });
  }
});

// ---------------------------------------------------
// RUTAS DE ENTREGAS / COBROS DE CLIENTE (INGRESOS)
// ---------------------------------------------------

app.post('/api/proyectos/:proyectoId/ingresos', async (req, res) => {
  const { proyectoId } = req.params;
  const { etapa_id, monto, moneda, medio_pago, cuenta_id, fecha, concepto, comprobante_url } = req.body;

  const numMonto = parseFloat(monto);
  if (isNaN(numMonto) || numMonto <= 0) {
    return res.status(400).json({ error: 'El monto de la entrega debe ser mayor a 0' });
  }

  const fechaIngreso = fecha || new Date().toISOString().split('T')[0];
  const etapaIdNum = etapa_id ? parseInt(etapa_id, 10) : null;
  const cuentaIdNum = cuenta_id ? parseInt(cuenta_id, 10) : null;
  const monedaVal = moneda || 'ARS';

  try {
    const result = await pool.query(
      `INSERT INTO ingresos_cliente (proyecto_id, etapa_id, monto, moneda, medio_pago, cuenta_id, fecha, concepto, comprobante_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [proyectoId, etapaIdNum, numMonto, monedaVal, medio_pago || 'efectivo_ars', cuentaIdNum, fechaIngreso, concepto ? concepto.trim() : 'Entrega del cliente', comprobante_url || null]
    );

    const ingresoId = result.rows[0].id;

    if (cuentaIdNum) {
      await pool.query(
        `UPDATE cuentas_tesoreria SET saldo = saldo + $1 WHERE id = $2`,
        [numMonto, cuentaIdNum]
      );

      const proyRes = await pool.query('SELECT nombre FROM proyectos WHERE id = $1', [proyectoId]);
      const proyNombre = proyRes.rows[0]?.nombre || 'Proyecto';

      await pool.query(
        `INSERT INTO movimientos_tesoreria (cuenta_id, tipo, monto, concepto, ingreso_id)
         VALUES ($1, 'ingreso', $2, $3, $4)`,
        [cuentaIdNum, numMonto, `Cobro de Cliente (${proyNombre}): ${concepto || 'Entrega de dinero'}`, ingresoId]
      );
    }

    res.status(201).json({
      ...result.rows[0],
      monto: parseFloat(result.rows[0].monto)
    });
  } catch (error) {
    console.error('Error registrando ingreso de cliente:', error);
    res.status(500).json({ error: 'Error al registrar la entrega de dinero' });
  }
});

// GET todos los ingresos (de obras y servicios/estudio)
app.get('/api/ingresos', async (req, res) => {
  try {
    const query = `
      SELECT ic.*,
             COALESCE(p.nombre, 'Servicios / Estudio (Sin Obra)') AS proyecto_nombre,
             e.nombre AS etapa_nombre,
             ct.nombre AS cuenta_nombre,
             c.nombre AS cliente_nombre
      FROM ingresos_cliente ic
      LEFT JOIN proyectos p ON ic.proyecto_id = p.id
      LEFT JOIN etapas e ON ic.etapa_id = e.id
      LEFT JOIN cuentas_tesoreria ct ON ic.cuenta_id = ct.id
      LEFT JOIN clientes c ON p.cliente_id = c.id
      ORDER BY ic.fecha DESC, ic.id DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows.map(i => {
      let isUSD = i.moneda === 'USD' || i.medio_pago === 'efectivo_usd';
      if (!isUSD && i.cuenta_nombre) {
        const cLower = i.cuenta_nombre.toLowerCase();
        if (cLower.includes('usd') || cLower.includes('dolar') || cLower.includes('dólar')) {
          isUSD = true;
        }
      }
      return {
        ...i,
        moneda: isUSD ? 'USD' : (i.moneda || 'ARS'),
        monto: parseFloat(i.monto)
      };
    }));
  } catch (error) {
    console.error('Error obteniendo ingresos:', error);
    res.status(500).json({ error: 'Error al obtener listado de ingresos' });
  }
});

// POST nuevo ingreso (para obras o ingresos esporádicos del estudio como asesorías/consultas)
app.post('/api/ingresos', async (req, res) => {
  const { proyecto_id, etapa_id, monto, moneda, medio_pago, cuenta_id, fecha, concepto, comprobante_url, es_ingreso_estudio } = req.body;

  const numMonto = parseFloat(monto);
  if (isNaN(numMonto) || numMonto <= 0) {
    return res.status(400).json({ error: 'El monto del ingreso debe ser mayor a 0' });
  }

  if (!concepto || !concepto.trim()) {
    return res.status(400).json({ error: 'El concepto o descripción del ingreso es obligatorio' });
  }

  const fechaIngreso = fecha || new Date().toISOString().split('T')[0];
  const proyIdNum = es_ingreso_estudio ? null : (proyecto_id ? parseInt(proyecto_id, 10) : null);
  const etapaIdNum = es_ingreso_estudio ? null : (etapa_id ? parseInt(etapa_id, 10) : null);
  const cuentaIdNum = cuenta_id ? parseInt(cuenta_id, 10) : null;
  let monedaVal = moneda || 'ARS';

  try {
    if (cuentaIdNum) {
      const cRes = await pool.query('SELECT nombre, tipo, moneda FROM cuentas_tesoreria WHERE id = $1', [cuentaIdNum]);
      if (cRes.rows.length > 0) {
        const acc = cRes.rows[0];
        const cLower = (acc.nombre || '').toLowerCase();
        if (acc.moneda === 'USD' || acc.tipo === 'efectivo_usd' || cLower.includes('usd') || cLower.includes('dolar') || cLower.includes('dólar')) {
          monedaVal = 'USD';
        }
      }
    } else if (medio_pago === 'efectivo_usd') {
      monedaVal = 'USD';
    }

    const result = await pool.query(
      `INSERT INTO ingresos_cliente (proyecto_id, etapa_id, monto, moneda, medio_pago, cuenta_id, fecha, concepto, comprobante_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [proyIdNum, etapaIdNum, numMonto, monedaVal, medio_pago || (monedaVal === 'USD' ? 'efectivo_usd' : 'efectivo_ars'), cuentaIdNum, fechaIngreso, concepto.trim(), comprobante_url || null]
    );

    const ingresoId = result.rows[0].id;

    if (cuentaIdNum) {
      await pool.query(
        `UPDATE cuentas_tesoreria SET saldo = saldo + $1 WHERE id = $2`,
        [numMonto, cuentaIdNum]
      );

      let origenText = 'Servicio del Estudio / Asesoría';
      if (proyIdNum) {
        const proyRes = await pool.query('SELECT nombre FROM proyectos WHERE id = $1', [proyIdNum]);
        origenText = proyRes.rows[0]?.nombre || 'Proyecto';
      }

      await pool.query(
        `INSERT INTO movimientos_tesoreria (cuenta_id, tipo, monto, concepto, ingreso_id)
         VALUES ($1, 'ingreso', $2, $3, $4)`,
        [cuentaIdNum, numMonto, `[Ingreso] ${concepto.trim()} (${origenText})`, ingresoId]
      );
    }

    let proyNombre = 'Servicios / Estudio (Sin Obra)';
    if (proyIdNum) {
      const pRes = await pool.query('SELECT nombre FROM proyectos WHERE id = $1', [proyIdNum]);
      proyNombre = pRes.rows[0]?.nombre || proyNombre;
    }

    let cuentaNombre = null;
    if (cuentaIdNum) {
      const cRes = await pool.query('SELECT nombre FROM cuentas_tesoreria WHERE id = $1', [cuentaIdNum]);
      cuentaNombre = cRes.rows[0]?.nombre || null;
    }

    res.status(201).json({
      ...result.rows[0],
      proyecto_nombre: proyNombre,
      cuenta_nombre: cuentaNombre,
      monto: parseFloat(result.rows[0].monto)
    });
  } catch (error) {
    console.error('Error registrando ingreso:', error);
    res.status(500).json({ error: 'Error al registrar el ingreso' });
  }
});

app.delete('/api/ingresos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const ingRes = await pool.query('SELECT * FROM ingresos_cliente WHERE id = $1', [id]);
    if (ingRes.rows.length === 0) {
      return res.status(404).json({ error: 'Cobro de cliente no encontrado' });
    }

    const ing = ingRes.rows[0];

    if (ing.cuenta_id) {
      await pool.query(
        `UPDATE cuentas_tesoreria SET saldo = saldo - $1 WHERE id = $2`,
        [ing.monto, ing.cuenta_id]
      );
    }

    await pool.query('DELETE FROM ingresos_cliente WHERE id = $1', [id]);

    res.json({ mensaje: 'Entrega de cliente eliminada correctamente', id: parseInt(id, 10) });
  } catch (error) {
    console.error('Error eliminando ingreso de cliente:', error);
    res.status(500).json({ error: 'Error al eliminar la entrega de dinero' });
  }
});

// ---------------------------------------------------
// RUTAS DE CATEGORIAS
// ---------------------------------------------------
app.get('/api/categorias', async (req, res) => {
  try {
    const query = `
      SELECT c.*,
             COUNT(g.id) AS total_registros,
             COALESCE(SUM(g.monto), 0) AS total_monto
      FROM categorias c
      LEFT JOIN gastos g ON g.categoria_id = c.id
      GROUP BY c.id
      ORDER BY c.es_estudio DESC, c.nombre ASC
    `;
    const result = await pool.query(query);
    res.json(result.rows.map(r => ({
      ...r,
      total_registros: parseInt(r.total_registros, 10),
      total_monto: parseFloat(r.total_monto)
    })));
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({ error: 'Error al obtener las categorías' });
  }
});

app.post('/api/categorias', async (req, res) => {
  const { nombre, es_estudio } = req.body;
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre de la categoría es obligatorio' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO categorias (nombre, es_estudio) VALUES ($1, $2) RETURNING *',
      [nombre.trim(), !!es_estudio]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'La categoría ya existe' });
    }
    console.error('Error creando categoría:', error);
    res.status(500).json({ error: 'Error al crear la categoría' });
  }
});

app.delete('/api/categorias/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const checkGastos = await pool.query('SELECT COUNT(*) FROM gastos WHERE categoria_id = $1', [id]);
    if (parseInt(checkGastos.rows[0].count, 10) > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar la categoría porque tiene gastos asociados' 
      });
    }

    const result = await pool.query('DELETE FROM categorias WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    res.json({ mensaje: 'Categoría eliminada con éxito', id: parseInt(id, 10) });
  } catch (error) {
    console.error('Error eliminando categoría:', error);
    res.status(500).json({ error: 'Error al eliminar la categoría' });
  }
});

// ---------------------------------------------------
// RUTAS DE GASTOS
// ---------------------------------------------------
app.get('/api/gastos', async (req, res) => {
  const { proyecto_id, etapa_id, categoria_id, search, tipo } = req.query;

  let query = `
    SELECT g.*,
           COALESCE(p.nombre, 'Estudio / Gastos Operativos') AS proyecto_nombre,
           e.nombre AS etapa_nombre,
           c.nombre AS categoria_nombre,
           ct.nombre AS cuenta_nombre
    FROM gastos g
    LEFT JOIN proyectos p ON g.proyecto_id = p.id
    LEFT JOIN etapas e ON g.etapa_id = e.id
    JOIN categorias c ON g.categoria_id = c.id
    LEFT JOIN cuentas_tesoreria ct ON g.cuenta_id = ct.id
    WHERE 1=1
  `;
  const params = [];

  if (tipo === 'estudio') {
    query += ` AND g.es_gasto_estudio = TRUE`;
  } else if (tipo === 'obras') {
    query += ` AND g.es_gasto_estudio = FALSE`;
  }

  if (proyecto_id) {
    params.push(proyecto_id);
    query += ` AND g.proyecto_id = $${params.length}`;
  }

  if (etapa_id) {
    params.push(etapa_id);
    query += ` AND g.etapa_id = $${params.length}`;
  }

  if (categoria_id) {
    params.push(categoria_id);
    query += ` AND g.categoria_id = $${params.length}`;
  }

  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    query += ` AND (g.descripcion ILIKE $${params.length} OR p.nombre ILIKE $${params.length})`;
  }

  query += ` ORDER BY g.fecha_gasto DESC, g.id DESC`;

  try {
    const result = await pool.query(query, params);
    const gastos = result.rows.map(g => {
      const mon = g.moneda || (g.cuenta_nombre && g.cuenta_nombre.toLowerCase().includes('usd') ? 'USD' : 'ARS');
      return {
        ...g,
        moneda: mon,
        monto: parseFloat(g.monto)
      };
    });
    res.json(gastos);
  } catch (error) {
    console.error('Error obteniendo gastos:', error);
    res.status(500).json({ error: 'Error al obtener la lista de gastos' });
  }
});

app.post('/api/gastos', async (req, res) => {
  const { proyecto_id, etapa_id, categoria_id, monto, moneda, descripcion, fecha_gasto, comprobante_url, es_gasto_estudio, cuenta_id } = req.body;

  if (!categoria_id || !monto || !descripcion || !descripcion.trim()) {
    return res.status(400).json({ error: 'Categoría, monto y descripción son obligatorios' });
  }

  if (!es_gasto_estudio && !proyecto_id) {
    return res.status(400).json({ error: 'Selecciona un proyecto o marca el gasto como Gasto del Estudio' });
  }

  const numMonto = parseFloat(monto);
  if (isNaN(numMonto) || numMonto <= 0) {
    return res.status(400).json({ error: 'El monto debe ser un número positivo mayor a 0' });
  }

  const fecha = fecha_gasto || new Date().toISOString().split('T')[0];
  const proyIdNum = es_gasto_estudio ? null : parseInt(proyecto_id, 10);
  const etapaIdNum = es_gasto_estudio ? null : (etapa_id ? parseInt(etapa_id, 10) : null);
  const cuentaIdNum = cuenta_id ? parseInt(cuenta_id, 10) : null;
  let monedaVal = moneda || 'ARS';

  try {
    if (cuentaIdNum) {
      const cRes = await pool.query('SELECT nombre, tipo, moneda FROM cuentas_tesoreria WHERE id = $1', [cuentaIdNum]);
      if (cRes.rows.length > 0) {
        const acc = cRes.rows[0];
        const cLower = (acc.nombre || '').toLowerCase();
        if (acc.moneda === 'USD' || acc.tipo === 'efectivo_usd' || cLower.includes('usd') || cLower.includes('dolar') || cLower.includes('dólar')) {
          monedaVal = 'USD';
        }
      }
    }

    const result = await pool.query(
      `INSERT INTO gastos (proyecto_id, etapa_id, categoria_id, monto, moneda, descripcion, fecha_gasto, comprobante_url, es_gasto_estudio, cuenta_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [proyIdNum, etapaIdNum, categoria_id, numMonto, monedaVal, descripcion.trim(), fecha, comprobante_url || null, !!es_gasto_estudio, cuentaIdNum]
    );

    const gastoId = result.rows[0].id;

    if (cuentaIdNum) {
      await pool.query(
        `UPDATE cuentas_tesoreria SET saldo = saldo - $1 WHERE id = $2`,
        [numMonto, cuentaIdNum]
      );
      await pool.query(
        `INSERT INTO movimientos_tesoreria (cuenta_id, tipo, monto, concepto, gasto_id)
         VALUES ($1, 'egreso', $2, $3, $4)`,
        [cuentaIdNum, numMonto, `Pago de gasto: ${descripcion.trim()}`, gastoId]
      );
    }

    let proyNombre = 'Estudio / Gastos Operativos';
    if (proyIdNum) {
      const pRes = await pool.query('SELECT nombre FROM proyectos WHERE id = $1', [proyIdNum]);
      proyNombre = pRes.rows[0]?.nombre || proyNombre;
    }
    const catRes = await pool.query('SELECT nombre FROM categorias WHERE id = $1', [categoria_id]);

    res.status(201).json({
      ...result.rows[0],
      monto: parseFloat(result.rows[0].monto),
      proyecto_nombre: proyNombre,
      categoria_nombre: catRes.rows[0]?.nombre || ''
    });
  } catch (error) {
    console.error('Error guardando gasto:', error);
    res.status(500).json({ error: 'Error al registrar el gasto' });
  }
});

app.put('/api/gastos/:id', async (req, res) => {
  const { id } = req.params;
  const { proyecto_id, etapa_id, categoria_id, monto, moneda, descripcion, fecha_gasto, comprobante_url, es_gasto_estudio, cuenta_id } = req.body;

  if (!categoria_id || !monto || !descripcion || !descripcion.trim()) {
    return res.status(400).json({ error: 'Categoría, monto y descripción son obligatorios' });
  }

  const numMonto = parseFloat(monto);
  if (isNaN(numMonto) || numMonto <= 0) {
    return res.status(400).json({ error: 'El monto debe ser válido' });
  }

  const proyIdNum = es_gasto_estudio ? null : parseInt(proyecto_id, 10);
  const etapaIdNum = es_gasto_estudio ? null : (etapa_id ? parseInt(etapa_id, 10) : null);
  const cuentaIdNum = cuenta_id ? parseInt(cuenta_id, 10) : null;
  let monedaVal = moneda || 'ARS';

  try {
    if (cuentaIdNum) {
      const cRes = await pool.query('SELECT nombre, tipo, moneda FROM cuentas_tesoreria WHERE id = $1', [cuentaIdNum]);
      if (cRes.rows.length > 0) {
        const acc = cRes.rows[0];
        const cLower = (acc.nombre || '').toLowerCase();
        if (acc.moneda === 'USD' || acc.tipo === 'efectivo_usd' || cLower.includes('usd') || cLower.includes('dolar') || cLower.includes('dólar')) {
          monedaVal = 'USD';
        }
      }
    }

    const prevRes = await pool.query('SELECT * FROM gastos WHERE id = $1', [id]);
    if (prevRes.rows.length === 0) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }
    const prevGasto = prevRes.rows[0];
    const prevMonto = parseFloat(prevGasto.monto);
    const prevCuentaId = prevGasto.cuenta_id;

    // Revertir descuento previo si la cuenta existía
    if (prevCuentaId) {
      await pool.query('UPDATE cuentas_tesoreria SET saldo = saldo + $1 WHERE id = $2', [prevMonto, prevCuentaId]);
    }

    // Aplicar nuevo descuento si hay cuenta especificada
    if (cuentaIdNum) {
      await pool.query('UPDATE cuentas_tesoreria SET saldo = saldo - $1 WHERE id = $2', [numMonto, cuentaIdNum]);
    }

    const result = await pool.query(
      `UPDATE gastos
       SET proyecto_id = $1, etapa_id = $2, categoria_id = $3, monto = $4, moneda = $5, descripcion = $6, fecha_gasto = $7, comprobante_url = $8, es_gasto_estudio = $9, cuenta_id = $10
       WHERE id = $11 RETURNING *`,
      [proyIdNum, etapaIdNum, categoria_id, numMonto, monedaVal, descripcion.trim(), fecha_gasto, comprobante_url || null, !!es_gasto_estudio, cuentaIdNum, id]
    );

    res.json({
      ...result.rows[0],
      monto: parseFloat(result.rows[0].monto)
    });
  } catch (error) {
    console.error('Error actualizando gasto:', error);
    res.status(500).json({ error: 'Error al modificar el gasto' });
  }
});

app.delete('/api/gastos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const checkGasto = await pool.query('SELECT * FROM gastos WHERE id = $1', [id]);
    if (checkGasto.rows.length === 0) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }

    const gasto = checkGasto.rows[0];

    // Reintegrar dinero a la cuenta de tesorería si fue pagado con una
    if (gasto.cuenta_id && gasto.monto) {
      await pool.query(
        `UPDATE cuentas_tesoreria SET saldo = saldo + $1 WHERE id = $2`,
        [parseFloat(gasto.monto), gasto.cuenta_id]
      );
    }

    const result = await pool.query('DELETE FROM gastos WHERE id = $1 RETURNING id', [id]);
    res.json({ mensaje: 'Gasto eliminado con éxito', id: parseInt(id, 10) });
  } catch (error) {
    console.error('Error eliminando gasto:', error);
    res.status(500).json({ error: 'Error al eliminar el gasto' });
  }
});

// ---------------------------------------------------
// RUTAS DE EMPLEADOS & CUENTA CORRIENTE & PAGOS (SUELDOS / MDO)
// ---------------------------------------------------

// 1. Obtener todos los empleados con resumen de pagos
app.get('/api/empleados', async (req, res) => {
  try {
    const query = `
      SELECT e.*,
             COALESCE(SUM(p.monto), 0) AS total_pagado,
             COUNT(p.id) AS cantidad_pagos
      FROM empleados e
      LEFT JOIN pagos_empleados p ON p.empleado_id = e.id
      GROUP BY e.id
      ORDER BY e.nombre ASC
    `;
    const result = await pool.query(query);
    res.json(result.rows.map(emp => ({
      ...emp,
      salario_base: parseFloat(emp.salario_base) || 0,
      total_pagado: parseFloat(emp.total_pagado) || 0,
      cantidad_pagos: parseInt(emp.cantidad_pagos, 10)
    })));
  } catch (error) {
    console.error('Error obteniendo empleados:', error);
    res.status(500).json({ error: 'Error al obtener la lista de empleados' });
  }
});

// 2. Obtener detalle de un empleado con su Cuenta Corriente (historial de pagos)
app.get('/api/empleados/:id/cuenta-corriente', async (req, res) => {
  const { id } = req.params;
  try {
    const empRes = await pool.query('SELECT * FROM empleados WHERE id = $1', [id]);
    if (empRes.rows.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    const empleado = empRes.rows[0];

    const pagosRes = await pool.query(
      `SELECT p.*,
              proy.nombre AS proyecto_nombre,
              et.nombre AS etapa_nombre,
              ct.nombre AS cuenta_nombre
       FROM pagos_empleados p
       LEFT JOIN proyectos proy ON p.proyecto_id = proy.id
       LEFT JOIN etapas et ON p.etapa_id = et.id
       LEFT JOIN cuentas_tesoreria ct ON p.cuenta_id = ct.id
       WHERE p.empleado_id = $1
       ORDER BY p.fecha DESC, p.id DESC`,
      [id]
    );

    const pagos = pagosRes.rows.map(p => ({
      ...p,
      monto: parseFloat(p.monto)
    }));

    const totalPagado = pagos.reduce((acc, p) => acc + p.monto, 0);

    res.json({
      empleado: {
        ...empleado,
        salario_base: parseFloat(empleado.salario_base) || 0,
        total_pagado: totalPagado
      },
      pagos
    });
  } catch (error) {
    console.error('Error obteniendo cuenta corriente de empleado:', error);
    res.status(500).json({ error: 'Error al obtener cuenta corriente del empleado' });
  }
});

// 3. Crear empleado
app.post('/api/empleados', async (req, res) => {
  const { nombre, dni_cuit, telefono, email, puesto_rol, salario_base, notas } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del empleado es obligatorio' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO empleados (nombre, dni_cuit, telefono, email, puesto_rol, salario_base, notas)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [nombre.trim(), dni_cuit ? dni_cuit.trim() : null, telefono ? telefono.trim() : null, email ? email.trim() : null, puesto_rol ? puesto_rol.trim() : null, parseFloat(salario_base) || 0, notas ? notas.trim() : null]
    );
    res.status(201).json({
      ...result.rows[0],
      salario_base: parseFloat(result.rows[0].salario_base) || 0,
      total_pagado: 0,
      cantidad_pagos: 0
    });
  } catch (error) {
    console.error('Error creando empleado:', error);
    res.status(500).json({ error: 'Error al guardar el empleado' });
  }
});

// 4. Modificar empleado
app.put('/api/empleados/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, dni_cuit, telefono, email, puesto_rol, salario_base, notas } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del empleado es obligatorio' });
  }

  try {
    const result = await pool.query(
      `UPDATE empleados
       SET nombre = $1, dni_cuit = $2, telefono = $3, email = $4, puesto_rol = $5, salario_base = $6, notas = $7
       WHERE id = $8 RETURNING *`,
      [nombre.trim(), dni_cuit, telefono, email, puesto_rol, parseFloat(salario_base) || 0, notas, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    res.json({
      ...result.rows[0],
      salario_base: parseFloat(result.rows[0].salario_base) || 0
    });
  } catch (error) {
    console.error('Error actualizando empleado:', error);
    res.status(500).json({ error: 'Error al modificar el empleado' });
  }
});

// 5. Eliminar empleado
app.delete('/api/empleados/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const checkPagos = await pool.query('SELECT COUNT(*) FROM pagos_empleados WHERE empleado_id = $1', [id]);
    if (parseInt(checkPagos.rows[0].count, 10) > 0) {
      return res.status(400).json({ error: 'No se puede eliminar el empleado porque posee pagos registrados en su cuenta corriente' });
    }

    const result = await pool.query('DELETE FROM empleados WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }
    res.json({ mensaje: 'Empleado eliminado correctamente', id: parseInt(id, 10) });
  } catch (error) {
    console.error('Error eliminando empleado:', error);
    res.status(500).json({ error: 'Error al eliminar empleado' });
  }
});

// 6. Registrar Pago a Empleado (Mano de Obra MDO o Sueldo Estudio + Descuento de Tesorería)
app.post('/api/empleados/:id/pagos', async (req, res) => {
  const { id } = req.params;
  const { monto, fecha, concepto, proyecto_id, etapa_id, cuenta_id } = req.body;

  const numMonto = parseFloat(monto);
  if (isNaN(numMonto) || numMonto <= 0) {
    return res.status(400).json({ error: 'El monto del pago debe ser mayor a 0' });
  }

  if (!concepto || !concepto.trim()) {
    return res.status(400).json({ error: 'La descripción / concepto del pago es obligatoria' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verificar empleado
    const empRes = await client.query('SELECT * FROM empleados WHERE id = $1', [id]);
    if (empRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }
    const empleado = empRes.rows[0];

    const fechaPago = fecha || new Date().toISOString().split('T')[0];
    const proyIdNum = proyecto_id ? parseInt(proyecto_id, 10) : null;
    const etapaIdNum = (proyIdNum && etapa_id) ? parseInt(etapa_id, 10) : null;
    const cuentaIdNum = cuenta_id ? parseInt(cuenta_id, 10) : null;

    // Buscar o crear la categoría correspondiente
    let categoriaNombre = proyIdNum ? 'Mano de Obra (MDO)' : 'Sueldos y Honorarios (Estudio)';
    let esEstudio = !proyIdNum;

    let catRes = await client.query('SELECT id FROM categorias WHERE LOWER(nombre) = LOWER($1)', [categoriaNombre]);
    let categoriaId;
    if (catRes.rows.length > 0) {
      categoriaId = catRes.rows[0].id;
    } else {
      const newCatRes = await client.query(
        'INSERT INTO categorias (nombre, es_estudio) VALUES ($1, $2) RETURNING id',
        [categoriaNombre, esEstudio]
      );
      categoriaId = newCatRes.rows[0].id;
    }

    // Registrar gasto de obra (MDO) o gasto de estudio (Sueldos)
    const descGasto = proyIdNum 
      ? `[MDO - ${empleado.nombre}] ${concepto.trim()}`
      : `[Sueldos - ${empleado.nombre}] ${concepto.trim()}`;

    const gastoRes = await client.query(
      `INSERT INTO gastos (proyecto_id, etapa_id, categoria_id, monto, descripcion, fecha_gasto, es_gasto_estudio, cuenta_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [proyIdNum, etapaIdNum, categoriaId, numMonto, descGasto, fechaPago, esEstudio, cuentaIdNum]
    );

    const gastoId = gastoRes.rows[0].id;

    // Si especificó cuenta de tesorería, descontar saldo e insertar movimiento
    if (cuentaIdNum) {
      await client.query('UPDATE cuentas_tesoreria SET saldo = saldo - $1 WHERE id = $2', [numMonto, cuentaIdNum]);

      await client.query(
        `INSERT INTO movimientos_tesoreria (cuenta_id, tipo, monto, concepto, gasto_id)
         VALUES ($1, 'egreso', $2, $3, $4)`,
        [cuentaIdNum, numMonto, `Pago a Empleado (${empleado.nombre}): ${concepto.trim()}`, gastoId]
      );
    }

    // Insertar en tabla pagos_empleados (Cuenta Corriente)
    const pagoRes = await client.query(
      `INSERT INTO pagos_empleados (empleado_id, monto, fecha, concepto, proyecto_id, etapa_id, cuenta_id, gasto_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [id, numMonto, fechaPago, concepto.trim(), proyIdNum, etapaIdNum, cuentaIdNum, gastoId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      ...pagoRes.rows[0],
      monto: parseFloat(pagoRes.rows[0].monto)
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error procesando pago a empleado:', error);
    res.status(500).json({ error: 'Error al registrar el pago en la cuenta del empleado' });
  } finally {
    client.release();
  }
});

// 7. Eliminar Pago de Empleado (Revierte Gasto y Tesorería)
app.delete('/api/pagos-empleados/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const pagoRes = await client.query('SELECT * FROM pagos_empleados WHERE id = $1', [id]);
    if (pagoRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Registro de pago no encontrado' });
    }

    const pago = pagoRes.rows[0];

    // Si tiene gasto_id asociado, eliminar el gasto (lo que reintegrará el dinero a la tesorería)
    if (pago.gasto_id) {
      const gastoRes = await client.query('SELECT * FROM gastos WHERE id = $1', [pago.gasto_id]);
      if (gastoRes.rows.length > 0) {
        const gasto = gastoRes.rows[0];
        if (gasto.cuenta_id) {
          await client.query('UPDATE cuentas_tesoreria SET saldo = saldo + $1 WHERE id = $2', [parseFloat(gasto.monto), gasto.cuenta_id]);
        }
        await client.query('DELETE FROM gastos WHERE id = $1', [pago.gasto_id]);
      }
    }

    await client.query('DELETE FROM pagos_empleados WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({ mensaje: 'Pago eliminado y saldo de tesorería reintegrado con éxito', id: parseInt(id, 10) });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error eliminando pago de empleado:', error);
    res.status(500).json({ error: 'Error al eliminar el pago' });
  } finally {
    client.release();
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`Servidor del backend corriendo exitosamente en http://localhost:${PORT}`);
});
# Analizador de Transacciones Bancarias — Guía del Usuario

**Versión:** 1.0 (MVP)  
**Desarrollado por:** Thradex Technologies  
**Propósito:** Aplicación web local para analizar, validar y gestionar múltiples cuentas bancarias con almacenamiento seguro en el navegador.

---

## Descripción General
El **Analizador de Transacciones Bancarias (MVP)** es una herramienta ligera y privada que permite a los usuarios:
- Pegar texto sin formato de movimientos bancarios.
- Analizar, validar y normalizar automáticamente las transacciones.
- Asignar transacciones a cuentas bancarias registradas.
- Guardar toda la información localmente (sin conexión a internet).
- Exportar los datos en formato **JSON**.

Funciona completamente **sin conexión** y garantiza **privacidad total** de los datos.

---

## Funciones Principales

### 1. Gestión de Cuentas Bancarias
- Registrar múltiples cuentas con:
  - Alias (nombre amigable)
  - Nombre del banco
  - Titular de la cuenta
  - Número de cuenta
  - Moneda (por ejemplo: `S/`, `PEN`, `USD`)
  - Tipo de cuenta (por ejemplo: Ahorros, Corriente)
- Ver una lista consolidada de todas las cuentas.
- Consultar estadísticas por cuenta:
  - Total de transacciones
  - Fecha del registro más antiguo
  - Fecha del registro más reciente
- Hacer clic en una cuenta para seleccionarla como activa.

### 2. Análisis de Transacciones
- Pegar el texto de los movimientos bancarios en este formato:
  ```
  Transf interbancaria
  vie. 31 oct 17:07 S/ -286.00
  ```
- El analizador detecta automáticamente:
  - Descripción, fecha/hora, moneda y monto.
- Las fechas se normalizan al formato **ISO** (`YYYY-MM-DDTHH:mm:ss`).

### 3. Validación de Moneda
- Las transacciones deben coincidir con la moneda declarada de la cuenta.
- Si no coinciden, el proceso de análisis se detiene con una advertencia.

### 4. Detección de Duplicados
- Cada transacción recibe un **UUID determinístico**:
  ```
  <numeroDeCuenta>_<fechaHoraISO>
  ```
- Antes de guardar, el sistema verifica duplicados:
  - Si el UUID ya existe → se omite la transacción.
  - Si es nueva → se guarda correctamente.
- Muestra un resumen como:
  ```
  🟢 23 nuevas guardadas, ⚠️ 4 duplicadas omitidas.
  ```
- Muestra una tabla de duplicadas y permite descargar el archivo JSON correspondiente.
- Las duplicadas solo se muestran **durante la sesión actual** y se eliminan antes del siguiente análisis.

### 5. Almacenamiento Local
- Utiliza **localStorage** del navegador.
- Los datos persisten incluso al cerrar o recargar la página.
- Cada cuenta tiene su propio almacenamiento independiente.

### 6. Gestión de Datos
- **Borrar todas las transacciones guardadas** (por cuenta).  
- **Borrar por rango de fechas.**  
- **Borrar el área de texto** (antes o después de analizar).

### 7. Descargas
- **Descargar lote actual (JSON)**.  
- **Descargar todas las transacciones (JSON)**.  
- **Descargar duplicadas (JSON)**.

### 8. Indicadores Visuales
- 🟢 Mensaje “Guardado localmente” tras cada operación exitosa.  
- ⚠️ Advertencias por moneda o duplicados.  
- Interfaz blanca, simple y minimalista.

---

## Validaciones

| Validación | Descripción | Comportamiento |
|-------------|-------------|----------------|
| Coincidencia de moneda | La moneda debe coincidir con la cuenta | Aborta |
| Duplicado | UUID ya existente | Omite |
| Pega vacío | Sin datos | Aborta |
| Fecha inválida | No reconocida | Ignora |
| Múltiples monedas | Mezcladas en el mismo lote | Aborta |

---

## Ejemplos de Exportación

### transactions_batch.json
```json
{
  "bank_account": {
    "alias": "Cuenta Nómina",
    "bank_name": "Interbank",
    "account_holder": "Ronald Zavaleta",
    "account_number": "000123456789",
    "currency": "PEN",
    "account_type": "Ahorros"
  },
  "transactions": [ ... ]
}
```

### duplicates.json
```json
{
  "bank_account": {
    "alias": "Cuenta Nómina",
    "bank_name": "Interbank",
    "account_number": "000123456789",
    "currency": "PEN"
  },
  "skipped_duplicates": [ ... ]
}
```

---

## Resumen Técnico
- Front-End: HTML + JavaScript puro  
- Almacenamiento: localStorage del navegador  
- Formato de exportación: JSON  
- Funciona sin conexión al 100%  
- Privacidad: sin acceso a servidores externos

---

## Guía Rápida
1. Abrir el archivo `index.html`.  
2. Registrar tus cuentas bancarias.  
3. Seleccionar una cuenta.  
4. Pegar los movimientos bancarios.  
5. Hacer clic en **Analizar y Guardar**.  
6. Revisar duplicados y descargar los archivos JSON.

---

## Mejoras Futuras
- Contadores y balances por cuenta.  
- Gráficos y filtros por tipo de transacción.  
- Exportación a CSV/Excel.  
- Sincronización cifrada opcional.  
- Notificaciones visuales (toast).  

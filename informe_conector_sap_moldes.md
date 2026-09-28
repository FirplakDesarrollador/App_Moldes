# Informe Técnico: Conector API SAP - Actualización de Estados de Moldes

Este documento detalla la funcionalidad de sincronización de estados entre la aplicación de Moldes y **SAP Business One**, permitiendo replicar esta lógica y credenciales en otros aplicativos.

---

## 1. Arquitectura de Conexión
La comunicación se realiza a través del **SAP Service Layer** (la API moderna de SAP B1 basada en OData).

- **Protocolo:** HTTPS / JSON
- **Base URL (Producción):** `https://200.7.96.194:50000/b1s/v1`
- **Entidad de SAP afectada:** `SerialNumberDetails` (Detalle de Números de Serie).

## 2. Credenciales y Autenticación
Para utilizar estas credenciales en otro aplicativo, se requieren las siguientes variables de entorno:

- `SAP_USER`: Usuario técnico de SAP.
- `SAP_PASSWORD`: Contraseña del usuario técnico.
- `SAP_COMPANY_DB`: Nombre de la base de datos de la empresa en SAP.

### Proceso de Login
Cada petición al conector inicia con una autenticación al endpoint `/Login` enviando:
```json
{
    "CompanyDB": "NOMBRE_DE_TU_DB",
    "UserName": "TU_USUARIO",
    "Password": "TU_PASSWORD"
}
```
El servidor de SAP responde con un `SessionId` y una `Set-Cookie`, los cuales deben ser incluidos en las cabeceras (`Cookie` y `B1SESSION`) de las peticiones posteriores.

---

## 3. Lógica de Modificación de Estado
La funcionalidad se divide en tres pasos críticos:

### A. Mapeo de Estados
Para asegurar la compatibilidad con los valores permitidos en SAP, la aplicación realiza la siguiente traducción:

| Estado en Aplicación | Estado en SAP (`U_EstadoMolde`) |
| :--- | :--- |
| **Entregado** | `Activo` |
| **Destruido** | `Baja` |
| **En reparación** | `En reparación` |

### B. Búsqueda del Registro en SAP
Como SAP identifica los registros por un `DocEntry` interno, el conector primero busca el registro:
- **Filtro OData:** `SerialNumber eq 'CODIGO_MOLDE' or MfrSerialNo eq 'CODIGO_MOLDE'`
- **Endpoint de búsqueda:** `/SerialNumberDetails?$filter=...`

### C. Actualización (PATCH)
Una vez obtenido el `DocEntry`, se envía una petición `PATCH` al registro identificado:
- **Endpoint:** `/SerialNumberDetails(DOC_ENTRY_ENCONTRADO)`
- **Payload:**
    ```json
    {
        "U_EstadoMolde": "ESTADO_MAPEADO"
    }
    ```
    *(Nota: `U_EstadoMolde` es un campo definido por el usuario o UDF en SAP).*

---

## 4. Consideraciones Técnicas
- **Certificados SSL:** El servidor SAP actual utiliza un certificado auto-firmado, por lo que las peticiones deben configurar el agente para ignorar errores de SSL (`rejectUnauthorized: false`).
- **Seguridad:** Las credenciales deben gestionarse siempre desde un backend seguro; nunca deben exponerse en el cliente (frontend).
- **Triggers:** En la aplicación actual, la actualización ocurre en el evento `handleSave` de la página de Historial.

---
**Rutas de referencia en el código:**
- **Frontend (Trigger):** `src/app/dashboard/history/page.tsx`
- **Backend (API Logic):** `src/app/api/sap-items/update/route.ts`

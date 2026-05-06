import { NextResponse } from 'next/server'
import { Agent, setGlobalDispatcher } from 'undici'

function mapEstadoToSAP(estado: string): string | null {
    const e = estado.trim().toLowerCase();
    
    // Mapeo según reglas de negocio
    if (e.includes('reparación') || e.includes('reparacion') || e.includes('espera')) {
        return 'En reparación';
    }
    if (e.includes('activo') || e.includes('disponible') || e.includes('entregado')) {
        return 'Activo';
    }
    if (e.includes('baja') || e.includes('destruido')) {
        return 'Baja';
    }
    
    return null;
}

export async function POST(req: Request) {
    console.log('[SAP Update] Incoming request...');
    try {
        const payload = await req.json()
        console.log('[SAP Update] Payload:', JSON.stringify(payload, null, 2));

        const rawSerial = String(payload.serialNumber || '');
        const serialNumber = rawSerial.trim();
        const { itemCode, estado_sap } = payload

        if (!itemCode || !serialNumber || !estado_sap) {
            console.error('[SAP Update] Missing parameters:', { itemCode, serialNumber, estado_sap });
            return NextResponse.json({ success: false, error: 'Faltan parámetros obligatorios de identificación (ItemCode, SerialNumber, estado_sap)' }, { status: 400 })
        }

        // Normalizar estado para SAP
        const normalizedStatus = mapEstadoToSAP(estado_sap);
        if (!normalizedStatus) {
            console.error('[SAP Update] Invalid status requested:', estado_sap);
            return NextResponse.json({ success: false, error: `El estado '${estado_sap}' no es un valor válido para SAP (Activo, En reparación, Baja)` }, { status: 400 })
        }
        
        console.log(`[SAP Update] Status normalized: '${estado_sap}' -> '${normalizedStatus}'`);

        const agent = new Agent({ connect: { rejectUnauthorized: false } })

        // 1. Authenticate to SAP
        const sapUser = process.env.SAP_USER
        const sapPassword = process.env.SAP_PASSWORD
        const sapCompany = process.env.SAP_COMPANY_DB
        const baseUrl = process.env.SAP_BASE_URL || 'https://200.7.96.194:50000/b1s/v1'

        console.log('[SAP Update] Attempting login to SAP...', { baseUrl, user: sapUser, company: sapCompany });

        if (!sapUser || !sapPassword || !sapCompany) {
            return NextResponse.json({ success: false, error: 'Credenciales SAP no configuradas en el servidor' }, { status: 500 })
        }

        const loginRes = await fetch(`${baseUrl}/Login`, {
            method: 'POST',
            body: JSON.stringify({
                CompanyDB: sapCompany,
                UserName: sapUser,
                Password: sapPassword
            }),
            dispatcher: agent
        } as any)

        if (!loginRes.ok) {
            const loginErr = await loginRes.text();
            console.error('[SAP Update] Login failed:', loginRes.status, loginErr);
            return NextResponse.json({ success: false, error: 'Fallo autenticación en SAP', details: loginErr }, { status: 401 })
        }

        const loginData = await loginRes.json()
        const sessionCookie = loginRes.headers.get('set-cookie') || ''
        const sessionId = loginData.SessionId

        const headers = {
            'Content-Type': 'application/json',
            'Cookie': sessionCookie,
            'B1SESSION': sessionId
        }

        // 2. Fetch the entity to get its unique identifier 
        const filterQuery = `(SerialNumber eq '${serialNumber}' or MfrSerialNo eq '${serialNumber}') and ItemCode eq '${itemCode}'`;
        const searchPath = `/SerialNumberDetails?$filter=${encodeURIComponent(filterQuery)}`;
        
        console.log('[SAP Update] Searching for record...', { url: `${baseUrl}${searchPath}` });

        const fetchRes = await fetch(`${baseUrl}${searchPath}`, { headers, dispatcher: agent } as any)
        const fetchData = await fetchRes.json()
        
        if (!fetchRes.ok || !fetchData.value || fetchData.value.length === 0) {
            console.error('[SAP Update] Record not found or error:', fetchRes.status, fetchData);
            return NextResponse.json({ 
                success: false, 
                error: 'El artículo o número de serie no existe en SAP.', 
                details: fetchData.error || 'No records found'
            }, { status: 404 })
        }

        const entity = fetchData.value[0]
        console.log('[SAP Update] Record found:', { DocEntry: entity.DocEntry, ItemCode: entity.ItemCode });

        // Use the exact identified User-Defined Field
        const estadoMoldeKey = 'U_EstadoMolde';

        const patchData = {
            [estadoMoldeKey]: normalizedStatus
        }

        // 3. Patch the record
        const docEntry = entity.DocEntry;
        const patchPath = `/SerialNumberDetails(${docEntry})`
        console.log('[SAP Update] Sending PATCH...', { url: `${baseUrl}${patchPath}`, data: patchData });

        const patchRes = await fetch(`${baseUrl}${patchPath}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(patchData),
            dispatcher: agent
        } as any)

        if (!patchRes.ok) {
            const patchErr = await patchRes.json().catch(() => ({ error: 'Error parseando respuesta' }));
            console.error('[SAP Update] PATCH failed:', patchRes.status, JSON.stringify(patchErr, null, 2));
            
            let errorMsg = 'Error del servidor SAP al intentar actualizar';
            if (patchRes.status === 401) errorMsg = 'Sesión SAP expirada o no autorizada';
            if (patchRes.status === 400) errorMsg = 'Parámetros inválidos o campo no editable en SAP';

            return NextResponse.json({ 
                success: false, 
                error: errorMsg, 
                details: patchErr 
            }, { status: patchRes.status })
        }

        console.log('[SAP Update] Update successful!');
        return NextResponse.json({ success: true, message: 'Actualizado correctamente en SAP' })

    } catch (error: any) {
        console.error('[SAP Update] Fatal error:', error)
        return NextResponse.json({ success: false, error: 'Error de red o excepción interna: ' + (error.message || 'Error desconocido') }, { status: 500 })
    }
}

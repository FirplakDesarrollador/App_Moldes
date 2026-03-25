import { NextResponse } from 'next/server'
import { Agent, setGlobalDispatcher } from 'undici'

export async function POST(req: Request) {
    try {
        const payload = await req.json()
        const rawSerial = String(payload.serialNumber || '');
        const serialNumber = rawSerial.trim();
        const { itemCode, estado_sap } = payload

        if (!itemCode || !serialNumber || !estado_sap) {
            return NextResponse.json({ success: false, error: 'Faltan parámetros obligatorios de identificación (ItemCode, SerialNumber, estado_sap)' }, { status: 400 })
        }

        const agent = new Agent({ connect: { rejectUnauthorized: false } })

        // 1. Authenticate to SAP
        const sapUser = process.env.SAP_USER
        const sapPassword = process.env.SAP_PASSWORD
        const sapCompany = process.env.SAP_COMPANY_DB
        const baseUrl = 'https://200.7.96.194:50000/b1s/v1'

        if (!sapUser || !sapPassword || !sapCompany) {
            return NextResponse.json({ success: false, error: 'Credenciales SAP no configuradas' }, { status: 500 })
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
            return NextResponse.json({ success: false, error: 'Fallo auténticacion en SAP' }, { status: 401 })
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
        // We know the serialNumber from the app. It may be stored in InternalSerialNumber, MfrSerialNo, etc.
        const filterQuery = `SerialNumber eq '${serialNumber}' or MfrSerialNo eq '${serialNumber}'`;
        const searchPath = `/SerialNumberDetails?$filter=${encodeURIComponent(filterQuery)}`;
        
        const fetchRes = await fetch(`${baseUrl}${searchPath}`, { headers, dispatcher: agent } as any)
        const fetchData = await fetchRes.json()
        
        if (!fetchRes.ok || !fetchData.value || fetchData.value.length === 0) {
            return NextResponse.json({ success: false, error: 'El número de serie no existe en SAP. Verifica que el código del molde coincida exactamente.', details: fetchData }, { status: 404 })
        }

        const entity = fetchData.value[0]

        // Determine what property name is being used for the "Estado Molde" 
        // We fall back across known possible property names we assumed in the frontend
        const estadoMoldeKey = entity.hasOwnProperty('U_ESTADO_MOLDE') ? 'U_ESTADO_MOLDE' : 
                               entity.hasOwnProperty('U_ESTADO') ? 'U_ESTADO' : 
                               entity.hasOwnProperty('U_EstadoMolde') ? 'U_EstadoMolde' : 
                               entity.hasOwnProperty('U_Estado') ? 'U_Estado' : 'U_ESTADO_MOLDE';

        const patchData = {
            [estadoMoldeKey]: estado_sap
        }

        // 3. Patch the record
        const systemNumber = entity.SystemNumber
        const realItemCode = entity.ItemCode
        // In SAP B1 SL, correct URL is mostly (ItemCode='xxx',SystemNumber=1) or (ItemCode='...',SerialNumber='...')
        // Trying the SystemNumber approach which is the primary unique auto-increment in B1
        const patchPath = `/SerialNumberDetails(ItemCode='${realItemCode}',SystemNumber=${systemNumber})`
        const patchRes = await fetch(`${baseUrl}${patchPath}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(patchData),
            dispatcher: agent
        } as any)

        if (!patchRes.ok) {
            const err = await patchRes.text()
            console.error('SAP Update Error:', err)
            return NextResponse.json({ success: false, error: 'Error del servidor SAP al intentar actualizar' }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: 'Actualizado correctamente en SAP' })

    } catch (error: any) {
        console.error('Update SAP Endpoint Error:', error)
        return NextResponse.json({ success: false, error: error.message || 'Error de red con SAP' }, { status: 500 })
    }
}

// API Route: GET /api/sap-items
// Authenticates with SAP using env credentials, then fetches Items
import { NextResponse } from 'next/server'
import { Agent } from 'undici'

const SAP_BASE = 'https://200.7.96.194:50000/b1s/v1'

// Shared dispatcher that ignores self-signed cert
const dispatcher = new Agent({ connect: { rejectUnauthorized: false } })

async function sapFetch(url: string, options: RequestInit & { dispatcher?: any } = {}) {
    // @ts-ignore – undici dispatcher not in standard RequestInit but works at runtime
    return fetch(url, { ...options, dispatcher })
}

export async function GET() {
    try {
        // ── Step 1: Authenticate ──────────────────────────────────────────────
        const loginRes = await sapFetch(`${SAP_BASE}/Login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                CompanyDB: process.env.SAP_COMPANY_DB,
                UserName:  process.env.SAP_USER,
                Password:  process.env.SAP_PASSWORD,
            }),
        })

        if (!loginRes.ok) {
            const errText = await loginRes.text()
            console.error('[sap-items] Login failed:', errText)
            return NextResponse.json(
                { error: 'No fue posible autenticarse con SAP', details: errText },
                { status: 401 }
            )
        }

        // SAP returns the session cookie in Set-Cookie — capture it
        const sessionCookie = loginRes.headers.get('set-cookie') || ''
        const loginData     = await loginRes.json()
        const sessionId     = loginData?.SessionId || ''

        if (!sessionCookie && !sessionId) {
            return NextResponse.json(
                { error: 'SAP no devolvió sesión válida' },
                { status: 401 }
            )
        }

        const authHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(sessionCookie ? { Cookie: sessionCookie } : {}),
            ...(sessionId     ? { 'B1SESSION': sessionId } : {}),
        }

        // ── Step 2: Fetch ALL SerialNumberDetails via pagination ──────────────────
        // SAP B1 defaults to 20 per page. We loop with $skip until we get
        // a batch smaller than $top (= last page).
        const PAGE_SIZE = 100
        const allItems: any[] = []
        let skip = 0
        let keepFetching = true

        while (keepFetching) {
            // Not using $select so we get all standard fields + UDFs (for "Estado molde")
            const itemsUrl =
                `${SAP_BASE}/SerialNumberDetails?$top=${PAGE_SIZE}&$skip=${skip}&$orderby=ItemCode asc`

            const itemsRes = await sapFetch(itemsUrl, { headers: authHeaders })

            if (!itemsRes.ok) {
                const errText = await itemsRes.text()
                console.error('[sap-items] Items fetch failed at skip=' + skip + ':', errText)
                // Logout before returning error
                await sapFetch(`${SAP_BASE}/Logout`, { method: 'POST', headers: authHeaders }).catch(() => {})
                return NextResponse.json(
                    { error: 'No fue posible consultar la tabla de items en SAP', details: errText },
                    { status: itemsRes.status }
                )
            }

            const page = await itemsRes.json()
            const batch: any[] = page?.value ?? []
            allItems.push(...batch)

            // If we received fewer than PAGE_SIZE, we've reached the last page
            if (batch.length < PAGE_SIZE) {
                keepFetching = false
            } else {
                skip += PAGE_SIZE
            }
        }

        // ── Step 3: Logout (best practice) ───────────────────────────────────
        await sapFetch(`${SAP_BASE}/Logout`, {
            method: 'POST',
            headers: authHeaders,
        }).catch(() => { /* non-critical */ })

        return NextResponse.json({ success: true, count: allItems.length, items: allItems })

    } catch (err: any) {
        console.error('[sap-items] Unexpected error:', err)
        return NextResponse.json(
            { error: 'Error interno del servidor', message: err.message },
            { status: 500 }
        )
    }
}

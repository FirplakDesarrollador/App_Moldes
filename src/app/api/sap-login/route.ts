import { NextResponse } from 'next/server';
import { Agent } from 'undici';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { Username, Password } = body;

        // Use environment variables for SAP connection
        const sapLoginUrl = process.env.SAP_LOGIN_URL;

        console.log('--- SAP Authentication Attempt ---');
        console.log('URL:', sapLoginUrl);
        console.log('CompanyDB:', process.env.SAP_COMPANY_DB);
        console.log('User:', Username || process.env.SAP_USER);

        const sapPayload = {
            "CompanyDB": process.env.SAP_COMPANY_DB,
            "Password": Password || process.env.SAP_PASSWORD,
            "UserName": Username || process.env.SAP_USER
        };

        if (!sapLoginUrl) {
            console.error('CRITICAL: SAP_LOGIN_URL is missing in .env');
            return NextResponse.json({ error: 'SAP_LOGIN_URL not configured in environment' }, { status: 500 });
        }

        // Use an https agent that rejects unauthorized = false if we get self-signed cert issues (fetch natively doesn't support agents easily without node-fetch, but in Next 13+ node defaults apply, we'll try fetch first)

        const response = await fetch(sapLoginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sapPayload),
            // @ts-ignore
            dispatcher: new Agent({
                connect: {
                    rejectUnauthorized: false
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`SAP Login Failed with status ${response.status}:`, errorText);
            return NextResponse.json({
                error: 'Failed to authenticate with SAP',
                status: response.status,
                details: errorText
            }, { status: response.status });
        }

        console.log('SAP Login successful, parsing response data...');
        const data = await response.json();

        // We need to extract the cookies or SessionId to reuse if making subsequent calls.
        // For this requirement, we just need to report success.

        return NextResponse.json({ success: true, session: data });

    } catch (error: any) {
        console.error('SAP Login API Exception:', error);
        return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
    }
}

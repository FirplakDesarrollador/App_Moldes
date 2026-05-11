const { Agent } = require('undici');
require('dotenv').config();
const dispatcher = new Agent({ connect: { rejectUnauthorized: false } });

async function test() {
  try {
    console.log("Logging in...");
    const loginRes = await fetch(process.env.SAP_LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            CompanyDB: process.env.SAP_COMPANY_DB,
            UserName:  process.env.SAP_USER,
            Password:  process.env.SAP_PASSWORD,
        }),
        dispatcher
    });
    const c = loginRes.headers.get('set-cookie');
    const d = await loginRes.json();
    
    if (!loginRes.ok) {
        console.error('Login failed:', d);
        return;
    }

    console.log("Logged in. Searching for serial 0175-40 in SAP...");
    const serial = '0175-40';
    const baseUrl = process.env.SAP_LOGIN_URL.replace('/Login', '');
    const searchPath = `/SerialNumberDetails?$filter=SerialNumber eq '${serial}' or MfrSerialNo eq '${serial}'`;
    
    const r = await fetch(`${baseUrl}${searchPath}`, {
        headers: { Cookie: c, B1SESSION: d.SessionId },
        dispatcher
    });
    
    const data = await r.json();
    console.log('SAP Results:', JSON.stringify(data, null, 2));
    
  } catch(e) {
    console.error('Error during SAP debug:', e);
  }
}
test();

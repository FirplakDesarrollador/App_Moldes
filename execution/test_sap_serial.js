const { Agent } = require('undici');
require('dotenv').config();
const dispatcher = new Agent({ connect: { rejectUnauthorized: false } });

async function test() {
  try {
    console.log("Logging in...");
    const loginRes = await fetch('https://200.7.96.194:50000/b1s/v1/Login', {
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
    
    console.log("Logged in. Fetching serial...");
    const serial = '0175-03';
    const searchPath = `/SerialNumberDetails?$top=1`;
    
    const r = await fetch('https://200.7.96.194:50000/b1s/v1' + searchPath, {
        headers: { Cookie: c, B1SESSION: d.SessionId },
        dispatcher
    });
    
    const text = await r.json();
    require('fs').writeFileSync('execution/keys.json', JSON.stringify(Object.keys(text.value[0]), null, 2));
    console.log('Done writing keys.json');
  } catch(e) {
    console.log(e);
  }
}
test();

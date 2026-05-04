import dotenv from 'dotenv'
import fs from 'fs'

const envConfig = dotenv.parse(fs.readFileSync('.env'))
const token = envConfig.SUPABASE_ACCESS_TOKEN

if (!token) {
    console.error('SUPABASE_ACCESS_TOKEN not found in .env')
    process.exit(1)
}

async function listProjects() {
    console.log('--- Fetching Supabase Projects ---')
    try {
        const response = await fetch('https://api.supabase.com/v1/projects', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        
        if (!response.ok) {
            const err = await response.text()
            console.error(`Error fetching projects: ${response.status} ${err}`)
            return
        }
        
        const projects = await response.json()
        console.log(`Found ${projects.length} projects:`)
        projects.forEach(p => {
            console.log(`- Name: ${p.name}, ID: ${p.id}, Organization: ${p.organization_id}`)
        })
        
        const manufactura = projects.find(p => p.name.toLowerCase().includes('manufactura'))
        if (manufactura) {
            console.log('\n--- Project "Manufactura" found! ---')
            console.log(JSON.stringify(manufactura, null, 2))
        } else {
            console.log('\nProject "Manufactura" not found in the list.')
        }
    } catch (e) {
        console.error('Exception during project list:', e)
    }
}

listProjects()

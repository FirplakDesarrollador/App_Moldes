// Verify daily persistence payloads without accessing production Supabase.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const compiled = ts.transpileModule(fs.readFileSync('src/services/dailyIndicators.service.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
}).outputText
const context = { exports: {}, require: () => ({ createClient() { throw Error('Unexpected database access') } }) }
vm.runInNewContext(compiled, context)
const row = (id, expected, delivered, type = 'ESPECIAL') => ({
    id, fecha_esperada: expected, fecha_entrega: delivered, tipo_de_reparacion: type, tipo: '',
})
const a = row(1, '2026-11-01', '2026-11-01')
const b = row(2, '2026-11-01', '2026-11-02')
const c = row(3, '2026-11-02', '2026-11-01')
const d = row(4, null, '2026-11-01')
const pending = row(5, '2026-11-01', null)
const excluded = row(6, '2026-11-01', '2026-11-01', 'RAPIDA')
const stats = { comprometidos: [a, b, c, pending, excluded], entregados: [a, b, c, d, excluded] }
const build = context.exports.buildDailyIndicators
const records = build(stats, ['2026-11-01', '2026-11-02'], { '2026-11-01': 2, '2026-11-02': 0 }, 'PRINCIPAL', 'Test')
assert.equal(records[0].moldes_comprometidos, 3)
assert.equal(records[0].moldes_entregados, 3)
assert.equal(records[0].comprometidos_cumplidos, 1)
assert.equal(records[0].comprometidos_pendientes, 1)
assert.equal(records[0].nivel_servicio_pct, (1 / 3) * 100)
assert.equal(records[0].productividad, 1.5)
assert.equal(records[0].entregados_anticipados, 1)
assert.equal(records[0].entregados_en_fecha, 1)
assert.equal(records[0].entregados_sin_fecha_esperada, 1)
assert.equal(records[1].entregados_tarde, 1)
assert.equal(records[1].productividad, 0)
assert.equal(records[1].nivel_servicio_pct, 100)
assert.throws(() => build(stats, ['2026-11-01'], {}, 'PRINCIPAL', 'Test'))
console.log('Daily indicator payload checks passed.')

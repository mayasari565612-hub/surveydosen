const assert = require('assert');
const { buildAnalytics, kriteriaPersentase } = require('../analytics');

const boundaryCases = [
  [20, 'Tidak Baik'],
  [36, 'Tidak Baik'],
  [36.01, 'Kurang Baik'],
  [52, 'Kurang Baik'],
  [52.01, 'Cukup Baik'],
  [68, 'Cukup Baik'],
  [68.01, 'Baik'],
  [84, 'Baik'],
  [84.01, 'Baik Sekali'],
  [100, 'Baik Sekali']
];

for (const [value, expected] of boundaryCases) {
  assert.strictEqual(kriteriaPersentase(value).label, expected, `Kriteria ${value}% harus ${expected}`);
}

const analytics = buildAnalytics();
assert.strictEqual(analytics.overview.jumlahItem, 19, 'Jumlah item harus mengikuti questions.json (saat ini 19)');

for (const d of analytics.dosen) {
  assert.strictEqual(d.skorIdeal, d.jumlahResponden * analytics.overview.jumlahItem * 5);
  const expectedPct = d.skorIdeal ? (d.skorAktual / d.skorIdeal) * 100 : 0;
  assert.ok(Math.abs(d.persentaseSkorRaw - expectedPct) < 1e-10, `Persentase ${d.dosen} tidak sesuai rumus`);
  assert.strictEqual(d.kriteriaPersentase, kriteriaPersentase(expectedPct).label);
}

const actualInstitution = analytics.dosen.reduce((sum, d) => sum + d.skorAktual, 0);
const idealInstitution = analytics.dosen.reduce((sum, d) => sum + d.skorIdeal, 0);
assert.strictEqual(analytics.overview.skorAktualInstitusi, actualInstitution);
assert.strictEqual(analytics.overview.skorIdealInstitusi, idealInstitution);

console.log('OK - sistem persentase Skor Aktual / Skor Ideal dan batas kriteria valid.');

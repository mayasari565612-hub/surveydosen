const ExcelJS = require('exceljs');

const NAVY = 'FF16294A';
const GOLD = 'FFB8912F';
const CREAM = 'FFF6F3EC';

function styleHeaderRow(row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } }
    };
  });
  row.height = 28;
}

function addColorScale(ws, range) {
  ws.addConditionalFormatting({
    ref: range,
    rules: [{
      type: 'colorScale',
      cfvo: [{ type: 'min' }, { type: 'percentile', value: 50 }, { type: 'max' }],
      color: [{ argb: 'FFF3AFAF' }, { argb: 'FFFCECA0' }, { argb: 'FFA9D9B4' }]
    }]
  });
}


const LIGHT_NAVY = 'FFEAF0F7';
const LIGHT_GOLD = 'FFF8F0DC';
const LIGHT_GREEN = 'FFE8F5EC';
const LIGHT_RED = 'FFFBE9E9';
const MID_BLUE = 'FF5F7FA8';
const MID_GREEN = 'FF5B9A72';
const MID_GOLD = 'FFC5A24A';
const MID_RED = 'FFB96C6C';
const MUTED = 'FF64748B';

function colName(n) {
  let out = '';
  while (n > 0) {
    n--;
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26);
  }
  return out;
}

function setThinBorder(cell, color = 'FFD8DEE8') {
  cell.border = {
    top: { style: 'thin', color: { argb: color } },
    left: { style: 'thin', color: { argb: color } },
    bottom: { style: 'thin', color: { argb: color } },
    right: { style: 'thin', color: { argb: color } }
  };
}

function styleSection(ws, range, title) {
  ws.mergeCells(range);
  const startCell = range.split(':')[0];
  const c = ws.getCell(startCell);
  c.value = title;
  c.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
  c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  c.alignment = { vertical: 'middle', horizontal: 'left' };
  const row = ws.getRow(c.row);
  row.height = Math.max(row.height || 15, 23);
}

function kpiCard(ws, range, label, value, opts = {}) {
  ws.mergeCells(range);
  const [start, end] = range.split(':');
  const c = ws.getCell(start);
  c.value = `${label}\n${value}`;
  c.font = {
    bold: true,
    size: opts.size || 12,
    color: { argb: opts.fontColor || NAVY }
  };
  c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: opts.fill || CREAM } };

  const startCell = ws.getCell(start);
  const endCell = ws.getCell(end);
  for (let r = startCell.row; r <= endCell.row; r++) {
    for (let col = startCell.col; col <= endCell.col; col++) {
      setThinBorder(ws.getCell(r, col));
    }
  }
}

function paintBar(ws, row, startCol, segments, value, maxValue, color = MID_BLUE) {
  const ratio = maxValue > 0 ? Math.max(0, Math.min(1, value / maxValue)) : 0;
  const filled = Math.round(ratio * segments);
  for (let i = 0; i < segments; i++) {
    const cell = ws.getCell(row, startCol + i);
    cell.value = '';
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: i < filled ? color : 'FFF1F4F8' }
    };
    setThinBorder(cell, 'FFE2E8F0');
  }
}

function rankMap(items, scoreFn) {
  const sorted = [...items].sort((a, b) => scoreFn(b) - scoreFn(a));
  const map = new Map();
  sorted.forEach((item, idx) => map.set(item.dosen, idx + 1));
  return { sorted, map };
}

function addDashboard(wb, analytics) {
  const ws = wb.addWorksheet('Dashboard', {
    views: [{ showGridLines: false }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });
  ws.properties.tabColor = { argb: GOLD };

  // Lebar kolom dashboard (A:V)
  const widths = [5, 30, 11, 13, 13, 13, 13, 18, 2, 28, 11,
    4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4];
  widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  ws.mergeCells('A1:V2');
  ws.getCell('A1').value = 'DASHBOARD HASIL SURVEI KINERJA DOSEN — LPMI INSTBUNAS';
  ws.getCell('A1').font = { bold: true, size: 20, color: { argb: 'FFFFFFFF' } };
  ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  ws.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 26;
  ws.getRow(2).height = 15;

  ws.mergeCells('A3:V3');
  ws.getCell('A3').value = `Ringkasan visual otomatis • Dibuat ${new Date().toLocaleString('id-ID')} • Ranking utama menggunakan kelompok ≥19 responden`;
  ws.getCell('A3').font = { italic: true, size: 10, color: { argb: MUTED } };
  ws.getCell('A3').alignment = { horizontal: 'center' };

  const ov = analytics.overview;
  kpiCard(ws, 'A5:D8', 'TOTAL PENGISIAN', ov.totalSubmission, { fill: LIGHT_NAVY });
  kpiCard(ws, 'E5:H8', 'TOTAL DOSEN DINILAI', ov.totalDosen, { fill: LIGHT_GOLD });
  kpiCard(ws, 'I5:L8', 'PERSENTASE INSTITUSI', `${ov.persentaseSkorInstitusi.toFixed(2)}%`, { fill: LIGHT_GREEN });
  kpiCard(ws, 'M5:P8', 'RATA-RATA INSTITUSI', `${ov.rataInstitusi.toFixed(2)} / 5`, { fill: LIGHT_NAVY });
  kpiCard(ws, 'Q5:V8', 'TOTAL PENILAIAN DOSEN', ov.totalPenilaian, { fill: LIGHT_GOLD });

  const utama = analytics.dosen.filter((d) => d.jumlahResponden >= 19);
  const menengah = analytics.dosen.filter((d) => d.jumlahResponden >= 10 && d.jumlahResponden < 19);
  const rendah = analytics.dosen.filter((d) => d.jumlahResponden < 10);

  styleSection(ws, 'A10:V10', 'MODEL / METODE PERHITUNGAN YANG DITAMPILKAN');
  const methodCards = [
    ['A11:F14', '1. Persentase Skor', '(Skor Aktual / Skor Ideal) × 100%', LIGHT_GREEN],
    ['G11:L14', '2. Rata-rata 1–5', 'Skor Aktual / (Responden × Item)', LIGHT_NAVY],
    ['M11:R14', '3. Skor Tertimbang', `(v/(v+m))×R + (m/(v+m))×C\nm=${ov.skorTertimbangInfo.m.toFixed(1)} • C=${ov.skorTertimbangInfo.c.toFixed(3)}`, LIGHT_GOLD],
    ['S11:V14', '4. Skor Netral', `Batas bawah konservatif sebaran rating\nz=${ov.skorNetralInfo.z}`, LIGHT_RED]
  ];
  methodCards.forEach(([range, title, formula, fill]) => {
    ws.mergeCells(range);
    const c = ws.getCell(range.split(':')[0]);
    c.value = `${title}\n${formula}`;
    c.font = { bold: true, size: 10, color: { argb: NAVY } };
    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
    const sc = ws.getCell(range.split(':')[0]);
    const ec = ws.getCell(range.split(':')[1]);
    for (let r = sc.row; r <= ec.row; r++) {
      for (let col = sc.col; col <= ec.col; col++) setThinBorder(ws.getCell(r, col));
    }
  });

  // Ranking utama hanya kelompok >=19 responden, selaras dengan pemisahan dashboard admin.
  const pool = utama;
  const pctRank = rankMap(pool, (d) => d.persentaseSkorRaw);
  const avgRank = rankMap(pool, (d) => d.rataKeseluruhanRaw);
  const weightedRank = rankMap(pool, (d) => d.skorTertimbangRaw);
  const neutralRank = rankMap(pool, (d) => d.skorNetralRaw);

  styleSection(ws, 'A16:H16', 'PERBANDINGAN TOP 10 — KELOMPOK ≥19 RESPONDEN');
  const h = ['Rank %', 'Nama Dosen', 'N', 'Persentase', 'Rata-rata', 'Tertimbang', 'Netral', 'Kriteria'];
  h.forEach((x, i) => { ws.getCell(17, i + 1).value = x; });
  styleHeaderRow(ws.getRow(17));
  const top10 = pctRank.sorted.slice(0, 10);
  top10.forEach((d, idx) => {
    const row = 18 + idx;
    ws.getCell(row, 1).value = idx + 1;
    ws.getCell(row, 2).value = d.dosen;
    ws.getCell(row, 3).value = d.jumlahResponden;
    ws.getCell(row, 4).value = d.persentaseSkor / 100;
    ws.getCell(row, 4).numFmt = '0.00%';
    ws.getCell(row, 5).value = d.rataKeseluruhan;
    ws.getCell(row, 6).value = d.skorTertimbang;
    ws.getCell(row, 7).value = d.skorNetral;
    ws.getCell(row, 8).value = d.kriteriaPersentase;
    for (let c = 1; c <= 8; c++) setThinBorder(ws.getCell(row, c));
  });
  if (top10.length) {
    addColorScale(ws, `D18:D${17 + top10.length}`);
    addColorScale(ws, `E18:G${17 + top10.length}`);
  }

  styleSection(ws, 'J16:V16', 'BAGAN BAR — TOP 10 PERSENTASE SKOR');
  ws.getCell('J17').value = 'Dosen';
  ws.getCell('K17').value = 'Skor';
  ws.mergeCells('L17:V17');
  ws.getCell('L17').value = 'Visual 0–100%';
  ['J17', 'K17', 'L17'].forEach((addr) => {
    const c = ws.getCell(addr);
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
  });
  top10.forEach((d, idx) => {
    const row = 18 + idx;
    ws.getCell(row, 10).value = d.dosen;
    ws.getCell(row, 11).value = d.persentaseSkor / 100;
    ws.getCell(row, 11).numFmt = '0.00%';
    paintBar(ws, row, 12, 11, d.persentaseSkor, 100, MID_GREEN);
    setThinBorder(ws.getCell(row, 10));
    setThinBorder(ws.getCell(row, 11));
  });

  styleSection(ws, 'A30:K30', 'RATA-RATA PER DIMENSI — INSTITUSI');
  ws.getCell('A31').value = 'Dimensi';
  ws.getCell('B31').value = 'Rata-rata';
  ws.mergeCells('C31:K31');
  ws.getCell('C31').value = 'Bagan 0–5';
  ['A31', 'B31', 'C31'].forEach((addr) => {
    const c = ws.getCell(addr);
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    c.alignment = { horizontal: 'center' };
  });
  const dimValues = Object.values(ov.rataPerDimensiInstitusi);
  dimValues.forEach((d, idx) => {
    const row = 32 + idx;
    ws.getCell(row, 1).value = d.judul;
    ws.getCell(row, 2).value = d.rata;
    paintBar(ws, row, 3, 9, d.rata, 5, MID_BLUE);
    setThinBorder(ws.getCell(row, 1));
    setThinBorder(ws.getCell(row, 2));
  });

  styleSection(ws, 'M30:V30', 'SEBARAN KELOMPOK JUMLAH RESPONDEN');
  ws.getCell('M31').value = 'Kelompok';
  ws.getCell('N31').value = 'Dosen';
  ws.mergeCells('O31:V31');
  ws.getCell('O31').value = 'Visual jumlah dosen';
  ['M31', 'N31', 'O31'].forEach((addr) => {
    const c = ws.getCell(addr);
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    c.alignment = { horizontal: 'center' };
  });
  const groups = [
    { label: '≥19 responden', value: utama.length, color: MID_GREEN },
    { label: '10–18 responden', value: menengah.length, color: MID_GOLD },
    { label: '<10 responden', value: rendah.length, color: MID_RED }
  ];
  const maxGroup = Math.max(1, ...groups.map((g) => g.value));
  groups.forEach((g, idx) => {
    const row = 32 + idx;
    ws.getCell(row, 13).value = g.label;
    ws.getCell(row, 14).value = g.value;
    paintBar(ws, row, 15, 8, g.value, maxGroup, g.color);
    setThinBorder(ws.getCell(row, 13));
    setThinBorder(ws.getCell(row, 14));
  });

  styleSection(ws, 'A39:K39', 'DISTRIBUSI KRITERIA PERSENTASE');
  const criterionLabels = {
    tidakBaik: 'Tidak Baik',
    kurangBaik: 'Kurang Baik',
    cukupBaik: 'Cukup Baik',
    baik: 'Baik',
    baikSekali: 'Baik Sekali'
  };
  const critEntries = Object.entries(ov.distribusiKriteriaPersentase).map(([k, v]) => ({ label: criterionLabels[k], value: v }));
  const maxCrit = Math.max(1, ...critEntries.map((x) => x.value));
  critEntries.forEach((x, idx) => {
    const row = 40 + idx;
    ws.getCell(row, 1).value = x.label;
    ws.getCell(row, 2).value = x.value;
    paintBar(ws, row, 3, 9, x.value, maxCrit, idx === critEntries.length - 1 ? MID_GREEN : MID_GOLD);
    setThinBorder(ws.getCell(row, 1));
    setThinBorder(ws.getCell(row, 2));
  });

  styleSection(ws, 'M39:V39', 'DISTRIBUSI NILAI 1–5');
  const distVals = [1, 2, 3, 4, 5].map((v) => ({ label: `Nilai ${v}`, value: ov.distribusiNilaiInstitusi[v] || 0 }));
  const maxDist = Math.max(1, ...distVals.map((x) => x.value));
  distVals.forEach((x, idx) => {
    const row = 40 + idx;
    ws.getCell(row, 13).value = x.label;
    ws.getCell(row, 14).value = x.value;
    paintBar(ws, row, 15, 8, x.value, maxDist, idx >= 3 ? MID_GREEN : MID_BLUE);
    setThinBorder(ws.getCell(row, 13));
    setThinBorder(ws.getCell(row, 14));
  });

  styleSection(ws, 'A47:V47', 'TOP 5 BERDASARKAN MASING-MASING MODEL — KELOMPOK ≥19 RESPONDEN');
  const blocks = [
    { c1: 1, c2: 5, title: 'Persentase Skor', rows: pctRank.sorted.slice(0, 5), val: (d) => `${d.persentaseSkor.toFixed(2)}%` },
    { c1: 6, c2: 10, title: 'Rata-rata 1–5', rows: avgRank.sorted.slice(0, 5), val: (d) => d.rataKeseluruhan.toFixed(2) },
    { c1: 11, c2: 15, title: 'Skor Tertimbang', rows: weightedRank.sorted.slice(0, 5), val: (d) => d.skorTertimbang.toFixed(2) },
    { c1: 16, c2: 22, title: 'Skor Netral (Wilson)', rows: neutralRank.sorted.slice(0, 5), val: (d) => d.skorNetral.toFixed(3) }
  ];
  blocks.forEach((b) => {
    const start = `${colName(b.c1)}48`;
    const end = `${colName(b.c2)}48`;
    ws.mergeCells(`${start}:${end}`);
    const hc = ws.getCell(start);
    hc.value = b.title;
    hc.font = { bold: true, color: { argb: NAVY } };
    hc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GOLD } };
    hc.alignment = { horizontal: 'center' };
    b.rows.forEach((d, idx) => {
      const row = 49 + idx;
      ws.mergeCells(row, b.c1, row, b.c2 - 1);
      const nameCell = ws.getCell(row, b.c1);
      nameCell.value = `${idx + 1}. ${d.dosen}`;
      nameCell.alignment = { wrapText: true, vertical: 'middle' };
      const scoreCell = ws.getCell(row, b.c2);
      scoreCell.value = b.val(d);
      scoreCell.font = { bold: true, color: { argb: NAVY } };
      scoreCell.alignment = { horizontal: 'center', vertical: 'middle' };
      for (let c = b.c1; c <= b.c2; c++) setThinBorder(ws.getCell(row, c));
    });
  });

  styleSection(ws, 'A56:V56', 'CATATAN INTERPRETASI');
  ws.mergeCells('A57:V60');
  ws.getCell('A57').value =
    '• Ranking utama pada dashboard ini hanya menggunakan dosen dengan ≥19 responden agar basis perbandingan seragam.\n' +
    '• Dosen dengan 10–18 responden dan <10 responden tetap tersedia lengkap pada sheet “Ringkasan Per Dosen”, tetapi dipisahkan sebagai data dengan basis responden lebih kecil.\n' +
    '• Persentase Skor dan Rata-rata menunjukkan performa langsung; Skor Tertimbang menyesuaikan ukuran sampel terhadap rata-rata institusi; Skor Netral (Wilson) memberi estimasi lebih konservatif berdasarkan sebaran rating.\n' +
    '• Dashboard ini bersifat visual ringkas. Detail item, distribusi nilai, saran/kritik, dan data mentah tersedia pada sheet lainnya.';
  ws.getCell('A57').alignment = { wrapText: true, vertical: 'top' };
  ws.getCell('A57').font = { size: 10, color: { argb: 'FF334155' } };
  ws.getCell('A57').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CREAM } };
  for (let r = 57; r <= 60; r++) {
    for (let c = 1; c <= 22; c++) setThinBorder(ws.getCell(r, c));
  }
  ws.getRow(57).height = 55;

  // Angka ringkas untuk membandingkan ranking lintas metode (kanan atas tersembunyi dari tampilan utama tidak diperlukan).
  // Border + alignment area aktif.
  return ws;
}

async function buildWorkbook(analytics, questions, responses) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Survei Kinerja Dosen - LPMI INSTBUNAS';
  wb.created = new Date();

  // ================= SHEET 1: Dashboard =================
  addDashboard(wb, analytics);

  // ================= SHEET 2: Ringkasan Institusi =================
  const wsOverview = wb.addWorksheet('Ringkasan Institusi', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  wsOverview.mergeCells('A1:D1');
  wsOverview.getCell('A1').value = 'RINGKASAN SURVEI KINERJA DOSEN — LPMI INSTBUNAS';
  wsOverview.getCell('A1').font = { bold: true, size: 14, color: { argb: NAVY } };
  wsOverview.getRow(1).height = 24;

  wsOverview.getCell('A3').value = 'Total Pengisian Survei (per kelas)';
  wsOverview.getCell('B3').value = analytics.overview.totalSubmission;
  wsOverview.getCell('A4').value = 'Total Penilaian Dosen (dosen x responden)';
  wsOverview.getCell('B4').value = analytics.overview.totalPenilaian;
  wsOverview.getCell('A5').value = 'Total Dosen Dinilai';
  wsOverview.getCell('B5').value = analytics.overview.totalDosen;
  wsOverview.getCell('A6').value = 'Rata-rata Keseluruhan Institusi (skala 1-5)';
  wsOverview.getCell('B6').value = analytics.overview.rataInstitusi;
  ['A3', 'A4', 'A5', 'A6'].forEach((c) => { wsOverview.getCell(c).font = { bold: true }; });

  wsOverview.getCell('C3').value = 'Skor Aktual Institusi';
  wsOverview.getCell('D3').value = analytics.overview.skorAktualInstitusi;
  wsOverview.getCell('C4').value = 'Skor Ideal Institusi';
  wsOverview.getCell('D4').value = analytics.overview.skorIdealInstitusi;
  wsOverview.getCell('C5').value = 'Persentase Skor Institusi';
  wsOverview.getCell('D5').value = analytics.overview.persentaseSkorInstitusi / 100;
  wsOverview.getCell('D5').numFmt = '0.00%';
  wsOverview.getCell('C6').value = 'Kriteria Persentase';
  wsOverview.getCell('D6').value = analytics.overview.kriteriaPersentaseInstitusi;
  ['C3', 'C4', 'C5', 'C6'].forEach((c) => { wsOverview.getCell(c).font = { bold: true }; });

  wsOverview.getCell('A8').value = 'RATA-RATA PER DIMENSI (INSTITUSI)';
  wsOverview.getCell('A8').font = { bold: true, color: { argb: NAVY } };
  let rIdx = 9;
  Object.values(analytics.overview.rataPerDimensiInstitusi).forEach((d) => {
    wsOverview.getCell(`A${rIdx}`).value = d.judul;
    wsOverview.getCell(`B${rIdx}`).value = d.rata;
    rIdx++;
  });

  rIdx += 1;
  wsOverview.getCell(`A${rIdx}`).value = 'DISTRIBUSI KATEGORI KEPUASAN (per dosen)';
  wsOverview.getCell(`A${rIdx}`).font = { bold: true, color: { argb: NAVY } };
  rIdx++;
  const kategoriLabel = {
    sangatBaik: 'Sangat Baik (≥4.5)',
    baik: 'Baik (3.5–4.49)',
    cukup: 'Cukup (2.5–3.49)',
    perluPerhatian: 'Perlu Perhatian (<2.5)'
  };
  Object.entries(analytics.overview.distribusiKepuasan).forEach(([k, v]) => {
    wsOverview.getCell(`A${rIdx}`).value = kategoriLabel[k];
    wsOverview.getCell(`B${rIdx}`).value = v;
    rIdx++;
  });

  rIdx += 1;
  wsOverview.getCell(`A${rIdx}`).value = 'RATA-RATA PER KELAS';
  wsOverview.getCell(`A${rIdx}`).font = { bold: true, color: { argb: NAVY } };
  rIdx++;
  const kelasHeaderRow = wsOverview.getRow(rIdx);
  kelasHeaderRow.getCell(1).value = 'Kelas';
  kelasHeaderRow.getCell(2).value = 'Program Studi';
  kelasHeaderRow.getCell(3).value = 'Jumlah Responden';
  kelasHeaderRow.getCell(4).value = 'Rata-rata';
  kelasHeaderRow.getCell(5).value = 'Skor Aktual';
  kelasHeaderRow.getCell(6).value = 'Skor Ideal';
  kelasHeaderRow.getCell(7).value = 'Persentase Skor';
  kelasHeaderRow.getCell(8).value = 'Kriteria';
  styleHeaderRow(kelasHeaderRow);
  rIdx++;
  const kelasStartRow = rIdx;
  analytics.overview.perKelas.forEach((k) => {
    wsOverview.getCell(`A${rIdx}`).value = k.kelas;
    wsOverview.getCell(`B${rIdx}`).value = k.prodi;
    wsOverview.getCell(`C${rIdx}`).value = k.jumlahResponden;
    wsOverview.getCell(`D${rIdx}`).value = k.rataRata;
    wsOverview.getCell(`E${rIdx}`).value = k.skorAktual;
    wsOverview.getCell(`F${rIdx}`).value = k.skorIdeal;
    wsOverview.getCell(`G${rIdx}`).value = k.persentaseSkor / 100;
    wsOverview.getCell(`G${rIdx}`).numFmt = '0.00%';
    wsOverview.getCell(`H${rIdx}`).value = k.kriteriaPersentase;
    rIdx++;
  });
  if (rIdx - 1 >= kelasStartRow) {
    addColorScale(wsOverview, `D${kelasStartRow}:D${rIdx - 1}`);
    addColorScale(wsOverview, `G${kelasStartRow}:G${rIdx - 1}`);
  }

  wsOverview.columns = [
    { width: 34 }, { width: 22 }, { width: 18 }, { width: 18 },
    { width: 16 }, { width: 16 }, { width: 18 }, { width: 18 }
  ];

  // ================= SHEET 3: Ringkasan Per Dosen =================
  const wsDosen = wb.addWorksheet('Ringkasan Per Dosen', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  const dimKodes = analytics.dimensiInfo.map((d) => d.kode);
  const header = ['Nama Dosen', 'Program Studi', 'Kelas', 'Jumlah Responden',
    ...analytics.dimensiInfo.map((d) => d.judul),
    'Skor Aktual', 'Skor Ideal', 'Persentase Skor', 'Kriteria Persentase',
    'Rata-rata Keseluruhan', 'Skor Tertimbang', 'Skor Netral', 'Kategori Lama (Skala 1-5)'];
  const headerRow = wsDosen.addRow(header);
  styleHeaderRow(headerRow);

  const dosenStartRow = 2;
  analytics.dosen.forEach((d) => {
    wsDosen.addRow([
      d.dosen,
      d.prodi,
      d.kelas,
      d.jumlahResponden,
      ...dimKodes.map((k) => d.rataPerDimensi[k].rata),
      d.skorAktual,
      d.skorIdeal,
      d.persentaseSkor / 100,
      d.kriteriaPersentase,
      d.rataKeseluruhan,
      d.skorTertimbang,
      d.skorNetral,
      kategoriLabel[d.kategori]
    ]);
  });
  const dosenEndRow = dosenStartRow + analytics.dosen.length - 1;
  if (dosenEndRow >= dosenStartRow) {
    const percentageColIndex = 4 + dimKodes.length + 3;
    const overallColIndex = 4 + dimKodes.length + 5;
    const weightedColIndex = overallColIndex + 1;
    const netralColIndex = overallColIndex + 2;
    const colName = (n) => {
      let out = '';
      while (n > 0) { n--; out = String.fromCharCode(65 + (n % 26)) + out; n = Math.floor(n / 26); }
      return out;
    };
    const percentageCol = colName(percentageColIndex);
    const overallCol = colName(overallColIndex);
    const weightedCol = colName(weightedColIndex);
    const netralCol = colName(netralColIndex);
    addColorScale(wsDosen, `${percentageCol}${dosenStartRow}:${percentageCol}${dosenEndRow}`);
    addColorScale(wsDosen, `${overallCol}${dosenStartRow}:${overallCol}${dosenEndRow}`);
    addColorScale(wsDosen, `${weightedCol}${dosenStartRow}:${weightedCol}${dosenEndRow}`);
    addColorScale(wsDosen, `${netralCol}${dosenStartRow}:${netralCol}${dosenEndRow}`);
  }
  wsDosen.columns = [
    { width: 32 }, { width: 20 }, { width: 16 }, { width: 16 },
    ...dimKodes.map(() => ({ width: 16 })),
    { width: 16 }, { width: 16 }, { width: 18 }, { width: 20 },
    { width: 18 }, { width: 18 }, { width: 18 }, { width: 22 }
  ];
  wsDosen.getColumn(4 + dimKodes.length + 3).numFmt = '0.00%';
  wsDosen.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + header.length)}1` };

  // ================= SHEET 4: Detail Per Item Pertanyaan =================
  const wsItem = wb.addWorksheet('Detail Per Item', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });
  const itemHeader = ['Nama Dosen', ...questions.dimensions.flatMap((d) =>
    d.items.map((it) => `Q${it.no}`))];
  const itemHeaderRow = wsItem.addRow(itemHeader);
  styleHeaderRow(itemHeaderRow);
  analytics.dosen.forEach((d) => {
    wsItem.addRow([d.dosen, ...d.rataPerItem]);
  });
  wsItem.columns = [{ width: 32 }, ...itemHeader.slice(1).map(() => ({ width: 8 }))];
  const itemEndRow = 1 + analytics.dosen.length;
  if (itemEndRow >= 2) {
    addColorScale(wsItem, `B2:${String.fromCharCode(65 + itemHeader.length - 1)}${itemEndRow}`);
  }

  // Legenda pertanyaan di baris bawah
  let legendRow = itemEndRow + 3;
  wsItem.getCell(`A${legendRow}`).value = 'KETERANGAN NOMOR PERTANYAAN';
  wsItem.getCell(`A${legendRow}`).font = { bold: true, color: { argb: NAVY } };
  legendRow++;
  questions.dimensions.forEach((d) => {
    wsItem.getCell(`A${legendRow}`).value = d.judul;
    wsItem.getCell(`A${legendRow}`).font = { bold: true };
    legendRow++;
    d.items.forEach((it) => {
      wsItem.getCell(`A${legendRow}`).value = `Q${it.no} — ${it.teks}`;
      legendRow++;
    });
  });

  // ================= SHEET 5: Distribusi Nilai (1-5) =================
  const wsDist = wb.addWorksheet('Distribusi Nilai');
  const distHeader = wsDist.addRow(['Nama Dosen', '1 (Tidak Baik)', '2', '3', '4', '5 (Sangat Baik)', 'Total Jawaban']);
  styleHeaderRow(distHeader);
  analytics.dosen.forEach((d) => {
    const total = [1, 2, 3, 4, 5].reduce((a, v) => a + (d.distribusi[v] || 0), 0);
    wsDist.addRow([d.dosen, d.distribusi[1] || 0, d.distribusi[2] || 0, d.distribusi[3] || 0,
      d.distribusi[4] || 0, d.distribusi[5] || 0, total]);
  });
  wsDist.columns = [{ width: 32 }, { width: 15 }, { width: 10 }, { width: 10 }, { width: 10 }, { width: 15 }, { width: 14 }];

  // ================= SHEET 6: Saran & Kritik =================
  const wsSaran = wb.addWorksheet('Saran & Kritik');
  const saranHeader = wsSaran.addRow(['Nama Dosen', 'Kelas', 'Waktu', 'Saran / Kritik Mahasiswa']);
  styleHeaderRow(saranHeader);
  analytics.dosen.forEach((d) => {
    d.saranList.forEach((s) => {
      wsSaran.addRow([d.dosen, s.kelas, new Date(s.waktu).toLocaleString('id-ID'), s.teks]);
    });
  });
  wsSaran.columns = [{ width: 32 }, { width: 14 }, { width: 20 }, { width: 70 }];
  wsSaran.getColumn(4).alignment = { wrapText: true, vertical: 'top' };

  // ================= SHEET 7: Data Mentah =================
  const wsRaw = wb.addWorksheet('Data Mentah', { views: [{ state: 'frozen', ySplit: 1 }] });
  const rawHeader = ['Waktu', 'Program Studi', 'Kelas', 'Nama Dosen',
    ...Array.from({ length: 19 }, (_, i) => `Q${i + 1}`), 'Saran / Kritik'];
  const rawHeaderRow = wsRaw.addRow(rawHeader);
  styleHeaderRow(rawHeaderRow);

  responses.forEach((r) => {
    r.penilaian.forEach((p) => {
      wsRaw.addRow([
        new Date(r.waktu).toLocaleString('id-ID'),
        r.prodi,
        r.kelas,
        p.dosen,
        ...p.jawaban,
        p.saran || ''
      ]);
    });
  });
  wsRaw.columns = [
    { width: 20 }, { width: 18 }, { width: 14 }, { width: 32 },
    ...Array.from({ length: 19 }, () => ({ width: 6 })),
    { width: 40 }
  ];
  wsRaw.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + rawHeader.length > 90 ? 90 : 64 + rawHeader.length)}1` };
  wsRaw.getColumn(rawHeader.length).alignment = { wrapText: true, vertical: 'top' };

  return wb;
}

module.exports = { buildWorkbook };

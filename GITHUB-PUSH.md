# Push Project ke GitHub

Repository tujuan:

```text
https://github.com/aifrfx/surveydosen.git
```

## Cara paling mudah di Windows

1. Extract ZIP project.
2. Pastikan **Git for Windows** sudah terpasang.
3. Double-click `PUSH-KE-GITHUB.bat`.
4. Jika identitas Git belum ada, script akan meminta nama dan email untuk commit.
5. Saat GitHub meminta autentikasi, login melalui Git Credential Manager/browser.
6. Setelah selesai, refresh repository GitHub.

## Cara manual lewat Git Bash / Terminal

Buka terminal di folder project ini, lalu jalankan:

```bash
git init
git branch -M main
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/aifrfx/surveydosen.git
git add .
git commit -m "feat: tambah sistem perhitungan penilaian kinerja"
git push -u origin main
```

Jika Git meminta identitas sebelum commit:

```bash
git config user.name "Nama Anda"
git config user.email "email-anda@example.com"
```

Lalu ulangi:

```bash
git commit -m "feat: tambah sistem perhitungan penilaian kinerja"
git push -u origin main
```

## Data responden

`data/responses.json` ada di `.gitignore`. Tujuannya agar data hasil survei lokal tidak ikut dipublikasikan ke repository. Aplikasi akan membuat file `responses.json` kosong secara otomatis jika file tersebut belum ada di server.

## File utama yang diubah

- `analytics.js`: rumus Skor Aktual, Skor Ideal, Persentase Skor, dan kriteria.
- `public/admin.html`: panel metode, KPI persentase, grafik, tabel rekap, dan detail dosen.
- `excelExport.js`: kolom persentase dan kriteria pada export Excel.
- `tests/analytics.test.js`: pengujian rumus dan batas kriteria.
- `.gitignore`: mencegah data responden lokal ikut di-push.

# Song Defender AI

Website pengenal lagu dari URL TikTok/YouTube dan file MP3/MP4, plus pencarian berbantuan AI berdasarkan petunjuk teks.

## Fitur utama
- Input URL TikTok/YouTube dan audio file upload
- Backend Node.js + Express
- Integrasi API AudD bila token tersedia
- Integrasi OpenAI bila API key tersedia
- Fallback demo mode agar app tetap bisa dipakai tanpa key
- UI dark mode dan responsif

## Prasyarat
- Node.js 18+
- NPM
- (Opsional) FFmpeg dan yt-dlp untuk integrasi audio yang lebih kuat

## Setup lokal
1. Install dependency:
   ```bash
   npm install
   ```
2. Salin `.env.example` menjadi `.env`.
3. Atur variabel:
   ```bash
   PORT=3000
   AUDD_API_TOKEN=your_audd_api_token
   OPENAI_API_KEY=your_openai_api_key
   ```
4. Jalankan server:
   ```bash
   npm start
   ```
5. Buka:
   ```text
   http://localhost:3000
   ```

## Endpoint utama
- `POST /api/recognize-url` → mengenali lagu dari URL
- `POST /api/recognize-file` → mengenali lagu dari file upload
- `POST /api/ai-search` → mencari rekomendasi lagu berdasarkan deskripsi/lirik
- `GET /api/health` → cek kesehatan server

## Catatan
- Jika `AUDD_API_TOKEN` atau `OPENAI_API_KEY` belum ada, app tetap berjalan dalam mode demo.
- Jangan menaruh API key di frontend. Simpan semuanya di `.env` server.
- Gunakan URL dan file yang punya izin akses.

require('dotenv').config();

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;
const uploadDir = path.join(__dirname, 'tmp');

fs.mkdirSync(uploadDir, { recursive: true });

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, uploadDir),
    filename: (_, file, cb) => {
      const cleanName = file.originalname.replace(/\s+/g, '_');
      cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${cleanName}`);
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

function demoResult({
  meta = 'Demo result',
  title = 'Midnight City',
  artist = 'M83',
  album = 'Hurry Up, We’re Dreaming',
  cover = 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=600&q=80',
  link = 'https://www.youtube.com/results?search_query=M83+Midnight+City',
  preview = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
}) {
  return {
    meta,
    title,
    artist,
    album,
    cover,
    link,
    preview
  };
}

function buildTextSuggestions(query = '', lyrics = '') {
  const text = [query, lyrics].filter(Boolean).join(' ');
  const seed = text.toLowerCase();

  if (!seed) {
    return [
      {
        title: 'Kemungkinan lagu 1',
        text: 'Lagu dengan vibe chillhop dan tempo sedang, sering digunakan untuk video santai di TikTok.'
      },
      {
        title: 'Kemungkinan lagu 2',
        text: 'Kategori indie / alternative dengan vokal lembut dan riff yang mudah diingat.'
      },
      {
        title: 'Potensi kata kunci',
        text: '"lofi sunset instrumental", "indie mellow female vocal", "chillhop 2024".'
      }
    ];
  }

  if (seed.includes('phonk') || seed.includes('bass')) {
    return [
      {
        title: 'Kemungkinan lagu 1',
        text: 'Track phonk dengan tempo cepat, synth bass berat, dan groove yang cocok untuk video pendek yang energik.'
      },
      {
        title: 'Kemungkinan lagu 2',
        text: 'Lagu electronic / trap dengan vocal sedikit nyaring dan hook yang berulang di chorus.'
      },
      {
        title: 'Potensi kata kunci',
        text: '"phonk bass heavy", "dark trap instrumental", "midtempo phonk".'
      }
    ];
  }

  if (seed.includes('anime') || seed.includes('opening') || seed.includes('ost')) {
    return [
      {
        title: 'Kemungkinan lagu 1',
        text: 'OST anime dengan orchestrasi besar, vokal emosional, dan intro yang kuat.'
      },
      {
        title: 'Kemungkinan lagu 2',
        text: 'Soundtrack dengan riff piano atau gitar yang menonjol di bagian hook.'
      },
      {
        title: 'Potensi kata kunci',
        text: '"anime opening song", "epic soundtrack instrumental", "dramatic japanese anime ost".'
      }
    ];
  }

  if (seed.includes('sad') || seed.includes('melow') || seed.includes('lofi')) {
    return [
      {
        title: 'Kemungkinan lagu 1',
        text: 'Lagu lo-fi / chill dengan tempo santai, piano lembut, dan atmosfer puitis.'
      },
      {
        title: 'Kemungkinan lagu 2',
        text: 'Prog indie dengan vokal lembut dan instrumentasi minimal yang cocok untuk mood tenang.'
      },
      {
        title: 'Potensi kata kunci',
        text: '"lofi study beat", "sad indie acoustic", "mellow evening playlist".'
      }
    ];
  }

  return [
    {
      title: 'Kemungkinan lagu 1',
      text: 'Lagu dengan aransemen cerah, hook yang mudah diingat, dan ritme yang cocok untuk konteks video cepat.'
    },
    {
      title: 'Kemungkinan lagu 2',
      text: 'Track pop indie modern dengan vokal hangat dan melodi yang kuat di chorus.'
    },
    {
      title: 'Potensi kata kunci',
      text: '"viral song mood", "indie pop recent hits", "catchy melodic track".'
    }
  ];
}

async function getAuddMatch(source, type = 'url') {
  if (!process.env.AUDD_API_TOKEN) {
    return null;
  }

  try {
    const form = new FormData();
    form.append('api_token', process.env.AUDD_API_TOKEN);

    if (type === 'url') {
      form.append('url', source);
    } else {
      const fileStream = fs.createReadStream(source);
      form.append('file', fileStream);
    }

    const response = await axios.post('https://api.audd.io/', form, {
      headers: form.getHeaders && form.getHeaders(),
      timeout: 120000
    });

    const payload = response.data || {};
    const result = payload.result || payload;

    if (!result || (!result.title && !result.artist)) {
      return null;
    }

    return {
      meta: payload.status === 'success' ? 'Audio match' : 'AudD result',
      title: result.title || 'Unknown track',
      artist: result.artist || 'Unknown artist',
      album: result.album || 'No album info',
      cover: result.spotify?.album?.images?.[0]?.url || result.cover || 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=600&q=80',
      link: result.spotify?.external_urls?.spotify || result.youtube_url || result.link || 'https://www.youtube.com/results?search_query=' + encodeURIComponent((result.title || 'song') + ' ' + (result.artist || '')),
      preview: result.preview || result.previews?.[0]?.url || ''
    };
  } catch (error) {
    console.warn('AudD request failed:', error.message);
    return null;
  }
}

async function getOpenAIHints(query, lyrics) {
  if (!process.env.OPENAI_API_KEY) {
    return buildTextSuggestions(query, lyrics);
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = `Bantu cari lagu berdasarkan petunjuk berikut. Kembalikan hanya JSON array dengan key "title" dan "text" (3 item), bahasa Indonesia. Petunjuk: ${query || ''}. lirik: ${lyrics || ''}.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Kamu adalah asisten pencari lagu. Berikan 3 rekomendasi singkat yang relevan dalam format JSON array.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices?.[0]?.message?.content || '';
    const parsed = JSON.parse(content);
    const suggestions = Array.isArray(parsed?.suggestions) ? parsed.suggestions : Array.isArray(parsed) ? parsed : null;

    if (Array.isArray(suggestions) && suggestions.length) {
      return suggestions.map((item) => ({
        title: item.title || 'Rekomendasi',
        text: item.text || item.description || item.reason || ''
      })).slice(0, 3);
    }
  } catch (error) {
    console.warn('OpenAI request failed:', error.message);
  }

  return buildTextSuggestions(query, lyrics);
}

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', app: 'Song Defender AI' });
});

app.post('/api/recognize-url', async (req, res) => {
  const { url } = req.body || {};

  if (!url || !/^https?:\/\//i.test(url)) {
    return res.status(400).json({ error: 'URL tidak valid. Kirim URL lengkap seperti https://...' });
  }

  try {
    const match = await getAuddMatch(url, 'url');

    if (match) {
      return res.json({
        success: true,
        result: match,
        source: 'audd'
      });
    }

    return res.json({
      success: true,
      result: demoResult({
        meta: 'Demo • Link video',
        title: 'Midnight City',
        artist: 'M83',
        album: 'Hurry Up, We’re Dreaming',
        link: url,
        preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
      }),
      source: 'demo',
      warning: 'Mode demo aktif karena API key belum dikonfigurasi.'
    });
  } catch (error) {
    return res.status(500).json({ error: 'Gagal memproses link.', details: error.message });
  }
});

app.post('/api/recognize-file', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Pilih file audio atau video terlebih dahulu.' });
  }

  try {
    const match = await getAuddMatch(req.file.path, 'file');

    fs.unlink(req.file.path, () => {});

    if (match) {
      return res.json({
        success: true,
        result: match,
        source: 'audd'
      });
    }

    return res.json({
      success: true,
      result: demoResult({
        meta: 'Demo • Audio fingerprint',
        title: 'Attention',
        artist: 'Charlie Puth',
        album: 'Voicenotes',
        link: 'https://www.youtube.com/results?search_query=Charlie+Puth+Attention',
        preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
      }),
      source: 'demo',
      warning: 'Mode demo aktif karena API key belum dikonfigurasi.'
    });
  } catch (error) {
    return res.status(500).json({ error: 'Gagal memproses audio.', details: error.message });
  }
});

app.post('/api/ai-search', async (req, res) => {
  const { query = '', lyrics = '' } = req.body || {};

  if (!query.trim() && !lyrics.trim()) {
    return res.status(400).json({ error: 'Isi minimal satu petunjuk lagu atau lirik.' });
  }

  try {
    const suggestions = await getOpenAIHints(query, lyrics);
    return res.json({ success: true, suggestions });
  } catch (error) {
    return res.status(500).json({ error: 'Gagal memproses AI search.', details: error.message });
  }
});

app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Song Defender AI running on http://localhost:${PORT}`);
});

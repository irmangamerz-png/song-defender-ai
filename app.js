const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');
const resultBox = document.getElementById('result');
const activity = document.getElementById('activity');
const aiResults = document.getElementById('ai-results');

function switchTab(target) {
  tabs.forEach((tab) => {
    const active = tab.dataset.tab === target;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
  });

  panels.forEach((panel) => {
    panel.classList.toggle('active', panel.dataset.panel === target);
  });
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});

document.getElementById('audio-file').addEventListener('change', (event) => {
  const file = event.target.files && event.target.files[0];
  const title = document.getElementById('file-title');
  const subtitle = document.getElementById('file-subtitle');

  if (file) {
    title.textContent = file.name;
    subtitle.textContent = `${(file.size / (1024 * 1024)).toFixed(2)} MB · Siap diproses`;
  }
});

function setActivity(title, copy) {
  activity.classList.remove('hidden');
  document.getElementById('activity-title').textContent = title;
  document.getElementById('activity-copy').textContent = copy;
}

function hideActivity() {
  activity.classList.add('hidden');
}

function renderResult(data) {
  const cover = data.cover ? `<img class="cover" src="${data.cover}" alt="${data.title} cover">` : `<div class="cover cover-fallback">♫</div>`;

  resultBox.classList.remove('hidden');
  resultBox.innerHTML = `
    <div class="result-top">
      ${cover}
      <div>
        <div class="result-meta">${data.meta}</div>
        <div class="result-title">${data.title}</div>
        <div class="result-artist">${data.artist}</div>
        <div class="result-album">${data.album}</div>
      </div>
    </div>
    <div class="result-actions">
      <a class="secondary-btn" href="${data.link}" target="_blank" rel="noreferrer">Open source ↗</a>
      ${data.preview ? `<audio class="preview" controls src="${data.preview}"></audio>` : ''}
    </div>
    <p class="disclaimer">Hasil demo. Pada versi lengkap, sistem akan memanggil API pengenal audio atau AI pencarian.</p>
  `;
}

function renderAIResults() {
  const suggestions = [
    {
      title: 'Kemungkinan lagu 1',
      text: 'Lagu dengan vibe chillhop, instrumental lembut, dan tempo sedang. Cocok untuk video dengan mood santai atau sunset.'
    },
    {
      title: 'Kemungkinan lagu 2',
      text: 'Genre alternatif/indie dengan vokal yang hangat dan melodi repetitif yang mudah diingat di TikTok.'
    },
    {
      title: 'Potensi kata kunci pencarian',
      text: '"lofi sunset instrumental", "indie mellow female vocal", "chillhop 2024".'
    }
  ];

  aiResults.classList.remove('hidden');
  aiResults.innerHTML = `
    <h3>Rekomendasi AI</h3>
    ${suggestions.map((item) => `
      <div class="suggestion">
        <strong>${item.title}</strong>
        <p>${item.text}</p>
      </div>
    `).join('')}
  `;
}

document.getElementById('url-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const input = document.getElementById('video-url');

  if (!input.value.trim()) {
    input.focus();
    return;
  }

  setActivity('Mencari lagu dari link…', 'Mengecek metadata audio dan kemungkinan hasil pencocokan.');

  setTimeout(() => {
    hideActivity();
    renderResult({
      meta: 'Match • YouTube / TikTok',
      title: 'Midnight City',
      artist: 'M83',
      album: 'Hurry Up, We’re Dreaming',
      cover: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=600&q=80',
      link: 'https://www.youtube.com/results?search_query=M83+Midnight+City',
      preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
    });
  }, 1200);
});

document.getElementById('file-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const fileInput = document.getElementById('audio-file');

  if (!fileInput.files || !fileInput.files[0]) {
    fileInput.click();
    return;
  }

  setActivity('Menganalisis audio…', 'Membandingkan fingerprint suara dengan database lagu.');

  setTimeout(() => {
    hideActivity();
    renderResult({
      meta: 'Fingerprint match',
      title: 'Attention',
      artist: 'Charlie Puth',
      album: 'Voicenotes',
      cover: 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?auto=format&fit=crop&w=600&q=80',
      link: 'https://www.youtube.com/results?search_query=Charlie+Puth+Attention',
      preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
    });
  }, 1400);
});

document.getElementById('ai-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const query = document.getElementById('ai-query').value.trim();
  const lyrics = document.getElementById('ai-lyrics').value.trim();

  if (!query && !lyrics) {
    document.getElementById('ai-query').focus();
    return;
  }

  setActivity('Menyusun pencarian AI…', 'Mengolah hint, mood, dan lirik untuk menyarankan kemungkinan lagu.');

  setTimeout(() => {
    hideActivity();
    renderAIResults();
  }, 1200);
});

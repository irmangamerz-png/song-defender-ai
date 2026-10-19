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
    <p class="disclaimer">Hasil dapat berubah sesuai API eksternal yang dikonfigurasi di server.</p>
  `;
}

function renderAIResults(suggestions) {
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

document.getElementById('url-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = document.getElementById('video-url');

  if (!input.value.trim()) {
    input.focus();
    return;
  }

  setActivity('Mencari lagu dari link…', 'Mengecek metadata audio dan kemungkinan hasil pencocokan.');

  try {
    const response = await fetch('/api/recognize-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: input.value.trim() })
    });

    const payload = await response.json();
    hideActivity();

    if (!payload.success) {
      throw new Error(payload.error || 'Gagal memproses link');
    }

    renderResult(payload.result);
  } catch (error) {
    hideActivity();
    resultBox.classList.remove('hidden');
    resultBox.innerHTML = `<p class="disclaimer">${error.message}</p>`;
  }
});

document.getElementById('file-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const fileInput = document.getElementById('audio-file');

  if (!fileInput.files || !fileInput.files[0]) {
    fileInput.click();
    return;
  }

  setActivity('Menganalisis audio…', 'Membandingkan fingerprint suara dengan database lagu.');

  try {
    const formData = new FormData();
    formData.append('audio', fileInput.files[0]);

    const response = await fetch('/api/recognize-file', {
      method: 'POST',
      body: formData
    });

    const payload = await response.json();
    hideActivity();

    if (!payload.success) {
      throw new Error(payload.error || 'Gagal memproses file');
    }

    renderResult(payload.result);
  } catch (error) {
    hideActivity();
    resultBox.classList.remove('hidden');
    resultBox.innerHTML = `<p class="disclaimer">${error.message}</p>`;
  }
});

document.getElementById('ai-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const query = document.getElementById('ai-query').value.trim();
  const lyrics = document.getElementById('ai-lyrics').value.trim();

  if (!query && !lyrics) {
    document.getElementById('ai-query').focus();
    return;
  }

  setActivity('Menyusun pencarian AI…', 'Mengolah hint, mood, dan lirik untuk menyarankan kemungkinan lagu.');

  try {
    const response = await fetch('/api/ai-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, lyrics })
    });

    const payload = await response.json();
    hideActivity();

    if (!payload.success) {
      throw new Error(payload.error || 'Gagal memproses AI search');
    }

    renderAIResults(payload.suggestions || []);
  } catch (error) {
    hideActivity();
    aiResults.classList.remove('hidden');
    aiResults.innerHTML = `<p class="disclaimer">${error.message}</p>`;
  }
});

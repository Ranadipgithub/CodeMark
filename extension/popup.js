document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('app-container');
  const BACKEND_URL = 'https://codemark.onrender.com';
  const DASHBOARD_URL = 'https://codemark-lac.vercel.app';

  // 1. Robust Messaging Helper
  async function sendMessageToBackground(payload) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Extension background script timed out."));
      }, 8000);

      chrome.runtime.sendMessage(payload, (response) => {
        clearTimeout(timeout);
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  // 2. Check for Auth Cookie
  const cookie = await new Promise(resolve => {
    chrome.cookies.get({ url: BACKEND_URL, name: 'token' }, (c) => resolve(c));
  });

  if (!cookie) {
    renderLoginUI();
    return;
  }

  // 3. Check Context
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const currentTab = tabs[0];
    const url = currentTab.url;
    const slugMatch = url?.match(/\/problems\/([^/]+)/);
    const slug = slugMatch ? slugMatch[1] : null;

    if (!slug) {
      renderNotLeetCodeUI();
      return;
    }

    renderLoadingUI("Extracting Problem...");

    const query = `
      query questionData($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          title
          difficulty
          topicTags { name }
        }
      }
    `;

    try {
      const [response, checkResponse] = await Promise.all([
        sendMessageToBackground({
          action: 'fetchGraphQL',
          payload: {
            operationName: 'questionData',
            variables: { titleSlug: slug },
            query: query
          }
        }),
        fetch(`${BACKEND_URL}/api/problems/check/${slug}`, { credentials: 'include' })
          .then(res => res.json())
          .catch(() => ({ saved: false, isDue: false }))
      ]);

      if (!response.success || !response.data?.data?.question) {
        throw new Error("LeetCode data fetch failed.");
      }

      const q = response.data.data.question;
      const tags = q.topicTags.map(t => t.name);

      renderMainUI(q.title, slug, url, q.difficulty, tags, checkResponse);
    } catch (err) {
      container.innerHTML = `<p class="error-box">${err.message}</p>`;
    }
  });

  // --- UI RENDERERS ---

  function renderLoginUI() {
    container.innerHTML = `
      <div class="text-center py-6">
        <img src="logo.png" class="logo-img mb-4" />
        <h2 class="title-gradient mb-4">CodeMark</h2>
        <p class="text-slate-400 text-sm mb-6">Please log in to save problems.</p>
        <button id="login-btn" class="btn btn-primary">Log In / Register</button>
      </div>`;
    document.getElementById('login-btn').addEventListener('click', () => {
      chrome.tabs.create({ url: `${DASHBOARD_URL}/login` });
    });
  }

  function renderNotLeetCodeUI() {
    container.innerHTML = `
      <div class="text-center py-6">
        <img src="logo.png" class="logo-img mb-4" />
        <h2 class="text-lg mb-2">Not a LeetCode Problem</h2>
        <p class="text-slate-500 text-sm">Navigate to a problem page to save it.</p>
        <button id="dash-btn" class="btn btn-secondary mt-4">Open Dashboard</button>
      </div>`;
    document.getElementById('dash-btn').addEventListener('click', () => {
      chrome.tabs.create({ url: DASHBOARD_URL });
    });
  }

  function renderLoadingUI(text) {
    container.innerHTML = `
      <div class="text-center py-6 text-teal-400 animate-pulse font-medium">
        <img src="logo.png" class="logo-img mb-4" />
        ${text}
      </div>`;
  }

  function renderMainUI(title, slug, url, difficulty, tags, status) {
    const isSaved = status.saved;
    const isDue = status.isDue;

    container.innerHTML = `
      <div>
        <div class="text-center mb-4"><img src="logo.png" class="logo-img" /></div>
        <h2 class="text-lg text-white mb-1 line-clamp">${title}</h2>
        <div class="flex-row mb-4">
          <span class="tag tag-${difficulty.toLowerCase()}">${difficulty}</span>
          <span class="text-xs text-slate-400">${tags.length} topics</span>
        </div>

        ${isDue ? `
          <div class="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl mb-4">
            <p class="text-amber-400 font-medium text-sm mb-2 text-center">🎯 Revision Due Today!</p>
            <div class="grid grid-cols-3 gap-2">
              <button class="rev-btn bg-red-500/20 text-red-400" data-val="hard">Hard</button>
              <button class="rev-btn bg-blue-500/20 text-blue-400" data-val="good">Good</button>
              <button class="rev-btn bg-green-500/20 text-green-400" data-val="easy">Easy</button>
            </div>
          </div>
        ` : isSaved ? `
          <div class="text-center p-4 my-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <p class="text-emerald-400 font-medium mb-1">✅ Already Saved</p>
            <p class="text-slate-400 text-xs">Next review: ${new Date(status.nextReviewDate).toLocaleDateString()}</p>
          </div>
        ` : `
          <div class="input-group mb-2 mt-4">
            <label>Initial Feeling</label>
            <select id="feeling-select" class="input-control">
              <option value="Medium">Medium (Review in 2 days)</option>
              <option value="Easy">Easy (Review in 3 days)</option>
              <option value="Hard">Hard (Review tomorrow)</option>
            </select>
          </div>

          <div class="input-group mb-2">
            <label>Select Primary Topic</label>
            <select id="topic-select" class="input-control">
              <option value="">-- Auto-categorize by tags --</option>
              ${tags.map(t => `<option value="${t}">${t}</option>`).join('')}
            </select>
          </div>

          <div class="input-group mb-4">
            <label>Add Custom Topics (comma separated)</label>
            <input type="text" id="custom-topics" placeholder="e.g. Must Revise, Tricky" class="input-control" />
          </div>

          <button id="save-btn" class="btn btn-primary mb-2 w-full">Save Problem</button>
        `}
        <button id="dash-btn-final" class="btn btn-secondary w-full">Open Dashboard</button>
        <div id="status-msg" class="mt-2 text-center text-xs hidden"></div>
      </div>`;

    // Listeners
    document.getElementById('dash-btn-final').addEventListener('click', () => {
      chrome.tabs.create({ url: DASHBOARD_URL });
    });

    if (!isSaved && !isDue) {
      document.getElementById('save-btn').addEventListener('click', async () => {
        const btn = document.getElementById('save-btn');
        const selectedTopic = document.getElementById('topic-select').value;
        const customTopicsStr = document.getElementById('custom-topics').value;
        const manualTopics = customTopicsStr.split(',').map(t => t.trim()).filter(t => t !== '');

        // Re-implementing your logic: Custom Input > Dropdown > All Tags
        let finalTopics;
        if (manualTopics.length > 0) {
          finalTopics = manualTopics;
        } else if (selectedTopic) {
          finalTopics = [selectedTopic];
        } else {
          finalTopics = [...tags];
        }

        btn.disabled = true;
        btn.innerText = 'Saving...';

        try {
          const res = await fetch(`${BACKEND_URL}/api/problems`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              title, slug, leetcodeUrl: url, difficulty,
              leetcodeTags: tags,
              customTopics: finalTopics,
              initialFeeling: document.getElementById('feeling-select').value
            })
          });
          if (res.ok) {
            btn.innerText = 'Saved!';
            btn.className = 'btn btn-success mb-2 w-full';
          }
        } catch (err) {
          btn.disabled = false;
          btn.innerText = 'Error - Try Again';
        }
      });
    }

    if (isDue) {
      document.querySelectorAll('.rev-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const feedback = e.target.getAttribute('data-val');
          renderLoadingUI("Updating Algorithm...");
          try {
            await fetch(`${BACKEND_URL}/api/problems/${status.problemId}/review`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ feedback })
            });
            container.innerHTML = `<div class="text-center p-6"><p class="text-green-400">✅ Review Logged!</p></div>`;
            setTimeout(() => window.close(), 1500);
          } catch (err) {
            renderMainUI(title, slug, url, difficulty, tags, status);
          }
        });
      });
    }
  }
});
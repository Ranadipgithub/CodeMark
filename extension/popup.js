document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('app-container');
  const BACKEND_URL = 'http://localhost:5000';
  const DASHBOARD_URL = 'http://localhost:5173';

  // 1. Check for Auth Cookie
  const cookie = await new Promise(resolve => {
    chrome.cookies.get({ url: BACKEND_URL, name: 'token' }, (c) => resolve(c));
  });

  if (!cookie) {
    container.innerHTML = `
      <div class="text-center py-6">
        <img src="logo.png" class="logo-img mb-4" alt="CodeMark Logo" />
        <h2 class="title-gradient mb-4">CodeMark</h2>
        <p class="text-slate-400 text-sm mb-6">Please log in to save problems.</p>
        <button id="login-btn" class="btn btn-primary">
          Log In / Register
        </button>
      </div>
    `;
    document.getElementById('login-btn').addEventListener('click', () => {
      chrome.tabs.create({ url: `${DASHBOARD_URL}/login` });
    });
    return;
  }

  // 2. We have a cookie! Check if we are on LeetCode
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const currentTab = tabs[0];
    const url = currentTab.url;

    if (!url || !url.includes('leetcode.com/problems/')) {
      container.innerHTML = `
        <div class="text-center py-6">
          <img src="logo.png" class="logo-img mb-4" alt="CodeMark Logo" />
          <h2 class="text-lg mb-2">Not a LeetCode Problem</h2>
          <p class="text-slate-500 text-sm">Navigate to a problem description page to save it.</p>
          <button id="dash-btn" class="btn btn-secondary mt-4">Open Dashboard</button>
        </div>
      `;
      document.getElementById('dash-btn')?.addEventListener('click', () => {
        chrome.tabs.create({ url: DASHBOARD_URL });
      });
      return;
    }

    // Extract Slug
    const urlParts = url.split('/');
    const problemIndex = urlParts.indexOf('problems');
    const slug = urlParts[problemIndex + 1];

    if (!slug) {
      container.innerHTML = `<p class="error-box text-center">Could not parse problem slug.</p>`;
      return;
    }

      container.innerHTML = `<div class="text-center py-6 text-teal-400 animate-pulse font-medium">
        <img src="logo.png" class="logo-img mb-4" alt="CodeMark Logo" />
        Extracting Problem...
      </div>`;

    // 3. Fetch GraphQL Data via Background Script
    const query = `
      query questionData($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionId
          title
          titleSlug
          difficulty
          topicTags {
            name
          }
        }
      }
    `;

    chrome.runtime.sendMessage({
      action: 'fetchGraphQL',
      payload: {
        operationName: 'questionData',
        variables: { titleSlug: slug },
        query: query
      }
    }, (response) => {
      if (!response.success || !response.data || !response.data.data.question) {
        container.innerHTML = `<p class="error-box">Failed to fetch data from LeetCode. Make sure you are on a valid problem page.</p>`;
        return;
      }

      const q = response.data.data.question;
      const tags = q.topicTags.map(t => t.name);

      renderSaveUI(q.title, slug, url, q.difficulty, tags);
    });
  });

  function renderSaveUI(title, slug, url, difficulty, tags) {
    container.innerHTML = `
      <div>
        <div class="text-center mb-4"><img src="logo.png" class="logo-img" alt="CodeMark Logo" /></div>
        <h2 class="text-lg text-white mb-1 line-clamp" title="${title}">${title}</h2>
        <div class="flex-row">
          <span class="tag ${
            difficulty === 'Easy' ? 'tag-easy' :
            difficulty === 'Medium' ? 'tag-medium' :
            difficulty === 'Hard' ? 'tag-hard' : 'tag-default'
          }">${difficulty}</span>
          <span class="text-xs text-slate-400">${tags.length} topics</span>
        </div>

        <div class="input-group mb-2">
          <label>Initial Feeling (Seeds your next review)</label>
          <select id="feeling-select" class="input-control">
            <option value="Medium">Medium (Review in 2 days)</option>
            <option value="Easy">Easy (Review in 3 days)</option>
            <option value="Hard">Hard (Review tomorrow)</option>
          </select>
        </div>

        <div class="input-group mb-2">
          <label>Select Topic</label>
          <select id="topic-select" class="input-control">
            <option value="">-- Auto-categorize by tags --</option>
            ${tags.map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
        </div>

        <div class="input-group mb-4">
          <label>Or add custom topics (comma separated)</label>
          <input type="text" id="custom-topics" placeholder="e.g. Must Revise, DP, Tricky" 
            class="input-control" />
        </div>

        <button id="save-btn" class="btn btn-primary mb-2">
          Save Problem
        </button>
        <button id="dash-btn-2" class="btn btn-secondary mb-2">
          Open Dashboard
        </button>
        <div id="status-msg" class="mt-2 text-center text-xs hidden"></div>
      </div>
    `;

    document.getElementById('dash-btn-2').addEventListener('click', () => {
      chrome.tabs.create({ url: DASHBOARD_URL });
    });

    document.getElementById('save-btn').addEventListener('click', async () => {
      const btn = document.getElementById('save-btn');
      const msg = document.getElementById('status-msg');
      const selectedTopic = document.getElementById('topic-select').value;
      const customTopicsStr = document.getElementById('custom-topics').value;
      const initialFeeling = document.getElementById('feeling-select').value;
      const manualTopics = customTopicsStr.split(',').map(t => t.trim()).filter(t => t !== '');

      // Build the final customTopics array:
      // 1. If user typed custom topics, use those
      // 2. Else if user selected a topic from dropdown, use that
      // 3. Else auto-categorize using all LeetCode tags
      let finalTopics;
      if (manualTopics.length > 0) {
        finalTopics = manualTopics;
      } else if (selectedTopic) {
        finalTopics = [selectedTopic];
      } else {
        // Auto-categorize: use the problem's LeetCode tags as topics
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
            title,
            slug,
            leetcodeUrl: url,
            difficulty,
            leetcodeTags: tags,
            customTopics: finalTopics,
            initialFeeling
          })
        });

        if (res.ok) {
          msg.innerText = '✅ Saved successfully!';
          msg.className = 'mt-2 text-center text-xs text-green-400 block';
          btn.innerText = 'Saved';
          btn.className = 'btn btn-success mb-2';
        } else {
          throw new Error('Failed to save');
        }
      } catch (err) {
        msg.innerText = '❌ Error saving problem.';
        msg.className = 'mt-2 text-center text-xs text-red-400 block';
        btn.innerText = 'Try Again';
        btn.disabled = false;
        btn.className = 'btn btn-primary mb-2';
      }
    });
  }
});

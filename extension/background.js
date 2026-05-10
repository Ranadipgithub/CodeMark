chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchGraphQL') {
    fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request.payload)
    })
    .then(res => res.json())
    .then(data => sendResponse({ success: true, data }))
    .catch(error => sendResponse({ success: false, error: error.message }));

    return true; // Keep message channel open for async response
  }
});

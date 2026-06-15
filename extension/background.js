const BACKEND_URL = 'https://codemark.onrender.com';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchGraphQL") {
    handleGraphQL(request, sendResponse);
    return true; // Keep the channel open
  }

  if(request.action === "verifyAuth"){
    performAuthCheck(sendResponse);
    return true;
  }
});

async function handleGraphQL(request, sendResponse) {
  try {
    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request.payload),
    });
    const data = await res.json();
    sendResponse({ success: true, data });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function performAuthCheck(sendResponse) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/me`, {credentials: 'include'});
    sendResponse({ ok: res.ok });
  } catch (err) {
    console.error("auth error", err);
    sendResponse({ ok: false });
  }
}
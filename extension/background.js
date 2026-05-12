chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchGraphQL") {
    handleGraphQL(request, sendResponse);
    return true; // Keep the channel open
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
chrome.commands.onCommand.addListener((command) => {
  if (command === "simulate-type") {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      // ตรวจสอบว่า tab มีอยู่จริงและไม่ใช่หน้า internal ของ chrome (เช่น chrome://)
      if (tab?.id && !tab.url.startsWith('chrome://')) {
        chrome.tabs.sendMessage(tab.id, { action: "start_typing" })
          .catch(err => console.debug("Cannot send message to this tab:", err));
      }
    });
  }
});
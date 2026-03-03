chrome.runtime.onMessage.addListener(async (request) => {
  if (request.action === "start_typing") {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;

      const el = getDeepActiveElement();
      if (!el) return;

      fastSimulateTyping(el, text);
    } catch (err) {
      console.error("Super Keyboard Sim: Clipboard access denied or empty.");
    }
  }
});

// ฟังก์ชันหา Element ที่ Focus อยู่จริงแม้จะอยู่ใน Shadow DOM หรือ nested frames
function getDeepActiveElement() {
  let el = document.activeElement;
  while (el && el.shadowRoot && el.shadowRoot.activeElement) {
    el = el.shadowRoot.activeElement;
  }
  return el;
}

function fastSimulateTyping(el, text) {
  const eventOptions = {
    bubbles: true,
    cancelable: true,
    composed: true,
    data: text,
    inputType: 'insertFromPaste'
  };

  // 1. ส่ง beforeinput: แจ้งเตือนเว็บไซต์ว่ากำลังจะมีการวางข้อความ
  const beforeInputEvent = new InputEvent('beforeinput', eventOptions);
  el.dispatchEvent(beforeInputEvent);
  
  if (beforeInputEvent.defaultPrevented) return;

  // 2. ดำเนินการแทรกข้อความ (Primary Method: execCommand)
  // เป็นวิธีที่ Gemini และ Rich Text Editors ส่วนใหญ่รองรับได้ดีที่สุด
  let success = document.execCommand('insertText', false, text);

  // 3. Fallback Strategies: หาก execCommand ล้มเหลว
  if (!success) {
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      const { selectionStart: start, selectionEnd: end, value } = el;
      el.value = value.slice(0, start) + text + value.slice(end);
      el.selectionStart = el.selectionEnd = start + text.length;
    } else if (el.isContentEditable) {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(text));
        range.collapse(false);
      }
    }
  }

  // 4. ส่ง input event: เพื่อให้ React/Vue State อัปเดตข้อมูลก้อนใหม่
  el.dispatchEvent(new InputEvent('input', eventOptions));

  // 5. ส่ง change event: เพื่อบอกว่าการแก้ไขเสร็จสมบูรณ์
  el.dispatchEvent(new Event('change', { bubbles: true }));
}
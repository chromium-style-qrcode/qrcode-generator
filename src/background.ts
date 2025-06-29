// Background script to handle keyboard shortcuts
export default defineBackground(() => {
  // Listen for keyboard shortcut commands
  chrome.commands?.onCommand.addListener((command: string) => {
    if (command === 'show-qrcode') {
      // Open the popup when the shortcut is pressed
      chrome.action?.openPopup()
    }
  })
})

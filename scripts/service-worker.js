async function sendMessage(message) {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
  if (tab == null || tab.url?.startsWith('chrome://')) return undefined
  const response = await chrome.tabs.sendMessage(tab.id, message)
  // do something with response here, not outside the function
  // console.log(response)
}

function addListener(commandName) {
  chrome.commands.onCommand.addListener((command) => {
    if (command !== commandName) return
    console.log(`Command ${command} triggered`)
    sendMessage({ command: command })
  })
}

async function setup() {
  addListener('Improve')
  addListener('Complete')
  addListener('Ask')
  /*const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
  if (tab?.url?.startsWith('chrome://')) return undefined
  console.log('tab'+tab)
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['scripts/content.js']
  }).then(() => {

  })*/
}

setup()

const settings = [
  { key: 'Complete', shortcut: 'Alt+C', status: 'enabled', type: 'Command' },
  { key: 'Improve', shortcut: 'Alt+I', status: 'enabled', type: 'Command' },
  { key: 'Ask', shortcut: 'Alt+A', status: 'enabled', type: 'Command' }
]

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

chrome.runtime.onInstalled.addListener((reason) => {
  if (reason.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    checkCommandShortcuts()
  }
})

// Only use this function during the initial install phase. After
// installation the user may have intentionally unassigned commands.
// Example for install commands: [{"description":"","name":"_execute_action","shortcut":""},{"description":"Use the selected text to ask GPT. It adds to the beginning of the selected text: 'In Latex, '","name":"Ask","shortcut":""},{"description":"Complete selected text","name":"Complete","shortcut":""},{"description":"Improve selected text","name":"Improve","shortcut":""}]
async function checkCommandShortcuts() {
  chrome.commands.getAll((commands) => {
    for (let { name, shortcut } of commands) {
      let command =
        settings.filter(({ type, key }) => 'Command' === type && name === key)
      if (command.length > 0) {
        command = command[0]
        if (shortcut === '') {
          command.status = 'error'
        }
        setSetting(command.key, command)
      }
    }
  })
}

/**
 * Set a setting in storage {@link https://developer.chrome.com/docs/extensions/reference/storage/#type-StorageArea:~:text=to%20the%20callback.-,set,-void}
 * @param key
 * @param value
 * @param callback
 */
async function setSetting(key, value, callback = null) {
  let obj = {}
  obj[key] = value
  chrome.storage.local.set(obj, callback).catch(error => {
    console.log(`Failed to set ${key} setting. Error: ${error}`)
  })
}

/**
 * Get a setting from storage
 * @param {string | string[] | object} [keys=null] - The keys to get (see {@link https://developer.chrome.com/docs/extensions/reference/storage/#usage})
 * @param {function} [callback=null] - Callback function
 */
async function getSetting(keys = null, callback = null) {
  return chrome.storage.local.get(keys, callback)
}

async function setup() {
  addListener('Improve')
  addListener('Complete')
  addListener('Ask')
}

setup()
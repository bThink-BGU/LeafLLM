const apiKeyRegex = /sk-[a-zA-Z0-9]{48}/

function addMessage(message) {
  $('#message-box').append(`<div class="message">${message}</div>`)
}

function addErrorMessage(message) {
  $('#message-box').append(`<div class="error">${message}</div>`)
}

function clearMessages() {
  $('#message-box').empty()
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

async function refreshStorage() {
  getSetting('openAIAPIKey').then(({ openAIAPIKey }) => {
    $('#api-token-form .api-token-status').text(chrome.runtime.lastError || !openAIAPIKey ? 'not set' : 'set')
  })

  getSetting(['Improve', 'Complete', 'Ask']).then(settings =>
    settings.forEach(({ key, shortcut, status }) => {
    if (status === 'error') {
      addErrorMessage(`${shortcut} could not be bound for the ${key} command. You can set it manually at chrome://extensions/shortcuts.`)
    }
    $(`#settings-form input[name='text-${key}']:checkbox`).prop('checked', status === 'checked')
  }))
}

async function handleAPITokenSet(event) {
  event.preventDefault()
  event.stopPropagation()

  clearMessages()

  const input = $('#api-token-form').find('input[name=\'api-token\']')
  const openAIAPIKey = input.val()
  input.val('')

  if (!openAIAPIKey || !apiKeyRegex.test(openAIAPIKey)) {
    addErrorMessage('Invalid API Token.')
    return
  }

  try {
    await chrome.storage.local.set({ openAIAPIKey })
  } catch (error) {
    console.log(error)
    addErrorMessage('Failed to set API Token.')
    return
  }

  await refreshStorage()
}

async function handleAPITokenClear(event) {
  event.preventDefault()
  event.stopPropagation()

  clearMessages()

  try {
    await chrome.storage.local.remove('openAIAPIKey')
  } catch (error) {
    console.log(error)
    addErrorMessage('Failed to remove API Token.')
    return
  }

  await refreshStorage()
}

function makeHandleSettingChange(key) {
  return async (event) => {
    event.preventDefault()
    event.stopPropagation()
    clearMessages()

    const value = event.target.checked
    getSetting(key).then(setting => {
      setting.status = value ? 'checked' : 'unchecked'
      setSetting(setting.key, setting)
    })
    // await refreshStorage()
  }
}

$(document).ready(async function () {
  $('#api-token-form .submit').on('click', handleAPITokenSet)
  $('#api-token-form .clear').on('click', handleAPITokenClear)

  getSetting(['Improve', 'Complete', 'Ask']).forEach(key => {
    $(`#settings-form input[name='text-${name}']:checkbox`).on('change', makeHandleSettingChange(key))
  })
  return refreshStorage()
})

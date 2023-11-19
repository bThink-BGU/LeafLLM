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

async function refreshStorage() {
  chrome.storage.local.get('openAIAPIKey').then(({ openAIAPIKey }) => {
    $('#api-token-form .api-token-status').text(chrome.runtime.lastError || !openAIAPIKey ? 'not set' : 'set')
  })

  const commands = await chrome.commands.getAll();

  chrome.storage.local.get(['Improve', 'Complete', 'Ask']).then((settings) => {
    Object.values(settings).forEach(setting => {
      let command = commands.filter(({ name }) => name === setting.key)[0]
      if(command.shortcut !== setting.shortcut) {
        setting.shortcut = command.shortcut;
        if(setting.status === 'enabled' && setting.shortcut === '') {
          setting.status = 'error'
        }
        chrome.storage.local.set({ [setting.key]: setting });
      } else if(setting.status === 'enabled' && setting.shortcut === '') {
        setting.status = 'error'
        chrome.storage.local.set({ [setting.key]: setting })
      }
    })
    let bindingFailures = Object.values(settings)
      .filter(({ status }) => status === 'error')
      .map(({ key }) => `${key}`)
      .join(', ');
    if (bindingFailures.length > 0) {
      addErrorMessage(`Could not bind the following shortcuts:\n${bindingFailures}.\nYou can set it manually at <a href="chrome://extensions/shortcuts">chrome://extensions/shortcuts</a>.`)
    }
    Object.values(settings).forEach(({ key, status, shortcut }) => {
      $(`#settings-form input[name='text-${key}']:checkbox`).prop('checked', status === 'enabled')
      let shortcut2 = shortcut === '' ? 'not set' : shortcut
      $(`#shortcut-${key}`).html(`<span>${shortcut2}</span>`)
    })
  })
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

  chrome.storage.local.set({ openAIAPIKey })
    .then(refreshStorage)
    .catch((error) => addErrorMessage(`Failed to remove API Token. Error: ${error}`))
}

async function handleAPITokenClear(event) {
  event.preventDefault()
  event.stopPropagation()

  clearMessages()

  chrome.storage.local.remove('openAIAPIKey')
    .then(refreshStorage)
    .catch((error) => addErrorMessage(`Failed to remove API Token. Error: ${error}`))
}

function makeHandleSettingChange(key) {
  return async (event) => {
    event.preventDefault()
    event.stopPropagation()
    clearMessages()

    const value = event.target.checked
    const setting = await chrome.storage.local.get(key)
/*    let commandKey = await chrome.commands.getAll()
    commandKey = commandKey.filter(({ name }) => name === key)[0]*/
    // if (setting[key].status !== 'error') {
      setting[key].status = value ? 'enabled' : 'disabled'
      await chrome.storage.local.set({ [key]: setting[key] })
    // }
    return refreshStorage()
  }
}

$(document).ready(async function () {
  $('#api-token-form .submit').on('click', handleAPITokenSet)
  $('#api-token-form .clear').on('click', handleAPITokenClear)

  let commands = ['Improve', 'Complete', 'Ask']
  commands.forEach((key) => {
    $(`#settings-form input[name='text-${key}']:checkbox`).on('change', makeHandleSettingChange(key))
  })

  $('body').on('click', 'a', function(){
    chrome.tabs.create({url: $(this).attr('href')});
    return false;
  });
  return refreshStorage()
})

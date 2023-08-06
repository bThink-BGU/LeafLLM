import {setSetting} from '../scripts/utils.js'

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

  chrome.storage.local.get(['Improve', 'Complete', 'Ask']).then((settings) => {
    let bindingFailures = Object.values(settings)
    .filter(({ status }) => status === 'error')
    .map(({ key, shortcut }) => `${shortcut} for ${key}`)
    .join(', ')
    if (bindingFailures.length > 0) {
      addErrorMessage(`Could not bound the following shortcuts:\n${bindingFailures}.\nYou can set it manually at <a href="chrome://extensions/shortcuts">chrome://extensions/shortcuts</a>.`)
    }
    Object.values(settings).forEach(({ key, status }) => {
      $(`#settings-form input[name='text-${key}']:checkbox`).prop('checked', status === 'enabled')
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

  try {
    chrome.storage.local.set({ openAIAPIKey }).then(refreshStorage)
  } catch (error) {
    console.log(error)
    addErrorMessage('Failed to set API Token.')
    return
  }
}

async function handleAPITokenClear(event) {
  event.preventDefault()
  event.stopPropagation()

  clearMessages()

  try {
    chrome.storage.local.remove('openAIAPIKey').then(refreshStorage)
  } catch (error) {
    console.log(error)
    addErrorMessage('Failed to remove API Token.')
    return
  }
}

function makeHandleSettingChange(key) {
  return async (event) => {
    event.preventDefault()
    event.stopPropagation()
    clearMessages()

    const value = event.target.checked
    chrome.storage.local.get(key).then(setting => {
      if(setting[key].status !== 'error') {
        setting[key].status = value ? 'enabled' : 'disabled'
        setSetting(setting[key].key, setting[key])
      }
      return refreshStorage()
    })
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
  await refreshStorage()
})

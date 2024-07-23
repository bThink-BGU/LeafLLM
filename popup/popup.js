// Changing defaultConfigurations requires changing service-worker.js
const defaultConfigurations = {
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    base: {
      n: 1,
      temperature: 0.5,
      model: 'gpt-3.5-turbo'
    },
    Complete: {
      max_tokens: 512,
      messages: [{
        role: 'system',
        content: 'You are an assistant in a Latex editor that continues the given text. No need to rewrite the given text'
      }]
    },
    Improve: {
      messages: [{
        role: 'system',
        content: 'You are an assistant in a Latex editor that improves the given text'
      }]
    },
    Ask: {
      messages: [{
        role: 'system',
        content: 'You are an assistant in a Latex editor. Answer questions without introduction/explanations'
      }]
    }
  }
}

// Changing the class here requires changing scripts/content.js
class OpenAIAPI {
  constructor(apiKey) {
    this.apiKey = apiKey
  }

  query(url, data) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', url, true)
      xhr.setRequestHeader('Content-Type', 'application/json')
      xhr.setRequestHeader('Authorization', `Bearer ${this.apiKey}`)
      xhr.onerror = function () {
        reject('Failed to query OpenAI API: network error.')
      }
      xhr.onload = function () {
        if (xhr.status === 200) {
          let jsonResponse
          try {
            jsonResponse = JSON.parse(xhr.responseText)
          } catch (e) {
            reject('Failed to query OpenAI API, cannot parse response:\n' + e + '\n' + xhr.responseText)
            return
          }
          if (jsonResponse.hasOwnProperty('choices')) {
            resolve(jsonResponse.choices)
          } else {
            reject('Failed to query OpenAI API: invalid response: ' + jsonResponse)
          }
        } else {
          reject('Failed to query OpenAI API: invalid status: ' + xhr.status + ' - ' + xhr.responseText)
        }
      }

      xhr.send(JSON.stringify(data))
    })
  }

  async act(command, text) {
    let conf = (await chrome.storage.local.get('RequestConfiguration')).RequestConfiguration.openai
    let request = Object.assign({}, conf.base)
    let url = conf.url
    Object.assign(request, conf[command])
    request.messages.push({ role: 'user', 'content': text })
    return this.query(url, request)
      .then(result => result[0]['message'].content)
  }
}


const jsonEditor = createJsonEditor()

function createJsonEditor() {
  return new JSONEditor($('#json-editor')[0], {
    mode: 'code', // Use code mode for better editing
    onChange: function () {
      $('#saveConfig').prop('disabled', false);
    }
  })
}

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

  const commands = await chrome.commands.getAll()

  chrome.storage.local.get(['RequestConfiguration']).then((settings) => {
    jsonEditor.set(settings.RequestConfiguration)
    $('#saveConfig').prop('disabled', true);
  })

  chrome.storage.local.get(['Improve', 'Complete', 'Ask']).then((settings) => {
    Object.values(settings).forEach(setting => {
      let command = commands.filter(({ name }) => name === setting.key)[0]
      if (command.shortcut !== setting.shortcut) {
        setting.shortcut = command.shortcut
        if (setting.status === 'enabled' && setting.shortcut === '') {
          setting.status = 'error'
        }
        chrome.storage.local.set({ [setting.key]: setting })
      } else if (setting.status === 'enabled' && setting.shortcut === '') {
        setting.status = 'error'
        chrome.storage.local.set({ [setting.key]: setting })
      }
    })
    let bindingFailures = Object.values(settings)
      .filter(({ status }) => status === 'error')
      .map(({ key }) => `${key}`)
      .join(', ')
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

  if (!openAIAPIKey) {
    addErrorMessage('Invalid API Token.')
    return
  }
  try {
    await validateAPIKey(openAIAPIKey)
  }catch (e) {
    addErrorMessage(`Failed to validate API Token. Error: ${e}`)
    return
  }

  chrome.storage.local.set({ openAIAPIKey })
    .then(refreshStorage)
    .catch((error) => addErrorMessage(`Failed to remove API Token. Error: ${error}`))
}

async function validateAPIKey(apiKey) {
  const openAI = new OpenAIAPI(apiKey)
  return openAI.act('Ask', 'write a random latex command. do not explain it.')
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

async function saveConfig() {
  clearMessages()
  let config;
  try {
    config = jsonEditor.get()
  } catch (e) {
    addErrorMessage(`Failed to parse configuration. Error: ${e}`)
    return
  }
  chrome.storage.local.set({ RequestConfiguration: config })
    .then(refreshStorage)
    .catch((error) => addErrorMessage(`Failed to save configuration. Error: ${error}`))
}

$(document).ready(async function () {
  $('#api-token-form .submit').on('click', handleAPITokenSet)
  $('#api-token-form .clear').on('click', handleAPITokenClear)

  let commands = ['Improve', 'Complete', 'Ask']
  commands.forEach((key) => {
    $(`#settings-form input[name='text-${key}']:checkbox`).on('change', makeHandleSettingChange(key))
  })

  $('body').on('click', 'a', function () {
    chrome.tabs.create({ url: $(this).attr('href') })
    return false
  })

  $('#resetConfig').on('click', async function () {
    jsonEditor.set(defaultConfigurations)
    await saveConfig()
  })

  $('#saveConfig').on('click', saveConfig)
  return refreshStorage()
})


class OpenAIAPI {
  static defaultModel = 'gpt-3.5-turbo'

  constructor(apiKey) {
    this.apiKey = apiKey
  }

  query(endpoint, data) {
    return new Promise((resolve, reject) => {
      const url = `https://api.openai.com/v1/${endpoint}`

      if (!data.model) data.model = OpenAIAPI.defaultModel
      if (!data.n) data.n = 1
      if (!data.temperature) data.temperature = 0.5

      const xhr = new XMLHttpRequest()
      xhr.open('POST', url, true)
      xhr.setRequestHeader('Content-Type', 'application/json')
      xhr.setRequestHeader('Authorization', `Bearer ${this.apiKey}`)
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return
        if (xhr.status !== 200) return reject('Failed to query OpenAI API.')

        const jsonResponse = JSON.parse(xhr.responseText)

        if (!jsonResponse.choices) return reject('Failed to query OpenAI API.')

        return resolve(jsonResponse.choices)
      }

      xhr.send(JSON.stringify(data))
    })
  }

  async completeText(text) {
    const data = {
      max_tokens: 512,
      messages: [
        { role: 'system', content: 'You are an assistant in a Latex editor that continues the given text. No need to rewrite the given text' },
        { role: 'user', 'content': text }
      ],
    }

    return this.query('chat/completions', data)
      .then(result => result[0]['message'].content)
  }

  async improveText(text) {
    const data = {
      messages: [
        { role: 'system', content: 'You are an assistant in a Latex editor' },
        { role: 'user', 'content': 'Improve the following text:\n'+text }],
    }

    return this.query('chat/completions', data)
      .then(result => result[0]['message'].content)
  }

  async ask(text) {
    const data = {
      max_tokens: 512,
      messages: [
        { role: 'system', content: 'You are an assistant in a Latex editor. Answer questions without introduction/explanations' },
        { role: 'user', 'content': text }
      ],
    }

    return this.query('chat/completions', data)
      .then(result => result[0]['message'].content)
  }
}

function replaceSelectedText(replacementText, selection) {
  const sel = selection === undefined ? window.getSelection() : selection

  if (sel.rangeCount) {
    const range = sel.getRangeAt(0)
    range.deleteContents()
    range.insertNode(document.createTextNode(replacementText))
  }
}

async function settingIsEnabled(key) {
  return chrome.storage.local.get(key)
    .then(setting => 'enabled' === setting[key].status)
    .catch(() => false)
}

function commentText(text) {
  const regexPattern = /\n/g
  const replacementString = '\n%'
  let comment = text.replace(regexPattern, replacementString)
  if (!comment.startsWith('%')) {
    comment = '%' + comment
  }
  return comment
}

async function improveTextHandler(openAI) {
  if (!(await settingIsEnabled('Improve'))) throw new Error('Text improvement is not enabled.')
  const selection = window.getSelection()
  const selectedText = selection.toString()
  if (!selectedText) return
  const editedText = await openAI.improveText(selectedText)
  const commentedText = commentText(selectedText)
  replaceSelectedText(commentedText + '\n' + editedText, selection)
}

async function completeTextHandler(openAI) {
  if (!(await settingIsEnabled('Complete'))) throw new Error('Text completion is not enabled.')
  const selection = window.getSelection()
  const selectedText = selection.toString()
  if (!selectedText) return
  const editedText = (await openAI.completeText(selectedText)).trimStart()
  replaceSelectedText(selectedText + '\n' + editedText, selection)
}

async function askHandler(openAI) {
  if (!(await settingIsEnabled('Ask'))) throw new Error('Ask is not enabled.')
  const selection = window.getSelection()
  const selectedText = selection.toString()
  if (!selectedText) return
  const editedText = (await openAI.ask(selectedText)).trimStart()
  replaceSelectedText(editedText, selection)
}

let currentAPIKey
let openAI = undefined

function cleanup() {
}

function setAPIKey(key) {
  if (currentAPIKey === key) return
  cleanup()
  currentAPIKey = key
  if (currentAPIKey) {
    openAI = new OpenAIAPI(currentAPIKey)
    log('OpenAI API key set, enabling LeafLLM features.')
  } else {
    openAI = undefined
    log('OpenAI API key is not set, LeafLLM features are disabled.')
  }
}

function handleCommand(command) {
  if (command === 'Improve') {
    improveTextHandler(openAI).catch(e => error(`Failed to execute the '${command}' command.`, e))
  } else if (command === 'Complete') {
    completeTextHandler(openAI).catch(e => error(`Failed to execute the '${command}' command.`, e))
  } else if (command === 'Ask') {
    askHandler(openAI).catch(e => error(`Failed to execute the '${command}' command.`, e))
  }
}

function error(msg, error) {
  if(error) {
    msg += ` Error message: ${error.message}`
    if(error.cause) {
      console.error(`\nCause: ${JSON.stringify(error.cause)}`)
    }
  }
  customAlert(msg)
  console.error(`LeafLLM: ${msg}`)
}

function log(msg) {
  console.log(`LeafLLM: ${msg}`)
}

function customAlert(msg,duration)
{
  if(!duration) duration = 4000;
  var styler = document.createElement("div");
  styler.setAttribute("class","system-message-content alert");
  styler.setAttribute("style","z-index:10000;position:absolute;top:20%;left:50%;border: solid 5px Red;background-color:#444;color:Silver");
  styler.innerHTML = msg;
  setTimeout(function()
  {
    styler.parentNode.removeChild(styler);
  },duration);
  document.body.appendChild(styler);
}

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    log(`Received request: ${JSON.stringify(request)}`)
    if (request.command === 'setup') {
      setAPIKey(request.apiKey)
    } else {
      if (!openAI) {
        chrome.storage.local.get('openAIAPIKey').then(({ openAIAPIKey }) => {
          setAPIKey(openAIAPIKey)
          if (openAI) {
            handleCommand(request.command)
          } else {
            error('OpenAI API key is not set, LeafLLM features are disabled.')
          }
        })
      } else {
        handleCommand(request.command)
      }
    }
  }
)


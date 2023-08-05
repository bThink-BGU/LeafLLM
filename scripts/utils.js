/**
 * Set a setting in storage {@link https://developer.chrome.com/docs/extensions/reference/storage/#type-StorageArea:~:text=to%20the%20callback.-,set,-void}
 * @param key
 * @param value
 * @param {function}[callback] Optional callback function
 */
export async function setSetting(key, value, callback) {
  let obj = {}
  obj[key] = value
  if (typeof callback === 'undefined') {
    chrome.storage.local.set(obj).catch(error => {
      console.log(`Failed to set ${key} setting. Error: ${error}`)
    })
  } else {
    chrome.storage.local.set(obj, callback).catch(error => {
      console.log(`Failed to set ${key} setting. Error: ${error}`)
    })
  }
}

/**
 * Get a setting from storage
 * @param {string | string[] | object} [keys=null] - The keys to get (see {@link https://developer.chrome.com/docs/extensions/reference/storage/#usage})
 * @param {function}[callback] Optional callback function
 */
export async function getSetting(keys = null, callback) {
  if (typeof callback === 'undefined') {
    return chrome.storage.local.get(keys, (items) => Object.values(items))
  }else {
    return chrome.storage.local.get(keys, (items) => callback(Object.values(items)))
  }
}
import * as sodium from 'libsodium-wrappers'

export default {
  generateRandom (length = 16) {
    return window.crypto.getRandomValues(new Uint8Array(length))
  },

  async getHash (value, salt = '') {
    await sodium.ready

    const rawHash = await window.crypto.subtle.digest('SHA-256', Buffer.from(value + salt))
    const hash = sodium.to_hex(Buffer.from(rawHash))

    return hash
  },

  async deriveKey (pass, salt) {
    await sodium.ready

    const keyBase = await window.crypto.subtle.importKey(
      'raw',
      Buffer.from(pass),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )

    const rawKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt || this.generateRandom(),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyBase,
      { name: 'AES-GCM', length: 128 },
      true,
      ['encrypt', 'decrypt']
    )

    const key = await this.exportKey(rawKey)

    return key
  },

  async generateKey () {
    const key = await window.crypto.subtle.generateKey({
      name: 'AES-GCM',
      length: 128
    }, true, ['encrypt', 'decrypt'])

    return this.exportKey(key)
  },

  async exportKey (rawKey, type = 'raw') {
    await sodium.ready

    const key = await window.crypto.subtle.exportKey(type, rawKey)

    return sodium.to_base64(Buffer.from(key))
  },

  async importKey (key) {
    await sodium.ready

    const bufferedKey = sodium.from_base64(key)

    const rawKey = await window.crypto.subtle.importKey('raw', bufferedKey, {
      name: 'AES-GCM'
    }, true, ['encrypt', 'decrypt'])

    return rawKey
  },

  async encrypt (key, data) {
    await sodium.ready

    const rawKey = await this.importKey(key)

    const iv = this.generateRandom(12)

    const bufferedResult = await window.crypto.subtle.encrypt({
      name: 'AES-GCM',
      iv
    }, rawKey, sodium.from_string(data))

    const ivB64 = sodium.to_base64(iv)

    const result = `${ivB64}@${sodium.to_base64(Buffer.from(bufferedResult))}`

    return result
  },

  async decrypt (key, data) {
    await sodium.ready

    const rawKey = await this.importKey(key)

    data = data.split('@')
    const iv = sodium.from_base64(data[0])
    const ctext = sodium.from_base64(data[1])

    const bufferedResult = await window.crypto.subtle.decrypt({
      name: 'AES-GCM',
      iv
    }, rawKey, ctext)

    const result = sodium.to_string(bufferedResult)

    return result
  }
}

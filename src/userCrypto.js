import crypto from './crypto'

export default {
  async generateAppKeys () {
    const appKeys = {
      appKey: await crypto.generateKey(),
      appSalt: await crypto.generateKey()
    }

    return appKeys
  },

  async generateAppKeysPackage (pass, appKeys = null) {
    const appKeySalt = await crypto.generateKey()
    const userKey = await crypto.deriveKey(pass, appKeySalt)

    appKeys = appKeys || await this.generateAppKeys()

    const keyPackage = await crypto.encrypt(userKey, JSON.stringify(appKeys))

    return {
      keyPackage,
      appKeys,
      appKeySalt
    }
  }
}

import axios from 'axios'
import userCrypto from './userCrypto'
import crypto from './crypto'

export default {
  async authenticate (email, pass) {
    const result = await axios.post(`${process.env.VUE_APP_BACKEND_URL}/auth`, {
      email,
      password: await crypto.deriveKey(pass, 'passwordSalt')
    })

    return {
      ...result.data,
      pass
    }
  },

  async authenticateWithTFA (authResp, authKey) {
    const result = await axios.post(`${process.env.VUE_APP_BACKEND_URL}/auth`, {
      token: authResp.token,
      auth_key: authKey
    })

    return {
      ...result.data,
      pass: authResp.pass
    }
  },

  async refreshUserToken (token) {
    const result = await axios.post(`${process.env.VUE_APP_BACKEND_URL}/auth`, {
      token
    })

    return result.data
  },

  async createUserToken (email) {
    const result = await axios.post(`${process.env.VUE_APP_BACKEND_URL}/auth/registration`, {
      email
    })

    return result.data
  },

  async createUser (token, email, pass, passHint) {
    const userPackage = await userCrypto.generateAppKeysPackage(pass)

    const result = await axios.post(`${process.env.VUE_APP_BACKEND_URL}/auth/registration`, {
      token,
      user: {
        email,
        password: await crypto.deriveKey(pass, 'passwordSalt'),
        password_hint: passHint,
        appkey: userPackage.keyPackage,
        appkey_salt: userPackage.appKeySalt
      }
    })

    return result.data
  }
}

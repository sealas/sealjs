import axios from 'axios'
import user from './user'
import crypto from './crypto'

export default {
  async authenticate (email, pass) {
    const result = await axios.post(`${process.env.VUE_APP_BACKEND_URL}/auth`, {
      email,
      password: await crypto.deriveKey(pass, 'passwordSalt')
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
    const userPackage = await user.generateAppKeysPackage(pass)

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

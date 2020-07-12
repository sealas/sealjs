import { Socket } from 'phoenix'
import userClient from './userClient'
import crypto from './crypto'

export default class {
  constructor () {
    this.email = null
    this.pass = null

    this.accountId = null
    this.token = null
    this.appkey = null
    this.appkeySalt = null
  }

  async connect (email, pass) {
    this.email = email
    this.pass = pass

    const authResp = await userClient.authenticate(email, pass)

    this.token = authResp.token
    this.accountId = authResp.account_id

    this.userKey = await crypto.deriveKey(pass, authResp.appkey_salt)
    this.appKeysPackage = JSON.parse(await crypto.decrypt(this.userKey, authResp.appkey))

    this.socket = new Socket(`${process.env.VUE_APP_WS_URL}/socket`, {
      params: { token: this.token }
      // logger: (kind, msg, data) => { console.log(`${kind}: ${msg}`, data) }
    })

    this.socket.connect()

    this.channel = this.socket.channel(`item:${this.accountId}`)

    this.channel.on('all_items', (items) => {
      console.log('Receiving all items!', items)
    })

    this.channel.join()
      .receive('ok', (items) => {
        console.log('OK all items!', items)
      })

    return this.channel
  }

  async create (item, type = 'item') {
    const encryptedItem = await crypto.encrypt(this.appKeysPackage.appKey, JSON.stringify(item))
    const typeHash = await crypto.getHash(type, this.appKeysPackage.appSalt)

    return this.channel.push('add_item', {
      item: {
        content: encryptedItem,
        content_type: typeHash
      }
    })
  }

  async update (id, item, type) {
    const encryptedItem = await crypto.encrypt(this.appKeysPackage.appKey, JSON.stringify(item))
    const typeHash = await crypto.getHash(type, this.appKeysPackage.appSalt)

    item = {
      content: encryptedItem
    }

    if (type) {
      item.content_type = typeHash
    }

    return this.channel.push('update_item', {
      id,
      item
    })
  }

  async delete (id) {
    return this.channel.push('delete_item', {
      id
    })
  }
}

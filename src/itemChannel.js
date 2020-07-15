import { Socket } from 'phoenix'
import userClient from './userClient'
import crypto from './crypto'

export default class {
  constructor () {
    this.bindings = []

    this.email = null
    this.pass = null

    this.params = {
      token: null
    }

    this.accountId = null
    this.appkey = null
    this.appkeySalt = null

    this.socket = new Socket(`${process.env.VUE_APP_WS_URL}/socket`, {
      params: () => this.params
    })

    this.socket.onError((e) => {
      console.log('Socket error!', e)
    })
  }

  async connect (email, pass) {
    this.email = email
    this.pass = pass

    const authResp = await userClient.authenticate(email, pass)

    this.params.token = authResp.token
    this.accountId = authResp.account_id

    this.userKey = await crypto.deriveKey(pass, authResp.appkey_salt)
    this.appKeysPackage = JSON.parse(await crypto.decrypt(this.userKey, authResp.appkey))

    this.socket.connect()

    this.channel = this.socket.channel(`item:${this.accountId}`)

    this.channel.on('all_items', async (data) => {
      const items = await Promise.all(data.items.map(async (item) => {
        item.content = JSON.parse(
          await crypto.decrypt(this.appKeysPackage.appKey, item.content)
        )

        return item
      }))

      this._trigger('all_items', items)
    })

    this.channel.on('add_item', async ({ item }) => {
      item.content = JSON.parse(
        await crypto.decrypt(this.appKeysPackage.appKey, item.content)
      )

      this._trigger('add_item', item)
    })

    this.channel.on('update_item', async ({ item }) => {
      item.content = JSON.parse(
        await crypto.decrypt(this.appKeysPackage.appKey, item.content)
      )

      this._trigger('update_item', item)
    })

    this.channel.on('delete_item', (data) => {
      this._trigger('delete_item', data.id)
    })

    this.channel.join()
      .receive('error', (e) => {
        console.log('Joining went wrong!', e)
      })

    return this.channel
  }

  on (event, callback) {
    this.bindings.push({ event, callback })
  }

  _trigger (event, payload) {
    const eventBindings = this.bindings.filter(bind => bind.event === event)

    for (let i = 0; i < eventBindings.length; i++) {
      const bind = eventBindings[i]

      bind.callback(payload)
    }
  }

  setupChannel () {
    this.channel = this.socket.channel(`item:${this.accountId}`)
    this.channel.on('all_items', (items) => {
      console.log('Receiving all items!', items)
    })
    this.channel.join()
      .receive('ok', (p) => {
        console.log('Joining went well!', p)
      })
  }

  async create (item, type = 'item') {
    const encryptedItem = await crypto.encrypt(this.appKeysPackage.appKey, JSON.stringify(item))
    const typeHash = await crypto.getHash(type, this.appKeysPackage.appSalt)

    const resp = await this.channel.push('add_item', {
      item: {
        content: encryptedItem,
        content_type: typeHash
      }
    })

    switch (resp.event) {
      case 'add_item':
        return resp.payload()
      case 'error':
        throw new Error(resp.payload())
    }
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

# sealjs

JavaScript library for the [Sealax](https://github.com/sealas/sealax) backend.

## User Client

```js
import { userClient } from 'sealjs'

// Request validation token via email
const resp = await userClient.createUserToken(email)

// Create user with email, password and emailed validation token
const user = await userClient.createUser(resp.token, email, pw)

// Request auth token for API requests
const authResp = await userClient.authenticate(email, pw)
```

## Item Channel

```js
import { ItemChannel } from 'sealjs'

const channel = new ItemChannel()

channel.on('all_items', (items) => {
  // Handling all items here!
})

channel.on('add_item', (item) => {
  // Handling single new item
})

channel.on('update_item', (item) => {
  // Handling single updated item
})

channel.on('add_item', (id) => {
  // Handling single deleted item
})

// Connect to backend with user's credentials
await channel.connect(emailFromForm, passFromForm)

try {
  const result = await channel.create({
    new: 'item'
  })

  // handle new item with id: result.id
} catch (e) {
  console.error('Oh no!', e)
}

try {
  const result = await channel.update(ItemID, {
    updated: 'item'
  })

  // handle updated item
} catch (e) {
  console.error('Oh no!', e)
}

try {
  const result = await channel.delete(ItemID)

  // handle deleted item
} catch (e) {
  console.error('Oh no!', e)
}
```

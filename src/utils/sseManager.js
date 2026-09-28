const clients = new Map()


const addClient = (userId, res) => {
  const id = userId.toString()
  if (!clients.has(id)) clients.set(id, new Set())
  clients.get(id).add(res)
  res.on('close', () => {
    removeClient(userId, res)
  })
}


const removeClient = (userId, res) => {
  const id = userId.toString()
  if (clients.has(id)) {
    const userClients = clients.get(id)
    userClients.delete(res)
 
    if (userClients.size === 0) clients.delete(id)
  }
}

const sendToUser = (userId, eventName, data) => {
  const id = userId.toString()
  const userClients = clients.get(id)
  if (!userClients || userClients.size === 0) return
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`
  userClients.forEach(res => {
    res.write(payload)
  })
}

module.exports = { addClient, removeClient, sendToUser }

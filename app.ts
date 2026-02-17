const express = require('express')
const app = express()
const port = 3000

app.get('/', (req: any, res: { send: (arg0: string) => void }) => {
  res.send('Hello World!')
})

app.get('/listItems', (req: any, res: { send: (arg0: string) => void }) => {
  res.send('Hello ' + req.params.name)
})

app.get('/addBalance/:pennies', (req: any, res: { send: (arg0: string) => void }) => {
  res.send('Hello ' + req.params.name)
})

app.get('/purchase/:pennies', (req: any, res: { send: (arg0: string) => void }) => {
  res.send('Hello ' + req.params.name)
})

app.get('/checkBalance', (req: any, res: { send: (arg0: string) => void }) => {
  res.send('Hello ' + req.params.name)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

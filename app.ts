import express, { json } from 'express';

import type { Request, Response } from 'express'; 


const app = express()
const port = 3000
import { validate as uuidValidate } from 'uuid';

import 'dotenv/config'
import { PrismaClient } from "./generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

interface Item {
  id: string;
  name: String;
  price: number;
}

const item1: Item = {
    id: "a5672cc8-d4ec-4e71-8257-0fd8340d8ae7",
    name: "earth",
    price: 2500
};

const item2: Item = {
    id: "47273295-795d-4be1-b595-4094b7a37e17",
    name: "wind",
    price: 1999
};

const item3: Item = {
    id: "a9994fc4-b9f4-4384-b16a-b4bd38bcd9ea",
    name: "fire",
    price: 9999
}

const inventory: Item[] = [item1, item2, item3]

// Middleware to check for 'x-api-key' header
const checkHeader = (req: { header: (arg0: string) => any; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { error: string; }): any; new(): any; }; }; }, next: () => void) => {
  const userId = req.header('x-user-id'); // {Link: Express.js API reference for header checking https://expressjs.com/en/guide/error-handling.html}

  if (!userId) {
    // Fail the request if header is missing
    return res.status(400).json({ error: 'Forbidden: Missing user id' });
  }

  if (!uuidValidate(userId)) {
    return res.status(400).json({ error: 'Forbidden: Invalid user id' });
  }

  // Header is present, proceed
  next();
};

app.get('/', checkHeader, (req: any, res: { send: (arg0: string) => void }) => {
  res.send('Hello World!')
})

app.get('/api/items', checkHeader, (req: any, res: { send: (arg0: string) => void }) => {
  res.json(inventory)
})

app.post('/api/credits/:amount', checkHeader, async (req: any, res: { send: (arg0: string) => void }) => {
    const userId = req.header('x-user-id')
  
    if (!(req.params.amount > 0)) {
        return res.status(400).json({ error: 'Cannot add zero or negative credits'});
    }

    addToLedger(userId, req.params.amount);
    const userBalance = await checkUserBalance(userId);
    res.send(userBalance)
})

app.post('/api/purchases/:item', checkHeader, async (req: any, res: { send: (arg0: string) => void }) => {
    const userId = req.header('x-user-id')
    const searchId = req.params.item
    console.log(searchId)

    const foundItem = inventory.find(item => item.id === searchId);

    const price = foundItem?.price

    console.log(foundItem?.id)
    if (!foundItem) {
    // Fail the request if item does not exist
    return res.status(404).json({ error: 'Forbidden: Invalid item' });
  } else if (await checkUserBalance(userId) < foundItem.price) {
      return res.status(409).json({ error: 'Insufficent balance' });
  } else {
    console.log("heeeeeeeey")
    console.log(userId, foundItem, foundItem.price)
    subtractFromLedger(userId, foundItem.price)
    console.log("we're back")
  }
    // res.status(204)

    res.status(204).send()
})

app.get('/api/balance', checkHeader, async (req: any, res: { send: (arg0: string) => void }) => {
    const userId = req.header('x-user-id')
    res.send(String(await checkUserBalance(userId)))
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

// Handle server shutdown (Ctrl+C, etc.)
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

async function addToLedger(userId: string, amount: number) {

  const ledgerEntry = await prisma.ledgerEntry.create({
    data: {
      amount: Number(amount),
      userId: userId
    },
  })

    console.log(ledgerEntry)

}
async function checkUserBalance(userId: any) {
  const customerBalance = await prisma.ledgerEntry.aggregate({
    where: {
      userId: userId
    },
    _sum: {
      amount: true,
    }
  })

const total = customerBalance._sum.amount || 0;
  return total
}

async function subtractFromLedger(userId: string, amount: number) {
  console.log("We are in the ledger!")
  const debit = -1 * (amount)
  console.log(debit)
  const ledgerEntry = await prisma.ledgerEntry.create({
    data: {
      amount: debit,
      userId: userId
    },
  })

  console.log(ledgerEntry)
}


import express, { json } from 'express';
// import type { Request, Response } from 'express'; 
import { validate as uuidValidate } from 'uuid';
import 'dotenv/config'
import { Prisma, PrismaClient } from "./generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
// import e from 'express';

const app = express()
const port = 3000

app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
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

// For this project, instead of a db, hardcode items.
const inventory: Item[] = [item1, item2, item3]

// Middleware to check for 'x-user-id' header
const checkHeader = (req: { header: (arg0: string) => any; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { error: string; }): any; new(): any; }; }; }, next: () => void) => {
  const userId = req.header('x-user-id'); // {Link: Express.js API reference for header checking https://expressjs.com/en/guide/error-handling.html}

  // Fail the request if userId is missing or not a UUID
  if (!userId) {
    return res.status(400).json({ error: 'Forbidden: Missing user id' });
  } else if (!uuidValidate(userId)) {
    return res.status(400).json({ error: 'Forbidden: Invalid user id' });
  }

  // Header is present, proceed
  next();
};

app.get('/api/items', (req: any, res: { send: (arg0: string) => void }) => {
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

app.post('/api/purchases', checkHeader, async (req: any, res: { send: (arg0: string) => void }) => {
    const userId = req.header('x-user-id')
    const searchId = req.body.itemId
    const foundItem = inventory.find(item => item.id === searchId);

    if (!foundItem) {
    // Fail the request if item does not exist
    return res.status(404).json({ error: 'Forbidden: Invalid item' });
  } else if (await checkUserBalance(userId) < foundItem.price) {
      return res.status(409).json({ error: 'Insufficent balance' });
  } else {
    subtractFromLedger(userId, foundItem.price)
  }
    res.status(204).send()
})

app.get('/api/balance', checkHeader, async (req: any, res: { send: (arg0: string) => void }) => {
    const userId = req.header('x-user-id')
    res.send(String(await checkUserBalance(userId)))
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

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
  try {

    // Use $transaction to ensure the lock and the create stay in the same session
    return await prisma.$transaction(async (tx) => {
      // 1. Set a local timeout for THIS transaction only (e.g., 10 seconds)
      await tx.$executeRaw`SET LOCAL lock_timeout = '10s'`;
      
      // 2. Acquire the lock (will hold until the transaction ends)
      await tx.$executeRaw`LOCK TABLE "LedgerEntry" IN ACCESS EXCLUSIVE MODE`;

      const debit = -1 * (amount)
      // 3. Do the transaction.
      const ledgerEntry = await prisma.ledgerEntry.create({
        data: {
          // here the exact purchase price is recorded, as a standalone value
          // not a reference to a separate Item which could change in the future.
          amount: debit,
          userId: userId
        },
      })

    console.log(ledgerEntry)
    console.log("Successful purchase")
    }), 
    {
      timeout: 20000 // Total transaction timeout
    }
  } catch (error) {
    // 3. Catch and log the specific lock failure
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Postgres error code '55P03' means "lock_not_available" or timeout
      if (error.message.includes("55P03")) {
        console.error("This table is locked")      
      } else {
        console.error("Other Prisma error:", error.message)
      }
    } else {
      console.error(error)
    }
  }
}


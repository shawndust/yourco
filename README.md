# Ledger Backend

This project is a simple backend service to track user purchases.  Queries can include debits (for items purchased), balance check, adding credits, and listing available items.

Users are not allowed to have a negative balance.  So purchases that would take their balance below zero are declined.

The stack is NodeJS in Typescript, ExpressJS, and PostgreSQL with Prisma ORM for the datastore.

## Installation

First, clone the git repository:

````bash
git clone https://github.com/shawndust/yourco
````

Next, install packages.

````bash
cd yourco
npm install
````

Then, migrate the database:

````bash
# Run this in your terminal to migrate your database
npx prisma migrate dev --name init

# Run this in your terminal to generate your Prisma Client
npx prisma generate
````

Finally, run the app:

````bash
node app.ts 
````
# Ledger-based balance
Transactions are stored in the LedgerEntry table.  No balance is stored separately.  It is calculated at the time of the request.

## Concurrency-Safe

To maintain concurrency safety we lock the LedgerEntry table during a transaction.  This prevents two different requests from being fulfilled at once and bringing a given customer's balance below zero.  With a users table, we would be able to lock just that user.

# Price changes over time
When a LedgerEntry is created, it records the price of the purchased item at the time of purchase, not as a reference to some of the db row/table.  For now, it doesn't seem necessary to record the Item id as we do not use it.

# Indexes
To speed up read or write transactions indexes have been created.

Item Prices
  @@index([price])
• Supports future price queries (for example, all items priced at 500 cents)
• If Item price updates are infrequent relative to price lookups (for example, 1000 < price < 500 queries) then this index is ideal.  This pre-sorts the items by price in the index so lookups are much quicker.
• Though, every time an Item is added or an Item price is changed the index needs to be re-calculated.

Ledger Entries

  @@index([userId, amount])
• Supports quick ledger lookups with index-only scans.
• Can slow down writes.   

  @@index([userId, amount])
• Supports quick purchase history lookups.
• Also can slow down writes.

<!-- Depending on the storage involced, we could simplify these two to a composite index: @@index([userId, createdAt, amount]) and speed up writes. -->

# Idempotency 

The below is written for a future idempotency check:

Imagine POST /api/purchases supports:
Header: x-idempotency-key: <string>

The idempotency key could be added to table called IdempotencyKeys along with userId and createdAt.  Before finalizing a purchase, the code would check whether a record already exists in the IdempotencyKeys table with that key.  If not, the transaction proceeds.  If so, it fails.  This prevents the same transaction from being double-run.  Periodically, every few hours or days, the table should be cleared to prevent it from growing too large.
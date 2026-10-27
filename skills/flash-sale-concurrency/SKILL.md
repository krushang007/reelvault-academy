---
name: flash-sale-concurrency
description: High-concurrency inventory reservation and distributed lock architecture for zero-overselling. Use when designing flash sales, ticketing systems, inventory drops, booking engines, or handling race conditions during high-volume checkout spikes.
---

# High-Concurrency Flash Sale Architecture (Zero Overselling)

This skill provides the distributed architecture, Redis Lua scripts, and asynchronous event pipelines required to process extreme traffic spikes (e.g. 1.5M requests/sec) against relational database write limits (~2,000 writes/sec) with zero overselling.

---

## 1. The Core Failure Mode: Naive SQL Race Conditions

In standard e-commerce applications, inventory verification follows a naive read-then-write pattern:
```sql
-- Step 1: Read stock
SELECT stock FROM inventory WHERE product_id = 'item_101';

-- Step 2: Application checks if stock > 0, then issues decrement
UPDATE inventory SET stock = stock - 1 WHERE product_id = 'item_101';
```

When 1 item remains in stock and 500 users click "Buy" at the exact same millisecond ($T=0.001\text{s}$), all 500 concurrent threads read `stock = 1` before any thread commits its update. All 500 proceed to decrement, resulting in negative inventory (`stock = -499`) and overselling.

---

## 2. The 5-Tier Zero-Overselling Architecture

```
[1.5M Users]
     │
     ▼
[Tier 1: Global Edge CDN (Cloudflare/Fastly)] ── Drops static asset traffic
     │
     ▼
[Tier 2: Virtual Waiting Room (Token Gate)] ── Limits ingress to 2,500 req/sec
     │
     ▼
[Tier 3: Atomic Redis Lua Reservation] ── Evaluates stock in RAM (<1ms)
     │
     ├─ Sold Out (Stock = 0) ──▶ Instant Reject ("Out of Stock")
     │
     └─ Success (Stock > 0) ──▶ Decrement counter & grant 10-minute lease
                                          │
                                          ▼
[Tier 4: Asynchronous Kafka Queue] ── Smooths writes to DB at 500 writes/sec
                                          │
                                          ▼
[Tier 5: Relational DB + 10-min Lease Worker] ── Reconciles payments & rollbacks
```

---

## 3. Atomic Redis Lua Reservation Script

Redis operates on a single-threaded execution model for command execution. Combining stock inspection and decrement into an embedded Lua script guarantees **strict atomic execution with zero race conditions**:

```lua
-- atomic_reserve.lua
-- KEYS[1]: Inventory key (e.g., "inventory:item_101")
-- ARGV[1]: Quantity requested (e.g., 1)
-- ARGV[2]: User reservation set key (e.g., "reserved:item_101")
-- ARGV[3]: User ID

local stock_key = KEYS[1]
local reserved_set = ARGV[2]
local user_id = ARGV[3]
local qty = tonumber(ARGV[1])

-- Check if user has already reserved to prevent double dipping
if redis.call('SISMEMBER', reserved_set, user_id) == 1 then
    return -1 -- Error: User already has active reservation
end

local current_stock = tonumber(redis.call('GET', stock_key) or 0)

if current_stock >= qty then
    -- Atomically decrement stock
    redis.call('DECRBY', stock_key, qty)
    -- Track reservation
    redis.call('SADD', reserved_set, user_id)
    return 1 -- Success: Reservation locked
else
    return 0 -- Sold out / Insufficient stock
end
```

### Node.js / TypeScript Integration:

```typescript
import Redis from 'ioredis';
import fs from 'fs';

const redis = new Redis(process.env.REDIS_URL);
const luaScript = fs.readFileSync('./atomic_reserve.lua', 'utf8');

export async function attemptInventoryLock(productId: string, userId: string, quantity = 1): Promise<{ success: boolean; code: string }> {
  const stockKey = `inventory:${productId}`;
  const reservedSetKey = `reserved:${productId}`;

  // Execute atomic Lua script
  const result = await redis.eval(
    luaScript,
    1, // Number of keys
    stockKey,
    quantity,
    reservedSetKey,
    userId
  ) as number;

  if (result === 1) {
    return { success: true, code: 'RESERVED' };
  } else if (result === -1) {
    return { success: false, code: 'ALREADY_RESERVED' };
  } else {
    return { success: false, code: 'OUT_OF_STOCK' };
  }
}
```

---

## 4. 10-Minute Payment Lease & Compensating Rollback

A reservation is a temporary lock, not a final completed purchase:
1. **Grant Temporary Lease:** When `attemptInventoryLock()` succeeds, a reservation record is created with `expires_at = now() + 10 minutes`.
2. **Success Path (Payment Confirmed):** Payment webhook (Stripe/Razorpay) confirms settlement. Order status transitions to `CONFIRMED`.
3. **Failure Path (Abandonment / Payment Decline):**
   - If the user leaves the checkout flow or payment fails after 10 minutes, a scheduled reconciler worker executes a **compensating transaction**:
   ```typescript
   // Release stock back to live pool
   await redis.multi()
     .incrby(`inventory:${productId}`, quantity)
     .srem(`reserved:${productId}`, userId)
     .exec();
   ```
   - Stock returns immediately to the pool for waiting customers.

---

## 5. Architectural Invariants (Never Violate)

1. **Never query SQL for live stock during a flash sale.** All real-time inventory checks belong strictly in Redis memory.
2. **Never execute read-then-write logic in application code.** Stock decrements must be atomic Lua or single atomic SQL expressions.
3. **Always throttle ingress with a token bucket/virtual waiting room.** Do not expose the internal API gateway to unbounded concurrent traffic.
4. **Decouple checkout writes using a message broker (Kafka/RabbitMQ).** Smooth database writes to match database hardware capabilities.

# 05 — Razorpay Payment Gateway Integration Specification

**Project:** Help A Mission Welfare Society — Backend API  
**Provider:** Razorpay  
**Currency:** INR (Amounts represented in paise integer minor units)  

---

## 1. End-to-End Payment Flow

```mermaid
sequenceDiagram
    participant Visitor as Visitor / React Frontend
    participant API as Express API Server
    participant DB as PostgreSQL Database
    participant RZP as Razorpay API / Webhooks

    Visitor->>API: POST /donations/order (Amount, Donor Info, Idempotency-Key)
    API->>API: Validate input & verify amount limits
    API->>RZP: razorpay.orders.create({ amount, currency: 'INR', receipt })
    RZP-->>API: Returns Razorpay Order ID (order_12345)
    API->>DB: INSERT INTO donations (status: 'order_created', razorpay_order_id)
    API-->>Visitor: Return { donationId, razorpayOrderId, keyId }

    Visitor->>RZP: Open Razorpay Checkout modal & complete payment
    RZP-->>Visitor: Returns client payment response (razorpay_payment_id, signature)
    Visitor->>API: GET /donations/:id/status (Poll status)

    RZP->>API: POST /webhooks/razorpay (Raw body + X-Razorpay-Signature)
    API->>API: Compute HMAC SHA256 against raw request body
    alt Signature Valid & Event New
        API->>DB: BEGIN TRANSACTION
        API->>DB: INSERT INTO payment_webhook_events (provider_event_id, status: 'processed')
        API->>DB: UPDATE donations SET status='captured', paid_at=NOW(), razorpay_payment_id=...
        API->>DB: UPSERT user record in users table
        API->>DB: INSERT INTO jobs (job_type: 'generate_receipt')
        API->>DB: COMMIT TRANSACTION
        API-->>RZP: HTTP 200 OK
    else Duplicate Event ID
        API-->>RZP: HTTP 200 OK (Skipped deduplicated event)
    else Invalid Signature
        API-->>RZP: HTTP 400 Bad Request
    end
```

---

## 2. Idempotency & Raw-Body Webhook Verification

### 2.1 Order Creation Idempotency
Clients **must** pass an `Idempotency-Key` UUID header when calling `POST /api/v1/donations/order`. If a request with the same key is received within 24 hours, the backend returns the existing donation order record without creating a duplicate order on Razorpay.

### 2.2 Raw-Body Webhook Signature Verification
Express route parsing for `/api/v1/webhooks/razorpay` uses `express.raw({ type: 'application/json' })` so that the exact byte stream received from Razorpay is preserved for HMAC verification.

```javascript
import crypto from 'node:crypto';

export function verifyRazorpaySignature(rawBodyBuffer, signature, webhookSecret) {
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBodyBuffer)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'utf8'),
    Buffer.from(expectedSignature, 'utf8')
  );
}
```

---

## 3. Account Provisioning from Successful Payment

When a verified webhook event `payment.captured` or `order.paid` is processed:

1. **Transaction Boundary:** Execute inside a single SQL transaction (`BEGIN ... COMMIT`).
2. **Donor Lookup/Upsert:** Match donor by `email_normalized`.
   - If donor exists: Update `last_donation_at` and increment donation stats.
   - If donor does not exist: Create new donor in `users` with `created_source = 'donation'`, generate random verification token, and queue activation email.
3. **Donation Linking:** Set `donations.user_id = user.id` and mark `status = 'captured'`.
4. **Receipt Generation:** Insert a job into `jobs` table with `job_type = 'send_donation_receipt'`.

---

## 4. Payment Reconciliation Job

A scheduled worker (`dist/jobs/reconcile-razorpay.js`) runs daily via cPanel Cron to identify pending/unconfirmed donations older than 30 minutes:

```sql
SELECT * FROM donations 
WHERE status = 'order_created' 
  AND created_at < NOW() - INTERVAL '30 minutes'
  AND created_at > NOW() - INTERVAL '7 days';
```

For each pending order, the worker queries Razorpay API `orders.fetchPayments(order_id)`:
- If payment is `captured`: Triggers server-side payment capture logic.
- If payment is `failed` or `expired`: Updates donation `status = 'failed'`.

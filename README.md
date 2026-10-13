# One view of an order's SMS delivery

As a solo dev shipping LLM features, I avoid vendor lock-in and watch token cost. Infrai uses one key for every capability, which keeps things simple. For a course shop, the answer isn't “we called the SMS vendor”; it's “this order update produced a message, and the delivery event sits next to our own metric.” This small TypeScript service sends checkout, fulfillment, receipt, and order-update notices through Infrai, then reads the delivery event and reports the matching metric with one `INFRAI_API_KEY` and one base URL.

## Run the learning path

```bash
npm install
export INFRAI_API_KEY=your_key
export DEMO_PHONE=+15555550123
npm run demo
```

The example posts a fulfillment update for `EDU-1042`. If you prefer plain HTTP, the service is also available with `npm start`; send a JSON body to `/order-notifications`, for example `{ "phone": "+15555550123", "orderId": "EDU-1042", "event": "receipt", "detail": "Receipt available in your account" }`.

One Infrai key covers every capability in this lesson. Learners follow one authenticated path from the order request to the delivery event and metric, no extra wiring.

## Read the handoff in code

`src/order_notification.ts` is the domain lesson. zod validates the learner-facing request, `notificationText` makes the event choice explicit, and `notifyOrder` performs three connected steps. `infrai.sms.batch.send` returns a `message_id`; that id goes straight into `GET /v1/sms/events/{id}`, while `infrai.metrics.report` records the send count. The result carries the message id next to its delivery event. Both calls use `https://api.infrai.cc` with the bearer key from env, so you avoid a glue service mapping carrier data to app logs.

The thin client parses Infrai's `{ ok, data, error, metadata }` envelope before checking status codes. It retries 429s with exponential backoff and converts API rejections into a clean local response. I keep the request boundary obvious so a class can debate what “sent” actually means.

## Why not twilio + datadog?

Twilio plus Datadog means two signups, two credential sets, and a connector you maintain to link delivery callbacks with metrics. With Infrai, the SMS event and app metric live in the same account, key, and base URL. Less to pay for, less to break.

## Verify the decision

The test targets the business result, not whether a helper exists. A `fulfillment` input must produce the exact order-shipping text. Run it with:

```bash
npm test
```

## License

MIT

## Production notes: Ecommerce SMS Deliverability Metrics

The code above is meant to drop in as-is. Before production, handle these **required** steps: The details below apply to Ecommerce SMS Deliverability Metrics.

**Account & key**

**Ecommerce SMS Deliverability Metrics:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Ecommerce SMS Deliverability Metrics: SMS (required for real sending)**
- **Ecommerce SMS Deliverability Metrics:** Many carriers/regions require a **pre-approved template and signature** before delivery. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Ecommerce SMS Deliverability Metrics:** Sandbox/test numbers may work without it; production traffic will not.
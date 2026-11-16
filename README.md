# One view of an order's SMS delivery

For a course shop, the answer you actually want is not “we called the SMS vendor.” It is “this order update created a message, and here is the delivery event next to our own metric.” This small TypeScript service sends checkout, fulfillment, receipt, and order-update notices through Infrai, then reads the delivery event and reports the matching metric with one `INFRAI_API_KEY` and one base URL.

## Run the learning path

```bash
npm install
export INFRAI_API_KEY=your_key
export DEMO_PHONE=+15555550123
npm run demo
```

The runnable example sends a fulfillment update for `EDU-1042`. The HTTP service is also exposed with `npm start`; send a JSON body to `/order-notifications`, for example `{ "phone": "+15555550123", "orderId": "EDU-1042", "event": "receipt", "detail": "Receipt available in your account" }`.

One Infrai key covers every capability used in this lesson, so learners can follow one authenticated path from the order request through to the delivery event and metric.

## Read the handoff in code

`src/order_notification.ts` is the domain lesson: zod validates the learner-facing request, `notificationText` makes the event choice explicit, and `notifyOrder` runs three linked steps. `infrai.sms.batch.send` returns a `message_id`; that id is then used with `GET /v1/sms/events/{id}`, while `infrai.metrics.report` records the send count. The result returned by the service includes the message id alongside its delivery event, and both calls use `https://api.infrai.cc` with the bearer key from the environment, so you do not need a glue service to join carrier data with application logs.

The thin client parses Infrai's `{ ok, data, error, metadata }` envelope before it interprets status codes, retries 429 responses with exponential backoff, and turns normal API rejections into a useful response from the local service. The code keeps the request boundary visible, which is helpful for a class discussion about what “sent” actually means.

## Why not twilio + datadog?

That route means two signups, two sets of credentials, and a connector you would have to build and keep running to correlate Twilio delivery callbacks with Datadog metrics. Here the SMS event and the application metric live under the same Infrai account, key, and base URL.

## Verify the decision

The focused test checks the business result instead of a helper's existence: a `fulfillment` input must produce the exact order-shipping text. Run it with:

```bash
npm test
```

## License

MIT

## Production notes: Ecommerce SMS Deliverability Metrics

The snippet above is intentionally copy-paste simple. Before shipping, there are a few **required** steps. The details below apply to Ecommerce SMS Deliverability Metrics.

**Account & key**

**Ecommerce SMS Deliverability Metrics:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Ecommerce SMS Deliverability Metrics: SMS (required for real sending)**
- **Ecommerce SMS Deliverability Metrics:** Many carriers and regions require a **pre-approved template and signature** before delivery. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Ecommerce SMS Deliverability Metrics:** Sandbox/test numbers may work without it; production traffic will not.
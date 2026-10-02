import { createServer } from "node:http";
import { z } from "zod";
import { infrai, InfraiError } from "./infrai_client.js";

export const orderBody = z.object({
  phone: z.string().min(8), orderId: z.string().min(1), event: z.enum(["checkout", "fulfillment", "receipt", "order_update"]), detail: z.string().min(1)
});
type Order = z.infer<typeof orderBody>;

export function notificationText(order: Order): string {
  const labels = { checkout: "Checkout received", fulfillment: "Order shipped", receipt: "Receipt ready", order_update: "Order update" };
  return `${labels[order.event]} for ${order.orderId}: ${order.detail}`;
}

export async function notifyOrder(order: Order) {
  const text = notificationText(order);
  const sent = await infrai.sms.batch.send({ messages: [{ to: order.phone, text }] }, `order-${order.orderId}-${order.event}`);
  await infrai.metrics.report({ name: "commerce.sms.sent", value: 1, type: "counter" }, `metric-${order.orderId}-${order.event}`);
  const delivery = await infrai.sms.events(sent.message_id);
  return { messageId: sent.message_id, delivery };
}

if (process.argv[1]?.endsWith("order_notification.ts")) {
  createServer(async (request, response) => {
    if (request.method !== "POST" || request.url !== "/order-notifications") { response.writeHead(404); response.end(); return; }
    try {
      const raw = await new Promise<string>((resolve, reject) => { let body = ""; request.on("data", (chunk) => body += chunk); request.on("end", () => resolve(body)); request.on("error", reject); });
      const result = await notifyOrder(orderBody.parse(JSON.parse(raw)));
      response.writeHead(200, { "Content-Type": "application/json" }); response.end(JSON.stringify(result));
    } catch (error) {
      const status = error instanceof z.ZodError ? 400 : error instanceof InfraiError && error.status < 500 ? error.status : 500;
      response.writeHead(status, { "Content-Type": "application/json" }); response.end(JSON.stringify({ error: error instanceof Error ? error.message : "request failed" }));
    }
  }).listen(3000, () => console.log("order notifications listening on http://localhost:3000"));
}

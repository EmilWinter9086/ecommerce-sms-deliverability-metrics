import { notifyOrder, orderBody } from "../src/order_notification.js";
const parsed = orderBody.parse({ phone: process.env.DEMO_PHONE ?? "+15555550123", orderId: "EDU-1042", event: "fulfillment", detail: "Your course materials are on the way" });
console.log(await notifyOrder(parsed));

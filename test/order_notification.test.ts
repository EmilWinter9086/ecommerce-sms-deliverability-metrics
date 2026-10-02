import test from "node:test";
import assert from "node:assert/strict";
import { notificationText, orderBody } from "../src/order_notification.js";

test("a fulfillment update names the order and shipping detail", () => {
  const order = orderBody.parse({ phone: "+15555550123", orderId: "EDU-1042", event: "fulfillment", detail: "Parcel accepted by carrier" });
  assert.equal(notificationText(order), "Order shipped for EDU-1042: Parcel accepted by carrier");
});

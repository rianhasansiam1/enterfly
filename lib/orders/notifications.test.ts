import { describe, expect, it } from "vitest";

import { buildOrderStatusNotification } from "./notifications";

describe("buildOrderStatusNotification", () => {
  const base = {
    orderNumber: "ORD-26-000001",
    customerName: "Ayesha",
    customerEmail: "ayesha@example.com",
    customerPhone: "01700000000",
  };

  it("prefers email when an email is present", () => {
    const n = buildOrderStatusNotification({ ...base, status: "IN_TRANSIT" });
    expect(n.channel).toBe("email");
    expect(n.to).toBe("ayesha@example.com");
  });

  it("falls back to SMS when only a phone is present", () => {
    const n = buildOrderStatusNotification({
      ...base,
      customerEmail: null,
      status: "OUT_FOR_DELIVERY",
    });
    expect(n.channel).toBe("sms");
    expect(n.to).toBe("01700000000");
  });

  it("falls back to a server log when no contact details exist", () => {
    const n = buildOrderStatusNotification({
      ...base,
      customerEmail: null,
      customerPhone: null,
      status: "DELIVERED",
    });
    expect(n.channel).toBe("log");
    expect(n.to).toBeNull();
  });

  it("includes the order number and human label in the subject", () => {
    const n = buildOrderStatusNotification({ ...base, status: "DELIVERED" });
    expect(n.subject).toContain("ORD-26-000001");
    expect(n.subject).toContain("Delivered");
  });

  it("greets the customer by name in the message body", () => {
    const n = buildOrderStatusNotification({ ...base, status: "PACKED" });
    expect(n.message).toContain("Ayesha");
    expect(n.message).toContain("Packed");
  });

  it("uses a neutral greeting when the name is blank", () => {
    const n = buildOrderStatusNotification({
      ...base,
      customerName: "   ",
      status: "PACKED",
    });
    expect(n.message).toContain("Hi there,");
  });
});

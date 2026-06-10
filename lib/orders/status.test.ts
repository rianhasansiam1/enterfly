import { describe, expect, it } from "vitest";

import {
  CUSTOMER_CANCELLABLE_STATUSES,
  ORDER_STATUSES,
  ORDER_STATUS_META,
  ORDER_TRACKING_STEPS,
  STATUS_TRANSITIONS,
  canTransition,
  isOrderStatus,
  isTerminalStatus,
  trackingStepIndex,
  type OrderStatus,
} from "./status";

describe("order status — data integrity", () => {
  it("defines transitions and metadata for every status", () => {
    for (const status of ORDER_STATUSES) {
      expect(STATUS_TRANSITIONS[status]).toBeDefined();
      expect(ORDER_STATUS_META[status]).toBeDefined();
      expect(ORDER_STATUS_META[status].label).toBeTruthy();
    }
  });

  it("only transitions to known statuses", () => {
    for (const targets of Object.values(STATUS_TRANSITIONS)) {
      for (const target of targets) {
        expect(ORDER_STATUSES).toContain(target);
      }
    }
  });

  it("keeps the tracking rail as a subset of all statuses", () => {
    for (const step of ORDER_TRACKING_STEPS) {
      expect(ORDER_STATUSES).toContain(step);
    }
  });
});

describe("canTransition — happy path", () => {
  const path: OrderStatus[] = [
    "PENDING",
    "PAYMENT_CONFIRMED",
    "SELLER_TO_PACK",
    "PACKED",
    "READY_TO_SHIP",
    "WAREHOUSE",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
  ];

  it("allows advancing one step at a time", () => {
    for (let i = 0; i < path.length - 1; i += 1) {
      expect(canTransition(path[i], path[i + 1])).toBe(true);
    }
  });

  it("rejects skipping steps", () => {
    expect(canTransition("PENDING", "DELIVERED")).toBe(false);
    expect(canTransition("PENDING", "PACKED")).toBe(false);
    expect(canTransition("PAYMENT_CONFIRMED", "IN_TRANSIT")).toBe(false);
  });

  it("rejects moving backwards", () => {
    expect(canTransition("PACKED", "PENDING")).toBe(false);
    expect(canTransition("IN_TRANSIT", "WAREHOUSE")).toBe(false);
  });
});

describe("canTransition — cancellation rules", () => {
  it("allows cancelling any pre-delivery state", () => {
    const preDelivery: OrderStatus[] = [
      "PENDING",
      "PAYMENT_CONFIRMED",
      "SELLER_TO_PACK",
      "PACKED",
      "READY_TO_SHIP",
      "WAREHOUSE",
      "IN_TRANSIT",
      "OUT_FOR_DELIVERY",
    ];
    for (const status of preDelivery) {
      expect(canTransition(status, "CANCELLED")).toBe(true);
    }
  });

  it("does not allow cancelling once delivered", () => {
    expect(canTransition("DELIVERED", "CANCELLED")).toBe(false);
  });
});

describe("canTransition — return / refund flow", () => {
  it("requires DELIVERED before a return", () => {
    expect(canTransition("DELIVERED", "RETURN_REQUESTED")).toBe(true);
    expect(canTransition("IN_TRANSIT", "RETURN_REQUESTED")).toBe(false);
    expect(canTransition("PENDING", "RETURN_REQUESTED")).toBe(false);
  });

  it("requires RETURN_REQUESTED before RETURNED", () => {
    expect(canTransition("RETURN_REQUESTED", "RETURNED")).toBe(true);
    expect(canTransition("DELIVERED", "RETURNED")).toBe(false);
  });

  it("requires RETURNED before REFUNDED", () => {
    expect(canTransition("RETURNED", "REFUNDED")).toBe(true);
    expect(canTransition("RETURN_REQUESTED", "REFUNDED")).toBe(false);
  });
});

describe("terminal states", () => {
  it("treats CANCELLED and REFUNDED as terminal", () => {
    expect(isTerminalStatus("CANCELLED")).toBe(true);
    expect(isTerminalStatus("REFUNDED")).toBe(true);
  });

  it("treats live states as non-terminal", () => {
    expect(isTerminalStatus("PENDING")).toBe(false);
    expect(isTerminalStatus("DELIVERED")).toBe(false);
    expect(isTerminalStatus("RETURNED")).toBe(false);
  });
});

describe("helpers", () => {
  it("validates status strings", () => {
    expect(isOrderStatus("PENDING")).toBe(true);
    expect(isOrderStatus("IN_TRANSIT")).toBe(true);
    expect(isOrderStatus("SHIPPED")).toBe(false); // legacy value, removed
    expect(isOrderStatus(42)).toBe(false);
  });

  it("locates statuses on the tracking rail", () => {
    expect(trackingStepIndex("PENDING")).toBe(0);
    expect(trackingStepIndex("DELIVERED")).toBe(ORDER_TRACKING_STEPS.length - 1);
    expect(trackingStepIndex("CANCELLED")).toBe(-1);
    expect(trackingStepIndex("REFUNDED")).toBe(-1);
  });

  it("only marks pre-shipment states as customer-cancellable", () => {
    expect(CUSTOMER_CANCELLABLE_STATUSES).toContain("PENDING");
    expect(CUSTOMER_CANCELLABLE_STATUSES).not.toContain("IN_TRANSIT");
    expect(CUSTOMER_CANCELLABLE_STATUSES).not.toContain("DELIVERED");
  });
});

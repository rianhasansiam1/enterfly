import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import type { OrderDetail } from "@/features/orders/api";

/**
 * Builds a downloadable order invoice / receipt PDF.
 *
 * Generation runs entirely in the browser (jsPDF + jspdf-autotable)
 * so we don't need a headless browser on the server. The same
 * `OrderDetail` payload that the page renders on screen is the
 * source of truth here, which keeps the visible receipt and the
 * downloaded PDF in lockstep.
 */

const COLORS = {
  brandFrom: [124, 58, 237] as [number, number, number], // violet-600
  brandTo: [79, 70, 229] as [number, number, number], // indigo-600
  text: [33, 37, 41] as [number, number, number],
  muted: [108, 117, 125] as [number, number, number],
  divider: [233, 213, 255] as [number, number, number], // violet-200
};

const PAGE_MARGIN = 14;

const STORE_INFO = {
  name: "EnterFly",
  tagline: "Local Marketplace · enterfly26@gmail.com",
  address: "Mirpur, Dhaka, Bangladesh",
  email: "enterfly26@gmail.com",
};

type Doc = jsPDF;

function formatBdt(value: number): string {
  return `BDT ${value.toLocaleString()}`;
}

function formatDateTime(value: string): string {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function getNextY(doc: Doc, fallback: number): number {
  const last = (doc as unknown as { lastAutoTable?: { finalY: number } })
    .lastAutoTable;
  return (last?.finalY ?? fallback) + 8;
}

function drawHeader(doc: Doc, order: OrderDetail) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...COLORS.brandFrom);
  doc.rect(0, 0, pageWidth, 26, "F");

  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(STORE_INFO.name, PAGE_MARGIN, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(STORE_INFO.tagline, PAGE_MARGIN, 18);

  doc.setFontSize(9);
  doc.text(
    `Generated: ${new Date().toLocaleString()}`,
    pageWidth - PAGE_MARGIN,
    18,
    { align: "right" },
  );

  doc.setTextColor(...COLORS.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Order Receipt", PAGE_MARGIN, 40);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.muted);
  doc.text(`Order #${order.orderNumber}`, PAGE_MARGIN, 47);
  doc.text(`Placed on ${formatDateTime(order.createdAt)}`, PAGE_MARGIN, 53);

  doc.setDrawColor(...COLORS.divider);
  doc.setLineWidth(0.4);
  doc.line(PAGE_MARGIN, 58, pageWidth - PAGE_MARGIN, 58);
}

function drawTwoColumnTable(
  doc: Doc,
  startY: number,
  title: string,
  rows: Array<[string, string]>,
): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.brandTo);
  doc.text(title, PAGE_MARGIN, startY);

  autoTable(doc, {
    startY: startY + 3,
    body: rows,
    theme: "plain",
    styles: {
      fontSize: 9.5,
      cellPadding: { top: 1.4, right: 2, bottom: 1.4, left: 0 },
      textColor: COLORS.text,
    },
    columnStyles: {
      0: { cellWidth: 38, fontStyle: "bold", textColor: COLORS.muted },
      1: { cellWidth: "auto" },
    },
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
  });

  return getNextY(doc, startY);
}

function drawItemsTable(doc: Doc, startY: number, order: OrderDetail): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.brandTo);
  doc.text("Items", PAGE_MARGIN, startY);

  autoTable(doc, {
    startY: startY + 3,
    head: [["Product", "Qty", "Unit", "Line total"]],
    body: order.items.map((item) => {
      const variantParts = [item.color, item.size].filter(Boolean);
      const productCell = variantParts.length > 0
        ? `${item.productName}\n(${variantParts.join(" / ")})`
        : item.productName;
      return [
        productCell,
        String(item.quantity),
        formatBdt(item.unitPrice),
        formatBdt(item.totalPrice),
      ];
    }),
    theme: "striped",
    headStyles: {
      fillColor: COLORS.brandFrom,
      textColor: 255,
      fontStyle: "bold",
    },
    bodyStyles: { textColor: COLORS.text },
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 18, halign: "right" },
      2: { cellWidth: 32, halign: "right" },
      3: { cellWidth: 38, halign: "right" },
    },
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
  });

  return getNextY(doc, startY);
}

function drawTotals(doc: Doc, startY: number, order: OrderDetail): number {
  const rows: Array<[string, string]> = [
    ["Subtotal", formatBdt(order.subtotal)],
  ];
  if (order.discountAmount > 0) {
    const promoLabel = order.promoCode
      ? `Discount (${order.promoCode})`
      : "Discount";
    rows.push([promoLabel, `-${formatBdt(order.discountAmount)}`]);
  }
  rows.push([
    "Delivery charge",
    order.deliveryCharge === 0 ? "FREE" : formatBdt(order.deliveryCharge),
  ]);
  if (order.taxAmount > 0) {
    rows.push(["Tax", formatBdt(order.taxAmount)]);
  }
  rows.push(["Grand total", formatBdt(order.totalAmount)]);

  autoTable(doc, {
    startY,
    body: rows,
    theme: "plain",
    styles: {
      fontSize: 10.5,
      cellPadding: { top: 1.6, right: 2, bottom: 1.6, left: 0 },
      textColor: COLORS.text,
    },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: "bold", textColor: COLORS.muted },
      1: { cellWidth: "auto", halign: "right" },
    },
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    didParseCell: (data) => {
      if (data.row.index === rows.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = COLORS.brandTo;
        data.cell.styles.fontSize = 12;
      }
    },
  });

  return getNextY(doc, startY);
}

function drawFooter(doc: Doc) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(
      `Thank you for shopping with ${STORE_INFO.name}.`,
      PAGE_MARGIN,
      pageHeight - 8,
    );
    doc.text(
      `Page ${page} of ${pageCount}`,
      pageWidth - PAGE_MARGIN,
      pageHeight - 8,
      { align: "right" },
    );
  }
}

export function generateOrderPdf(order: OrderDetail): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  drawHeader(doc, order);

  let y = 66;

  // Two side-by-side info blocks: store + customer.
  const pageWidth = doc.internal.pageSize.getWidth();
  const half = (pageWidth - PAGE_MARGIN * 2) / 2;

  // Left column: store info (re-rendered below the header so it shows on the receipt).
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.brandTo);
  doc.text("From", PAGE_MARGIN, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...COLORS.text);
  doc.text(STORE_INFO.name, PAGE_MARGIN, y + 6);
  doc.setTextColor(...COLORS.muted);
  doc.text(STORE_INFO.address, PAGE_MARGIN, y + 11);
  doc.text(STORE_INFO.email, PAGE_MARGIN, y + 16);

  // Right column: customer info.
  const rightX = PAGE_MARGIN + half + 4;
  const billToWidth = pageWidth - rightX - PAGE_MARGIN;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.brandTo);
  doc.text("Bill to", rightX, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  const lineHeight = 5;

  const writeBillToLine = (
    text: string,
    color: [number, number, number],
  ): void => {
    if (!text) return;
    doc.setTextColor(...color);
    const wrapped = doc.splitTextToSize(text, billToWidth) as string[];
    doc.text(wrapped, rightX, customerY);
    // Advance by the actual number of rendered lines so wrapped text
    // (long addresses, long emails) doesn't paint on top of itself.
    customerY += wrapped.length * lineHeight;
  };

  let customerY = y + 6;
  writeBillToLine(order.customerName, COLORS.text);
  if (order.customerEmail) {
    writeBillToLine(order.customerEmail, COLORS.muted);
  }
  writeBillToLine(order.customerPhone, COLORS.muted);

  if (order.customerAddress) {
    writeBillToLine(order.customerAddress, COLORS.muted);
  }
  const cityLine = [order.customerCity, order.customerPostalCode]
    .filter((part): part is string => Boolean(part))
    .join(" ");
  if (cityLine) {
    writeBillToLine(cityLine, COLORS.muted);
  }

  y = Math.max(customerY, y + 22) + 4;

  y = drawTwoColumnTable(doc, y, "Order info", [
    ["Order #", order.orderNumber],
    ["Order date", formatDateTime(order.createdAt)],
    ["Order status", order.status],
    [
      "Payment method",
      order.paymentMethod === "ONLINE" ? "Pay now" : "Cash on delivery",
    ],
    ["Payment status", order.paymentStatus],
  ]);

  y = drawItemsTable(doc, y, order);
  y = drawTotals(doc, y, order);

  if (order.customerNote) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.brandTo);
    doc.text("Note from customer", PAGE_MARGIN, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...COLORS.muted);
    doc.text(
      doc.splitTextToSize(order.customerNote, pageWidth - PAGE_MARGIN * 2),
      PAGE_MARGIN,
      y + 6,
    );
  }

  drawFooter(doc);

  return doc;
}

/** Save the PDF with a sensible default filename. */
export function downloadOrderPdf(order: OrderDetail) {
  const doc = generateOrderPdf(order);
  doc.save(`EnterFly-${order.orderNumber}.pdf`);
}

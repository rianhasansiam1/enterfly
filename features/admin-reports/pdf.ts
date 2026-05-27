import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import {
  REPORT_DEFS,
  formatCurrency,
  formatDate,
  formatDateTime,
  type CategoriesReport,
  type CustomersReport,
  type InventoryReport,
  type OrdersReport,
  type ProductsReport,
  type ReportPayload,
  type SalesReport,
} from "@/features/admin-reports/api";

/**
 * Generates a downloadable PDF for any of the admin reports.
 *
 * The same payload that powers the on-screen preview is used to build
 * the PDF, so the two views can never disagree. We rely on jsPDF +
 * jspdf-autotable so generation happens entirely on the client and the
 * server never has to spin up a headless browser or rasterizer.
 *
 * Each section follows the same skeleton:
 *   1. Header (brand strip, title, generated-at line, window).
 *   2. Summary KPIs as a key/value table.
 *   3. One or more detail tables specific to the report type.
 *   4. Footer with page number and a small "EnterFly Admin" mark.
 */

type Doc = jsPDF;

const COLORS = {
  brandFrom: [124, 58, 237] as [number, number, number], // violet-600
  brandTo: [79, 70, 229] as [number, number, number], // indigo-600
  text: [33, 37, 41] as [number, number, number],
  muted: [108, 117, 125] as [number, number, number],
  divider: [233, 213, 255] as [number, number, number], // violet-200
};

const PAGE_MARGIN = 14;

function drawHeader(doc: Doc, payload: ReportPayload) {
  const def = REPORT_DEFS[payload.meta.type];
  const pageWidth = doc.internal.pageSize.getWidth();

  // Brand strip: a flat violet bar across the top.
  doc.setFillColor(...COLORS.brandFrom);
  doc.rect(0, 0, pageWidth, 26, "F");

  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text("EnterFly", PAGE_MARGIN, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Admin Console — Reports", PAGE_MARGIN, 18);

  doc.setFontSize(9);
  doc.text(
    `Generated: ${formatDateTime(payload.meta.generatedAt)}`,
    pageWidth - PAGE_MARGIN,
    18,
    { align: "right" },
  );

  // Title block below the strip.
  doc.setTextColor(...COLORS.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(def.subject, PAGE_MARGIN, 40);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(10);
  doc.text(def.description, PAGE_MARGIN, 47, {
    maxWidth: pageWidth - PAGE_MARGIN * 2,
  });

  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);
  doc.text(
    `Window: ${formatDate(payload.meta.from)} → ${formatDate(payload.meta.to)}`,
    PAGE_MARGIN,
    58,
  );

  doc.setDrawColor(...COLORS.divider);
  doc.setLineWidth(0.4);
  doc.line(PAGE_MARGIN, 62, pageWidth - PAGE_MARGIN, 62);
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
      "EnterFly Admin · Confidential",
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

/**
 * Render a small "Summary" key/value table. We reuse the autoTable
 * layout so the visual style matches the detail tables below.
 */
function drawSummary(
  doc: Doc,
  startY: number,
  rows: Array<[string, string]>,
): number {
  autoTable(doc, {
    startY,
    head: [["Metric", "Value"]],
    body: rows,
    theme: "grid",
    headStyles: {
      fillColor: COLORS.brandFrom,
      textColor: 255,
      fontStyle: "bold",
    },
    bodyStyles: { textColor: COLORS.text },
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: "bold" },
      1: { cellWidth: "auto" },
    },
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
  });
  return getNextY(doc);
}

function drawSectionHeading(doc: Doc, y: number, label: string): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.brandTo);
  doc.text(label, PAGE_MARGIN, y);
  doc.setTextColor(...COLORS.text);
  return y + 4;
}

function getNextY(doc: Doc): number {
  // jspdf-autotable v5 stores the last Y on the doc as `lastAutoTable`.
  const last = (doc as unknown as { lastAutoTable?: { finalY: number } })
    .lastAutoTable;
  return (last?.finalY ?? 60) + 10;
}

/* -------------------------------------------------------------------------- */
/*  Per-report renderers                                                      */
/* -------------------------------------------------------------------------- */

function renderSales(doc: Doc, report: SalesReport) {
  let y = 70;
  y = drawSectionHeading(doc, y, "Summary");
  y = drawSummary(doc, y, [
    ["Total revenue (excl. cancelled)", formatCurrency(report.summary.totalRevenue)],
    ["Orders (excl. cancelled)", String(report.summary.totalOrders)],
    ["Average order value", formatCurrency(report.summary.avgOrderValue)],
    ["Gross subtotal", formatCurrency(report.summary.grossSubtotal)],
    ["Total delivery fees", formatCurrency(report.summary.totalDeliveryCharges)],
    ["Total discounts applied", formatCurrency(report.summary.totalDiscounts)],
    [
      "Cancelled orders",
      `${report.summary.cancelledOrders} · ${formatCurrency(report.summary.cancelledRevenue)}`,
    ],
  ]);

  // Status breakdown
  if (report.byStatus.length > 0) {
    y = drawSectionHeading(doc, y, "Orders by status");
    autoTable(doc, {
      startY: y,
      head: [["Status", "Orders", "Revenue"]],
      body: report.byStatus.map((row) => [
        row.status,
        String(row.orders),
        formatCurrency(row.revenue),
      ]),
      theme: "striped",
      headStyles: { fillColor: COLORS.brandFrom, textColor: 255 },
      styles: { fontSize: 10, cellPadding: 2.5 },
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    });
    y = getNextY(doc);
  }

  // Payment status breakdown
  if (report.byPaymentStatus.length > 0) {
    y = drawSectionHeading(doc, y, "Payment status (live orders)");
    autoTable(doc, {
      startY: y,
      head: [["Payment status", "Orders", "Revenue"]],
      body: report.byPaymentStatus.map((row) => [
        row.paymentStatus,
        String(row.orders),
        formatCurrency(row.revenue),
      ]),
      theme: "striped",
      headStyles: { fillColor: COLORS.brandFrom, textColor: 255 },
      styles: { fontSize: 10, cellPadding: 2.5 },
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    });
    y = getNextY(doc);
  }

  // Daily series
  if (report.dailySeries.length > 0) {
    y = drawSectionHeading(doc, y, "Daily revenue");
    autoTable(doc, {
      startY: y,
      head: [["Date", "Orders", "Revenue"]],
      body: report.dailySeries.map((row) => [
        formatDate(row.day),
        String(row.orders),
        formatCurrency(row.revenue),
      ]),
      theme: "grid",
      headStyles: { fillColor: COLORS.brandFrom, textColor: 255 },
      styles: { fontSize: 9, cellPadding: 2 },
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    });
    y = getNextY(doc);
  }

  // Recent orders
  if (report.recentOrders.length > 0) {
    y = drawSectionHeading(doc, y, "Recent orders");
    autoTable(doc, {
      startY: y,
      head: [["Order #", "Customer", "Status", "Payment", "Total", "Placed"]],
      body: report.recentOrders.map((row) => [
        row.orderNumber,
        row.customerName,
        row.status,
        row.paymentStatus,
        formatCurrency(row.totalAmount),
        formatDateTime(row.createdAt),
      ]),
      theme: "striped",
      headStyles: { fillColor: COLORS.brandFrom, textColor: 255 },
      styles: { fontSize: 9, cellPadding: 2 },
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    });
  }
}

function renderOrders(doc: Doc, report: OrdersReport) {
  let y = 70;
  y = drawSectionHeading(doc, y, "Summary");
  y = drawSummary(doc, y, [
    ["Total orders in window", String(report.summary.totalOrders)],
    ["Total amount", formatCurrency(report.summary.totalAmount)],
    ["Total discounts", formatCurrency(report.summary.totalDiscounts)],
  ]);

  if (report.byStatus.length > 0) {
    y = drawSectionHeading(doc, y, "Orders by status");
    autoTable(doc, {
      startY: y,
      head: [["Status", "Orders"]],
      body: report.byStatus.map((row) => [row.status, String(row.orders)]),
      theme: "striped",
      headStyles: { fillColor: COLORS.brandFrom, textColor: 255 },
      styles: { fontSize: 10, cellPadding: 2.5 },
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    });
    y = getNextY(doc);
  }

  y = drawSectionHeading(doc, y, "Order log");
  autoTable(doc, {
    startY: y,
    head: [
      ["Order #", "Customer", "Phone", "Status", "Pay", "Items", "Total", "Placed"],
    ],
    body: report.rows.map((row) => [
      row.orderNumber,
      row.customerName,
      row.customerPhone,
      row.status,
      row.paymentStatus,
      String(row.itemsCount),
      formatCurrency(row.totalAmount),
      formatDateTime(row.createdAt),
    ]),
    theme: "striped",
    headStyles: { fillColor: COLORS.brandFrom, textColor: 255 },
    styles: { fontSize: 8, cellPadding: 1.8 },
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
  });
}

function renderProducts(doc: Doc, report: ProductsReport) {
  let y = 70;
  y = drawSectionHeading(doc, y, "Summary");
  y = drawSummary(doc, y, [
    ["Unique products sold", String(report.summary.uniqueProducts)],
    ["Total units shipped", String(report.summary.unitsSold)],
    ["Revenue from these products", formatCurrency(report.summary.revenue)],
  ]);

  y = drawSectionHeading(doc, y, "Top products by revenue");
  autoTable(doc, {
    startY: y,
    head: [
      ["#", "Product", "Category", "Units", "Revenue", "Price now", "Stock", "Status"],
    ],
    body: report.rows.map((row, index) => [
      String(index + 1),
      row.name,
      row.category,
      String(row.unitsSold),
      formatCurrency(row.revenue),
      row.currentPrice != null ? formatCurrency(row.currentPrice) : "—",
      row.currentStock != null ? String(row.currentStock) : "—",
      row.status ?? "—",
    ]),
    theme: "striped",
    headStyles: { fillColor: COLORS.brandFrom, textColor: 255 },
    styles: { fontSize: 9, cellPadding: 2 },
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
  });
}

function renderInventory(doc: Doc, report: InventoryReport) {
  let y = 70;
  y = drawSectionHeading(doc, y, "Summary");
  y = drawSummary(doc, y, [
    ["Total products", String(report.summary.totalProducts)],
    ["Total units in stock", String(report.summary.totalUnitsInStock)],
    ["Out of stock", String(report.summary.outOfStock)],
    ["Low stock (≤ 5)", String(report.summary.lowStock)],
    ["Inventory value", formatCurrency(report.summary.inventoryValue)],
  ]);

  y = drawSectionHeading(doc, y, "Catalog (lowest stock first)");
  autoTable(doc, {
    startY: y,
    head: [
      ["Product", "Category", "Price", "Discount", "Stock", "Status", "Updated"],
    ],
    body: report.rows.map((row) => [
      row.name,
      row.category,
      formatCurrency(row.price),
      row.discountPrice != null ? formatCurrency(row.discountPrice) : "—",
      String(row.stock),
      row.status,
      formatDate(row.updatedAt),
    ]),
    theme: "striped",
    headStyles: { fillColor: COLORS.brandFrom, textColor: 255 },
    styles: { fontSize: 9, cellPadding: 2 },
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
  });
}

function renderCustomers(doc: Doc, report: CustomersReport) {
  let y = 70;
  y = drawSectionHeading(doc, y, "Summary");
  y = drawSummary(doc, y, [
    ["Total registered users", String(report.summary.totalUsers)],
    ["New sign-ups in window", String(report.summary.newSignupsInWindow)],
    ["Active buyers in window", String(report.summary.activeBuyers)],
    ["Total revenue", formatCurrency(report.summary.totalRevenue)],
    ["Avg revenue per buyer", formatCurrency(report.summary.avgRevenuePerBuyer)],
  ]);

  y = drawSectionHeading(doc, y, "Top customers");
  autoTable(doc, {
    startY: y,
    head: [
      [
        "Customer",
        "Email",
        "Phone",
        "City",
        "Role",
        "Orders",
        "Spend",
        "Last order",
      ],
    ],
    body: report.rows.map((row) => [
      row.name,
      row.email ?? "—",
      row.phone ?? "—",
      row.city ?? "—",
      row.role,
      String(row.ordersCount),
      formatCurrency(row.totalSpend),
      row.lastOrderAt ? formatDate(row.lastOrderAt) : "—",
    ]),
    theme: "striped",
    headStyles: { fillColor: COLORS.brandFrom, textColor: 255 },
    styles: { fontSize: 8, cellPadding: 1.8 },
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
  });
}

function renderCategories(doc: Doc, report: CategoriesReport) {
  let y = 70;
  y = drawSectionHeading(doc, y, "Summary");
  y = drawSummary(doc, y, [
    ["Total categories", String(report.summary.totalCategories)],
    ["Active categories", String(report.summary.activeCategories)],
    ["Units sold in window", String(report.summary.unitsSold)],
    ["Revenue in window", formatCurrency(report.summary.revenue)],
  ]);

  y = drawSectionHeading(doc, y, "Category performance");
  autoTable(doc, {
    startY: y,
    head: [["Category", "Status", "Products", "Units sold", "Revenue"]],
    body: report.rows.map((row) => [
      row.name,
      row.status,
      String(row.productCount),
      String(row.unitsSold),
      formatCurrency(row.revenue),
    ]),
    theme: "striped",
    headStyles: { fillColor: COLORS.brandFrom, textColor: 255 },
    styles: { fontSize: 10, cellPadding: 2.5 },
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
  });
}

/* -------------------------------------------------------------------------- */
/*  Public entry                                                              */
/* -------------------------------------------------------------------------- */

export function generateReportPdf(payload: ReportPayload): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  drawHeader(doc, payload);

  switch (payload.meta.type) {
    case "sales":
      if (payload.sales) renderSales(doc, payload.sales);
      break;
    case "orders":
      if (payload.orders) renderOrders(doc, payload.orders);
      break;
    case "products":
      if (payload.products) renderProducts(doc, payload.products);
      break;
    case "inventory":
      if (payload.inventory) renderInventory(doc, payload.inventory);
      break;
    case "customers":
      if (payload.customers) renderCustomers(doc, payload.customers);
      break;
    case "categories":
      if (payload.categories) renderCategories(doc, payload.categories);
      break;
  }

  drawFooter(doc);
  return doc;
}

export function buildReportFilename(payload: ReportPayload): string {
  const stamp = payload.meta.generatedAt.replace(/[:.]/g, "-").slice(0, 19);
  return `enterfly-${payload.meta.type}-report-${stamp}.pdf`;
}

export function downloadReportPdf(payload: ReportPayload): void {
  const doc = generateReportPdf(payload);
  doc.save(buildReportFilename(payload));
}

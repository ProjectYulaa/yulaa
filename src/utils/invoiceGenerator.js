// src/utils/invoiceGenerator.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Import your logo (make sure it's small PNG/JPG/SVG, ~200px wide max)
import yulaaLogo from "../assets/yulaa-logo.png";  // ✅ place logo in src/assets

export const generateInvoice = (order) => {
  const doc = new jsPDF();

  // Add Logo
  doc.addImage(yulaaLogo, "PNG", 14, 10, 30, 15); // (image, format, x, y, width, height)

  // Company Name / Header Title
  doc.setFontSize(18);
  doc.setTextColor(40);
  doc.text("YULAA Invoice", 50, 20);

  // Subheader / Contact Info
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("www.yulaa.com | support@yulaa.com | +91-9876543210", 50, 26);

  // Order & Customer Info
  doc.setFontSize(11);
  doc.setTextColor(50);
  doc.text(`Order ID: ${order.orderId}`, 14, 40);
  doc.text(`Order Date: ${order.date}`, 14, 46);
  doc.text(`Customer: ${order.customerName}`, 14, 52);

  doc.text(
    `Address: ${order.address.fulladdress}, ${order.address.city}, ${order.address.state}, ${order.address.pincode}`,
    14,
    58,
    { maxWidth: 180 }
  );

  doc.text(`Payment Method: ${order.paymentMethod?.detail || "N/A"}`, 14, 66);

  // Items Table
  const tableColumn = ["Item", "Qty", "Price (₹)", "Total (₹)"];
  const tableRows = [];

  order.items.forEach((item) => {
    const itemData = [
      item.title || item.name,
      item.quantity || 1,
      item.price,
      (item.price || 0) * (item.quantity || 1),
    ];
    tableRows.push(itemData);
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 75,
    theme: "striped", // ✅ modern look
    headStyles: { fillColor: [72, 129, 133] }, // YULAA primary color
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 14, right: 14 },
  });

  // Totals Section
  let finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.text(`Subtotal: ₹${order.subtotal}`, 140, finalY);
  doc.text(`Shipping: ₹${order.shipping}`, 140, finalY + 6);
  doc.text(`Grand Total: ₹${order.total}`, 140, finalY + 12);

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(
    "Thank you for shopping with YULAA! For support, contact support@yulaa.com",
    14,
    285
  );

  // Save
  doc.save(`Invoice_${order.orderId}.pdf`);
};

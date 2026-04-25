import PDFDocument from "pdfkit";

interface InvoiceData {
  invoiceId: string;
  patientName: string;
  patientEmail: string;
  doctorName: string;
  appointmentDate: string;
  amount: number;
  transactionId: string;
  paymentDate: string;
}

const COLORS = {
  primary: "#12324A",   // deep navy
  secondary: "#1AA6B7", // teal
  accent: "#2F855A",    // medical green
  bg: "#F5FAFC",
  card: "#FFFFFF",
  text: "#1F2937",
  muted: "#6B7280",
  border: "#D8E5EC",
  light: "#EAF6F8",
  danger: "#D9534F",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(amount);
}

function drawCard(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  radius = 14
) {
  doc.save();
  doc.roundedRect(x, y, w, h, radius).fillAndStroke(COLORS.card, COLORS.border);
  doc.restore();
}

function drawSectionTitle(
  doc: PDFKit.PDFDocument,
  title: string,
  x: number,
  y: number
) {
  doc
    .fillColor(COLORS.primary)
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(title, x, y);
}

function addLabelValue(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number
) {
  doc.fillColor(COLORS.muted).font("Helvetica").fontSize(9).text(label, x, y);
  doc
    .fillColor(COLORS.text)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(value, x, y + 12, { width });
}

export const generateInvoicePdf = async (
  data: InvoiceData
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 0,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageW = 595.28;
      const pageH = 841.89;
      const margin = 42;
      const contentW = pageW - margin * 2;

      // Background
      doc.rect(0, 0, pageW, pageH).fill(COLORS.bg);

      // Top banner
      doc
        .rect(0, 0, pageW, 120)
        .fill(COLORS.primary);

      // Decorative accent line
      doc
        .rect(0, 120, pageW, 6)
        .fill(COLORS.secondary);

      // Title block
      doc
        .fillColor("#FFFFFF")
        .font("Helvetica-Bold")
        .fontSize(26)
        .text("INVOICE", margin, 34, { align: "left" });

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#DDEAF0")
        .text("PH Healthcare Services", margin, 68);

      doc
        .fontSize(9)
        .text("Your Health, Our Priority", margin, 82);

      // Invoice number chip
      const chipX = pageW - margin - 160;
      const chipY = 34;
      doc.roundedRect(chipX, chipY, 160, 34, 10).fill(COLORS.secondary);

      doc
        .fillColor("#FFFFFF")
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("Invoice No.", chipX + 12, chipY + 6);

      doc
        .font("Helvetica")
        .fontSize(10)
        .text(data.invoiceId, chipX + 12, chipY + 18);

      // Main white sheet
      const sheetY = 150;
      const sheetH = 640;
      drawCard(doc, margin, sheetY, contentW, sheetH, 18);

      // Status bar
      doc
        .roundedRect(margin + 18, sheetY + 18, contentW - 36, 38, 12)
        .fill(COLORS.light);

      doc
        .fillColor(COLORS.secondary)
        .font("Helvetica-Bold")
        .fontSize(11)
        .text("Payment Received", margin + 34, sheetY + 31);

      doc
        .fillColor(COLORS.muted)
        .font("Helvetica")
        .fontSize(9)
        .text(`Processed on ${formatDate(data.paymentDate)}`, pageW - margin - 180, sheetY + 31, {
          width: 150,
          align: "right",
        });

      // Two-column blocks
      const leftX = margin + 24;
      const rightX = pageW / 2 + 8;
      const blockY = sheetY + 78;
      const blockW = contentW / 2 - 30;
      const blockH = 110;

      drawCard(doc, leftX, blockY, blockW, blockH, 14);
      drawCard(doc, rightX, blockY, blockW, blockH, 14);

      drawSectionTitle(doc, "Patient Information", leftX + 16, blockY + 14);
      addLabelValue(doc, "Name", data.patientName, leftX + 16, blockY + 36, blockW - 32);
      addLabelValue(doc, "Email", data.patientEmail, leftX + 16, blockY + 68, blockW - 32);

      drawSectionTitle(doc, "Doctor Information", rightX + 16, blockY + 14);
      addLabelValue(doc, "Doctor", data.doctorName, rightX + 16, blockY + 36, blockW - 32);
      addLabelValue(doc, "Appointment", formatDate(data.appointmentDate), rightX + 16, blockY + 68, blockW - 32);

      // Payment summary card
      const summaryY = blockY + blockH + 18;
      const summaryH = 180;
      drawCard(doc, margin + 24, summaryY, contentW - 48, summaryH, 14);

      drawSectionTitle(doc, "Payment Summary", margin + 40, summaryY + 16);

      // Table header
      const rowX = margin + 40;
      const amountX = pageW - margin - 130;
      const lineY = summaryY + 48;

      doc
        .moveTo(rowX, lineY)
        .lineTo(pageW - margin - 40, lineY)
        .strokeColor(COLORS.border)
        .lineWidth(1)
        .stroke();

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(COLORS.primary)
        .text("Description", rowX, summaryY + 28);

      doc
        .text("Amount", amountX, summaryY + 28, {
          width: 90,
          align: "right",
        });

      // Row 1
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(COLORS.text)
        .text("Consultation Fee", rowX, summaryY + 68);

      doc
        .fillColor(COLORS.text)
        .text(formatCurrency(data.amount), amountX, summaryY + 68, {
          width: 90,
          align: "right",
        });

      // Row 2
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(COLORS.primary)
        .text("Total Amount", rowX, summaryY + 108);

      doc
        .fillColor(COLORS.accent)
        .text(formatCurrency(data.amount), amountX, summaryY + 108, {
          width: 90,
          align: "right",
        });

      // Highlight strip at bottom of summary
      doc
        .roundedRect(margin + 40, summaryY + 145, contentW - 80, 18, 8)
        .fill(COLORS.light);

      doc
        .fillColor(COLORS.secondary)
        .font("Helvetica")
        .fontSize(8)
        .text(`Transaction ID: ${data.transactionId}`, margin + 50, summaryY + 150);

      // Signature / note area
      const noteY = summaryY + summaryH + 18;
      drawCard(doc, margin + 24, noteY, contentW - 48, 132, 14);

      drawSectionTitle(doc, "Medical Note", margin + 40, noteY + 16);

      doc
        .fillColor(COLORS.muted)
        .font("Helvetica")
        .fontSize(9)
        .text(
          "This invoice is electronically generated for the above medical service. "
          + "Please keep this document for your records.",
          margin + 40,
          noteY + 40,
          {
            width: contentW - 80,
            lineGap: 4,
          }
        );

      // Signature line
      const sigY = noteY + 90;
      doc
        .moveTo(margin + 40, sigY)
        .lineTo(margin + 220, sigY)
        .strokeColor(COLORS.border)
        .lineWidth(1)
        .stroke();

      doc
        .fillColor(COLORS.primary)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text("Authorized Signature", margin + 40, sigY + 6);

      // Footer
      const footerY = pageH - 58;
      doc
        .moveTo(margin, footerY - 12)
        .lineTo(pageW - margin, footerY - 12)
        .strokeColor(COLORS.border)
        .lineWidth(1)
        .stroke();

      doc
        .fillColor(COLORS.muted)
        .font("Helvetica")
        .fontSize(8.5)
        .text("PH Healthcare Services • Secure payment processed • Thank you for your trust", margin, footerY, {
          align: "center",
        });

      // End
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
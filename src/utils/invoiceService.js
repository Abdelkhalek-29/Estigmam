import fs from "fs";
import PDFDocument from "pdfkit";
import path from "path";

export function createInvoice(invoice, pathToSave) {
  validateInput(invoice);
  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
    bufferPages: true,
  });

  setupDocument(doc, pathToSave);
  addContent(doc, invoice);
  finishDocument(doc);
}

function validateInput(invoice) {
  if (
    !invoice?.total ||
    isNaN(parseFloat(invoice.total)) ||
    parseFloat(invoice.total) <= 0
  ) {
    throw new Error(`Invalid total amount: ${invoice.total}`);
  }
  if (!invoice?.bookingRef) {
    throw new Error("Missing booking reference");
  }
  if (!invoice?.tripDetails) {
    throw new Error("Missing trip details");
  }
}

function setupDocument(doc, pathToSave) {
  const dir = path.dirname(pathToSave);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  doc.pipe(fs.createWriteStream(pathToSave));
}

function addContent(doc, invoice) {
  // Header
  addLogo(doc);
  addHeaderText(doc, invoice);
  addDividerLine(doc, 120);

  const startY = 140;
  addSummaryBox(doc, invoice, startY);
  addTripDetails(doc, invoice, startY + 180);
  addPaymentInfo(doc, invoice, startY + 350);

  addFooter(doc);
}

function addLogo(doc) {
  try {
    const logoPath = path.resolve("./images/logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 45, { width: 150 });
    }
  } catch (error) {
    console.warn("Logo not found");
  }
}

function addHeaderText(doc, invoice) {
  doc
    .font("Helvetica-Bold")
    .fontSize(24)
    .text("INVOICE", 400, 45, { align: "right" })
    .fontSize(12)
    .font("Helvetica")
    .text(`Date: ${new Date().toLocaleDateString()}`, 400, 75, {
      align: "right",
    })
    .text(`Ref: ${invoice.bookingRef}`, 400, 90, { align: "right" });
}

function addDividerLine(doc, y) {
  doc.moveTo(50, y).lineTo(550, y).strokeColor("#2563eb").lineWidth(2).stroke();
}

function addSummaryBox(doc, invoice, y) {
  doc
    .roundedRect(50, y, 500, 160, 10)
    .fillColor("#f8fafc")
    .fill()
    .fillColor("#000000");
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .text("Here is your trip receipt", 70, y + 20)
    .font("Helvetica")
    .fontSize(12)
    .text("We hope you enjoyed your trip", 70, y + 45)
    .text(`Guests: ${invoice.numberOfPeople}`, 70, y + 65);

  const pricePerPerson = parseFloat(invoice.pricePerPerson);
  doc.text(
    `Price per Guest: SAR ${
      isNaN(pricePerPerson) ? "Invalid" : pricePerPerson.toFixed(2)
    }`,
    70,
    y + 85
  );

  const discount = parseFloat(invoice.discount);
  doc.text(
    `Discount: %${isNaN(discount) ? 0 : discount.toFixed(2)}`,
    70,
    y + 105
  );

  const totalAmount = parseFloat(invoice.total);
  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor(totalAmount > 0 ? "#2563eb" : "red")
    .text("Total Amount:", 70, y + 120)
    .text(
      `SAR ${isNaN(totalAmount) ? "Invalid" : totalAmount.toFixed(2)}`,
      500,
      y + 120,
      {
        align: "right",
      }
    );
}

function addTripDetails(doc, invoice, y) {
  doc
    .fillColor("#000000")
    .font("Helvetica-Bold")
    .fontSize(14)
    .text("Trip Details", 70, y)
    .font("Helvetica")
    .fontSize(12)
    .text(`Trip: ${invoice.tripDetails}`, 70, y + 25, {
      width: 460,
      align: "justify",
      lineGap: 5,
    })
    .text(
      `Trip Duration: ${invoice.tripDuration || "Not available"}`,
      70,
      y + 45,
      {
        width: 460,
        align: "justify",
        lineGap: 5,
      }
    );
}

function addPaymentInfo(doc, invoice, y) {
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .text("Payment Information", 70, y)
    .font("Helvetica")
    .fontSize(12)
    .text(`Method: ${invoice.method || "Not available"}`, 70, y + 25)
    .text("Status: Paid", 70, y + 45)
    .text(`Date: ${new Date().toLocaleDateString()}`, 70, y + 65);
}

function addFooter(doc) {
  const pages = doc.bufferedPageRange().count;
  for (let i = 0; i < pages; i++) {
    doc.switchToPage(i);
    doc
      .moveTo(50, 750)
      .lineTo(550, 750)
      .strokeColor("#e2e8f0")
      .lineWidth(1)
      .stroke();
    doc
      .fillColor("#64748b")
      .fontSize(10)
      .text("Thank you for choosing our service!", 50, 760, {
        align: "center",
        width: 500,
      })
      .text(`Page ${i + 1} of ${pages}`, 50, 780, {
        align: "center",
        width: 500,
      });
  }
}

function finishDocument(doc) {
  doc.end();
}

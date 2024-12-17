import PDFDocument from "pdfkit";
import moment from "moment";
import cloudinary from "../utils/cloudinary.js";
export class InvoiceService {
  constructor() {
    this.doc = new PDFDocument({
      size: "A4",
      margin: 50,
      layout: "portrait",
    });
  }

  async generateInvoice(data) {
    const {
      invoiceNumber,
      date,
      customerName,
      totalAmount,
      numberOfPeople,
      pricePerPerson,
      discount,
      subtotal,
      roundingAmount,
      paymentMethod,
      cardLastDigits,
      tripDetails,
      bookingReference,
    } = data;

    // Create an array to capture PDF data as a buffer
    const buffers = [];

    // Attach listeners to the PDF stream
    this.doc.on("data", buffers.push.bind(buffers)); // Push data into buffers
    this.doc.on("end", async () => {
      const buffer = Buffer.concat(buffers); // Concatenate the buffers

      try {
        const uploadResult = await this.uploadToCloudinary(buffer); // Upload the buffer to Cloudinary
        console.log("Invoice uploaded successfully:", uploadResult);
        // Return the result (public_id or relevant data)
        return uploadResult;
      } catch (error) {
        console.error("Error uploading invoice:", error);
        throw error; // Rethrow error to propagate failure
      }
    });

    // Generate the content of the PDF
    this.addHeader();
    this.addInvoiceDetails(date, customerName);
    this.addFinancialDetails({
      totalAmount,
      numberOfPeople,
      pricePerPerson,
      discount,
      subtotal,
      roundingAmount,
    });
    this.addPaymentDetails(paymentMethod, cardLastDigits);
    this.addTripDetails(tripDetails);
    this.addFooter(bookingReference);

    // Finalize the PDF document
    this.doc.end();
  }

  // Cloudinary upload function
  async uploadToCloudinary(buffer) {
    return new Promise((resolve, reject) => {
      // Log the cloudinary object and uploader to check if they're loaded correctly
      console.log("Cloudinary:", cloudinary);
      console.log("Cloudinary uploader:", cloudinary.v2.uploader);

      if (!cloudinary.v2 || !cloudinary.v2.uploader) {
        console.error("Cloudinary uploader is not available");
        return reject(new Error("Cloudinary uploader is not available"));
      }

      const uploadStream = cloudinary.v2.uploader.upload_stream(
        {
          resource_type: "raw",
          public_id: `invoices/${Date.now()}`,
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result.public_id); // Return the public_id
        }
      );

      uploadStream.end(buffer);
    });
  }

  // Header content for the invoice
  addHeader() {
    this.doc
      .font("Helvetica-Bold")
      .fontSize(24)
      .text("ESTGMAM", 450, 85, { align: "right" });
  }

  // Invoice details (date, customer name, etc.)
  addInvoiceDetails(date, customerName) {
    this.doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .text(moment(date).format("DD/MM/YYYY"), 450, 120, { align: "right" })
      .text(customerName, 450, 145, { align: "right" })
      .text("نأمل أن تكون قد استمتعت برحلتك", 450, 170, { align: "right" });
  }

  // Financial details
  addFinancialDetails({
    totalAmount,
    numberOfPeople,
    pricePerPerson,
    discount,
    subtotal,
    roundingAmount,
  }) {
    const startY = 200;

    this.addTableRow("الإجمالي", totalAmount.toFixed(2), startY);
    this.addTableRow("عدد الأفراد", numberOfPeople, startY + 30);
    this.addTableRow(
      "سعر الفرد الواحد",
      pricePerPerson.toFixed(2),
      startY + 60
    );
    this.addTableRow("الخصم", discount.toFixed(2), startY + 90);
    this.addTableRow("الإجمالي الفرعي", subtotal.toFixed(2), startY + 120);
    this.addTableRow("التقريب", roundingAmount.toFixed(2), startY + 150);
  }

  // Helper to add a row to the financial table
  addTableRow(label, value, y) {
    this.doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .text(label, 450, y, { align: "right" })
      .text(`${value} جنيه مصري`, 200, y);
  }

  // Payment details (method, card info)
  addPaymentDetails(paymentMethod, cardLastDigits) {
    const y = 400;
    this.doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .text("المدفوعات", 450, y, { align: "right" });

    this.doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .text(`باستخدام ${paymentMethod}`, 450, y + 30, { align: "right" })
      .text(`**** ${cardLastDigits}`, 450, y + 50, { align: "right" });
  }

  // Trip details (departure, arrival)
  addTripDetails(tripDetails) {
    const { departureDate, departureLocation, arrivalDate, arrivalLocation } =
      tripDetails;
    const y = 500;

    this.doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .text("تفاصيل الرحلة", 450, y, { align: "right" });

    this.doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .text(`${departureDate} - ${departureLocation}`, 450, y + 30, {
        align: "right",
      })
      .text(`${arrivalDate} - ${arrivalLocation}`, 450, y + 50, {
        align: "right",
      });
  }

  // Footer (booking reference)
  addFooter(bookingReference) {
    const y = 700;
    this.doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(
        "هذا ليس فاتورة ضريبية هذا إيصال الدفع مقابل خدمة النقل المقدمة من ياسر",
        450,
        y,
        { align: "right" }
      )
      .text(`رقم الحجز: ${bookingReference}`, 450, y + 20, { align: "right" });
  }
}

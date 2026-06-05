import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { Quotation } from "./src/types";

async function fetchWithFallback(urls: string[], destination: string): Promise<boolean> {
  if (fs.existsSync(destination)) {
    const stats = fs.statSync(destination);
    if (stats.size > 10000) return true;
    try { fs.unlinkSync(destination); } catch (err) {}
  }
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        if (buffer.byteLength > 10000) {
          fs.writeFileSync(destination, Buffer.from(buffer));
          return true;
        }
      }
    } catch (e: any) {}
  }
  return false;
}

async function ensureFonts() {
  const fontsDir = path.join(process.cwd(), "fonts");
  if (!fs.existsSync(fontsDir)) {
    fs.mkdirSync(fontsDir, { recursive: true });
  }
  const regularFontPath = path.join(fontsDir, "Roboto-Regular.ttf");
  const boldFontPath = path.join(fontsDir, "Roboto-Bold.ttf");

  const regularUrls = [
    "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/roboto/static/Roboto-Regular.ttf",
    "https://raw.githubusercontent.com/google/fonts/main/ofl/roboto/static/Roboto-Regular.ttf"
  ];
  const boldUrls = [
    "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/roboto/static/Roboto-Bold.ttf",
    "https://raw.githubusercontent.com/google/fonts/main/ofl/roboto/static/Roboto-Bold.ttf"
  ];

  const regularOk = await fetchWithFallback(regularUrls, regularFontPath);
  const boldOk = await fetchWithFallback(boldUrls, boldFontPath);

  return {
    regular: regularOk && fs.existsSync(regularFontPath) ? regularFontPath : "",
    bold: boldOk && fs.existsSync(boldFontPath) ? boldFontPath : ""
  };
}

export async function generateQuotationPDF(quotation: Quotation, config: any): Promise<Buffer> {
  const fonts = await ensureFonts();
  
  // Try to pre-fetch the dynamic QR code for banking
  let qrBuffer: Buffer | null = null;
  const amount = quotation.totalAmount || 0;
  const qrUrl = `https://img.vietqr.io/image/MB-0963484365-compact2.png?amount=${amount}&addInfo=Thanh%20Toan%20Bao%20Gia%20${encodeURIComponent(quotation.code)}&accountName=VO%20THI%20THUY`;
  
  try {
    const qrRes = await fetch(qrUrl);
    if (qrRes.ok) {
      const arrayBuffer = await qrRes.arrayBuffer();
      qrBuffer = Buffer.from(arrayBuffer);
    }
  } catch (err) {
    console.warn("[Quotation PDF] Failed to fetch MB Bank VietQR, falling back to clean details.", err);
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        bufferPages: true
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      // Font Registration
      let hasCustomFont = false;
      if (fonts.regular && fonts.bold) {
        doc.registerFont("Regular", fonts.regular);
        doc.registerFont("Bold", fonts.bold);
        hasCustomFont = true;
      }

      const fontReg = hasCustomFont ? "Regular" : "Helvetica";
      const fontBold = hasCustomFont ? "Bold" : "Helvetica-Bold";

      const companyName = config?.companyName || "CÔNG TY CỔ PHẦN CÔNG NGHỆ & TRUYỀN THÔNG TOLUCK";
      const companyAddress = config?.companyAddress || "Tòa nhà TOLUCK Building, Hà Nội, Việt Nam";
      const companyPhone = config?.companyPhone || "0963 484 365";
      const companyEmail = config?.companyEmail || "info@toluck.vn";

      // Visual Theme Configuration based on Template
      let primaryColor = "#0f766e"; // Teal / Emerald (Default)
      let secondaryColor = "#0f172a"; // Deep Navy
      let titleName = "BÁO GIÁ DỊCH VỤ";
      
      if (quotation.templateId === "template02") {
        primaryColor = "#2563eb"; // Elegant Blue
        titleName = "PHIẾU BÁO GIÁ & PHƯƠNG ÁN TECH";
      } else if (quotation.templateId === "template03") {
        primaryColor = "#4f46e5"; // Indigo Premium
        titleName = "QUOTATION & COOPERATION PLAN";
      }

      // --- PAGE HEADER DECOR ACTION ---
      doc.rect(0, 0, 595.28, 12).fill(primaryColor);

      // --- BRAND HEADER BLOCK ---
      // Top left Brand title
      doc.fillColor(primaryColor);
      doc.font(fontBold).fontSize(18).text("TOLUCK", 50, 40, { continued: true });
      doc.fillColor("#0f172a").text(" AGENCY");
      
      doc.fontSize(7.5).font(fontBold).fillColor("#64748b").text("CREATIVE MARKETING & TECH HUB EXCELLENCE", 50, 60, { characterSpacing: 1 });
      
      // Top right Company details
      doc.fillColor("#1e293b").font(fontReg).fontSize(8);
      doc.text(companyName, 280, 40, { align: "right", width: 265 });
      doc.text(`Địa chỉ: ${companyAddress}`, 280, 52, { align: "right", width: 265 });
      doc.text(`Hotline: ${companyPhone}  |  Email: ${companyEmail}`, 280, 64, { align: "right", width: 265 });

      // Divider line
      doc.lineWidth(1).strokeColor("#cbd5e1").moveTo(50, 85).lineTo(545, 85).stroke();

      // --- DOCUMENT HEADER ---
      doc.fillColor(secondaryColor).font(fontBold).fontSize(18).text(titleName, 50, 110, { align: "center" });
      
      doc.fillColor("#475569").font(fontReg).fontSize(9);
      doc.text(`Mã báo giá: ${quotation.code}`, 50, 132, { align: "left" });
      doc.text(`Ngày lập: ${quotation.createdAt}`, 350, 132, { align: "right", width: 195 });
      doc.text(`Người lập: ${quotation.assignedTo || "Phòng Kế Hoạch TOLUCK"}`, 50, 146, { align: "left" });
      doc.text(`Hạn hiệu lực: ${quotation.expiryDate}`, 350, 146, { align: "right", width: 195 });

      // --- CUSTOMER CARD (Filled Box) ---
      doc.rect(50, 170, 495, 75).fill("#f8fafc");
      doc.lineWidth(0.5).strokeColor("#e2e8f0").rect(50, 170, 495, 75).stroke();

      doc.fillColor(primaryColor).font(fontBold).fontSize(9.5).text("THÔNG TIN KHÁCH HÀNG / DOANH NGHIỆP", 65, 182);
      
      doc.fillColor("#1e293b").font(fontBold).fontSize(8.5).text("Doanh nghiệp: ", 65, 198, { continued: true });
      doc.font(fontReg).text(quotation.company || "Quý doanh nghiệp đối tác");
      
      doc.font(fontBold).text("Đại diện: ", 65, 212, { continued: true });
      doc.font(fontReg).text(`${quotation.customerName || "N/A"}  |  SĐT: ${quotation.phone || "N/A"}  |  Email: ${quotation.email || "N/A"}`);

      // --- SERVICES TABLE SECTION ---
      doc.fillColor(secondaryColor).font(fontBold).fontSize(10).text("NỘI DUNG PHƯƠNG ÁN & CƠ CẤU CHI PHÍ", 50, 265);

      let tableY = 282;
      // Header Table row
      doc.rect(50, tableY, 495, 22).fill(primaryColor);
      
      doc.fillColor("#ffffff").font(fontBold).fontSize(8.5);
      doc.text("STT", 55, tableY + 6, { width: 30, align: "center" });
      doc.text("Tên dịch vụ & Mô hình triển khai", 90, tableY + 6, { width: 230, align: "left" });
      doc.text("SL", 325, tableY + 6, { width: 30, align: "center" });
      doc.text("Đơn giá", 360, tableY + 6, { width: 80, align: "right" });
      doc.text("Thành tiền (đ)", 445, tableY + 6, { width: 95, align: "right" });

      tableY += 22;

      // Services loop
      doc.fillColor("#334155").font(fontReg).fontSize(8);
      
      const formatCurrency = (val: number) => {
        return Math.round(val).toLocaleString("vi-VN") + " đ";
      };

      const servicesList = quotation.services || [];
      if (servicesList.length === 0) {
        doc.rect(50, tableY, 495, 25).fill("#ffffff");
        doc.lineWidth(0.5).strokeColor("#cbd5e1").rect(50, tableY, 495, 25).stroke();
        doc.text("Chưa ghi nhận danh mục dịch vụ chọn.", 55, tableY + 8, { width: 485, align: "center" });
        tableY += 25;
      } else {
        servicesList.forEach((item, idx) => {
          // Calculate height required for description string
          const descStr = item.desc ? ` - ${item.desc}` : "";
          const fullText = `${item.name}${descStr}`;
          
          doc.font(fontReg).fontSize(8.5);
          const blockHeight = Math.max(26, doc.heightOfString(fullText, { width: 220 }) + 10);
          
          // Row background shading
          if (idx % 2 === 1) {
            doc.rect(50, tableY, 495, blockHeight).fill("#f8fafc");
          } else {
            doc.rect(50, tableY, 495, blockHeight).fill("#ffffff");
          }
          doc.lineWidth(0.5).strokeColor("#cbd5e1").rect(50, tableY, 495, blockHeight).stroke();

          // STT
          doc.fillColor("#1e293b").font(fontBold).text(`${idx + 1}`, 55, tableY + 8, { width: 30, align: "center" });
          
          // Dịch vụ
          doc.text(item.name, 90, tableY + 6, { width: 230, align: "left" });
          if (item.desc) {
            doc.fillColor("#64748b").font(fontReg).fontSize(7.5).text(item.desc, 90, tableY + 16, { width: 230, align: "left" });
          }
          
          doc.fillColor("#1e293b").font(fontReg).fontSize(8.5);
          // Qty
          doc.text(`${item.qty}`, 325, tableY + 8, { width: 30, align: "center" });
          // Price
          doc.text(formatCurrency(item.price), 360, tableY + 8, { width: 80, align: "right" });
          // Total
          doc.font(fontBold).text(formatCurrency(item.total), 445, tableY + 8, { width: 95, align: "right" });

          tableY += blockHeight;
        });
      }

      // --- CALCULATED SUMMARY CARD ---
      tableY += 8;
      
      const summaryW = 200;
      doc.save();
      doc.rect(345, tableY, 200, 75).fill("#f8fafc");
      doc.lineWidth(0.5).strokeColor("#e2e8f0").rect(345, tableY, 200, 75).stroke();
      doc.restore();

      doc.fillColor("#475569").font(fontReg).fontSize(8);
      // Tạm tính row
      doc.text("Tạm tính dịch vụ:", 355, tableY + 10);
      doc.font(fontBold).text(formatCurrency(quotation.subtotal), 430, tableY + 10, { align: "right", width: 105 });
      
      // Chiết khấu row
      doc.font(fontReg).text(`Chiết khấu (${quotation.discountPercent}%):`, 355, tableY + 25);
      doc.font(fontBold).text(`-${formatCurrency(quotation.discountValue)}`, 430, tableY + 25, { align: "right", width: 105 });
      
      // VAT row
      doc.font(fontReg).text(`Thuế GTGT VAT (${quotation.vatPercent}%):`, 355, tableY + 40);
      doc.font(fontBold).text(`+${formatCurrency(quotation.vatValue)}`, 430, tableY + 40, { align: "right", width: 105 });
      
      // Line
      doc.lineWidth(0.5).strokeColor("#cbd5e1").moveTo(355, tableY + 54).lineTo(535, tableY + 54).stroke();

      // Tổng Tiền row
      doc.fillColor(primaryColor).font(fontBold).fontSize(9.5).text("CỘNG THANH TOÁN:", 355, tableY + 58);
      doc.fontSize(10).text(formatCurrency(quotation.totalAmount), 430, tableY + 58, { align: "right", width: 105 });

      // Ghi chú block on the left
      if (quotation.notes) {
        doc.fillColor(secondaryColor).font(fontBold).fontSize(8).text("Ghi chú & Thỏa thuận hợp tác bổ sung:", 50, tableY + 2);
        doc.fillColor("#475569").font(fontReg).fontSize(7.5).text(quotation.notes, 50, tableY + 12, { width: 280, align: "justify", lineGap: 3 });
      }

      // --- PAYMENT GATEWAY & AUTHORIZATION STAMP ROW ---
      const footerY = Math.max(tableY + 95, 540);

      // Left Column: Payment QR & Info
      doc.rect(50, footerY - 5, 230, 115).fill("#f1f5f9");
      doc.lineWidth(0.5).strokeColor("#cbd5e1").rect(50, footerY - 5, 230, 115).stroke();
      
      doc.fillColor(primaryColor).font(fontBold).fontSize(8.5).text("HƯỚNG DẪN GIAO DỊCH CHUYỂN KHOẢN SỐ", 60, footerY + 5);
      doc.fillColor("#1e293b").font(fontReg).fontSize(7.5);
      doc.text("• Ngân hàng: Quân Đội MB Bank (Chi nhánh Hồ Chí Minh)", 60, footerY + 18);
      doc.text("• Số Tài khoản: 0963484365", 60, footerY + 28);
      doc.text("• Chủ tài khoản: VO THI THUY", 60, footerY + 38);
      doc.text(`• Nội dung chuyển khoản:\n  Thanh Toan Bao Gia ${quotation.code}`, 60, footerY + 48, { width: 120 });
      doc.font(fontReg).fontSize(6.5).fillColor("#64748b").text("(Nhân viên tư vấn sẽ kết nối duyệt ngay khi nhận thông báo có)", 60, footerY + 77, { width: 120 });

      if (qrBuffer) {
        // Embed the MB Bank QR code perfectly!
        doc.image(qrBuffer, 185, footerY + 15, { width: 85, height: 85 });
      } else {
        // Redraw a high-contrast elegant vector QR placeholder if offline
        doc.save();
        doc.rect(190, footerY + 17, 75, 75).fill("#e2e8f0");
        doc.fillColor("#1e293b").font(fontBold).fontSize(6.5);
        doc.text("SCAN TO PAY\nMB BANK", 190, footerY + 45, { width: 75, align: "center" });
        doc.restore();
      }

      // Right Column: Organization Stamp Sign
      const sigX = 350;
      doc.fillColor(secondaryColor).font(fontBold).fontSize(8.5).text("ĐẠI DIỆN TOLUCK AGENCY (PHÊ DUYỆT)", sigX, footerY + 5, { align: "center", width: 195 });
      doc.fillColor("#64748b").font(fontReg).fontSize(7.5).text("Giám Đốc Ban Điều Hành Thẩm Định", sigX, footerY + 16, { align: "center", width: 195 });

      // Circular Seal (Red Stamp) & Blue Ink Signature
      const stampX = sigX + 115;
      const stampY = footerY + 60;
      
      // Let's print out the company's circular dynamic seal using vector graphic code
      doc.save();
      doc.circle(stampX, stampY, 41).lineWidth(2).strokeColor("#e11d48").stroke();
      doc.circle(stampX, stampY, 39).lineWidth(0.5).strokeColor("#e11d48").stroke();
      
      doc.fillColor("#e11d48");
      
      // Concentric circles center text
      doc.font(fontBold).fontSize(10).text("TOLUCK", stampX - 22, stampY - 14, { width: 44, align: "center" });
      doc.font(fontBold).fontSize(5.5).text("0317974259", stampX - 25, stampY + 1, { width: 50, align: "center" });
      doc.font(fontBold).fontSize(5.5).text("S.D.N", stampX - 25, stampY - 24, { width: 50, align: "center" });
      
      // Curved-style circular text mapping (done gracefully as layered multi-align arcs)
      doc.font(fontBold).fontSize(5.5);
      doc.text("CÔNG TY TNHH", stampX - 35, stampY - 33, { width: 70, align: "center" });
      doc.text("PHÁT TRIỂN & CÔNG NGHỆ", stampX - 35, stampY - 8, { width: 70, align: "center" });
      doc.text("QUẬN 1 - TP. HỒ CHÍ MINH", stampX - 35, stampY + 24, { width: 70, align: "center" });
      doc.restore();

      // Fluid interactive digital ink-blue signature Võ Thị Thúy
      const inkX = sigX + 45;
      const inkY = footerY + 42;
      
      doc.save();
      doc.strokeColor("#2b6cb0").lineWidth(1.8);
      doc.moveTo(inkX, inkY + 18)
         .quadraticCurveTo(inkX + 14, inkY - 6, inkX + 28, inkY + 4)
         .quadraticCurveTo(inkX + 42, inkY + 16, inkX + 54, inkY - 12)
         .quadraticCurveTo(inkX + 66, inkY + 8, inkX + 78, inkY + 18)
         .stroke();
      doc.restore();

      // Footer Text names under the stamp
      doc.fillColor("#1e293b").font(fontBold).fontSize(9).text("Võ Thị Thúy", sigX, footerY + 95, { align: "center", width: 195 });

      // --- PAGE FOOTER & PAGES SYSTEM ---
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        doc.lineWidth(0.5).strokeColor("#cbd5e1").moveTo(50, 788).lineTo(545, 788).stroke();
        doc.font(fontReg).fontSize(7.5).fillColor("#94a3b8");
        doc.text(`TOLUCK AGENCY — www.toluck.com.vn  |  Quản trị viên: ${companyPhone}`, 50, 794, { align: "left" });
        doc.text(`Trang ${i + 1} / ${totalPages}`, 50, 794, { align: "right", width: 495 });
      }

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

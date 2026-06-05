import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { SurveyData, AIReport } from "./src/types";

// Helper function to guarantee Vietnamese rendering fonts
async function fetchWithFallback(urls: string[], destination: string): Promise<boolean> {
  // Check if file exists and is valid (> 10KB)
  if (fs.existsSync(destination)) {
    const stats = fs.statSync(destination);
    if (stats.size > 10000) {
      console.log(`[Font Engine] Valid font already exists at ${destination} (size: ${stats.size} bytes)`);
      return true;
    } else {
      console.warn(`[Font Engine] Existing font at ${destination} is corrupted or too small (${stats.size} bytes). Re-downloading...`);
      try {
        fs.unlinkSync(destination);
      } catch (err) {}
    }
  }

  for (const url of urls) {
    try {
      console.log(`[Font Engine] Attempting to download font from: ${url}`);
      const res = await fetch(url);
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        if (buffer.byteLength > 10000) {
          fs.writeFileSync(destination, Buffer.from(buffer));
          console.log(`[Font Engine] Successfully downloaded and saved to ${destination} (${buffer.byteLength} bytes)`);
          return true;
        } else {
          console.warn(`[Font Engine] Downloaded file from ${url} is too small (${buffer.byteLength} bytes). Trying next mirror.`);
        }
      } else {
        console.warn(`[Font Engine] Fetch from ${url} returned status: ${res.status}`);
      }
    } catch (e: any) {
      console.error(`[Font Engine] Error downloading from ${url}:`, e.message || String(e));
    }
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
    "https://raw.githubusercontent.com/google/fonts/main/ofl/roboto/static/Roboto-Regular.ttf",
    "https://raw.githubusercontent.com/googlefonts/roboto/main/src/hinted/Roboto-Regular.ttf",
    "https://raw.githubusercontent.com/google/fonts/main/ofl/roboto/Roboto-Regular.ttf"
  ];

  const boldUrls = [
    "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/roboto/static/Roboto-Bold.ttf",
    "https://raw.githubusercontent.com/google/fonts/main/ofl/roboto/static/Roboto-Bold.ttf",
    "https://raw.githubusercontent.com/googlefonts/roboto/main/src/hinted/Roboto-Bold.ttf",
    "https://raw.githubusercontent.com/google/fonts/main/ofl/roboto/Roboto-Bold.ttf"
  ];

  const regularOk = await fetchWithFallback(regularUrls, regularFontPath);
  const boldOk = await fetchWithFallback(boldUrls, boldFontPath);

  return {
    regular: regularOk && fs.existsSync(regularFontPath) ? regularFontPath : "",
    bold: boldOk && fs.existsSync(boldFontPath) ? boldFontPath : ""
  };
}

export async function generatePDF(survey: SurveyData, report: AIReport): Promise<Buffer> {
  const fonts = await ensureFonts();

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 55, bottom: 65, left: 55, right: 55 },
        bufferPages: true // Allows dynamic page numbering in footer
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      // Font registration
      let hasCustomFont = false;
      if (fonts.regular && fonts.bold) {
        doc.registerFont("Regular", fonts.regular);
        doc.registerFont("Bold", fonts.bold);
        hasCustomFont = true;
      }

      const fontReg = hasCustomFont ? "Regular" : "Helvetica";
      const fontBold = hasCustomFont ? "Bold" : "Helvetica-Bold";

      const titleColor = "#0f172a"; // Deep Slate Blue
      const brandBlue = "#2563eb";  // Interactive Blue
      const textColor = "#334155";  // Charcoal
      const lightBg = "#f8fafc";    // Muted off-white

      // ----------------- PAGE 1: PROFESSIONAL COVER PAGE -----------------
      // Decorative header accent bar
      doc.rect(0, 0, 595.28, 15).fill(brandBlue);

      // Top Brand Branding
      doc.fillColor(brandBlue);
      doc.font(fontBold).fontSize(20).text("TOLUCK", 55, 60, { continued: true });
      doc.fillColor("#0f172a").text(" AGENCY");
      
      doc.fontSize(8).font(fontBold).fillColor("#64748b").text("KIẾN TẠO CHIẾN LƯỢC TIẾP THỊ SỐ", 55, 85, { characterSpacing: 1.5 });
      
      // Divider
      doc.lineWidth(1).strokeColor("#e2e8f0").moveTo(55, 110).lineTo(540, 110).stroke();

      // Report Main Title
      doc.font(fontBold).fontSize(26).fillColor(titleColor).text("BÁO CÁO PHÂN TÍCH", 55, 190);
      doc.text("SỨC KHỎE MARKETING", 55, 225, { characterSpacing: 1 });
      doc.fontSize(14).font(fontReg).fillColor(brandBlue).text("Tư vấn & Hoạch định Chiến lược Chuyển Đổi Số Marketing", 55, 270);

      // Corporate Info Card (Filled Box)
      doc.rect(55, 340, 485.28, 130).fill(lightBg);
      
      doc.fillColor(titleColor).font(fontBold).fontSize(11).text("THÔNG TIN DOANH NGHIỆP KHẢO SÁT", 75, 360);
      
      doc.font(fontBold).fontSize(10).fillColor("#1e293b").text("Doanh nghiệp: ", 75, 385, { continued: true });
      doc.font(fontReg).text(survey.company_name || "(Đầu tác)");
      
      doc.font(fontBold).text("Đại diện: ", 75, 403, { continued: true });
      doc.font(fontReg).text(`${survey.contact_name || "Quý khách hàng"} (${survey.position || "Người chủ hành"})`);
      
      doc.font(fontBold).text("Mô hình hoạt động: ", 75, 421, { continued: true });
      doc.font(fontReg).text(survey.business_model || "Hoạt động trực tiếp", { width: 330, height: 35 });

      // Footer Cover Info
      doc.font(fontReg).fontSize(10).fillColor("#475569").text(`Hệ thống chẩn đoán: TOLUCK AI Engine (v1.3)`, 55, 630);
      doc.text(`Thời gian thiết lập: ${new Date().toLocaleDateString("vi-VN")}`, 55, 648);
      doc.text("Website: toluck.com.vn  |  Hotline: 0963 484 365", 55, 666);
      
      // Right bottom decorative polygon
      doc.save();
      doc.rect(480, 680, 120, 120).fill("#1e293b");
      doc.restore();


      // ----------------- PAGE 2: KEY CORE METRICS & SWOT -----------------
      doc.addPage();
      
      // Page Title
      doc.font(fontBold).fontSize(16).fillColor(titleColor).text("I. CHỈ SỐ TIẾP THỊ & ĐÁNH GIÁ SỨC KHỎE", 55, 55);
      doc.lineWidth(1).strokeColor("#cbd5e1").moveTo(55, 75).lineTo(540, 75).stroke();

      // Score Blocks Side-by-Side
      // Readiness Score
      doc.rect(55, 95, 235, 80).fill("#f0fdf4");
      doc.lineWidth(1).strokeColor("#bbf7d0").rect(55, 95, 235, 80).stroke();
      doc.fillColor("#15803d").font(fontBold).fontSize(9).text("ĐỘ SẴN SÀNG MARKETING", 75, 110, { characterSpacing: 0.5 });
      doc.fontSize(28).text(`${report.readinessScore || 0}`, 75, 125, { continued: true });
      doc.fontSize(14).font(fontReg).text("/100");

      // Maturity Grade
      doc.rect(305, 95, 235, 80).fill("#fffbeb");
      doc.lineWidth(1).strokeColor("#fef08a").rect(305, 95, 235, 80).stroke();
      doc.fillColor("#b45309").font(fontBold).fontSize(9).text("PHÂN HẠNG TRƯỞNG THÀNH", 325, 110, { characterSpacing: 0.5 });
      doc.fontSize(14).text(`Hạng ${report.maturityGrade || "B"}`, 325, 125);

      // Section SWOT Matrix title
      doc.font(fontBold).fontSize(12).fillColor(titleColor).text("MA TRẬN SWOT CHIẾN LƯỢC DOANH NGHIỆP", 55, 205);

      const renderSwotToPDFList = (title: string, items: string[] | undefined, x: number, y: number, w: number, h: number, bg: string, accent: string, textCol: string) => {
        doc.save();
        doc.rect(x, y, w, h).fill(bg);
        doc.lineWidth(0.5).strokeColor(accent).rect(x, y, w, h).stroke();
        doc.rect(x, y, w, 4).fill(accent); // Beautiful Top emphasis lines
        doc.restore();

        doc.fillColor(textCol).font(fontBold).fontSize(9).text(title, x + 12, y + 12);
        
        let startY = y + 30;
        const list = items || [];
        if (list.length === 0) {
          doc.fillColor("#94a3b8").font(fontReg).fontSize(8.5).text("• Đang cập nhật...", x + 12, startY);
        } else {
          list.forEach((item) => {
            if (startY < y + h - 15) {
              doc.fillColor("#334155").font(fontReg).fontSize(8).text(`• ${item}`, x + 12, startY, { width: w - 24, align: "justify" });
              startY += 26; // Height increments
            }
          });
        }
      };

      // 4 SWOT Quad Boxes
      const boxW = 237;
      const boxH = 120;
      
      // Top row: Strengths (green), Weaknesses (red)
      renderSwotToPDFList("ĐIỂM MẠNH (STRENGTHS)", report.swotAnalysis?.strengths, 55, 230, boxW, boxH, "#ecfdf5", "#10b981", "#065f46");
      renderSwotToPDFList("ĐIỂM YẾU (WEAKNESSES)", report.swotAnalysis?.weaknesses, 303, 230, boxW, boxH, "#fef2f2", "#ef4444", "#991b1b");
      
      // Bottom row: Opportunities (blue), Threats (orange)
      renderSwotToPDFList("CƠ HỘI (OPPORTUNITIES)", report.swotAnalysis?.opportunities, 55, 365, boxW, boxH, "#eff6ff", "#3b82f6", "#1e3a8a");
      renderSwotToPDFList("THÁCH THỨC (THREATS)", report.swotAnalysis?.threats, 303, 365, boxW, boxH, "#fffbeb", "#f59e0b", "#78350f");


      // ----------------- PAGE 3: HOẠCH ĐỊNH KÊNH & LỖ TRÌNH CHIẾN LƯỢC -----------------
      doc.addPage();
      doc.font(fontBold).fontSize(16).fillColor(titleColor).text("II. HOẠCH ĐỊNH KÊNH TRUYỀN THÔNG & CHIẾN LƯỢC", 55, 55);
      doc.lineWidth(1).strokeColor("#cbd5e1").moveTo(55, 75).lineTo(540, 75).stroke();

      doc.font(fontBold).fontSize(11).fillColor(titleColor).text("A. MA TRẬN PHÂN BỔ KÊNH QUẢNG CÁO ƯU TIÊN", 55, 95);

      let channelY = 115;
      const channels = report.channelStrategy || [];
      
      if (channels.length === 0) {
        doc.font(fontReg).fontSize(10).fillColor("#64748b").text("Chưa hoạch định đề xuất phân bổ kênh trực tiếp.", 55, channelY);
        channelY += 20;
      } else {
        channels.slice(0, 4).forEach((ch) => {
          // Priority Indicator Tag Accent
          const priority = ch.priority || "Trung bình";
          const priorityBg = priority === "Cao" ? "#fef2f2" : priority === "Trung bình" ? "#fffbeb" : "#ecfdf5";
          const priorityColor = priority === "Cao" ? "#dc2626" : priority === "Trung bình" ? "#d97706" : "#16a34a";

          doc.save();
          // Container
          doc.rect(55, channelY, 485, 54).fill("#f8fafc");
          doc.lineWidth(0.5).strokeColor("#e2e8f0").rect(55, channelY, 485, 54).stroke();
          // Priority Tag inside container
          doc.rect(395, channelY + 15, 120, 24).fill(priorityBg);
          doc.lineWidth(0.5).strokeColor(priorityColor).rect(395, channelY + 15, 120, 24).stroke();
          doc.restore();

          // Left border accent
          doc.rect(55, channelY, 4, 54).fill(brandBlue);

          // Name and Details
          doc.font(fontBold).fontSize(10).fillColor(titleColor).text(ch.channelName || "Đang cập nhật", 70, channelY + 10);
          doc.font(fontReg).fontSize(8.5).fillColor(textColor).text(`Lý do phân bổ: ${ch.reason || "Phân tích tự động"}`, 70, channelY + 23, { width: 310, height: 11 });
          doc.font(fontReg).fontSize(8.5).fillColor(brandBlue).text(`Hành động ưu tiên: ${ch.actionRequired || "Cần tối ưu"}`, 70, channelY + 36, { width: 310, height: 11 });

          // Badge Text
          doc.font(fontBold).fontSize(8).fillColor(priorityColor).text(`Độ ưu tiên: ${priority.toUpperCase()}`, 395, channelY + 23, { width: 120, align: "center" });

          channelY += 62;
        });
      }

      // Pain Points Section
      doc.font(fontBold).fontSize(11).fillColor(titleColor).text("B. PHƯƠNG ÁN KHẮC PHỤC ĐIỂM ĐAU CỦA DOANH NGHIỆP", 55, channelY + 10);
      
      let painY = channelY + 30;
      const painPoints = report.painPointSolutions || [];
      
      if (painPoints.length === 0) {
        doc.font(fontReg).fontSize(9).fillColor("#64748b").text("Hệ thống chưa ghi nhận điểm đau trọng tâm.", 55, painY);
      } else {
        painPoints.slice(0, 3).forEach((p) => {
          doc.save();
          doc.rect(55, painY, 485, 48).fill("#fffbfb");
          doc.lineWidth(0.5).strokeColor("#fecaca").rect(55, painY, 485, 48).stroke();
          doc.restore();

          doc.rect(55, painY, 4, 48).fill("#dc2626"); // Red warning bar

          doc.font(fontBold).fontSize(8.5).fillColor("#991b1b").text(`Điểm đau khó khăn: ${p.painPoint || "Đang phân tích"}`, 70, painY + 10, { width: 450, height: 15 });
          doc.font(fontReg).fontSize(8.5).fillColor("#0f172a").text(`Giải cấu trúc từ TOLUCK: ${p.solution || "Đang tối ưu hóa"}`, 70, painY + 24, { width: 450, height: 20 });

          painY += 56;
        });
      }


      // ----------------- PAGE 4: DETAILED ACTION ITEMS & CONCLUSION -----------------
      doc.addPage();
      doc.font(fontBold).fontSize(16).fillColor(titleColor).text("III. KHUYẾN NGHỊ HÀNH ĐỘNG & Ý KIẾN CHUYÊN GIA", 55, 55);
      doc.lineWidth(1).strokeColor("#cbd5e1").moveTo(55, 75).lineTo(540, 75).stroke();

      doc.font(fontBold).fontSize(11).fillColor(titleColor).text("A. LỘ TRÌNH 5 HÀNH ĐỘNG TRIỂN KHAI NHANH", 55, 95);

      let recY = 115;
      const recommendations = report.recommendations || [];
      if (recommendations.length === 0) {
        doc.font(fontReg).fontSize(10).fillColor("#64748b").text("Chưa tổng hợp khuyến nghị tối ưu.", 55, recY);
        recY += 20;
      } else {
        recommendations.forEach((rec, index) => {
          // Circular step number SVG equivalent
          doc.save();
          doc.circle(70, recY + 8, 8).fill(brandBlue);
          doc.restore();
          
          doc.font(fontBold).fontSize(8).fillColor("#ffffff").text(`${index + 1}`, 62, recY + 4, { width: 16, align: "center" });

          doc.font(fontReg).fontSize(9.5).fillColor(textColor).text(rec, 90, recY + 2, { width: 450, align: "justify" });
          
          recY += 34; // Spacing logic
        });
      }

      // Board Advisor Callout Block
      doc.font(fontBold).fontSize(11).fillColor(titleColor).text("B. Ý KIẾN ĐÁNH GIÁ CHUYÊN BIỆT TỪ BAN CỐ VẤN TOLUCK", 55, recY + 10);
      
      const opinionText = `"${report.consultantOpinion || "Doanh nghiệp có tiềm năng tăng trưởng rực rỡ nếu chú trọng đồng bộ dữ liệu đa kênh và thiết lập một hạ tầng chuyển đổi tiếp thị số toàn diện."}"`;
      
      doc.font(fontReg).fontSize(9);
      const textWidth = 450;
      const opinionHeight = doc.heightOfString(opinionText, { width: textWidth, lineGap: 3 });
      
      const boxHeight = opinionHeight + 30;
      const valY = recY + 30;

      doc.save();
      doc.rect(55, valY, 485, boxHeight).fill("#f8fafc");
      doc.lineWidth(0.5).strokeColor("#cbd5e1").rect(55, valY, 485, boxHeight).stroke();
      doc.restore();

      doc.rect(55, valY, 4, boxHeight).fill("#0f172a"); // Dark focus bar

      doc.font(fontReg).fontSize(9).fillColor("#1e293b").text(
        opinionText,
        70, valY + 15, { width: textWidth, align: "justify", lineGap: 3 }
      );

      // Contact & Footer Signatures
      const sigY = valY + boxHeight + 25;
      doc.font(fontBold).fontSize(10).fillColor(titleColor).text("ĐẠI DIỆN HỘI ĐỒNG CỐ VẤN CHIẾN LƯỢC TOLUCK", 55, sigY);
      doc.font(fontReg).fontSize(9).fillColor("#64748b").text("Giám đốc Trải nghiệm Khách hàng & Hoạt động Tiếp thị thông minh AI", 55, sigY + 14);

      // Signature Placeholder Graphic Line
      doc.lineWidth(0.5).strokeColor("#94a3b8").moveTo(55, sigY + 54).lineTo(180, sigY + 54).stroke();
      doc.text("HỘI ĐỒNG BAN ĐIỀU HÀNH TOLUCK AGENCY (Đã phê duyệt)", 55, sigY + 60);


      // ----------------- MULTI-PAGE GLOBAL HEADER & FOOTER RENDERER -----------------
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);

        // We bypass numbering and header text for the first page (Cover Page)
        if (i > 0) {
          // Page Header
          doc.font(fontReg).fontSize(8).fillColor("#94a3b8").text("BÁO CÁO SỨC KHỎE MARKETING DOANH NGHIỆP  |  TOLUCK AGENCY", 55, 35);
          doc.lineWidth(0.5).strokeColor("#e2e8f0").moveTo(55, 45).lineTo(540, 45).stroke();

          // Temporarily set bottom margin to 0 to prevent PDFKit from auto-creating a new page for the footer text
          const oldBottomMargin = doc.page.margins.bottom;
          doc.page.margins.bottom = 0;

          // Page Footer lines
          doc.lineWidth(0.5).strokeColor("#e2e8f0").moveTo(55, 792).lineTo(540, 792).stroke();
          doc.font(fontReg).fontSize(8).fillColor("#94a3b8").text(`Trang ${i + 1} / ${totalPages}`, 55, 802, { align: "right", width: 485 });
          doc.text("Tài liệu nghiên cứu đặc quyền thuộc sở hữu của TOLUCK - Nghiêm cấm sao chép trái phép.", 55, 802, { align: "left", width: 485 });

          // Restore original margin
          doc.page.margins.bottom = oldBottomMargin;
        }
      }

      // Finish PDF writing
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

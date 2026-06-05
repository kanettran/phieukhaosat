import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, deleteDoc } from "firebase/firestore";
import { generateEmailHTML } from "./emailTemplate";
import { generatePDF } from "./pdfGenerator";
import { generateQuotationPDF } from "./quotationPdfGenerator";

// Load environment variables from .env
dotenv.config();

// Load .env.example with override to ensure user changes inside .env.example take highest priority
dotenv.config({ path: path.join(process.cwd(), ".env.example"), override: true });

console.log("=== CONFIGURATION ENGINE ===");
console.log("SMTP HOST:", process.env.SMTP_HOST || "(None)");
console.log("SMTP PORT:", process.env.SMTP_PORT || "(None)");
console.log("SMTP USER:", process.env.SMTP_USER || "(None)");
console.log("SMTP FROM:", process.env.SMTP_FROM || "(None)");
console.log("SMTP PASS:", process.env.SMTP_PASS ? "********" : "(None)");
console.log("============================");

// Ensure lazy initialization or fallback to avoid crash on start if key is undefined
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  const emailLogs: any[] = [];

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Route: Submit survey data to the webhook
  app.post("/api/submit-webhook", async (req, res) => {
    const { webhookUrl, payload } = req.body;
    if (!webhookUrl) {
      return res.status(400).json({ error: "Webhook URL is required" });
    }

    try {
      console.log(`Forwarding survey to webhook: ${webhookUrl}`, payload);
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { text: responseText };
      }

      res.json({
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      });
    } catch (error: any) {
      console.error("Error posting to webhook:", error);
      res.status(500).json({
        error: "Failed to post to webhook",
        message: error.message || String(error),
      });
    }
  });

  // API Route: Generate local AI assessment report using Gemini 3.5 Flash
  app.post("/api/generate-report", async (req, res) => {
    const payload = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(400).json({
        error: "Missing Gemini API Key",
        message: "Vui lòng cấu hình GEMINI_API_KEY trong bảng điều khiển Secrets của AI Studio để mở khóa tính năng Phân tích AI tức thì."
      });
    }

    // Auth and Limits check
    const user = getSimulatedUser(req);
    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Vui lòng đăng ký tài khoản hoặc đăng nhập để tiếp tục nhận phân tích chiến lược từ TOLUCK AI."
      });
    }

    const db = await readCmsDb();
    const dbUser = db.users.find((u: any) => u.email?.toLowerCase() === user.email?.toLowerCase());
    if (dbUser) {
      // Check limits for non-admin/non-employee roles
      if (dbUser.role !== "ADMIN" && dbUser.role !== "CEO" && dbUser.role !== "NHÂN VIÊN") {
        const userCrms = db.crms.filter((c: any) => c.email?.toLowerCase() === dbUser.email?.toLowerCase());
        const limitCount = dbUser.limits?.surveys || 2;
        if (userCrms.length >= limitCount) {
          return res.status(403).json({
            error: "QuotaExceeded",
            message: `Tài khoản của bạn (${dbUser.email}) đã đạt giới hạn khảo sát/AI Audit tối đa (${limitCount} lần). Vui lòng nâng cấp tài khoản hoặc liên hệ quản trị viên.`
          });
        }
      }
    }

    try {
      const prompt = `Bạn là chuyên gia tư vấn chiến lược Marketing và Chuyển đổi số cấp cao của TOLUCK Agency.
Hãy phân tích dữ liệu khảo sát của doanh nghiệp dưới đây và lập một Báo cáo phân tích chuyên nghiệp bằng tiếng Việt.

Thông tin doanh nghiệp khảo sát:
- Tên doanh nghiệp: ${payload.company_name}
- Lĩnh vực kinh doanh: ${payload.industry}
- Năm thành lập: ${payload.year_established}
- Quy mô nhân sự: ${payload.employee_count}
- Website: ${payload.website} | Fanpage: ${payload.fanpage}
- Người liên hệ: ${payload.contact_name} (${payload.position}) - Email: ${payload.email} - Phone: ${payload.phone}

Hiện trạng kinh doanh và marketing:
- Sản phẩm/mô hình hoạt động: ${payload.business_model}
- Khách hàng mục tiêu: ${payload.target_customer}
- Doanh thu hàng tháng: ${payload.revenue}
- Mục tiêu 12 tháng tới: ${payload.goal}
- Cách hoạt động marketing hiện tại: ${payload.marketing_status}
- Ngân sách marketing: ${payload.marketing_budget}
- Kênh đang dùng: ${JSON.stringify(payload.channels)}
- Khó khăn lớn nhất đang gặp: ${JSON.stringify(payload.pain_points)}

Sức mạnh Thương hiệu và Hạ tầng:
- Điểm mạnh lớn nhất: ${payload.strengths}
- Điểm khác biệt (USP): ${payload.unique_selling_point}
- Đối thủ cạnh tranh: ${payload.competitors}
- Định vị thương hiệu mong muốn: ${payload.brand_positioning}
- Các tài sản Digital có sẵn: ${JSON.stringify(payload.digital_assets)}
- Công cụ theo dõi đã cấu hình: ${JSON.stringify(payload.tracking_tools)}

Kế hoạch hợp tác với TOLUCK:
- Dịch vụ mong muốn: ${JSON.stringify(payload.services_needed)}
- Ngân sách hợp tác dự kiến: ${payload.service_budget}

Hãy thực hiện phân tích chi tiết và trả về phản hồi dưới định dạng JSON khớp chính xác cấu trúc sau. Tuyệt đối không chứa thêm bất kỳ phần văn bản thừa thãi nào ngoài JSON thuần để phía server parse được chính xác.

Cấu trúc JSON yêu cầu:
{
  "readinessScore": <số nguyên từ 1 đến 100 thể hiện mức độ sẵn sàng marketing hiện tại>,
  "maturityGrade": "<A+ | A | B | C | D>",
  "swotAnalysis": {
    "strengths": [<3 điểm mạnh cốt lõi dạng string>],
    "weaknesses": [<3 điểm yếu hiện hữu dạng string>],
    "opportunities": [<3 cơ hội chiến lược cực lớn dạng string>],
    "threats": [<3 mối đe dọa hoặc rủi ro dạng string>]
  },
  "scoreBreakdown": {
    "infrastructure": <số từ 1-100 tương ứng chất lượng hạ tầng>,
    "budget": <số từ 1-100 tương ứng mức phân bổ vốn/sự tương thích ngân sách>,
    "strategy": <số từ 1-100 tương ứng tính rõ ràng mục tiêu>,
    "branding": <số từ 1-100 tương ứng định vị thương hiệu hiện tại>
  },
  "channelStrategy": [
    {
      "channelName": "<Tên kênh phù hợp, vd: Facebook Ads, SEO, TikTok Shop, CRM...>",
      "priority": "<Cao | Trung bình | Thấp>",
      "reason": "<Giải thích vì sao kênh này phù hợp>",
      "actionRequired": "<Hành động kỹ thuật cần triển khai ngay>"
    }
  ],
  "painPointSolutions": [
    {
      "painPoint": "<Phân tích điểm đau của doanh nghiệp>",
      "solution": "<Phương án khắc phục cụ thể từ TOLUCK>"
    }
  ],
  "recommendations": [<3-5 đề xuất hành động tối ưu hóa hiệu quả nhanh chóng>],
  "consultantOpinion": "<Đánh giá sắc bén, khách quan, giàu kinh nghiệm của chuyên gia của TOLUCK về triển vọng dự án>"
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text || "{}";
      const cleanedText = responseText.trim().replace(/^```json/, "").replace(/```$/, "").trim();
      const report = JSON.parse(cleanedText);

      try {
        const creatorBranch = user ? (user.branch || "Tổng bộ TOLUCK") : "Tổng bộ TOLUCK";
        await registerLeadFromSurvey(payload, report, creatorBranch);
      } catch (dbErr) {
        console.error("Failed to automatically record lead in CMS database:", dbErr);
      }

      res.json(report);
    } catch (error: any) {
      console.error("Error generating report with Gemini:", error);
      res.status(500).json({
        error: "Failed to generate report",
        message: error.message || String(error),
      });
    }
  });

  // API Route: Record/Synchronize a survey submission directly to CRM database
  app.post("/api/record-lead", async (req, res) => {
    const { surveyData, reportData } = req.body;
    if (!surveyData) {
      return res.status(400).json({ error: "Missing surveyData payload" });
    }

    try {
      console.log(`[API /api/record-lead] Manually recording client lead for: ${surveyData.contact_name} - ${surveyData.company_name}`);
      const user = getSimulatedUser(req);
      const creatorBranch = user ? (user.branch || "Tổng bộ TOLUCK") : "Tổng bộ TOLUCK";
      await registerLeadFromSurvey(surveyData, reportData, creatorBranch);
      res.json({ success: true, message: "Lead synchronized successfully inside CMS database." });
    } catch (err: any) {
      console.error("Error recording manual lead via API:", err);
      res.status(500).json({
        error: "Failed to record CRM lead",
        message: err.message || String(err)
      });
    }
  });

  // --- STATIC HIGH-QUALITY TEST DATA PAYLOADS ---
  const testSurveyData = {
    company_name: "Công ty Cổ phần Công nghệ TOLUCK Việt Nam",
    website: "https://toluck.com.vn",
    fanpage: "https://facebook.com/toluck.agency",
    industry: "Cung cấp Giải pháp Bán lẻ & Công nghệ số",
    year_established: "2020",
    employee_count: "50-100 người",
    contact_name: "Trần Thế Hùng",
    position: "Giám đốc Dự án",
    email: "hungtran.kanet@gmail.com",
    phone: "0963484365",
    business_model: "B2B & B2C Kết hợp",
    target_customer: "Các doanh nghiệp SMEs và chuỗi cửa hàng bán lẻ",
    revenue: "10 - 50 tỷ VNĐ / năm",
    goal: "Mở rộng nhận diện thương hiệu số, tăng trưởng tệp khách hàng tự động và chuyển đổi tối thiểu 20% lượng organic traffic.",
    marketing_status: "Đã có phòng ban marketing cơ bản nhưng chưa đồng bộ hóa dữ liệu và vận hành thiếu nhất quán.",
    channels: ["Facebook Ads", "Google Search", "Zalo OA", "Email Marketing"],
    marketing_budget: "50 - 100 triệu VNĐ / tháng",
    pain_points: [
      "Chi phí quảng cáo ngày càng tăng nhưng tỷ lệ chuyển đổi đơn hàng giảm rõ rệt",
      "Không quản lý được dữ liệu insight khách hàng tập trung gây lãng phí Lead",
      "Thiếu quy trình chăm sóc khách hàng tự động (Automation marketing) sau bán"
    ],
    strengths: "Có sản phẩm công nghệ chất lượng cao độc bản, đội ngũ kỹ thuật mạnh mẽ và có sẵn nền tảng website tối ưu SEO.",
    unique_selling_point: "Hệ sinh thái phần mềm quản lý tích hợp chuyển đổi số tiếp thị thông minh đầu tiên tại Việt Nam.",
    competitors: "Các đơn vị ERP nước ngoài và một số đơn vị phần mềm SAAS nội địa.",
    brand_positioning: "Thương hiệu giải pháp công nghệ đi đầu về trải nghiệm khách hàng tiện lợi.",
    digital_assets: ["Website tối ưu", "Hệ thống CRM nội bộ", "Mạng xã hội đa nền tảng"],
    tracking_tools: ["Google Analytics 4", "Facebook Pixel"],
    services_needed: ["Tư vấn chiến lược tổng thể", "Vận hành quảng cáo đa kênh", "Thiết lập Automation Marketing CRM"],
    service_budget: "100 - 150 triệu VNĐ / toàn chiến dịch"
  };

  const testReportData = {
    readinessScore: 78,
    maturityGrade: "A",
    swotAnalysis: {
      strengths: [
        "Có hệ sinh thái giải pháp độc bản ưu việt.",
        "Đội ngũ kỹ thuật có chuyên môn sâu, làm chủ công nghệ lõi.",
        "Sở hữu lượng data khách hàng lịch sử tiềm năng lớn."
      ],
      weaknesses: [
        "Kiến thức vận hành digital marketing đa kênh của nhân sự còn mỏng.",
        "Chưa có hạ tầng xử lý dữ liệu tập trung (CDP/CRM).",
        "Hệ thống marketing automation chưa được kích hoạt."
      ],
      opportunities: [
        "Thị trường SMEs đang tăng tốc chuyển đổi số mạnh mẽ.",
        "Xu hướng marketing dựa trên dữ liệu cá nhân hóa phát triển.",
        "Nguồn cung quảng cáo tự động hóa chi phí thấp khả dụng."
      ],
      threats: [
        "Sự cạnh tranh từ các đối thủ lớn nước ngoài có ngân sách mạnh.",
        "Các thuật toán phân phối nội dung mạng xã hội bão hòa liên tục.",
        "Chi phí thầu từ khóa Google Search tăng cao."
      ]
    },
    scoreBreakdown: {
      infrastructure: 75,
      budget: 80,
      strategy: 85,
      branding: 72
    },
    channelStrategy: [
      {
        channelName: "Facebook Ads & Remarketing",
        priority: "Cao",
        reason: "Tệp khách hàng mục tiêu hoạt động hành vi cao trên nền tảng mạng xã hội này, thích hợp tạo phễu ban đầu.",
        actionRequired: "Sản xuất video ngắn trải nghiệm thực tế và chạy phễu remarketing đuổi bám."
      },
      {
        channelName: "Inbound Marketing & SEO Website",
        priority: "Cao",
        reason: "Giảm phụ thuộc vào quảng cáo trả phí bằng cách giải quyết bài toán tìm kiếm của SMEs.",
        actionRequired: "Xây dựng blog chuyên mục cẩm nang quản lý vận hành bán lẻ thông minh."
      },
      {
        channelName: "Zalo OA & Automation Chăm Sóc",
        priority: "Trung bình",
        reason: "Tỉ lệ mở tin nhắn rất cao, thân thiện với người dùng Việt Nam so với Email.",
        actionRequired: "Thiết lập kịch bản chatbot tự động gửi mã ưu đãi chào mừng khách mua hàng."
      },
      {
        channelName: "Email Marketing nuôi dưỡng Lead",
        priority: "Trung bình",
        reason: "Tiếp cận giám đốc dự án (B2B) trực diện lúc họ đang làm việc trực tuyến.",
        actionRequired: "Gửi báo cáo phân tích ngành định kỳ định dạng infographic hấp dẫn."
      }
    ],
    painPointSolutions: [
      {
        painPoint: "Chi phí quảng cáo ngày càng tăng nhưng tỷ lệ chuyển đổi đơn hàng giảm rõ rệt",
        solution: "Triển khai chiến dịch remarketing đa kênh cá nhân hóa kết hợp tối ưu UX/UI landing page để tối đa hóa số lượt chuyển đổi trên lượng traffic có sẵn."
      },
      {
        painPoint: "Không quản lý được dữ liệu insight khách hàng tập trung gây lãng phí Lead",
        solution: "Đồng bộ hóa toàn bộ phễu đăng ký vào hệ thống CRM mini để phân tích hành vi và phân nhóm khách hàng tự động."
      },
      {
        painPoint: "Thiếu quy trình chăm sóc khách hàng tự động (Automation marketing) sau bán",
        solution: "Thiết lập chuỗi email/SMS chăm sóc tự động 1-3-7 ngày định kỳ sau khi khách hàng trải nghiệm sản phẩm để tăng tỷ lệ tái ký và giới thiệu."
      }
    ],
    recommendations: [
      "Tiến hành chuẩn hóa hạ tầng Website, kiểm tra tính khả dụng của mã theo dõi GA4/Pixel lập tức.",
      "Khởi động chiến dịch quảng cáo hiển thị mục tiêu B2B tập trung vào bài toán tối ưu chi phí.",
      "Xây dựng thư viện tài liệu giải pháp (Lead Magnet) chia sẻ độc quyền hữu ích cho SMEs.",
      "Tổ chức chuẩn hóa dữ liệu CRM để đào tạo đội ngũ sale chuyển đổi lead tốt hơn.",
      "Tích hợp và huấn luyện Chatbot trả lời thông tin sơ bộ ban đầu trong vòng 3 phút."
    ],
    consultantOpinion: "Doanh nghiệp TOLUCK có một nền tảng sản phẩm cực kỳ tốt và tiềm năng phát triển vượt bậc. Tuy nhiên, rào cản lớn nhất hiện tại nằm ở việc marketing đang hoạt động đơn lẻ, các dữ liệu bị đứt gãy. Khi áp dụng chuẩn hóa quy trình tiếp thị tự động và tối ưu hóa chuyển đổi, tối ưu ngân sách truyền thông đa kênh toàn bộ thì hiệu quả tiếp thị số sẽ bùng nổ vượt bậc, tối ưu hóa tới 30-45% ngân sách hiện hữu."
  };

  // API Route: Get pre-built static test payload data
  app.get("/api/test-payload", (req, res) => {
    res.json({
      surveyData: testSurveyData,
      reportData: testReportData
    });
  });

  // API Route: Send HTML strategic report email to customer
  app.post("/api/send-email", async (req, res) => {
    let { surveyData, reportData, useTestData, email: overrideEmail } = req.body;

    if (useTestData) {
      surveyData = {
        ...testSurveyData,
        email: overrideEmail || testSurveyData.email
      };
      reportData = testReportData;
    }

    if (!surveyData || !reportData) {
      return res.status(400).json({ error: "Missing surveyData or reportData" });
    }

    const { email, contact_name, company_name } = surveyData;
    if (!email) {
      return res.status(400).json({ error: "Recipient email is required" });
    }

    try {
      const db = await readCmsDb();
      const config = db.system_config || {};
      const htmlContent = generateEmailHTML(surveyData, reportData, config);
      const subject = `[TOLUCK Agency] Báo cáo tư vấn & Thiết lập chiến dịch Marketing - ${company_name}`;

      // Generate strategic PDF report buffer server-side
      let pdfBuffer: Buffer | null = null;
      try {
        console.log("Generating strategic PDF attachment...");
        pdfBuffer = await generatePDF(surveyData, reportData);
        console.log("PDF generated successfully. Size:", pdfBuffer?.length, "bytes");
      } catch (pdfErr) {
        console.error("Failed to generate PDF attachment:", pdfErr);
      }

      const cleanEnvVal = (val: string | undefined): string => {
        if (!val) return "";
        return val.trim().replace(/^["']|["']$/g, "").trim();
      };

      const smtpHost = cleanEnvVal(process.env.SMTP_HOST);
      const smtpPort = cleanEnvVal(process.env.SMTP_PORT) || "587";
      const smtpUser = cleanEnvVal(process.env.SMTP_USER);
      const smtpPass = cleanEnvVal(process.env.SMTP_PASS);
      const smtpFrom = cleanEnvVal(process.env.SMTP_FROM) || smtpUser || "info@toluck.com.vn";

      let emailSentResult = false;
      let isSimulated = true;
      let infoMessage = "";

      if (smtpHost && smtpUser && smtpPass) {
        console.log(`Attempting real SMTP delivery to ${email} via ${smtpHost}:${smtpPort}`);
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: Number(smtpPort),
          secure: smtpPort === "465",
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          tls: {
            // Fix handshake validation failures for custom SMTP hosting
            rejectUnauthorized: false
          },
          connectionTimeout: 8000,
          greetingTimeout: 8000,
          socketTimeout: 8000
        });

        const attachments = pdfBuffer ? [
          {
            filename: `Bao_cao_marketing_TOLUCK_${company_name.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ] : [];

        const info = await transporter.sendMail({
          from: smtpFrom,
          to: email,
          subject: subject,
          html: htmlContent,
          attachments: attachments
        });

        console.log("Real email sent successfully. Msg ID:", info.messageId);
        emailSentResult = true;
        isSimulated = false;
        infoMessage = `Gửi email thực tế kèm file đính kèm PDF thành công qua máy chủ SMTP! ID tin nhắn: ${info.messageId}`;
      } else {
        console.log(`SMTP not fully configured. Simulating delivery for ${email}`);
        infoMessage = "Đăng chạy chế độ mô phỏng vì chưa điền tài khoản SMTP cấu hình trong Secrets hoặc file .env.";
      }

      // Add to memory list for UI inspection
      const logEntry = {
        id: Math.random().toString(36).substr(2, 9),
        sentAt: new Date().toISOString(),
        to: email,
        subject: subject,
        html: htmlContent,
        isSimulated: isSimulated,
        companyName: company_name,
        contactName: contact_name,
        status: "success",
      };
      
      emailLogs.unshift(logEntry);

      res.json({
        success: true,
        isSimulated: isSimulated,
        message: infoMessage,
        recipient: email,
        log: logEntry,
      });
    } catch (err: any) {
      console.error("Error sending strategic email:", err);
      
      let guidance = "";
      if (err.code === "ETIMEDOUT" || err.message?.toLowerCase().includes("timeout")) {
        guidance = "⚠️ LỖI KẾT NỐI (TIMEOUT):\n" +
                   "1. Hệ thống Email Hosting của bạn (7host / Hostinger) có thể đang CHẶN IP của dải máy chủ Google Cloud để chống spam. Hãy liên hệ nhà cấp Hosting yêu cầu mở chặn / whitelist dải IP Google Cloud.\n" +
                   "2. Hãy thử đổi cấu hình sang SMTP_PORT=\"587\" và xem cổng 587 có thông suốt được hay không.\n" +
                   "3. Nên sử dụng các dịch vụ gửi thư tin cậy chuyên dụng như SendGrid, Resend, Mailgun hoặc SMTP Relay Gsuite để tránh bị chặn IP.";
      } else if (err.code === "EAUTH" || err.message?.toLowerCase().includes("auth")) {
        guidance = "⚠️ LỖI XÁC THỰC TÀI KHOẢN (EAUTH):\n" +
                   "Email gửi (SMTP_USER) hoặc Mật khẩu (SMTP_PASS) của bạn không chính xác. Hoặc tài khoản email doanh nghiệp của bạn yêu cầu mật khẩu ứng dụng riêng (App Password). Hãy tạo mật khẩu ứng dụng.";
      } else {
        guidance = "⚠️ HƯỚNG DẪN KIỂM TRA:\n" +
                   "Vui lòng xác nhận đúng tất cả ký tự trong SMTP_HOST, SMTP_USER, SMTP_PASS ở phần cài đặt bí mật (Secrets) hoặc file môi trường.";
      }

      res.status(500).json({
        success: false,
        error: err.code || "SMTP_ERROR",
        message: `${err.message || String(err)}\n\n👉 HƯỚNG DẪN KHẮC PHỤC:\n${guidance}`
      });
    }
  });

  // API Route: Test SMTP configuration and connection diagnostics
  app.post("/api/test-smtp", async (req, res) => {
    const { testRecipient } = req.body;
    
    const cleanEnvVal = (val: string | undefined): string => {
      if (!val) return "";
      return val.trim().replace(/^["']|["']$/g, "").trim();
    };

    const smtpHost = cleanEnvVal(process.env.SMTP_HOST);
    const smtpPort = cleanEnvVal(process.env.SMTP_PORT) || "587";
    const smtpUser = cleanEnvVal(process.env.SMTP_USER);
    const smtpPass = cleanEnvVal(process.env.SMTP_PASS);
    const smtpFrom = cleanEnvVal(process.env.SMTP_FROM) || smtpUser || "info@toluck.com.vn";

    if (!smtpHost || !smtpUser || !smtpPass) {
      return res.status(400).json({
        success: false,
        error: "Missing SMTP configuration",
        message: "Chưa điền đủ thông số SMTP trong .env hoặc secrets (Cần có SMTP_HOST, SMTP_USER, SMTP_PASS).",
        details: { smtpHost, smtpPort, smtpUser, hasPass: !!smtpPass }
      });
    }

    try {
      console.log(`[Diagnostic] Connecting to SMTP Server ${smtpHost}:${smtpPort} as ${smtpUser}...`);
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort),
        secure: smtpPort === "465",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 8000
      });

      // 1. Verify connection
      await transporter.verify();
      
      let sendResult = "Xác thực tài khoản và kết nối SMTP thành công!";
      
      // 2. Option to send a quick test email
      if (testRecipient) {
        console.log(`[Diagnostic] Sending test email to ${testRecipient}...`);
        const info = await transporter.sendMail({
          from: smtpFrom,
          to: testRecipient,
          subject: "[TOLUCK] Test kết nối và bảo mật SMTP thành công",
          html: `
            <div style="font-family: sans-serif; padding: 24px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 500px; margin: 0 auto;">
              <h2 style="color: #0f172a; margin-top: 0;">Kết nối SMTP thành công! 🎉</h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.5;">Hệ thống email gửi từ cấu hình tên miền của bạn hoạt động rất tốt.</p>
              <div style="background-color: #f1f5f9; padding: 12px; border-radius: 6px; font-size: 12px; font-family: monospace; color: #334155; margin-top: 16px;">
                Mã máy chủ: ${smtpHost}:${smtpPort}<br>
                Tài khoản: ${smtpUser}<br>
                Thời gian: ${new Date().toLocaleString("vi-VN")}
              </div>
              <p style="color: #94a3b8; font-size: 11px; margin-top: 24px; border-t: 1px solid #e2e8f0; padding-top: 12px;">Được gửi tự động từ TOLUCK Agency Marketing Assessor.</p>
            </div>
          `
        });
        sendResult += ` Đã gửi thành công email test tới ${testRecipient}. ID: ${info.messageId}`;
      }

      res.json({
        success: true,
        message: sendResult,
        details: {
          smtpHost,
          smtpPort,
          smtpUser,
          smtpFrom,
          secure: smtpPort === "465"
        }
      });
    } catch (err: any) {
      console.error("[Diagnostic] SMTP test failed:", err);
      
      let guidance = "";
      if (err.code === "ETIMEDOUT" || err.message?.toLowerCase().includes("timeout")) {
        guidance = "⚠️ LỖI KẾT NỐI (TIMEOUT):\n" +
                   "1. Hệ thống Email Hosting của bạn (7host - mx07.7host.vn) có thể đang CHẶN IP dải máy chủ của Google Cloud Run để chống spam. Vui lòng liên hệ bộ phận kỹ thuật của 7host nhờ họ mở chặn (whitelist) cho dải IP máy chủ hoặc tắt lọc IP nguồn tạm thời cho tài khoản email này.\n" +
                   "2. Hãy thử đổi cấu hình sang SMTP_PORT=\"587\" (để chuyển qua giao thức STARTTLS thay vì SMTPS trên cổng 465) và chạy lại chuẩn đoán.\n" +
                   "3. Cân nhắc sử dụng cấu hình SMTP của Google Workspace (Gsuite), SendGrid, Resend (resend.com), hoặc Mailgun có IP tin cậy cao.";
      } else if (err.code === "EAUTH" || err.message?.toLowerCase().includes("auth")) {
        guidance = "⚠️ LỖI XÁC THỰC TÀI KHOẢN (EAUTH):\n" +
                   "Tài khoản (SMTP_USER) hoặc Mật khẩu (SMTP_PASS) không trùng khớp. Nếu bạn dùng cơ chế bảo mật đa lớp, hãy chắc chắn là đã sinh Mật khẩu ứng dụng riêng (App Password) thay vì nhập mật khẩu chính.";
      } else {
        guidance = "⚠️ HƯỚNG DẪN KIỂM TRA:\n" +
                   "Vui lòng xác thực xem đúng chính tả tên miền, tài khoản máy chủ hay chưa.";
      }

      res.status(500).json({
        success: false,
        error: err.code || "SMTP_ERROR",
        message: `${err.message || String(err)}\n\n👉 HƯỚNG DẪN KHẮC PHỤC:\n${guidance}`,
        stack: err.stack,
        command: err.command,
        response: err.response,
        details: {
          smtpHost,
          smtpPort,
          smtpUser,
          smtpFrom
        }
      });
    }
  });

  // API Route: Download PDF on-demand
  app.post("/api/download-pdf", async (req, res) => {
    let { surveyData, reportData, useTestData } = req.body;

    if (useTestData) {
      surveyData = testSurveyData;
      reportData = testReportData;
    }

    if (!surveyData || !reportData) {
      return res.status(400).send("Missing surveyData or reportData");
    }
    try {
      const buffer = await generatePDF(surveyData, reportData);
      const safeCompanyName = (surveyData.company_name || "Doanh_nghiep").replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `Bao_cao_marketing_TOLUCK_${safeCompanyName}.pdf`;
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (err: any) {
      console.error("Error generating PDF download:", err);
      res.status(500).send(`Failed to generate PDF: ${err.message || String(err)}`);
    }
  });

  // API Route: Get local memory email logs for UI console testing
  app.get("/api/email-logs", (req, res) => {
    res.json(emailLogs);
  });


  // =========================================================================
  // ===================== CMS CORE & DATABASE ENGINE ===================
  // =========================================================================
  const DB_PATH = path.join(process.cwd(), "cms_db.json");
  let db: any = null;
  let useFirebase = false;

  // Load configuration from firebase-applet-config.json gracefully
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
      if (
        firebaseConfig &&
        firebaseConfig.projectId &&
        firebaseConfig.apiKey &&
        firebaseConfig.projectId !== "YOUR_PROJECT_ID"
      ) {
        const firebaseApp = initializeApp(firebaseConfig);
        db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
        useFirebase = true;
        console.log("[Cms DB] Successfully registered Firebase configuration metadata.");
      } else {
        console.log("[Cms DB] Empty or dummy Firebase configuration. Operating in 0-cost Local File mode.");
      }
    } else {
      console.log("[Cms DB] firebase-applet-config.json not found. Operating in 0-cost Local File mode.");
    }
  } catch (err: any) {
    console.warn("[Cms DB] Failing to initialization Firebase driver gracefully. Switching to 0-cost Local File mode:", err.message);
    useFirebase = false;
  }

  enum OperationType {
    CREATE = "create",
    UPDATE = "update",
    DELETE = "delete",
    LIST = "list",
    GET = "get",
    WRITE = "write",
  }

  interface FirestoreErrorInfo {
    error: string;
    operationType: OperationType;
    path: string | null;
    authInfo: {
      userId?: string | null;
      email?: string | null;
      emailVerified?: boolean | null;
      isAnonymous?: boolean | null;
    }
  }

  function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: "server-admin",
        email: "server@toluck.vn",
        emailVerified: true,
        isAnonymous: false,
      },
      operationType,
      path
    };
    console.error("Firestore Error: ", JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }

  // Simulated Session Store (JWT/Session Simulation)
  const simulatedSessions: Record<string, { email: string; name: string; role: string; branch?: string; exp: number }> = {};

  async function testFirestoreConnection(): Promise<boolean> {
    if (!useFirebase || !db) return false;
    try {
      console.log("[Cms DB] Pinging Firebase Firestore connection health...");
      await getDocs(collection(db, "users"));
      console.log("[Cms DB] Firebase Firestore connection verified and active!");
      return true;
    } catch (e: any) {
      console.error("[Cms DB] Firestore target is unreachable or blocked. Reverting connection back to completely 0-cost Local Database (cms_db.json) for absolute stability. Error:", e.message);
      useFirebase = false;
      return false;
    }
  }

  async function saveUserToFirestore(user: any) {
    if (!useFirebase) return;
    try {
      await setDoc(doc(db, "users", user.email), user);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${user.email}`);
    }
  }

  async function deleteUserFromFirestore(email: string) {
    if (!useFirebase) return;
    try {
      await deleteDoc(doc(db, "users", email));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${email}`);
    }
  }

  async function saveSurveyToFirestore(survey: any) {
    if (!useFirebase) return;
    try {
      await setDoc(doc(db, "surveys", survey.id), survey);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `surveys/${survey.id}`);
    }
  }

  async function deleteSurveyFromFirestore(id: string) {
    if (!useFirebase) return;
    try {
      await deleteDoc(doc(db, "surveys", id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `surveys/${id}`);
    }
  }

  async function saveCrmToFirestore(crm: any) {
    if (!useFirebase) return;
    try {
      await setDoc(doc(db, "crms", crm.id), crm);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `crms/${crm.id}`);
    }
  }

  async function deleteCrmFromFirestore(id: string) {
    if (!useFirebase) return;
    try {
      await deleteDoc(doc(db, "crms", id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `crms/${id}`);
    }
  }

  async function saveConfigToFirestore(config: any) {
    if (!useFirebase) return;
    try {
      await setDoc(doc(db, "configs", "system"), config);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, "configs/system");
    }
  }

  async function addLogToFirestore(log: any) {
    if (!useFirebase) return;
    try {
      await setDoc(doc(db, "logs", log.id), log);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `logs/${log.id}`);
    }
  }

  async function addHistoryToFirestore(history: any) {
    if (!useFirebase) return;
    try {
      await setDoc(doc(db, "login_history", history.id), history);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `login_history/${history.id}`);
    }
  }

  async function readCmsDb() {
    if (useFirebase) {
      try {
        const [usersSnap, surveysSnap, crmsSnap, configsSnap, logsSnap, historySnap, quotationsSnap, projectsSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "surveys")),
          getDocs(collection(db, "crms")),
          getDocs(collection(db, "configs")),
          getDocs(collection(db, "logs")),
          getDocs(collection(db, "login_history")),
          getDocs(collection(db, "quotations")).catch(() => ({ forEach: () => {} })),
          getDocs(collection(db, "projects")).catch(() => ({ forEach: () => {} })),
        ]);

        const users: any[] = [];
        usersSnap.forEach(d => users.push(d.data()));

        const surveys: any[] = [];
        surveysSnap.forEach(d => surveys.push(d.data()));

        const crms: any[] = [];
        crmsSnap.forEach(d => crms.push(d.data()));

        let system_config: any = {};
        configsSnap.forEach(d => {
          if (d.id === "system") {
            system_config = d.data();
          }
        });

        const logs: any[] = [];
        logsSnap.forEach(d => logs.push(d.data()));
        logs.sort((a, b) => b.id.localeCompare(a.id));

        const login_history: any[] = [];
        historySnap.forEach(d => login_history.push(d.data()));
        login_history.sort((a, b) => b.id.localeCompare(a.id));

        const quotations: any[] = [];
        if (quotationsSnap && typeof quotationsSnap.forEach === "function") {
          quotationsSnap.forEach(d => quotations.push(d.data()));
        }

        const projects: any[] = [];
        if (projectsSnap && typeof projectsSnap.forEach === "function") {
          projectsSnap.forEach(d => projects.push(d.data()));
        }

        return { 
          users, 
          surveys, 
          crms, 
          system_config, 
          logs, 
          login_history, 
          quotations: quotations || [], 
          projects: projects || [] 
        };
      } catch (err: any) {
        console.error("[Cms DB] Querying Firestore failed. Falling back to local filesystem...", err.message);
      }
    }

    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        if (!parsed.quotations) parsed.quotations = [];
        if (!parsed.projects) parsed.projects = [];
        return parsed;
      }
    } catch (e: any) {
      console.error("[Cms DB] Failed to read local filesystem database:", e.message);
    }

    return { users: [], surveys: [], crms: [], system_config: {}, logs: [], login_history: [], quotations: [], projects: [] };
  }

  async function writeCmsDb(data: any) {
    if (!data) return;

    if (useFirebase) {
      try {
        const promises: Promise<any>[] = [];

        if (data.users && Array.isArray(data.users)) {
          data.users.forEach((u: any) => {
            promises.push(setDoc(doc(db, "users", u.email), u));
          });
        }

        if (data.surveys && Array.isArray(data.surveys)) {
          data.surveys.forEach((s: any) => {
            promises.push(setDoc(doc(db, "surveys", s.id), s));
          });
        }

        if (data.crms && Array.isArray(data.crms)) {
          data.crms.forEach((c: any) => {
            promises.push(setDoc(doc(db, "crms", c.id), c));
          });
        }

        if (data.system_config) {
          promises.push(setDoc(doc(db, "configs", "system"), data.system_config));
        }

        if (data.logs && Array.isArray(data.logs)) {
          data.logs.slice(0, 50).forEach((l: any) => {
            promises.push(setDoc(doc(db, "logs", l.id), l));
          });
        }

        if (data.login_history && Array.isArray(data.login_history)) {
          data.login_history.slice(0, 50).forEach((h: any) => {
            promises.push(setDoc(doc(db, "login_history", h.id), h));
          });
        }

        if (data.quotations && Array.isArray(data.quotations)) {
          data.quotations.forEach((q: any) => {
            promises.push(setDoc(doc(db, "quotations", q.id), q));
          });
        }

        if (data.projects && Array.isArray(data.projects)) {
          data.projects.forEach((p: any) => {
            promises.push(setDoc(doc(db, "projects", p.id), p));
          });
        }

        await Promise.all(promises);
        return;
      } catch (err: any) {
        console.error("[Cms DB] Failed to write back to Firestore. Writing locally as fallback...", err.message);
      }
    }

    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch (err: any) {
      console.error("[Cms DB] Failed to write to local filesystem database:", err.message);
    }
  }

  // Priming database with default enterprise records
  async function initFirestoreIfNeeded() {
    if (useFirebase) {
      await testFirestoreConnection();
    }

    if (useFirebase) {
      try {
        // Clean out legacy mock leads if they exist in Firestore
        try {
          await Promise.all([
            deleteDoc(doc(db, "crms", "crm-1")),
            deleteDoc(doc(db, "crms", "crm-2")),
            deleteDoc(doc(db, "crms", "crm-3"))
          ]);
          console.log("[Firebase Initialization] Cleaned up legacy mock leads (crm-1, crm-2, crm-3) from Firestore.");
        } catch (err) {
          // Ignore
        }

        const usersSnap = await getDocs(collection(db, "users"));
        
        // Let's check if local cms_db.json exists, if so we push its up-to-date state directly to Firestore
        if (fs.existsSync(DB_PATH)) {
          console.log("[Firebase Initialization] Syncing current local cms_db.json database data directly to Firebase Firestore...");
          const raw = fs.readFileSync(DB_PATH, "utf-8");
          const localData = JSON.parse(raw);
          await writeCmsDb(localData);
          console.log("[Firebase Initialization] Direct local data synchronized to Firestore successfully!");
        } else if (usersSnap.empty) {
          console.log("[Firebase Initialization] Firestore is empty and no cms_db.json was found. Bootstrapping with default database layout...");
          const defaultData = {
            users: [
              {
                email: "admin@toluck.vn",
                password: "Admin@2026",
                name: "Trần Thế Hùng (Admin)",
                role: "ADMIN",
                status: "Active",
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
                phone: "0963484365",
                branch: "Tổng bộ TOLUCK",
                createdAt: "2026-06-01",
                limits: { surveys: 100, aiAudits: 100, crms: 500, expDate: "2027-12-31" }
              },
              {
                email: "ceo@toluck.vn",
                password: "Ceo@2026",
                name: "Thuý Võ",
                role: "CEO",
                status: "Active",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
                phone: "0963484365",
                branch: "Tổng bộ TOLUCK",
                createdAt: "2026-06-01",
                limits: { surveys: 20, aiAudits: 20, crms: 1000, expDate: "2030-12-31" }
              },
              {
                email: "sales.fr@toluck.vn",
                password: "Sales@2026",
                name: "Võ Thị Thanh Uyên",
                role: "GIÁM ĐỐC KINH DOANH NHƯỢNG QUYỀN",
                status: "Active",
                avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
                phone: "0933444555",
                branch: "TP. Hồ Chí Minh",
                createdAt: "2026-06-02",
                limits: { surveys: 20, aiAudits: 20, crms: 100, expDate: "2026-12-31" }
              },
              {
                email: "staff@toluck.vn",
                password: "Staff@2026",
                name: "Phạm Đăng Khoa (Nhân Viên HN)",
                role: "NHÂN VIÊN",
                status: "Active",
                avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
                phone: "0944555666",
                branch: "Hà Nội",
                createdAt: "2026-06-03",
                limits: { surveys: 10, aiAudits: 10, crms: 50, expDate: "2026-08-30" }
              },
              {
                email: "customer@gmail.com",
                password: "Customer@2026",
                name: "Nguyễn Văn Khách (Khách hàng An Nam)",
                role: "KHÁCH HÀNG",
                status: "Active",
                avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
                phone: "0955666777",
                branch: "Khách vãng lai",
                createdAt: "2026-06-04",
                limits: { surveys: 2, aiAudits: 2, crms: 2, expDate: "2026-07-15" }
              }
            ],
            surveys: [
              {
                id: "survey-1",
                name: "Khảo sát Nhu cầu Phòng Marketing Thuê Ngoài - TOLUCK",
                creator: "admin@toluck.vn",
                createdAt: "2026-06-01",
                usageCount: 45,
                status: "Hoạt động",
                config: {
                  logo: "https://toluck.com.vn/logo.png",
                  colorTheme: "#1e3a8a",
                  emailFrom: "info@toluck.com.vn",
                  promptAi: "Bạn là chuyên gia tư vấn chiến lược Marketing của TOLUCK Agency...",
                  webhookUrl: "https://ai.toluck.com.vn/webhook/phantichkhachhang"
                }
              },
              {
                id: "survey-2",
                name: "Khảo sát Đánh giá Sức Khỏe Thương Hiệu FMCG 2026",
                creator: "ceo@toluck.vn",
                createdAt: "2026-06-02",
                usageCount: 16,
                status: "Hoạt động",
                config: {
                  logo: "https://toluck.com.vn/logo.png",
                  colorTheme: "#0d9488",
                  emailFrom: "info@toluck.com.vn",
                  promptAi: "Bạn là chuyên gia tư vấn sức khỏe thương hiệu...",
                  webhookUrl: "https://ai.toluck.com.vn/webhook/fmcg-audit"
                }
              }
            ],
            crms: [],
            system_config: {
              geminiApiKey: process.env.GEMINI_API_KEY || "",
              openaiApiKey: "",
              n8nWebhookUrl: "https://ai.toluck.com.vn/webhook/phantichkhachhang",
              smtpEmail: process.env.SMTP_USER || "info@toluck.com.vn",
              smtpHost: process.env.SMTP_HOST || "mail.toluck.com.vn",
              smtpPort: process.env.SMTP_PORT || "465",
              smtpPass: process.env.SMTP_PASS ? "CONFIGURED_IN_ENV" : "",
              smtpFrom: process.env.SMTP_FROM || "info@toluck.com.vn",
              logo: "https://toluck.com.vn/logo.png",
              favicon: "https://toluck.com.vn/favicon.ico",
              footerText: "TOLUCK AGENCY © 2026 — ĐỐI TÁC CỰC ĐẠI HÓA DOANH THU & CHUYỂN ĐỔI SỐ"
            },
            logs: [
              { id: "log-1", date: "2026-06-04 12:00:00", user: "admin@toluck.vn", action: "Đăng nhập", detail: "Đăng nhập thành công từ IP 14.161.42.11" },
              { id: "log-2", date: "2026-06-04 12:15:00", user: "admin@toluck.vn", action: "Cấu hình SMTP", detail: "Đã chẩn đoán thông suốt SMTP mail.toluck.com.vn:465" },
              { id: "log-3", date: "2026-06-04 12:45:00", user: "staff@toluck.vn", action: "Gửi Email", detail: "Đã gửi mail báo cáo SWOT + PDF đính kèm sang hung.tran@annamfood.vn" }
            ],
            login_history: [
              { id: "h-1", email: "admin@toluck.vn", time: "2026-06-04 12:00:00", ip: "14.161.42.11", status: "Thành công" },
              { id: "h-2", email: "staff@toluck.vn", time: "2026-06-04 11:20:00", ip: "115.79.138.25", status: "Thành công" },
              { id: "h-3", email: "ceo@toluck.vn", time: "2026-06-04 10:45:00", ip: "42.113.15.93", status: "Thành công" }
            ]
          };

          for (const u of defaultData.users) {
            await setDoc(doc(db, "users", u.email), u);
          }
          for (const s of defaultData.surveys) {
            await setDoc(doc(db, "surveys", s.id), s);
          }
          for (const c of defaultData.crms) {
            await setDoc(doc(db, "crms", c.id), c);
          }
          await setDoc(doc(db, "configs", "system"), defaultData.system_config);
          for (const l of defaultData.logs) {
            await setDoc(doc(db, "logs", l.id), l);
          }
          for (const h of defaultData.login_history) {
            await setDoc(doc(db, "login_history", h.id), h);
          }
          console.log("[Firebase Initialization] Standard bootstrap completed successfully.");
        }
      } catch (err: any) {
        console.error("[Firebase Initialization] Error priming data:", err.message);
      }
    }

    if (!useFirebase) {
      console.log("[Cms DB] Running in 0-cost Local File mode (cms_db.json). Verifying local database file...");
      try {
        if (!fs.existsSync(DB_PATH)) {
          const defaultData = {
            users: [
              {
                email: "admin@toluck.vn",
                password: "Admin@2026",
                name: "Trần Thế Hùng (Admin)",
                role: "ADMIN",
                status: "Active",
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
                phone: "0963484365",
                branch: "Tổng bộ TOLUCK",
                createdAt: "2026-06-01",
                limits: { surveys: 100, aiAudits: 100, crms: 500, expDate: "2027-12-31" }
              },
              {
                email: "ceo@toluck.vn",
                password: "Ceo@2026",
                name: "Thuý Võ",
                role: "CEO",
                status: "Active",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
                phone: "0963484365",
                branch: "Tổng bộ TOLUCK",
                createdAt: "2026-06-01",
                limits: { surveys: 20, aiAudits: 20, crms: 1000, expDate: "2030-12-31" }
              },
              {
                email: "sales.fr@toluck.vn",
                password: "Sales@2026",
                name: "Võ Thị Thanh Uyên",
                role: "GIÁM ĐỐC KINH DOANH NHƯỢNG QUYỀN",
                status: "Active",
                avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
                phone: "0933444555",
                branch: "TP. Hồ Chí Minh",
                createdAt: "2026-06-02",
                limits: { surveys: 20, aiAudits: 20, crms: 100, expDate: "2026-12-31" }
              },
              {
                email: "staff@toluck.vn",
                password: "Staff@2026",
                name: "Phạm Đăng Khoa (Nhân Viên HN)",
                role: "NHÂN VIÊN",
                status: "Active",
                avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
                phone: "0944555666",
                branch: "Hà Nội",
                createdAt: "2026-06-03",
                limits: { surveys: 10, aiAudits: 10, crms: 50, expDate: "2026-08-30" }
              },
              {
                email: "customer@gmail.com",
                password: "Customer@2026",
                name: "Nguyễn Văn Khách (Khách hàng An Nam)",
                role: "KHÁCH HÀNG",
                status: "Active",
                avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
                phone: "0955666777",
                branch: "Khách vãng lai",
                createdAt: "2026-06-04",
                limits: { surveys: 2, aiAudits: 2, crms: 2, expDate: "2026-07-15" }
              }
            ],
            surveys: [
              {
                id: "survey-1",
                name: "Khảo sát Nhu cầu Phòng Marketing Thuê Ngoài - TOLUCK",
                creator: "admin@toluck.vn",
                createdAt: "2026-06-01",
                usageCount: 45,
                status: "Hoạt động",
                config: {
                  logo: "https://toluck.com.vn/logo.png",
                  colorTheme: "#1e3a8a",
                  emailFrom: "info@toluck.com.vn",
                  promptAi: "Bạn là chuyên gia tư vấn chiến lược Marketing của TOLUCK Agency...",
                  webhookUrl: "https://ai.toluck.com.vn/webhook/phantichkhachhang"
                }
              },
              {
                id: "survey-2",
                name: "Khảo sát Đánh giá Sức Khỏe Thương Hiệu FMCG 2026",
                creator: "ceo@toluck.vn",
                createdAt: "2026-06-02",
                usageCount: 16,
                status: "Hoạt động",
                config: {
                  logo: "https://toluck.com.vn/logo.png",
                  colorTheme: "#0d9488",
                  emailFrom: "info@toluck.com.vn",
                  promptAi: "Bạn là chuyên gia tư vấn sức khỏe thương hiệu...",
                  webhookUrl: "https://ai.toluck.com.vn/webhook/fmcg-audit"
                }
              }
            ],
            crms: [],
            system_config: {
              geminiApiKey: process.env.GEMINI_API_KEY || "",
              openaiApiKey: "",
              n8nWebhookUrl: "https://ai.toluck.com.vn/webhook/phantichkhachhang",
              smtpEmail: process.env.SMTP_USER || "info@toluck.com.vn",
              smtpHost: process.env.SMTP_HOST || "mail.toluck.com.vn",
              smtpPort: process.env.SMTP_PORT || "465",
              smtpPass: process.env.SMTP_PASS ? "CONFIGURED_IN_ENV" : "",
              smtpFrom: process.env.SMTP_FROM || "info@toluck.com.vn",
              logo: "https://toluck.com.vn/logo.png",
              favicon: "https://toluck.com.vn/favicon.ico",
              footerText: "TOLUCK AGENCY © 2026 — ĐỐI TÁC CỰC ĐẠI HÓA DOANH THU & CHUYỂN ĐỔI SỐ"
            },
            logs: [
              { id: "log-1", date: "2026-06-04 12:00:00", user: "admin@toluck.vn", action: "Đăng nhập", detail: "Đăng nhập thành công từ IP 14.161.42.11" },
              { id: "log-2", date: "2026-06-04 12:15:00", user: "admin@toluck.vn", action: "Cấu hình SMTP", detail: "Đã chẩn đoán thông suốt SMTP mail.toluck.com.vn:465" },
              { id: "log-3", date: "2026-06-04 12:45:00", user: "staff@toluck.vn", action: "Gửi Email", detail: "Đã gửi mail báo cáo SWOT + PDF đính kèm sang hung.tran@annamfood.vn" }
            ],
            login_history: [
              { id: "h-1", email: "admin@toluck.vn", time: "2026-06-04 12:00:00", ip: "14.161.42.11", status: "Thành công" },
              { id: "h-2", email: "staff@toluck.vn", time: "2026-06-04 11:20:00", ip: "115.79.138.25", status: "Thành công" },
              { id: "h-3", email: "ceo@toluck.vn", time: "2026-06-04 10:45:00", ip: "42.113.15.93", status: "Thành công" }
            ]
          };
          fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2), "utf-8");
          console.log("[Cms DB] Successfully created primary 0-cost local database file: cms_db.json");
        } else {
          console.log("[Cms DB] Verified existing local database file: cms_db.json");
        }
      } catch (err: any) {
        console.error("[Cms DB] Error checking or bootstrapping local database file:", err.message);
      }
    }
  }

  // Trigger setup
  initFirestoreIfNeeded();

  // De-duplicate & Auto-register lead on survey
  async function registerLeadFromSurvey(survey: any, report: any, creatorBranch?: string) {
    try {
      const dbData = await readCmsDb();
      
      const matchingSurvey = dbData.surveys.find((s: any) => s.config?.webhookUrl === survey.webhookUrl) || dbData.surveys[0];
      if (matchingSurvey) {
        matchingSurvey.usageCount = (matchingSurvey.usageCount || 0) + 1;
        await saveSurveyToFirestore(matchingSurvey);
      }

      const freshScore = report?.readinessScore || 50;
      const maturity = report?.maturityGrade || "C";
      const notesLine = `Khảo sát nộp từ web. Mục tiêu: ${survey.goal || "Không gõ"}`;

      // Build survey history item
      const surveyHistoryItem = {
        id: "sub-" + Date.now(),
        date: new Date().toISOString(),
        surveyData: { ...survey },
        reportData: report ? { ...report } : null
      };

      const existingCrm = dbData.crms.find(
        (l: any) => l.email?.toLowerCase() === survey.email?.toLowerCase() || 
                    l.company?.toLowerCase() === survey.company_name?.toLowerCase()
      );

      if (existingCrm) {
        existingCrm.marketingScore = freshScore;
        existingCrm.aiAuditResult = `Cập nhật: Mức sẵn sàng: ${freshScore}% (${maturity}). ${report?.consultantOpinion?.slice(0, 150)}...`;
        existingCrm.notes = notesLine + "\n" + existingCrm.notes;
        existingCrm.historyLogs.unshift({
          date: new Date().toISOString().split("T")[0],
          type: "Khảo sát lại",
          detail: `Khách hàng cập nhật lại hiện trạng marketing. Điểm AI mới: ${freshScore}pts.`
        });
        if (!existingCrm.surveyHistory) {
          existingCrm.surveyHistory = [];
        }
        existingCrm.surveyHistory.unshift(surveyHistoryItem);
        await saveCrmToFirestore(existingCrm);
      } else {
        const newLead = {
          id: "crm-" + Date.now(),
          company: survey.company_name || "Doanh nghiệp mới",
          contact: survey.contact_name || "Chưa rõ",
          email: survey.email || "",
          phone: survey.phone || "",
          marketingScore: freshScore,
          status: "Lead mới",
          assignedTo: "",
          branch: creatorBranch || "Tổng bộ TOLUCK",
          aiAuditResult: `Mức sẵn sàng: ${freshScore}% (${maturity}). ${report?.consultantOpinion?.slice(0, 150)}...`,
          pdfUrl: "",
          notes: notesLine,
          historyLogs: [
            { date: new Date().toISOString().split("T")[0], type: "Khảo sát", detail: "Hoàn tất chẩn đoán marketing AI thu hoạch lead." }
          ],
          createdAt: new Date().toISOString().split("T")[0],
          surveyHistory: [surveyHistoryItem]
        };
        dbData.crms.unshift(newLead);
        await saveCrmToFirestore(newLead);
      }

      const logPayload = {
        id: "log-" + Date.now(),
        date: new Date().toISOString().replace("T", " ").substring(0, 19),
        user: "Khách vãng lai",
        action: "Thu nạp Lead",
        detail: `Hệ thống tự động sinh Lead cho ${survey.contact_name} - ${survey.company_name}`
      };
      dbData.logs.unshift(logPayload);
      await addLogToFirestore(logPayload);

      // Persist entire DB state ensuring absolute synchronization
      await writeCmsDb(dbData);

      console.log("[CMS DB] Handled automated survey submission integration successfully!");
    } catch (e) {
      console.error("[Cms DB] Error processing auto submission:", e);
    }
  }

  // Middleware helper to authorize role
  function getSimulatedUser(req: any) {
    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.replace(/^Bearer\s+/, "").trim();
    if (!token) return null;
    return simulatedSessions[token] || null;
  }

  // 1. API GET SURVEYS, USERS, CRMS, CONFIGS, LOGS (RBAC Filtered)
  app.get("/api/cms/data", async (req, res) => {
    const user = getSimulatedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized. Vui lòng đăng nhập hệ thống quản lý." });
    }

    const db = await readCmsDb();
    
    // RBAC FILTERING LOGIC
    let filteredCrms = [...db.crms];
    let filteredUsers = [...db.users];
    let filteredSurveys = [...db.surveys];
    let filteredLogs = [...db.logs];
    let filteredQuotations = [...(db.quotations || [])];
    let filteredProjects = [...(db.projects || [])];

    const isTotalOfficeUser = user.role === "ADMIN" || user.role === "CEO" || user.branch === "Tổng bộ TOLUCK";

    if (isTotalOfficeUser) {
      // Admins, CEOs, and Total Office (Tổng bộ TOLUCK) staff can see all records
    } else if (user.role === "GIÁM ĐỐC KINH DOANH NHƯỢNG QUYỀN") {
      // Franchise branch directors can only see their branch leads
      const userBranch = user.branch || "TP. Hồ Chí Minh";
      filteredCrms = db.crms.filter((c: any) => c.branch === userBranch);
      filteredLogs = db.logs.filter((l: any) => l.detail?.includes(userBranch) || l.user === user.email);
      
      const branchLeadIds = filteredCrms.map((c: any) => c.id);
      filteredQuotations = (db.quotations || []).filter((q: any) => branchLeadIds.includes(q.customerId) || q.assignedTo === user.email);
      filteredProjects = (db.projects || []).filter((p: any) => branchLeadIds.includes(p.leadId));
    } else if (user.role === "NHÂN VIÊN") {
      // Branch employees can only see lead assigned to them within their branch
      const userBranch = user.branch || "";
      filteredCrms = db.crms.filter((c: any) => c.branch === userBranch && c.assignedTo === user.email);
      filteredLogs = db.logs.filter((l: any) => l.user === user.email);
      
      const assignedLeadIds = filteredCrms.map((c: any) => c.id);
      filteredQuotations = (db.quotations || []).filter((q: any) => assignedLeadIds.includes(q.customerId) || q.assignedTo === user.email);
      filteredProjects = (db.projects || []).filter((p: any) => assignedLeadIds.includes(p.leadId));
    } else if (user.role === "KHÁCH HÀNG") {
      // Can only see his own transactions
      filteredCrms = db.crms.filter((c: any) => c.email?.toLowerCase() === user.email?.toLowerCase());
      filteredLogs = [];
      
      const customerLeadIds = filteredCrms.map((c: any) => c.id);
      filteredQuotations = (db.quotations || []).filter((q: any) => customerLeadIds.includes(q.customerId));
      filteredProjects = (db.projects || []).filter((p: any) => customerLeadIds.includes(p.leadId));
    }

    // Scrub confidential passwords from client outputs
    const safeUsers = filteredUsers.map(({ password, ...u }: any) => u);

    res.json({
      currentUser: user,
      users: safeUsers,
      surveys: filteredSurveys,
      crms: filteredCrms,
      system_config: db.system_config,
      logs: filteredLogs,
      login_history: isTotalOfficeUser ? db.login_history : [],
      quotations: filteredQuotations,
      projects: filteredProjects
    });
  });

  // 2. API AUTH ACTIONS
  app.post("/api/cms/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const db = await readCmsDb();

    const user = db.users.find((u: any) => u.email === email && u.password === password);
    if (!user) {
      // Log failed attempt
      db.login_history.unshift({
        id: "h-" + Date.now(),
        email: email || "unknown",
        time: new Date().toISOString().replace("T", " ").substring(0, 19),
        ip: req.ip || "127.0.0.1",
        status: "Thất bại"
      });
      await writeCmsDb(db);
      return res.status(401).json({ success: false, error: "Tài khoản hoặc mật khẩu không chính xác." });
    }

    if (user.status === "Locked") {
      return res.status(403).json({ success: false, error: "Tài khoản của bạn đang bị khóa. Vui lòng liên hệ quản trị viên." });
    }

    // Generate JWT-like mock token
    const token = "jwt_" + Math.random().toString(36).substring(2, 10) + "_" + Buffer.from(user.email).toString("base64");
    simulatedSessions[token] = {
      email: user.email,
      name: user.name,
      role: user.role,
      branch: user.branch,
      exp: Date.now() + 24 * 60 * 60 * 1000
    };

    // Log successful attempt
    db.login_history.unshift({
      id: "h-" + Date.now(),
      email: user.email,
      time: new Date().toISOString().replace("T", " ").substring(0, 19),
      ip: req.ip || "127.0.0.1",
      status: "Thành công"
    });

    db.logs.unshift({
      id: "log-" + Date.now(),
      date: new Date().toISOString().replace("T", " ").substring(0, 19),
      user: user.email,
      action: "Đăng nhập",
      detail: `Đăng nhập thành công với vai trò ${user.role} từ thiết bị.`
    });

    await writeCmsDb(db);

    res.json({
      success: true,
      token,
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        branch: user.branch,
        avatar: user.avatar,
        phone: user.phone
      }
    });
  });

  app.post("/api/cms/auth/register", async (req, res) => {
    const { email, password, name, phone } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: "Vui lòng nhập đầy đủ Họ tên, Email và Mật khẩu." });
    }

    const db = await readCmsDb();

    // Check if duplicate user
    const exists = db.users.some((u: any) => u.email?.toLowerCase() === email?.toLowerCase());
    if (exists) {
      return res.status(400).json({ success: false, error: "Email này đã được đăng ký trên hệ thống. Vui lòng đăng nhập." });
    }

    // Create newUser
    const newUser = {
      email: email,
      password: password,
      name: name,
      role: "KHÁCH HÀNG",
      status: "Active",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
      phone: phone || "",
      branch: "Khách khảo sát",
      createdAt: new Date().toISOString().split("T")[0],
      limits: { surveys: 2, aiAudits: 2, crms: 10, expDate: "2026-12-31" }
    };

    db.users.push(newUser);

    // Save newly created user to Firestore if needed
    try {
      await saveUserToFirestore(newUser);
    } catch (e) {
      console.error("[Cms DB] Failed to save registered user to Firestore:", e);
    }

    // Generate JWT-like token
    const token = "jwt_" + Math.random().toString(36).substring(2, 10) + "_" + Buffer.from(newUser.email).toString("base64");
    simulatedSessions[token] = {
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      branch: newUser.branch,
      exp: Date.now() + 24 * 60 * 60 * 1000
    };

    // Log registration
    db.login_history.unshift({
      id: "h-" + Date.now(),
      email: newUser.email,
      time: new Date().toISOString().replace("T", " ").substring(0, 19),
      ip: req.ip || "127.0.0.1",
      status: "Đăng ký thành công"
    });

    db.logs.unshift({
      id: "log-" + Date.now(),
      date: new Date().toISOString().replace("T", " ").substring(0, 19),
      user: newUser.email,
      action: "Đăng ký",
      detail: `Đăng ký tài khoản khảo sát thành công.`
    });

    await writeCmsDb(db);

    res.json({
      success: true,
      token,
      user: {
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        branch: newUser.branch,
        avatar: newUser.avatar,
        phone: newUser.phone
      }
    });
  });

  app.post("/api/cms/auth/logout", async (req, res) => {
    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.replace(/^Bearer\s+/, "").trim();
    if (token && simulatedSessions[token]) {
      const user = simulatedSessions[token];
      const db = await readCmsDb();
      db.logs.unshift({
        id: "log-" + Date.now(),
        date: new Date().toISOString().replace("T", " ").substring(0, 19),
        user: user.email,
        action: "Đăng xuất",
        detail: `Người dùng ${user.name} đã đăng xuất khỏi phiên làm việc.`
      });
      await writeCmsDb(db);
      delete simulatedSessions[token];
    }
    res.json({ success: true });
  });

  // Change password endpoint
  app.post("/api/cms/auth/change-password", async (req, res) => {
    const user = getSimulatedUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { oldPassword, newPassword } = req.body;
    const db = await readCmsDb();
    const dbUser = db.users.find((u: any) => u.email === user.email);

    if (!dbUser || dbUser.password !== oldPassword) {
      return res.status(400).json({ error: "Mật khẩu cũ không chính xác." });
    }

    dbUser.password = newPassword;
    db.logs.unshift({
      id: "log-" + Date.now(),

      date: new Date().toISOString().replace("T", " ").substring(0, 19),
      user: user.email,
      action: "Đổi mật khẩu",
      detail: "Thay đổi mật khẩu cá nhân thành công."
    });

    writeCmsDb(db);
    res.json({ success: true, message: "Thay đổi mật khẩu thành công!" });
  });

  // Update profile endpoint
  app.post("/api/cms/auth/update-profile", async (req, res) => {
    const user = getSimulatedUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { name, phone } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Họ tên không được để trống." });
    }

    const db = await readCmsDb();
    const dbUser = db.users.find((u: any) => u.email === user.email);

    if (!dbUser) {
      return res.status(404).json({ error: "Không tìm thấy thông tin tài khoản." });
    }

    dbUser.name = name;
    dbUser.phone = phone || "";
    
    // Update simulated sessions as well
    (user as any).name = name;
    (user as any).phone = phone || "";

    db.logs.unshift({
      id: "log-" + Date.now(),
      date: new Date().toISOString().replace("T", " ").substring(0, 19),
      user: user.email,
      action: "Cập nhật hồ sơ",
      detail: "Cập nhật thông tin cá nhân thành công."
    });

    // Also update any matching elements in Firestore users
    try {
      await saveUserToFirestore(dbUser);
    } catch (e) {
      console.error("[Cms DB] Failed to save updated user profile to Firestore:", e);
    }

    await writeCmsDb(db);
    res.json({ 
      success: true, 
      message: "Cập nhật thông tin cá nhân thành công!",
      user: {
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        branch: dbUser.branch,
        avatar: dbUser.avatar,
        phone: dbUser.phone
      }
    });
  });

  // 3. API USER MANAGEMENT CRUD (ADMIN only)
  app.post("/api/cms/users/save", async (req, res) => {
    const user = getSimulatedUser(req);
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ error: "Phải là Admin mới được cấu hình tài khoản." });
    }

    const { email, password, name, role, phone, branch, limits, isEdit } = req.body;
    const db = await readCmsDb();

    if (isEdit) {
      const uIdx = db.users.findIndex((u: any) => u.email === email);
      if (uIdx !== -1) {
        db.users[uIdx] = {
          ...db.users[uIdx],
          name,
          role,
          phone,
          branch,
          limits: limits || db.users[uIdx].limits
        };
        // Option to change pass
        if (password) {
          db.users[uIdx].password = password;
        }

        db.logs.unshift({
          id: "log-" + Date.now(),
          date: new Date().toISOString().replace("T", " ").substring(0, 19),
          user: user.email,
          action: "Sửa người dùng",
          detail: `Đã chỉnh sửa thông tin người dùng ${email} (${name})`
        });
      }
    } else {
      // Check if duplicate
      const exists = db.users.some((u: any) => u.email === email);
      if (exists) {
        return res.status(400).json({ error: "Email này đã tồn tại trên hệ thống." });
      }

      db.users.push({
        email,
        password: password || "123456",
        name,
        role,
        status: "Active",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100",
        phone: phone || "",
        branch: branch || "Hà Nội",
        createdAt: new Date().toISOString().split("T")[0],
        limits: limits || { surveys: 5, aiAudits: 5, crms: 20, expDate: "2026-12-31" }
      });

      db.logs.unshift({
        id: "log-" + Date.now(),
        date: new Date().toISOString().replace("T", " ").substring(0, 19),
        user: user.email,
        action: "Tạo người dùng",
        detail: `Đã khởi tạo tài khoản mới ${email} vai trò ${role}`
      });
    }

    await writeCmsDb(db);
    res.json({ success: true });
  });

  app.post("/api/cms/users/lock", async (req, res) => {
    const user = getSimulatedUser(req);
    if (!user || user.role !== "ADMIN") return res.status(403).json({ error: "Chức năng dành riêng cho Admin." });

    const { email } = req.body;
    const db = await readCmsDb();
    const dbUser = db.users.find((u: any) => u.email === email);
    if (dbUser) {
      if (dbUser.email === "admin@toluck.vn") {
        return res.status(400).json({ error: "Không được tự khóa tài khoản Admin tối cao." });
      }
      dbUser.status = dbUser.status === "Locked" ? "Active" : "Locked";
      db.logs.unshift({
        id: "log-" + Date.now(),
        date: new Date().toISOString().replace("T", " ").substring(0, 19),
        user: user.email,
        action: dbUser.status === "Locked" ? "Khóa tài khoản" : "Mở tài khoản",
        detail: `Đã thay đổi trạng thái hoạt động tài khoản ${email} thành ${dbUser.status}`
      });
      await writeCmsDb(db);
    }
    res.json({ success: true });
  });

  app.post("/api/cms/users/delete", async (req, res) => {
    const user = getSimulatedUser(req);
    if (!user || user.role !== "ADMIN") return res.status(403).json({ error: "Chức năng dành riêng cho Admin." });

    const { email } = req.body;
    if (email === "admin@toluck.vn" || email === user.email) {
      return res.status(400).json({ error: "Không được phép xóa tài khoản của chính mình." });
    }

    const db = await readCmsDb();
    db.users = db.users.filter((u: any) => u.email !== email);
    db.logs.unshift({
      id: "log-" + Date.now(),
      date: new Date().toISOString().replace("T", " ").substring(0, 19),
      user: user.email,
      action: "Xóa người dùng",
      detail: `Đã xóa vĩnh viễn tài khoản ${email}`
    });
    await deleteUserFromFirestore(email);
    await writeCmsDb(db);
    res.json({ success: true });
  });

  // 4. API SURVEY ACTIONS (Quản Lý Khảo Sát)
  app.post("/api/cms/surveys/save", async (req, res) => {
    const user = getSimulatedUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "CEO")) {
      return res.status(403).json({ error: "Chỉ Admin/CEO mới được tùy cấu hình khảo sát." });
    }

    const { id, name, status, config, isEdit } = req.body;
    const db = await readCmsDb();

    if (isEdit) {
      const sIdx = db.surveys.findIndex((s: any) => s.id === id);
      if (sIdx !== -1) {
        db.surveys[sIdx] = {
          ...db.surveys[sIdx],
          name: name || db.surveys[sIdx].name,
          status: status || db.surveys[sIdx].status,
          config: config || db.surveys[sIdx].config
        };

        db.logs.unshift({
          id: "log-" + Date.now(),
          date: new Date().toISOString().replace("T", " ").substring(0, 19),
          user: user.email,
          action: "Sửa khảo sát",
          detail: `Đã cập nhật biểu mẫu khảo sát: ${name}`
        });
      }
    } else {
      db.surveys.push({
        id: "survey-" + Date.now(),
        name,
        creator: user.email,
        createdAt: new Date().toISOString().split("T")[0],
        usageCount: 0,
        status: "Hoạt động",
        config: config || {
          logo: "https://toluck.com.vn/logo.png",
          colorTheme: "#1e3a8a",
          emailFrom: "info@toluck.com.vn",
          promptAi: "Bạn là chuyên gia tư vấn...",
          webhookUrl: "https://ai.toluck.com.vn/webhook/analytics"
        }
      });
      db.logs.unshift({
        id: "log-" + Date.now(),
        date: new Date().toISOString().replace("T", " ").substring(0, 19),
        user: user.email,
        action: "Tạo khảo sát",
        detail: `Đã tạo mới biểu mẫu khảo sát: ${name}`
      });
    }

    await writeCmsDb(db);
    res.json({ success: true });
  });

  app.post("/api/cms/surveys/duplicate", async (req, res) => {
    const user = getSimulatedUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "CEO")) return res.status(403).json({ error: "Chức năng bảo mật." });

    const { id } = req.body;
    const db = await readCmsDb();
    const found = db.surveys.find((s: any) => s.id === id);
    if (found) {
      const duplicated = {
        ...found,
        id: "survey-" + Date.now(),
        name: found.name + " (Bản Sao)",
        usageCount: 0,
        createdAt: new Date().toISOString().split("T")[0]
      };
      db.surveys.push(duplicated);
      db.logs.unshift({
        id: "log-" + Date.now(),
        date: new Date().toISOString().replace("T", " ").substring(0, 19),
        user: user.email,
        action: "Nhân bản khảo sát",
        detail: `Đã nhân bản khảo sát ${found.name}`
      });
      await writeCmsDb(db);
    }
    res.json({ success: true });
  });

  app.post("/api/cms/surveys/toggle-status", async (req, res) => {
    const user = getSimulatedUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "CEO")) return res.status(403).json({ error: "Chức năng bảo mật." });

    const { id } = req.body;
    const db = await readCmsDb();
    const found = db.surveys.find((s: any) => s.id === id);
    if (found) {
      found.status = found.status === "Hoạt động" ? "Ngưng hoạt động" : "Hoạt động";
      db.logs.unshift({
        id: "log-" + Date.now(),
        date: new Date().toISOString().replace("T", " ").substring(0, 19),
        user: user.email,
        action: "Đổi trạng thái khảo sát",
        detail: `Thay đổi trạng thái ${found.name} thành ${found.status}`
      });
      await writeCmsDb(db);
    }
    res.json({ success: true });
  });

  app.post("/api/cms/surveys/delete", async (req, res) => {
    const user = getSimulatedUser(req);
    if (!user || user.role !== "ADMIN") return res.status(403).json({ error: "Chỉ Admin được xóa khảo sát." });

    const { id } = req.body;
    const db = await readCmsDb();
    const found = db.surveys.find((s: any) => s.id === id);
    if (found) {
      db.surveys = db.surveys.filter((s: any) => s.id !== id);
      db.logs.unshift({
        id: "log-" + Date.now(),
        date: new Date().toISOString().replace("T", " ").substring(0, 19),
        user: user.email,
        action: "Xóa khảo sát",
        detail: `Đã xóa khảo sát ${found.name}`
      });
      await deleteSurveyFromFirestore(id);
      await writeCmsDb(db);
    }
    res.json({ success: true });
  });

  // 5. CRM KHÁCH HÀNG & LEADS CRUD
  app.post("/api/cms/crm/save", async (req, res) => {
    const user = getSimulatedUser(req);
    if (!user) return res.status(403).json({ error: "Đăng nhập là bắt buộc." });

    const { id, company, contact, email, phone, branch, assignedTo, notes, status, marketingScore, isEdit } = req.body;
    const db = await readCmsDb();

    if (isEdit) {
      const idx = db.crms.findIndex((c: any) => c.id === id);
      if (idx !== -1) {
        db.crms[idx] = {
          ...db.crms[idx],
          company: company || db.crms[idx].company,
          contact: contact || db.crms[idx].contact,
          email: email || db.crms[idx].email,
          phone: phone || db.crms[idx].phone,
          branch: branch || db.crms[idx].branch,
          assignedTo: assignedTo || db.crms[idx].assignedTo,
          notes: notes || db.crms[idx].notes,
          status: status || db.crms[idx].status,
          marketingScore: marketingScore !== undefined ? marketingScore : db.crms[idx].marketingScore
        };

        db.crms[idx].historyLogs.unshift({
          date: new Date().toISOString().split("T")[0],
          type: "Cập nhật",
          detail: `Thông tin CRM được cập nhật bởi ${user.name}`
        });

        db.logs.unshift({
          id: "log-" + Date.now(),
          date: new Date().toISOString().replace("T", " ").substring(0, 19),
          user: user.email,
          action: "Sửa Lead CRM",
          detail: `Cập nhật thông tin Lead ${contact} (${company})`
        });
      }
    } else {
      db.crms.unshift({
        id: "crm-" + Date.now(),
        company,
        contact,
        email,
        phone,
        marketingScore: marketingScore || 20,
        status: status || "Lead mới",
        assignedTo: assignedTo || "",
        branch: branch || "Hà Nội",
        aiAuditResult: "Ghi chép thủ công từ quản lý.",
        pdfUrl: "",
        notes: notes || "",
        historyLogs: [
          { date: new Date().toISOString().split("T")[0], type: "Khởi tạo", detail: `Được tạo thủ công bởi ${user.name}` }
        ],
        createdAt: new Date().toISOString().split("T")[0]
      });

      db.logs.unshift({
        id: "log-" + Date.now(),
        date: new Date().toISOString().replace("T", " ").substring(0, 19),
        user: user.email,
        action: "Tạo Lead CRM",
        detail: `Khởi tạo thủ công Lead CRM cho khách hàng ${contact}`
      });
    }

    await writeCmsDb(db);
    res.json({ success: true });
  });

  app.post("/api/cms/crm/update-pipeline", async (req, res) => {
    const user = getSimulatedUser(req);
    if (!user) return res.status(452).json({ error: "Session expired." });

    const { id, status } = req.body;
    const db = await readCmsDb();
    const found = db.crms.find((c: any) => c.id === id);
    if (found) {
      const oldStatus = found.status;
      found.status = status;
      found.historyLogs.unshift({
        date: new Date().toISOString().split("T")[0],
        type: "Chuyển trạng thái",
        detail: `Chuyển Pipeline: [${oldStatus}] → [${status}] bởi ${user.name}`
      });

      db.logs.unshift({
        id: "log-" + Date.now(),
        date: new Date().toISOString().replace("T", " ").substring(0, 19),
        user: user.email,
        action: "Chuyển Pipeline CRM",
        detail: `Chuyển trạng thái Lead ${found.contact}: [${oldStatus}] -> [${status}]`
      });

      await writeCmsDb(db);
    }
    res.json({ success: true });
  });

  app.post("/api/cms/crm/add-log", async (req, res) => {
    const user = getSimulatedUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { id, type, detail } = req.body;
    const db = await readCmsDb();
    const found = db.crms.find((c: any) => c.id === id);
    if (found) {
      found.historyLogs.unshift({
        date: new Date().toISOString().split("T")[0],
        type,
        detail
      });

      db.logs.unshift({
        id: "log-" + Date.now(),
        date: new Date().toISOString().replace("T", " ").substring(0, 19),
        user: user.email,
        action: `Ghi nhận tương tác ${type}`,
        detail: `Khách hàng ${found.contact}: ${detail}`
      });

      await writeCmsDb(db);
    }
    res.json({ success: true });
  });

  app.post("/api/cms/crm/delete", async (req, res) => {
    const user = getSimulatedUser(req);
    if (!user || user.role !== "ADMIN") return res.status(403).json({ error: "Chức năng chỉ dành cho Admin." });

    const { id } = req.body;
    const db = await readCmsDb();
    const found = db.crms.find((c: any) => c.id === id);
    if (found) {
      db.crms = db.crms.filter((c: any) => c.id !== id);
      db.logs.unshift({
        id: "log-" + Date.now(),
        date: new Date().toISOString().replace("T", " ").substring(0, 19),
        user: user.email,
        action: "Xóa Lead CRM",
        detail: `Đã xóa vĩnh viễn Lead của ${found.contact} - ${found.company}`
      });
      await deleteCrmFromFirestore(id);
      await writeCmsDb(db);
    }
    res.json({ success: true });
  });

  // ======================= MODULE BÁO GIÁ ENDPOINTS =======================
  app.post("/api/cms/quotations/save", async (req, res) => {
    const user = getSimulatedUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized. Vui lòng đăng nhập." });

    const qData = req.body;
    const db = await readCmsDb();
    if (!db.quotations) db.quotations = [];

    const isEdit = qData.isEdit;
    let savedQuotation: any = null;

    if (isEdit) {
      const idx = db.quotations.findIndex((q: any) => q.id === qData.id);
      if (idx !== -1) {
        db.quotations[idx] = {
          ...db.quotations[idx],
          customerId: qData.customerId || db.quotations[idx].customerId,
          customerName: qData.customerName || db.quotations[idx].customerName,
          company: qData.company || db.quotations[idx].company,
          email: qData.email || db.quotations[idx].email,
          phone: qData.phone || db.quotations[idx].phone,
          services: qData.services || db.quotations[idx].services,
          subtotal: Number(qData.subtotal) !== undefined ? Number(qData.subtotal) : db.quotations[idx].subtotal,
          discountPercent: Number(qData.discountPercent) !== undefined ? Number(qData.discountPercent) : db.quotations[idx].discountPercent,
          discountValue: Number(qData.discountValue) !== undefined ? Number(qData.discountValue) : db.quotations[idx].discountValue,
          vatPercent: Number(qData.vatPercent) !== undefined ? Number(qData.vatPercent) : db.quotations[idx].vatPercent,
          vatValue: Number(qData.vatValue) !== undefined ? Number(qData.vatValue) : db.quotations[idx].vatValue,
          totalAmount: Number(qData.totalAmount) !== undefined ? Number(qData.totalAmount) : db.quotations[idx].totalAmount,
          notes: qData.notes !== undefined ? qData.notes : db.quotations[idx].notes,
          status: qData.status || db.quotations[idx].status,
          templateId: qData.templateId || db.quotations[idx].templateId,
          expiryDate: qData.expiryDate || db.quotations[idx].expiryDate,
          assignedTo: qData.assignedTo || db.quotations[idx].assignedTo
        };
        savedQuotation = db.quotations[idx];

        // Logs
        db.logs.unshift({
          id: "log-" + Date.now(),
          date: new Date().toISOString().replace("T", " ").substring(0, 19),
          user: user.email,
          action: "Cập nhật Báo giá",
          detail: `Đã cập nhật báo giá ${qData.code} trị giá ${Number(qData.totalAmount || 0).toLocaleString("vi-VN")}đ`
        });
      } else {
        return res.status(404).json({ error: "Không tìm thấy báo giá để sửa đổi." });
      }
    } else {
      const qId = "qt-" + Date.now();
      const qCode = qData.code || `QT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const newQuotation = {
        id: qId,
        code: qCode,
        customerId: qData.customerId || "",
        customerName: qData.customerName || "",
        company: qData.company || "",
        email: qData.email || "",
        phone: qData.phone || "",
        services: qData.services || [],
        subtotal: Number(qData.subtotal) || 0,
        discountPercent: Number(qData.discountPercent) || 0,
        discountValue: Number(qData.discountValue) || 0,
        vatPercent: Number(qData.vatPercent) || 0,
        vatValue: Number(qData.vatValue) || 0,
        totalAmount: Number(qData.totalAmount) || 0,
        notes: qData.notes || "",
        status: qData.status || "Nháp",
        templateId: qData.templateId || "template01",
        createdAt: new Date().toISOString().split("T")[0],
        expiryDate: qData.expiryDate || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0],
        assignedTo: qData.assignedTo || user.email,
        sentHistory: []
      };
      db.quotations.push(newQuotation);
      savedQuotation = newQuotation;

      // Logs
      db.logs.unshift({
        id: "log-" + Date.now(),
        date: new Date().toISOString().replace("T", " ").substring(0, 19),
        user: user.email,
        action: "Tạo Báo giá",
        detail: `Nhân viên ${user.name} lập báo giá mới ${qCode} cho ${qData.company} (${Number(qData.totalAmount || 0).toLocaleString("vi-VN")}đ)`
      });

      // Link to CRM status update or historologs
      if (qData.customerId) {
        const lead = db.crms.find((c: any) => c.id === qData.customerId);
        if (lead) {
          if (!lead.historyLogs) lead.historyLogs = [];
          lead.historyLogs.unshift({
            date: new Date().toISOString().split("T")[0],
            type: "Báo giá",
            detail: `Khởi tạo báo giá mới ${qCode} trị giá ${Number(qData.totalAmount).toLocaleString("vi-VN")}đ bởi ${user.name}`
          });
        }
      }
    }

    await writeCmsDb(db);
    res.json({ success: true, quotation: savedQuotation });
  });

  app.post("/api/cms/quotations/delete", async (req, res) => {
    const user = getSimulatedUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "CEO")) {
      return res.status(403).json({ error: "Bạn không có quyền xóa báo giá chính thức." });
    }

    const { id } = req.body;
    const db = await readCmsDb();
    if (!db.quotations) db.quotations = [];

    const found = db.quotations.find((q: any) => q.id === id);
    if (found) {
      db.quotations = db.quotations.filter((q: any) => q.id !== id);
      db.logs.unshift({
        id: "log-" + Date.now(),
        date: new Date().toISOString().replace("T", " ").substring(0, 19),
        user: user.email,
        action: "Xóa Báo giá",
        detail: `Đã xóa vĩnh viễn báo giá ${found.code} cho ${found.company}`
      });
      await writeCmsDb(db);
    }
    res.json({ success: true });
  });

  app.post("/api/cms/quotations/export-pdf", async (req, res) => {
    const user = getSimulatedUser(req);
    if (!user) return res.status(401).json({ error: "Vui lòng đăng nhập để xuất PDF." });

    const { id } = req.body;
    const db = await readCmsDb();
    if (!db.quotations) db.quotations = [];

    const quotation = db.quotations.find((q: any) => q.id === id);
    if (!quotation) {
      return res.status(404).json({ error: "Không tìm thấy nội dung báo giá." });
    }

    try {
      const config = db.system_config || {};
      const pdfBuffer = await generateQuotationPDF(quotation, config);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=Bao_gia_TOLUCK_${quotation.code}.pdf`);
      res.send(pdfBuffer);
    } catch (err: any) {
      console.error("[PDF Export Error] Failed:", err);
      res.status(500).json({ error: "Đã xảy ra lỗi khi tạo tệp PDF.", details: err.message });
    }
  });

  app.post("/api/cms/quotations/send-email", async (req, res) => {
    const user = getSimulatedUser(req);
    if (!user) return res.status(401).json({ error: "Vui lòng đăng nhập để gửi thư báo giá." });

    const { id } = req.body;
    const db = await readCmsDb();
    if (!db.quotations) db.quotations = [];

    const quotation = db.quotations.find((q: any) => q.id === id);
    if (!quotation) {
      return res.status(404).json({ error: "Không tìm thấy thông tin báo giá gửi đi." });
    }

    const { email, customerName, company, code, totalAmount } = quotation;
    if (!email) {
      return res.status(400).json({ error: "Khách hàng không có địa chỉ email nhận thư." });
    }

    try {
      const config = db.system_config || {};
      const companyName = config.companyName || "CÔNG TY CỔ PHẦN CÔNG NGHỆ & TRUYỀN THÔNG TOLUCK";
      const companyPhone = config.companyPhone || "0963 484 365";
      const companyAddress = config.companyAddress || "Tòa nhà TOLUCK Building, Hà Nội, Việt Nam";
      const companyEmail = config.companyEmail || "info@toluck.vn";

      const subject = `[TOLUCK Agency] Báo giá kế hoạch & Đề xuất tối ưu kinh doanh - ${company}`;
      const pdfBuffer = await generateQuotationPDF(quotation, config);

      const htmlBody = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <div style="background: linear-gradient(135deg, #0f766e 0%, #115e59 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 800;">TOLUCK AGENCY</h1>
            <p style="margin: 5px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.85;">Báo Giá Dịch Vụ Tiếp Thị Số & Chuyển Đổi Công Nghệ</p>
          </div>
          
          <div style="padding: 30px; color: #1e293b; line-height: 1.6; font-size: 14px;">
            <h3 style="margin-top: 0; color: #0f766e; font-size: 18px;">Kính gửi Anh/Chị ${customerName},</h3>
            <p><strong>TOLUCK Agency</strong> xin gửi đến Quý doanh nghiệp <strong>${company}</strong> bảng báo giá chi tiết cho các giải quyết tăng trưởng marketing và ứng dụng AI tự động hóa mà chúng tôi đã thảo luận trong buổi làm việc:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; color: #475569;">
                  <th style="padding: 10px; text-align: left; font-size: 11.5px; text-transform: uppercase;">Dịch vụ đề xuất</th>
                  <th style="padding: 10px; text-align: center; font-size: 11.5px; text-transform: uppercase; width: 60px;">SL</th>
                  <th style="padding: 10px; text-align: right; font-size: 11.5px; text-transform: uppercase; width: 120px;">Thành tiền (đ)</th>
                </tr>
              </thead>
              <tbody>
                ${quotation.services.map((i: any) => `
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px; font-weight: bold; font-size: 13px;">${i.name}<br/><span style="color: #64748b; font-size: 11px; font-weight: normal;">${i.desc || ""}</span></td>
                    <td style="padding: 10px; text-align: center; font-size: 13px;">${i.qty}</td>
                    <td style="padding: 10px; text-align: right; font-weight: bold; font-size: 13px;">${i.total.toLocaleString("vi-VN")} đ</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 25px;">
              <table style="width: 100%; font-size: 13px;">
                <tr>
                  <td style="color: #64748b; padding: 4px 0;">Tạm tính dịch vụ:</td>
                  <td style="text-align: right; font-weight: bold; padding: 4px 0;">${quotation.subtotal.toLocaleString("vi-VN")} đ</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding: 4px 0;">Chiết khấu (${quotation.discountPercent}%):</td>
                  <td style="text-align: right; font-weight: bold; color: #dc2626; padding: 4px 0;">-${quotation.discountValue.toLocaleString("vi-VN")} đ</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding: 4px 0;">Thuế GTGT VAT (${quotation.vatPercent}%):</td>
                  <td style="text-align: right; font-weight: bold; padding: 4px 0;">+${quotation.vatValue.toLocaleString("vi-VN")} đ</td>
                </tr>
                <tr style="font-size: 15px; font-weight: bold; color: #0f766e; border-top: 1px solid #cbd5e1;">
                  <td style="padding: 10px 0 0 0;">CỘNG THANH TOÁN:</td>
                  <td style="text-align: right; padding: 10px 0 0 0;">${quotation.totalAmount.toLocaleString("vi-VN")} đ</td>
                </tr>
              </table>
            </div>
            
            <p>📌 <strong>Hướng dẫn thanh toán trực tuyến:</strong></p>
            <div style="background-color: #ecfbfb; border-left: 4px solid #0f766e; padding: 15px; border-radius: 0 8px 8px 0; font-size: 12.5px; margin-bottom: 20px;">
              • Ngân hàng: <strong>Quân Đội MB Bank (Chi nhánh Hồ Chí Minh)</strong><br/>
              • Số Tài khoản: <strong>0963484365</strong><br/>
              • Chủ tài khoản: <strong>VO THI THUY</strong><br/>
              • Nội dung chuyển khoản: <strong style="color: #0f766e; font-family: monospace;">Thanh Toan Bao Gia ${code}</strong>
            </div>

            <p style="font-size: 12px; color: #475569; font-style: italic;">* Chi tiết cụ thể về các dịch vụ bàn giao, thời gian thực hiện, và điều khoản pháp lý đã được ban chủ trì TOLUCK ký đóng dấu mộc đỏ, tích hợp sẵn ở tệp PDF đính kèm trong thư này. Quý khách vui lòng tải xuống để tham khảo.*</p>
            
            <p>Mọi thắc mắc cần bổ sung hoặc đàm phán hợp đồng, xin Quý khách phản hồi trực tiếp email này hoặc gọi nhanh Hotline hỗ trợ: <strong>${companyPhone}</strong>.</p>
            
            <p style="margin-bottom: 0;">Trân trọng cảm ơn,</p>
            <p style="margin-top: 5px; font-weight: bold; color: #0f766e;">Ban Điều Hành & Tư Vấn TOLUCK Agency</p>
          </div>
          
          <div style="background-color: #0f172a; padding: 25px 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; line-height: 1.5;">
            <p style="margin: 0; font-weight: bold; color: white;">${companyName}</p>
            <p style="margin: 4px 0;">📍 ${companyAddress}</p>
            <p style="margin: 4px 0;">Hotline: ${companyPhone} | Email: ${companyEmail}</p>
          </div>
        </div>
      `;

      // Read SMTP Configurations from db
      const cleanEnvVal = (val: string | undefined): string => {
        if (!val) return "";
        return val.trim().replace(/^["']|["']$/g, "").trim();
      };

      const dbConfig = db.system_config || {};
      const smtpHost = cleanEnvVal(dbConfig.smtpHost || process.env.SMTP_HOST);
      const smtpPort = cleanEnvVal(dbConfig.smtpPort || process.env.SMTP_PORT) || "587";
      const smtpUser = cleanEnvVal(dbConfig.smtpEmail || process.env.SMTP_USER);
      const smtpPass = cleanEnvVal(dbConfig.smtpPass || process.env.SMTP_PASS);
      const smtpFrom = cleanEnvVal(dbConfig.smtpFrom || dbConfig.smtpEmail || process.env.SMTP_FROM || smtpUser || "info@toluck.com.vn");

      let emailSent = false;
      let isSimulated = true;
      let message = "Đã chạy chế độ mô phỏng email vì hệ thống chưa điền tài khoản SMTP cấu hình trong Cấu hình hệ thống.";

      if (smtpHost && smtpUser && smtpPass) {
        console.log(`Sending Quotation PDF to ${email} via ${smtpHost}`);
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: Number(smtpPort),
          secure: smtpPort === "465",
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          tls: { rejectUnauthorized: false }
        });

        await transporter.sendMail({
          from: smtpFrom,
          to: email,
          subject: subject,
          html: htmlBody,
          attachments: [
            {
              filename: `Bao_gia_TOLUCK_${code}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf'
            }
          ]
        });
        emailSent = true;
        isSimulated = false;
        message = `Đã gửi báo giá ${code} kèm file đóng dấu mộc PDF thành công qua SMTP thực tế đến ${email}.`;
      }

      // Record in Quotation sentHistory
      quotation.status = "Đã gửi khách";
      if (!quotation.sentHistory) quotation.sentHistory = [];
      const newHistoryItem = {
        date: new Date().toISOString().replace("T", " ").substring(0, 19),
        toEmail: email,
        status: isSimulated ? "GỬI MÔ PHỎNG" : "GỬI THÀNH CÔNG"
      };
      quotation.sentHistory.unshift(newHistoryItem);

      // Record in CRM Lead interaction log
      if (quotation.customerId) {
        const lead = db.crms.find((c: any) => c.id === quotation.customerId);
        if (lead) {
          if (!lead.historyLogs) lead.historyLogs = [];
          lead.historyLogs.unshift({
            date: new Date().toISOString().split("T")[0],
            type: "Gửi Mail",
            detail: `Báo giá ${code} kèm mộc đỏ PDF đã được chuyển phát thành công tới ${email} (${isSimulated ? "Chế độ mô phỏng" : "Thực tế qua SMTP"}). Trị giá: ${totalAmount.toLocaleString("vi-VN")}đ`
          });
        }
      }

      // Add to overall logs
      db.logs.unshift({
        id: "log-" + Date.now(),
        date: new Date().toISOString().replace("T", " ").substring(0, 19),
        user: user.email,
        action: "Gửi Mail Báo giá",
        detail: `Đã chuyển phát ${code} tới đại diện ${customerName} - ${company} (${email})`
      });

      await writeCmsDb(db);
      res.json({ success: true, isSimulated, message, log: newHistoryItem });
    } catch (err: any) {
      console.error("[Email Sending Error] Failed to send Quotation email:", err);
      res.status(500).json({ error: "Gửi mail thất bại", details: err.message });
    }
  });

  // --- MODULE DỰ ÁN ENDPOINTS ---
  app.post("/api/cms/projects/save", async (req, res) => {
    const user = getSimulatedUser(req);
    if (!user) return res.status(401).json({ error: "Vui lòng đăng nhập" });

    const pData = req.body;
    const db = await readCmsDb();
    if (!db.projects) db.projects = [];

    const isEdit = pData.isEdit;
    let savedProject: any = null;

    if (isEdit) {
      const idx = db.projects.findIndex((p: any) => p.id === pData.id);
      if (idx !== -1) {
        db.projects[idx] = {
          ...db.projects[idx],
          name: pData.name || db.projects[idx].name,
          status: pData.status || db.projects[idx].status,
          startDate: pData.startDate || db.projects[idx].startDate,
          endDate: pData.endDate || db.projects[idx].endDate,
          notes: pData.notes !== undefined ? pData.notes : db.projects[idx].notes,
          budget: Number(pData.budget) !== undefined ? Number(pData.budget) : db.projects[idx].budget,
          services: pData.services || db.projects[idx].services
        };
        savedProject = db.projects[idx];

        db.logs.unshift({
          id: "log-" + Date.now(),
          date: new Date().toISOString().replace("T", " ").substring(0, 19),
          user: user.email,
          action: "Cập nhật Dự án",
          detail: `Cập nhật dự án [${savedProject.name}] của ${savedProject.company} thành [${savedProject.status}]`
        });
      } else {
        return res.status(404).json({ error: "Không tìm thấy dự án." });
      }
    } else {
      const projId = "proj-" + Date.now();
      const newProject = {
        id: projId,
        leadId: pData.leadId,
        company: pData.company || "Đối tác",
        name: pData.name || "Dự án mới",
        status: pData.status || "Lập kế hoạch",
        startDate: pData.startDate || new Date().toISOString().split("T")[0],
        endDate: pData.endDate || new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().split("T")[0],
        notes: pData.notes || "Khởi tạo thành công từ Báo giá.",
        budget: Number(pData.budget) || 0,
        services: pData.services || []
      };
      db.projects.push(newProject);
      savedProject = newProject;

      db.logs.unshift({
        id: "log-" + Date.now(),
        date: new Date().toISOString().replace("T", " ").substring(0, 19),
        user: user.email,
        action: "Lập Dự án",
        detail: `Khởi lập dự án mới [${newProject.name}] cho ${pData.company} (${Number(newProject.budget).toLocaleString("vi-VN")}đ)`
      });

      // Log in Lead logs
      if (pData.leadId) {
        const lead = db.crms.find((c: any) => c.id === pData.leadId);
        if (lead) {
          if (!lead.historyLogs) lead.historyLogs = [];
          lead.historyLogs.unshift({
            date: new Date().toISOString().split("T")[0],
            type: "Hợp đồng",
            detail: `Khởi động bàn giao kỹ thuật & Chuyển thành dự án: [${newProject.name}]`
          });
        }
      }
    }

    await writeCmsDb(db);
    res.json({ success: true, project: savedProject });
  });

  // 5.5 PUBLIC SYSTEM CONFIGS ROUTE (Safe for clients, no secrets)
  app.get("/api/public-config", async (req, res) => {
    try {
      const db = await readCmsDb();
      const config = db.system_config || {};
      res.json({
        logo: config.logo || "https://toluck.com.vn/logo.png",
        favicon: config.favicon || "https://toluck.com.vn/favicon.ico",
        footerText: config.footerText || "TOLUCK AGENCY © 2026 — ĐỐI TÁC CỰC ĐẠI HÓA DOANH THU & CHUYỂN ĐỔI SỐ",
        companyPhone: config.companyPhone || "0963 484 365",
        companyIntro: config.companyIntro || "Biểu mẫu này giúp TOLUCK đánh giá hiện trạng marketing, xác định cơ hội tăng trưởng và xây dựng chiến lược phù hợp cho doanh nghiệp của bạn.",
        companyEmail: config.companyEmail || "info@toluck.vn",
        companyName: config.companyName || "CÔNG TY CỔ PHẦN CÔNG NGHỆ & TRUYỀN THÔNG TOLUCK",
        companyAddress: config.companyAddress || "Tòa nhà TOLUCK Building, Hà Nội, Việt Nam",
        companySubtitle: config.companySubtitle || "Digital & AI Agency",
        fanpageUrl: config.fanpageUrl || "https://facebook.com/toluck.vn",
        landingHeroTitle: config.landingHeroTitle || "DOANH NGHIỆP CỦA BẠN ĐANG LÃNG PHÍ BAO NHIÊU CƠ HỘI TĂNG TRƯỞNG?",
        landingHeroDesc: config.landingHeroDesc || "Nhận ngay báo cáo đánh giá Marketing 100 điểm bằng AI giúp phát hiện điểm yếu, cơ hội tăng trưởng và chiến lược phù hợp cho doanh nghiệp.",
        partners: config.partners || [
          { name: "NDS Business Care", logo: "" },
          { name: "BFIT", logo: "" },
          { name: "THADAHA", logo: "" },
          { name: "SunnyDay", logo: "" },
          { name: "Hà Linh Dental", logo: "" },
          { name: "DISC Electric", logo: "" }
        ]
      });
    } catch (e) {
      res.json({
        logo: "https://toluck.com.vn/logo.png",
        favicon: "https://toluck.com.vn/favicon.ico",
        footerText: "TOLUCK AGENCY © 2026 — ĐỐI TÁC CỰC ĐẠI HÓA DOANH THU & CHUYỂN ĐỔI SỐ",
        companyPhone: "0963 484 365",
        companyIntro: "Biểu mẫu này giúp TOLUCK đánh giá hiện trạng marketing, xác định cơ hội tăng trưởng và xây dựng chiến lược phù hợp cho doanh nghiệp của bạn.",
        companyEmail: "info@toluck.vn",
        companyName: "CÔNG TY CỔ PHẦN CÔNG NGHỆ & TRUYỀN THÔNG TOLUCK",
        companyAddress: "Tòa nhà TOLUCK Building, Hà Nội, Việt Nam",
        companySubtitle: "Digital & AI Agency",
        fanpageUrl: "https://facebook.com/toluck.vn",
        landingHeroTitle: "DOANH NGHIỆP CỦA BẠN ĐANG LÃNG PHÍ BAO NHIÊU CƠ HỘI TĂNG TRƯỞNG?",
        landingHeroDesc: "Nhận ngay báo cáo đánh giá Marketing 100 điểm bằng AI giúp phát hiện điểm yếu, cơ hội tăng trưởng và chiến lược phù hợp cho doanh nghiệp.",
        partners: [
          { name: "NDS Business Care", logo: "" },
          { name: "BFIT", logo: "" },
          { name: "THADAHA", logo: "" },
          { name: "SunnyDay", logo: "" },
          { name: "Hà Linh Dental", logo: "" },
          { name: "DISC Electric", logo: "" }
        ]
      });
    }
  });

  // 6. SYSTEM CONFIGS ROUTE Save (ADMIN only)
  app.post("/api/cms/config/save", async (req, res) => {
    const user = getSimulatedUser(req);
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ error: "Chỉ Admin tối cao mới được chỉnh sửa cấu hình hệ thống." });
    }

    const { 
      geminiApiKey, openaiApiKey, n8nWebhookUrl, smtpEmail, smtpHost, smtpPort, smtpPass, smtpFrom, 
      logo, favicon, footerText, companyPhone, companyIntro, companyEmail, companyName, companyAddress, 
      companySubtitle, fanpageUrl, landingHeroTitle, landingHeroDesc, partners 
    } = req.body;
    const db = await readCmsDb();

    db.system_config = {
      geminiApiKey: geminiApiKey !== undefined ? geminiApiKey : db.system_config.geminiApiKey,
      openaiApiKey: openaiApiKey !== undefined ? openaiApiKey : db.system_config.openaiApiKey,
      n8nWebhookUrl: n8nWebhookUrl !== undefined ? n8nWebhookUrl : db.system_config.n8nWebhookUrl,
      smtpEmail: smtpEmail !== undefined ? smtpEmail : db.system_config.smtpEmail,
      smtpHost: smtpHost !== undefined ? smtpHost : db.system_config.smtpHost,
      smtpPort: smtpPort !== undefined ? smtpPort : db.system_config.smtpPort,
      smtpPass: smtpPass || db.system_config.smtpPass, // Preserve if not typed
      smtpFrom: smtpFrom !== undefined ? smtpFrom : db.system_config.smtpFrom,
      logo: logo !== undefined ? logo : db.system_config.logo,
      favicon: favicon !== undefined ? favicon : db.system_config.favicon,
      footerText: footerText !== undefined ? footerText : db.system_config.footerText,
      companyPhone: companyPhone !== undefined ? companyPhone : (db.system_config.companyPhone || "0963 484 365"),
      companyIntro: companyIntro !== undefined ? companyIntro : (db.system_config.companyIntro || "Biểu mẫu này giúp TOLUCK đánh giá hiện trạng marketing, xác định cơ hội tăng trưởng và xây dựng chiến lược phù hợp cho doanh nghiệp của bạn."),
      companyEmail: companyEmail !== undefined ? companyEmail : (db.system_config.companyEmail || "info@toluck.vn"),
      companyName: companyName !== undefined ? companyName : (db.system_config.companyName || "CÔNG TY CỔ PHẦN CÔNG NGHỆ & TRUYỀN THÔNG TOLUCK"),
      companyAddress: companyAddress !== undefined ? companyAddress : (db.system_config.companyAddress || "Tòa nhà TOLUCK Building, Hà Nội, Việt Nam"),
      companySubtitle: companySubtitle !== undefined ? companySubtitle : (db.system_config.companySubtitle || "Digital & AI Agency"),
      fanpageUrl: fanpageUrl !== undefined ? fanpageUrl : (db.system_config.fanpageUrl || "https://facebook.com/toluck.vn"),
      landingHeroTitle: landingHeroTitle !== undefined ? landingHeroTitle : (db.system_config.landingHeroTitle || "DOANH NGHIỆP CỦA BẠN ĐANG LÃNG PHÍ BAO NHIÊU CƠ HỘI TĂNG TRƯỞNG?"),
      landingHeroDesc: landingHeroDesc !== undefined ? landingHeroDesc : (db.system_config.landingHeroDesc || "Nhận ngay báo cáo đánh giá Marketing 100 điểm bằng AI giúp phát hiện điểm yếu, cơ hội tăng trưởng và chiến lược phù hợp cho doanh nghiệp."),
      partners: partners !== undefined ? partners : (db.system_config.partners || [
        { name: "NDS Business Care", logo: "" },
        { name: "BFIT", logo: "" },
        { name: "THADAHA", logo: "" },
        { name: "SunnyDay", logo: "" },
        { name: "Hà Linh Dental", logo: "" },
        { name: "DISC Electric", logo: "" }
      ])
    };

    // Propagate system key back to Node runtime environment
    if (geminiApiKey) {
      process.env.GEMINI_API_KEY = geminiApiKey;
    }
    if (smtpHost) process.env.SMTP_HOST = smtpHost;
    if (smtpPort) process.env.SMTP_PORT = smtpPort;
    if (smtpEmail) process.env.SMTP_USER = smtpEmail;
    if (smtpPass && smtpPass !== "CONFIGURED_IN_ENV") process.env.SMTP_PASS = smtpPass;
    if (smtpFrom) process.env.SMTP_FROM = smtpFrom;

    db.logs.unshift({
      id: "log-" + Date.now(),
      date: new Date().toISOString().replace("T", " ").substring(0, 19),
      user: user.email,
      action: "Cập nhật hệ thống",
      detail: "Thay đổi toàn bộ tham số chìa khóa AI, Webhook n8n nộp lead và cổng SMTP."
    });

    await writeCmsDb(db);
    res.json({ success: true, message: "Lưu cấu hình hệ thống thành công!" });
  });

  // Load backend variables into memory db upon startup
  try {
    const db = await readCmsDb();
    if (db.system_config) {
      if (process.env.GEMINI_API_KEY && !db.system_config.geminiApiKey) {
        db.system_config.geminiApiKey = process.env.GEMINI_API_KEY;
      }
      if (process.env.SMTP_HOST && !db.system_config.smtpHost) {
        db.system_config.smtpHost = process.env.SMTP_HOST;
      }
      if (process.env.SMTP_USER && !db.system_config.smtpEmail) {
        db.system_config.smtpEmail = process.env.SMTP_USER;
      }
      if (process.env.SMTP_PORT && !db.system_config.smtpPort) {
        db.system_config.smtpPort = process.env.SMTP_PORT;
      }
      if (process.env.SMTP_FROM && !db.system_config.smtpFrom) {
        db.system_config.smtpFrom = process.env.SMTP_FROM;
      }
      if (!db.system_config.companyPhone) {
        db.system_config.companyPhone = "0963 484 365";
      }
      if (!db.system_config.companyIntro) {
        db.system_config.companyIntro = "Biểu mẫu này giúp TOLUCK đánh giá hiện trạng marketing, xác định cơ hội tăng trưởng và xây dựng chiến lược phù hợp cho doanh nghiệp của bạn.";
      }
      if (!db.system_config.companyEmail) {
        db.system_config.companyEmail = "info@toluck.vn";
      }
      if (!db.system_config.companyName) {
        db.system_config.companyName = "CÔNG TY CỔ PHẦN CÔNG NGHỆ & TRUYỀN THÔNG TOLUCK";
      }
      if (!db.system_config.companyAddress) {
        db.system_config.companyAddress = "Tòa nhà TOLUCK Building, Hà Nội, Việt Nam";
      }
      await writeCmsDb(db);
    }
  } catch (ioErr) {
    console.error("Failed to propagate ENV startup metadata:", ioErr);
  }


  // Vite middleware Setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

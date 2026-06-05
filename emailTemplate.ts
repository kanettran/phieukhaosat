import { SurveyData, AIReport } from "./src/types";

/**
 * Generates a beautiful, highly polished, responsive HTML email template
 * for TOLUCK Agency's automated strategic marketing report.
 * Uses inline styling with robust tables for bulletproof client compatibility.
 */
export function generateEmailHTML(survey: SurveyData, report: AIReport, config?: {
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  logo?: string;
}): string {
  const safeSurvey = survey || {} as SurveyData;
  const safeReport = report || {} as AIReport;
  const companyName = config?.companyName || "CÔNG TY CỔ PHẦN CÔNG NGHỆ & TRUYỀN THÔNG TOLUCK";
  const companyAddress = config?.companyAddress || "Tòa nhà TOLUCK Building, Hà Nội, Việt Nam";
  const companyPhone = config?.companyPhone || "0963 484 365";
  const companyEmail = config?.companyEmail || "info@toluck.vn";
  const logo = config?.logo || "https://toluck.com.vn/logo.png";

  // Safe helper to list items cleanly
  const renderList = (items: string[] | undefined) => {
    if (!items || items.length === 0) return "<li>Không có dữ liệu</li>";
    return items.map(item => `
      <li style="margin-bottom: 8px; color: #334155;">
        ${item}
      </li>
    `).join("");
  };

  // Safe helper to render SWOT matrices
  const renderSwotList = (items: string[] | undefined) => {
    if (!items || items.length === 0) return `<div style="color: #64748b; font-style: italic;">Đang cập nhật...</div>`;
    return items.map(item => `
      <div style="margin-bottom: 6px; font-size: 13px; color: #1e293b; line-height: 1.4;">
        • ${item}
      </div>
    `).join("");
  };

  // Safe helper to render channels as custom blocks
  const renderChannels = () => {
    const channels = safeReport.channelStrategy || [];
    if (channels.length === 0) {
      return `<tr><td colspan="4" style="text-align: center; padding: 15px; color: #64748b;">Đang cập nhật đề xuất kênh...</td></tr>`;
    }
    return channels.map((ch, index) => {
      const priorityColor = ch.priority === "Cao" 
        ? "#ef4444" 
        : ch.priority === "Trung bình" 
          ? "#f59e0b" 
          : "#10b981";
      
      const priorityBg = ch.priority === "Cao" 
        ? "#fef2f2" 
        : ch.priority === "Trung bình" 
          ? "#fffbeb" 
          : "#ecfdf5";

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="padding: 12px; font-size: 14px; font-weight: bold; color: #1e293b;">
            ${ch.channelName || "Đang cập nhật"}
          </td>
          <td style="padding: 12px; font-size: 13px;">
            <span style="display: inline-block; padding: 3px 8px; border-radius: 12px; background-color: ${priorityBg}; color: ${priorityColor}; font-weight: bold; font-size: 11px;">
              ${ch.priority || "Trung bình"}
            </span>
          </td>
          <td style="padding: 12px; font-size: 13px; color: #475569; line-height: 1.4;">
            ${ch.reason || "Đang phân tích"}
          </td>
          <td style="padding: 12px; font-size: 13px; color: #1e3a8a; font-weight: 500; line-height: 1.4;">
            ${ch.actionRequired || "Cần tối ưu"}
          </td>
        </tr>
      `;
    }).join("");
  };

  // Safe helper for pain points
  const renderPainPoints = () => {
    const painPoints = safeReport.painPointSolutions || [];
    if (painPoints.length === 0) {
      return `<p style="color: #64748b; font-style: italic;">Đang cập nhật giải pháp...</p>`;
    }
    return painPoints.map(p => `
      <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin-bottom: 15px; border-radius: 0 8px 8px 0;">
        <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #b91c1c; font-weight: bold;">
          ⚠️ Điểm đau: ${p.painPoint || "Đang cập nhật"}
        </h4>
        <p style="margin: 0; font-size: 13px; color: #1e293b; line-height: 1.5; font-weight: 500;">
          💡 Giải pháp từ TOLUCK: ${p.solution || "Đang tối ưu"}
        </p>
      </div>
    `).join("");
  };

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Báo cáo Chiến lược Marketing - TOLUCK Agency</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f1f5f9; padding: 30px 10px;">
        <tr>
            <td align="center">
                <!-- Wrapper Box -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 650px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.03); border: 1px solid #e2e8f0;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 35px 30px; text-align: center;">
                            ${logo ? `
                                <div style="margin-bottom: 15px; text-align: center;">
                                    <img src="${logo}" alt="${companyName}" style="height: auto; max-height: 55px; max-width: 250px; outline: none; border: 0; display: inline-block; object-fit: contain;" />
                                </div>
                            ` : `
                                <div style="font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: 1.5px; margin-bottom: 5px; font-family: sans-serif;">
                                    <span style="color: #60a5fa;">TOLUCK</span> AGENCY
                                </div>
                            `}
                            <div style="font-size: 11px; font-weight: bold; color: #94a3b8; letter-spacing: 2px; text-transform: uppercase;">
                                KIẾN TẠO CHIẾN LƯỢC TIẾP THỊ SỐ
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Notification Accent -->
                    <tr>
                        <td style="background-color: #eff6ff; padding: 18px 30px; border-bottom: 1px solid #dbeafe; text-align: center;">
                            <span style="font-size: 13px; color: #1e40af; font-weight: 700;">
                                BÁO CÁO PHÂN TÍCH DOANH NGHIỆP DỰA TRÊN CÔNG NGHỆ NHẬN DIỆN AI ĐỘC QUYỀN
                            </span>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 35px 30px;">
                            <!-- Welcome -->
                            <h2 style="margin-top: 0; margin-bottom: 12px; font-size: 20px; font-weight: 800; color: #0f172a;">
                                Kính gửi Anh/Chị ${safeSurvey.contact_name || "Quý khách hàng"},
                            </h2>
                            <p style="margin-top: 0; margin-bottom: 25px; font-size: 14px; line-height: 1.6; color: #475569;">
                                Cảm ơn Quý doanh nghiệp <strong>${safeSurvey.company_name || "đối tác"}</strong> đã hoàn thành bài khảo sát nhu cầu chuyển đổi số & hoạt động tiếp thị trong buổi làm việc hôm nay. 
                                Dựa vào nguồn thông tin đầu vào, phòng Nghiên cứu & Trải nghiệm khách hàng TOLUCK phối hợp cùng hệ thống <strong>TOLUCK AI</strong> đã hoạch định sơ bộ bộ chỉ số sức khỏe Marketing của doanh nghiệp như dưới đây:
                            </p>

                            <!-- Score Banner (Bento style block) -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                                <tr>
                                    <td>
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <!-- Readiness score -->
                                                <td width="50%" valign="top" style="padding-right: 10px;">
                                                    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; text-align: center;">
                                                        <div style="font-size: 12px; font-weight: bold; color: #15803d; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">
                                                            Độ sẵn sàng Marketing
                                                        </div>
                                                        <div style="font-size: 32px; font-weight: 900; color: #166534; line-height: 1.1;">
                                                            ${safeReport.readinessScore || 0}<span style="font-size: 16px; font-weight: 500; color: #166534;">/100</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <!-- Maturity grade -->
                                                <td width="50%" valign="top" style="padding-left: 10px;">
                                                    <div style="background-color: #fffbeb; border: 1px solid #fef08a; border-radius: 12px; padding: 20px; text-align: center;">
                                                        <div style="font-size: 12px; font-weight: bold; color: #b45309; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">
                                                            Xếp loại Doanh nghiệp
                                                        </div>
                                                        <div style="font-size: 32px; font-weight: 900; color: #92400e; line-height: 1.1;">
                                                            Hạng ${safeReport.maturityGrade || "B"}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Section: SWOT Matrix -->
                            <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; border-left: 4px solid #2563eb; padding-left: 10px; margin-bottom: 15px; margin-top: 30px;">
                                I. MA TRẬN PHÂN TÍCH SWOT CHIẾN LƯỢC
                            </h3>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                                <tr>
                                    <td valign="top" style="padding-bottom: 15px;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td width="50%" valign="top" style="padding-right: 8px; padding-bottom: 15px;">
                                                    <div style="background-color: #ecfdf5; border-top: 3px solid #10b981; border-radius: 8px; padding: 15px; min-height: 120px;">
                                                        <div style="font-weight: bold; color: #065f46; font-size: 13px; margin-bottom: 8px;">💪 Điểm mạnh (Strengths)</div>
                                                        ${renderSwotList(safeReport.swotAnalysis?.strengths)}
                                                    </div>
                                                </td>
                                                <td width="50%" valign="top" style="padding-left: 8px; padding-bottom: 15px;">
                                                    <div style="background-color: #fef2f2; border-top: 3px solid #ef4444; border-radius: 8px; padding: 15px; min-height: 120px;">
                                                        <div style="font-weight: bold; color: #991b1b; font-size: 13px; margin-bottom: 8px;">⚠️ Điểm yếu (Weaknesses)</div>
                                                        ${renderSwotList(safeReport.swotAnalysis?.weaknesses)}
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td width="50%" valign="top" style="padding-right: 8px;">
                                                    <div style="background-color: #eff6ff; border-top: 3px solid #3b82f6; border-radius: 8px; padding: 15px; min-height: 120px;">
                                                        <div style="font-weight: bold; color: #1e3a8a; font-size: 13px; margin-bottom: 8px;">🚀 Cơ hội (Opportunities)</div>
                                                        ${renderSwotList(safeReport.swotAnalysis?.opportunities)}
                                                    </div>
                                                </td>
                                                <td width="50%" valign="top" style="padding-left: 8px;">
                                                    <div style="background-color: #fffbeb; border-top: 3px solid #f59e0b; border-radius: 8px; padding: 15px; min-height: 120px;">
                                                        <div style="font-weight: bold; color: #78350f; font-size: 13px; margin-bottom: 8px;">🔥 Rủi ro (Threats)</div>
                                                        ${renderSwotList(safeReport.swotAnalysis?.threats)}
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Section: Recommendations based on Pain Points -->
                            <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; border-left: 4px solid #2563eb; padding-left: 10px; margin-bottom: 15px; margin-top: 20px;">
                                II. PHƯƠNG ÁN GIẢI QUYẾT ĐIỂM ĐAU CỐT LÕI
                            </h3>
                            <div style="margin-bottom: 30px;">
                                ${renderPainPoints()}
                            </div>

                            <!-- Section: Channel Strategy Matrix -->
                            <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; border-left: 4px solid #2563eb; padding-left: 10px; margin-bottom: 15px; margin-top: 20px;">
                                III. MA TRẬN ĐỀ XUẤT PHÂN BỔ KÊNH
                            </h3>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 30px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                                <tr style="background-color: #0f172a; color: #ffffff;">
                                    <th style="padding: 10px; font-size: 12px; text-transform: uppercase; text-align: left; width: 25%">Kênh đề xuất</th>
                                    <th style="padding: 10px; font-size: 12px; text-transform: uppercase; text-align: left; width: 15%">Ưu tiên</th>
                                    <th style="padding: 10px; font-size: 12px; text-transform: uppercase; text-align: left; width: 30%">Lý do phân bổ</th>
                                    <th style="padding: 10px; font-size: 12px; text-transform: uppercase; text-align: left; width: 30%">Hành động ưu tiên</th>
                                </tr>
                                ${renderChannels()}
                            </table>

                            <!-- Section: Consultant Opinion & Key Actions -->
                            <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; border-left: 4px solid #2563eb; padding-left: 10px; margin-bottom: 15px; margin-top: 25px;">
                                IV. ĐỀ XUẤT HÀNH ĐỘNG & ĐÁNH GIÁ CHUYÊN GIA
                            </h3>
                            
                            <!-- Actions List -->
                            <ul style="padding-left: 20px; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">
                                ${renderList(safeReport.recommendations)}
                            </ul>

                            <!-- Blockquote Opinion -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                                <tr>
                                    <td style="background-color: #f8fafc; border-left: 4px solid #1e293b; padding: 20px; border-radius: 0 12px 12px 0;">
                                        <div style="font-size: 12px; font-weight: bold; color: #475569; text-transform: uppercase; margin-bottom: 6px;">
                                            Ý kiến ban cố vấn TOLUCK
                                        </div>
                                        <div style="font-size: 13.5px; line-height: 1.6; color: #1e293b; font-style: italic;">
                                            "${safeReport.consultantOpinion || "TOLUCK sẵn sàng đồng hành cùng doanh nghiệp phát triển hệ thống kinh doanh đa kênh."}"
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <!-- Direct CTA Button -->
                            <div style="text-align: center; margin-top: 35px; margin-bottom: 15px;">
                                <a href="https://toluck.com.vn" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 15px 35px; border-radius: 12px; font-weight: bold; font-size: 14px; letter-spacing: 0.5px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
                                    ĐẶT LỊCH HỌP TƯ VẤN 1-ON-1 MIỄN PHÍ
                                </a>
                            </div>
                            <div style="text-align: center; font-size: 11px; color: #64748b;">
                                (TOLUCK Agency tặng thêm 01 buổi review hạ tầng Tracking trị giá 2.500.000 VNĐ cho DN đăng ký tuần này)
                            </div>
                        </td>
                    </tr>

                    <!-- Footer Section -->
                    <tr>
                        <td style="background-color: #0f172a; padding: 35px 30px; text-align: center; border-top: 1px solid #e1e8f0; color: #94a3b8; font-size: 12px; line-height: 1.6;">
                            <div style="font-weight: bold; color: #ffffff; margin-bottom: 10px; font-size: 14px;">
                                ${companyName}
                            </div>
                            <div style="margin-bottom: 6px;">
                                📍 <strong>Trụ sở:</strong> ${companyAddress}
                            </div>
                            <div style="margin-bottom: 6px;">
                                📞 <strong>Hotline:</strong> ${companyPhone} | ✉️ <strong>Email:</strong> ${companyEmail}
                            </div>
                            <div style="margin-bottom: 20px;">
                                🌐 <strong>Phòng Giải pháp Số:</strong> <a href="https://toluck.com.vn" style="color: #60a5fa; text-decoration: none;">www.toluck.com.vn</a>
                            </div>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #334155; padding-top: 15px;">
                                <tr>
                                    <td align="left" style="font-size: 11px; color: #64748b;">
                                        Email tự động được gửi qua hệ thống TOLUCK CRM AI. Vui lòng không trả lời trực tiếp email này.
                                    </td>
                                    <td align="right" style="font-size: 11px; color: #64748b;">
                                        © ${new Date().getFullYear()} ${companyName}.
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
}

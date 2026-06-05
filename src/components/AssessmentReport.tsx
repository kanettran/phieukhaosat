import React, { useState, useEffect } from "react";
import { AIReport, SurveyData } from "../types";
import { 
  Award, TrendingUp, ShieldCheck, Grid, Zap, Calendar, User, 
  MapPin, CheckCircle2, Bookmark, BarChart3, AlertCircle, Sparkles, 
  ChevronRight, Printer, RefreshCw, Layers, ExternalLink, HelpCircle,
  Mail, Send, FileDown, Sliders, Wrench
} from "lucide-react";
import { motion } from "motion/react";
import { generateEmailHTML } from "../../emailTemplate";

interface AssessmentReportProps {
  report: AIReport;
  surveyData: SurveyData;
  onReset: () => void;
  currentUser?: any;
  publicConfig?: {
    logo?: string;
    favicon?: string;
    footerText?: string;
    companyPhone?: string;
    companyIntro?: string;
    companyEmail?: string;
    companyName?: string;
    companyAddress?: string;
  };
}

export default function AssessmentReport({ report, surveyData, onReset, currentUser, publicConfig }: AssessmentReportProps) {
  // Tabs switcher: "report" (standard dashboard) or "email" (email dispatch console & live template render)
  const [activeTab, setActiveTab] = useState<"report" | "email">("report");
  
  const isAdmin = currentUser?.role === "ADMIN";

  // Force activeTab to report for non-admin users
  useEffect(() => {
    if (!isAdmin && activeTab === "email") {
      setActiveTab("report");
    }
  }, [isAdmin, activeTab]);
  
  // Email state managers
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailHtml, setEmailHtml] = useState<string>(() => {
    try {
      return generateEmailHTML(surveyData, report, publicConfig);
    } catch (e) {
      return "";
    }
  });
  const [useTestData, setUseTestData] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(surveyData.email || "");
  const [isSimulated, setIsSimulated] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // SMTP connection test diagnostic state managers
  const [diagnosticResult, setDiagnosticResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
    error?: string;
  } | null>(null);
  const [diagnosticStatus, setDiagnosticStatus] = useState<"idle" | "testing" | "success" | "error">("idle");

  // Live mockup template preview switcher based on test payload / real data
  useEffect(() => {
    const updatePreview = async () => {
      if (useTestData) {
        try {
          const res = await fetch("/api/test-payload");
          if (res.ok) {
            const data = await res.json();
            const html = generateEmailHTML({ ...data.surveyData, email: recipientEmail }, data.reportData, publicConfig);
            setEmailHtml(html);
          }
        } catch (err) {
          console.error("Failed to load test payload preview:", err);
        }
      } else {
        try {
          setEmailHtml(generateEmailHTML({ ...surveyData, email: recipientEmail }, report, publicConfig));
        } catch (err) {
          console.error("Failed to reset standard preview:", err);
        }
      }
    };
    updatePreview();
  }, [useTestData, recipientEmail, surveyData, report, publicConfig]);

  const handleTestSmtpConnection = async () => {
    setDiagnosticStatus("testing");
    setDiagnosticResult(null);
    try {
      const response = await fetch("/api/test-smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testRecipient: recipientEmail || surveyData.email || "info@toluck.com.vn",
        }),
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        setDiagnosticStatus("success");
        setDiagnosticResult({
          success: true,
          message: resData.message,
          details: resData.details,
        });
      } else {
        setDiagnosticStatus("error");
        setDiagnosticResult({
          success: false,
          message: resData.message || "Không thể kết nối hoặc xác thực SMTP.",
          error: resData.error || "SMTP_VERIFY_FAILED",
          details: resData.details || resData,
        });
      }
    } catch (err: any) {
      console.error("Lỗi chẩn đoán SMTP:", err);
      setDiagnosticStatus("error");
      setDiagnosticResult({
        success: false,
        message: `Lỗi kết nối API: ${err.message || String(err)}`,
        error: "API_CONNECTION_ERROR"
      });
    }
  };

  const handleDownloadPDF = async () => {
    setDownloadingPdf(true);
    try {
      const response = await fetch("/api/download-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surveyData: surveyData,
          reportData: report,
          useTestData: useTestData,
        }),
      });

      if (!response.ok) {
        throw new Error("Không thể khởi tạo file PDF từ máy chủ.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      const downloadName = useTestData 
        ? `Bao_cao_marketing_${(publicConfig?.companyName || "TOLUCK").replace(/[^a-zA-Z0-9]/g, "_")}_TEST_PAYLOAD.pdf`
        : `Bao_cao_marketing_${(publicConfig?.companyName || "TOLUCK").replace(/[^a-zA-Z4-9]/g, "_")}_${(surveyData.company_name || "Doanh_nghiep").replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Lỗi khi tải PDF:", err);
      alert(`Gặp vấn đề khi xuất PDF: ${err.message || String(err)}`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Format current date helper
  const currentDate = new Date().toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Automated delivery on demand (user clicks button)
  // Removed automatic dispatch on mount to make page loading instant and prevent premature server load

  const sendStrategicEmail = async () => {
    if (!recipientEmail) {
      setEmailStatus("error");
      setEmailMessage("Vui lòng nhập địa chỉ Email của khách hàng.");
      return;
    }

    setEmailStatus("sending");
    setEmailMessage("Đang biên soạn mẫu HTML chiến lược & truyền máy chủ SMTP...");

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surveyData: {
            ...surveyData,
            email: recipientEmail,
          },
          reportData: report,
          useTestData: useTestData,
        }),
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        setEmailStatus("success");
        setIsSimulated(resData.isSimulated);
        setEmailHtml(resData.log?.html || "");
        
        if (resData.isSimulated) {
          setEmailMessage(`[MÔ PHỎNG THÀNH CÔNG] Đã sinh và lưu bản vẽ Email HTML thành công. Hệ thống đang chạy chế độ phát thử nghiệm (Visual Studio Mode).`);
        } else {
          setEmailMessage(`[SMTP THÀNH CÔNG] Đã tạo mẫu HTML và gửi email báo cáo chiến lược trực tiếp tới hòm thư ${recipientEmail}.`);
        }
      } else {
        throw new Error(resData.message || "Failed to deliver email");
      }
    } catch (err: any) {
      console.error("Error dispatching strategic report email:", err);
      setEmailStatus("error");
      setEmailMessage(`Gặp lỗi khi truyền tải email: ${err.message || String(err)}. Hệ thống tiếp tục duy trì bản vẽ thiết kế HTML đầy đủ dưới đây.`);
      
      // Self-generating fallback full beautiful HTML locally if server route fails or is disconnected
      try {
        setEmailHtml(generateEmailHTML({
          ...surveyData,
          email: recipientEmail,
        }, report, publicConfig));
      } catch (calcErr) {
        console.error("Client fallback generation failed:", calcErr);
      }
    }
  };

  const getReadinessColor = (score: number) => {
    if (score >= 85) return { text: "text-emerald-600 bg-emerald-50 border-emerald-200", fill: "#10b981" };
    if (score >= 60) return { text: "text-blue-600 bg-blue-50 border-blue-200", fill: "#3b82f6" };
    if (score >= 40) return { text: "text-amber-600 bg-amber-50 border-amber-200", fill: "#f59e0b" };
    return { text: "text-rose-600 bg-rose-50 border-rose-200", fill: "#ef4444" };
  };

  const readinessColor = getReadinessColor(report.readinessScore);

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:space-y-4 font-sans" id="assessment-report-panel">
      {/* Print-specific header */}
      <div className="hidden print:block text-center border-b border-gray-200 pb-4 mb-4">
        {publicConfig?.logo && (
          <div className="flex justify-center mb-2">
            <img src={publicConfig.logo} alt="Logo" className="h-10 object-contain" referrerPolicy="no-referrer" />
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">BÁO CÁO ĐÁNH GIÁ MỨC ĐỘ SẴN SÀNG MARKETING</h1>
        <p className="text-xs text-gray-500 font-semibold mt-1">
          {publicConfig?.companyName || "TOLUCK AGENCY"} &bull; {publicConfig?.footerText || "PHÒNG MARKETING THUÊ NGOÀI"}
        </p>
      </div>

      {/* Top Banner Success Notification */}
      <div className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 text-white shadow-xl relative overflow-hidden print:hidden">
        <div className="absolute right-0 bottom-0 w-64 h-64 rounded-full bg-blue-500/10 blur-2xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              Khảo sát đã gửi thành công!
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug text-white">
              Cảm ơn bạn đã hoàn thành khảo sát nhu cầu
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
              Hệ thống {publicConfig?.companyName || "TOLUCK"} AI đang phân tích dữ liệu doanh nghiệp của bạn. Báo cáo đánh giá và đề xuất chiến lược chi tiết đầy đủ sẽ được gửi về email <span className="font-semibold text-white underline">{surveyData.email}</span> trong vòng 3-5 phút.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0 self-end md:self-center">
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPdf}
              className={`flex items-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                downloadingPdf 
                  ? "bg-blue-800 text-blue-200 border border-blue-800 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-700 text-white border border-blue-500 hover:border-blue-600"
              }`}
            >
              {downloadingPdf ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              <span>{downloadingPdf ? "Đang tạo PDF..." : "Tải PDF Báo Cáo"}</span>
            </button>

            <button
              onClick={onReset}
              className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 text-xs font-bold cursor-pointer transition-all shadow-xs"
            >
              <RefreshCw className="w-4 h-4 text-blue-500" />
              <span>Làm khảo sát mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual Tab Switcher */}
      {isAdmin && (
        <div className="flex border-b border-gray-200/80 bg-white p-1 rounded-2xl border border-gray-200/60 shadow-xs max-w-sm print:hidden">
          <button
            onClick={() => setActiveTab("report")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "report"
                ? "bg-[#0F172A] text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
            id="tab-report-advisory"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Báo cáo chiến lược</span>
          </button>
          <button
            onClick={() => setActiveTab("email")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "email"
                ? "bg-[#0F172A] text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
            id="tab-email-preview"
          >
            <div className="relative">
              <Mail className="w-4 h-4" />
              {emailStatus === "sending" && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
              )}
              {emailStatus === "success" && (
                <span className="absolute -top-1 -right-1 flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              )}
            </div>
            <span>Bản xem trước Email</span>
            <span className="bg-blue-100 text-blue-800 text-[9px] font-black px-1.5 py-0.5 rounded-full scale-90">Hot</span>
          </button>
        </div>
      )}

      {activeTab === "report" && (
        <div className="space-y-6" id="report-tab-subcontainer">
          {/* Primary Dashboard Summary section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Circular Readiness Score Card */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-white border border-gray-100 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest pl-0.5">CHỈ SỐ SẴN SÀNG</h3>
                <p className="text-xs text-gray-400 mt-0.5">Marketing Readiness Index (MRI)</p>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${readinessColor.text}`}>
                Hạng {report.maturityGrade}
              </span>
            </div>

            {/* Visual Arc / Circle dial indicator */}
            <div className="flex flex-col items-center justify-center p-4 relative">
              <svg className="w-36 h-36 transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="72"
                  cy="72"
                  r="64"
                  className="text-gray-100"
                  strokeWidth="10"
                  stroke="currentColor"
                  fill="transparent"
                />
                {/* Foreground value arc */}
                <circle
                  cx="72"
                  cy="72"
                  r="64"
                  className="transition-all duration-1000 ease-out"
                  strokeWidth="10"
                  strokeDasharray={402}
                  strokeDashoffset={402 - (402 * report.readinessScore) / 100}
                  strokeLinecap="round"
                  stroke={readinessColor.fill}
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold text-gray-950 tracking-tight">{report.readinessScore}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">ĐIỂM CHUẨN</span>
              </div>
            </div>

            <div className="text-center p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-600 leading-relaxed font-medium">
              Doanh nghiệp đạt cấp độ <span className="font-bold text-blue-700">{report.maturityGrade}</span>. 
              {report.readinessScore >= 75 
                ? ` Hạ tầng và nguồn lực cực kỳ tiềm năng, sẵn sàng đột phá doanh thu mạnh mẽ cùng ${publicConfig?.companyName || "TOLUCK"}.`
                : report.readinessScore >= 50 
                  ? " Có nền tảng cơ bản khá tốt, cần kiện toàn các khoảng hổng chuyển đổi và tối ưu ngân sách quảng cáo."
                  : " Cần xây dựng lại hệ thống chiến lược và cài đặt lại tracking cơ bản trước khi chi lớn cho quảng cáo."}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 mt-4 space-y-2.5 text-xs text-gray-500">
            <div className="flex justify-between items-center">
              <span>Khách hàng mục tiêu:</span>
              <span className="font-semibold text-gray-800 text-right truncate max-w-[150px]" title={surveyData.target_customer}>
                {surveyData.target_customer}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Doanh thu:</span>
              <span className="font-semibold text-blue-600">{surveyData.revenue}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Doanh nghiệp:</span>
              <span className="font-bold text-gray-800">{surveyData.company_name}</span>
            </div>
          </div>
        </div>

        {/* Right Score Breakdown Details */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-gray-100 shadow-xl space-y-5">
          <div>
            <h3 className="font-extrabold text-gray-950 text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Chi tiết các trụ cột Sức nặng Marketing
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Phân tích hiệu suất theo từng danh mục năng lực trọng yếu dựa trên kết quả khảo sát.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* 1. Infrastructure */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-700">1. Hạ tầng Digital & Kỹ thuật</span>
                <span className="text-xs font-bold text-blue-600">{report.scoreBreakdown.infrastructure}/100</span>
              </div>
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${report.scoreBreakdown.infrastructure}%` }} />
              </div>
              <p className="text-[10px] text-gray-500 leading-normal">
                Đánh giá qua các tài sản hiện có như Website, Pixel, GA. Điểm cao phản ánh khả năng lưu trữ, tối ưu hóa tệp dữ liệu quảng cáo.
              </p>
            </div>

            {/* 2. Budget */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-700">2. Độ phủ Ngân sách</span>
                <span className="text-xs font-bold text-teal-600">{report.scoreBreakdown.budget}/100</span>
              </div>
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full" style={{ width: `${report.scoreBreakdown.budget}%` }} />
              </div>
              <p className="text-[10px] text-gray-500 leading-normal">
                Độ lớn của ngân sách marketing hiện tại so với mục tiêu tăng trưởng dự kiến. Xác định biên độ an toàn cho chiến dịch.
              </p>
            </div>

            {/* 3. Strategy */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-700">3. Độ rõ nét Chiến lược</span>
                <span className="text-xs font-bold text-emerald-600">{report.scoreBreakdown.strategy}/100</span>
              </div>
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${report.scoreBreakdown.strategy}%` }} />
              </div>
              <p className="text-[10px] text-gray-500 leading-normal">
                Khả năng thấu hiểu khách hàng, năng lực bám đuổi hành vi và xác lập lộ trình hoạt động doanh thu 12 tháng tới.
              </p>
            </div>

            {/* 4. Branding */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-700">4. Định vị Thương hiệu (USP)</span>
                <span className="text-xs font-bold text-rose-600">{report.scoreBreakdown.branding}/100</span>
              </div>
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${report.scoreBreakdown.branding}%` }} />
              </div>
              <p className="text-[10px] text-gray-500 leading-normal">
                Sức mạnh từ điểm khác biệt độc nhất, năng lực định vị trong tâm trí khách hàng mục tiêu để tối ưu CPM quảng cáo.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* SWOT Bento Grid */}
      <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-xl space-y-5" id="report-swot-analysis-bento">
        <div>
          <h3 className="font-extrabold text-gray-950 text-base flex items-center gap-2">
            <Grid className="w-5 h-5 text-blue-500" />
            Ma trận Phân tích SWOT doanh nghiệp
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Bản đánh giá chéo từ {publicConfig?.companyName || "TOLUCK"} AI kết nối điểm mạnh nội tại với cơ hội phát triển thị trường thực tế.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Strengths */}
          <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-100/50 space-y-3">
            <span className="inline-flex py-1 px-3.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              S - ĐIỂM MẠNH (Strengths)
            </span>
            <ul className="space-y-2 text-xs text-gray-700">
              {report.swotAnalysis.strengths.map((item, idx) => (
                <li key={idx} className="flex gap-2 items-start">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="p-5 rounded-2xl bg-amber-50/40 border border-amber-100/50 space-y-3">
            <span className="inline-flex py-1 px-3.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
              W - ĐIỂM YẾU (Weaknesses)
            </span>
            <ul className="space-y-2 text-xs text-gray-700">
              {report.swotAnalysis.weaknesses.map((item, idx) => (
                <li key={idx} className="flex gap-2 items-start">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Opportunities */}
          <div className="p-5 rounded-2xl bg-blue-50/40 border border-blue-100/50 space-y-3">
            <span className="inline-flex py-1 px-3.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
              O - CƠ HỘI (Opportunities)
            </span>
            <ul className="space-y-2 text-xs text-gray-700">
              {report.swotAnalysis.opportunities.map((item, idx) => (
                <li key={idx} className="flex gap-2 items-start">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Threats */}
          <div className="p-5 rounded-2xl bg-rose-50/40 border border-rose-100/50 space-y-3">
            <span className="inline-flex py-1 px-3.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider">
              T - THÁCH THỨC (Threats)
            </span>
            <ul className="space-y-2 text-xs text-gray-700">
              {report.swotAnalysis.threats.map((item, idx) => (
                <li key={idx} className="flex gap-2 items-start">
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Strategic Channels Matrix */}
      <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-xl space-y-5" id="report-channels-table">
        <div>
          <h3 className="font-extrabold text-gray-950 text-base flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-500" />
            Ma trận Đề xuất Kênh truyền thông tối ưu
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Xác lập các điểm chạm then chốt giúp tối ưu phễu thu thập tệp dữ liệu khách hàng chất lượng cao nhất.</p>
        </div>

        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="min-w-full divide-y divide-gray-100 text-xs text-left">
            <thead className="bg-gray-50 font-bold text-gray-700 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Kênh đề xuất</th>
                <th className="px-5 py-3.5">Mức độ ưu tiên</th>
                <th className="px-5 py-3.5">Lý do cốt lõi</th>
                <th className="px-5 py-3.5">Hành động kỹ thuật cần làm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white font-medium text-gray-600">
              {report.channelStrategy.map((channel, idx) => {
                const priorityBg = channel.priority === "Cao"
                  ? "bg-rose-50 border border-rose-100 text-rose-700"
                  : channel.priority === "Trung bình"
                    ? "bg-amber-50 border border-amber-100 text-amber-700"
                    : "bg-gray-50 border border-gray-200 text-gray-500";

                return (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 font-bold text-gray-900 whitespace-nowrap">
                      {channel.channelName}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 rounded-full text-[10px] font-bold ${priorityBg}`}>
                        {channel.priority}
                      </span>
                    </td>
                    <td className="px-5 py-4 leading-relaxed min-w-[200px]">
                      {channel.reason}
                    </td>
                    <td className="px-5 py-4 leading-relaxed font-mono text-[11px] text-blue-600 bg-blue-50/10 hover:bg-blue-50/25 transition-colors">
                      {channel.actionRequired}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pain Points Mitigation Solutions */}
      <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-xl space-y-5" id="report-painpoint-mitigation">
        <div>
          <h3 className="font-extrabold text-gray-950 text-base flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Phương án tháo gỡ điểm đau / khó khăn
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">{publicConfig?.companyName || "TOLUCK"} thiết lập các giải pháp đặc chế để tháo gỡ trực diện các rào cản tăng trưởng hiện tại.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.painPointSolutions.map((item, idx) => (
            <div key={idx} className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-2 relative overflow-hidden">
              <span className="absolute top-0 right-0 py-1 px-2 text-[9px] font-bold bg-amber-50 text-amber-700 rounded-bl-xl border-l border-b border-amber-100">
                LỖ HỔNG #{idx + 1}
              </span>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Điểm đau / Khó khăn:</p>
                <h4 className="text-sm font-extrabold text-gray-950 mt-0.5">{item.painPoint}</h4>
              </div>
              <div className="pt-2 border-t border-gray-100/60 mt-2 space-y-1">
                <p className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">Giải pháp tháo gỡ từ {publicConfig?.companyName || "TOLUCK"}:</p>
                <p className="text-xs text-gray-600 leading-relaxed font-medium">{item.solution}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expert Recommendations & Consultant Opinion */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 1. Bullet list action plan */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-gray-100 shadow-xl space-y-4">
          <div>
            <h3 className="font-extrabold text-gray-950 text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              Khuyến nghị Hành động Tối ưu ngay lập tức
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Các cột mốc cụ thể, có thể tự động áp dụng để thúc đẩy chuyển đổi số tức thì.</p>
          </div>

          <div className="space-y-3.5 pt-2">
            {report.recommendations.map((rec, idx) => (
              <div key={idx} className="flex gap-3.5 items-start">
                <div className="flex-none w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                  {idx + 1}
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-gray-700 leading-relaxed font-semibold">{rec}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Consultant Expert Personal opinion */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-slate-900 text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 -mr-8 -mt-8 w-24 h-24 rounded-full bg-blue-500/10 blur-xl"></div>
          <div className="absolute left-0 bottom-0 w-32 h-32 rounded-full bg-teal-500/5 blur-xl"></div>

          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-2">
              <span className="p-1 px-1.5 bg-yellow-400/20 text-yellow-300 rounded text-[9px] font-bold uppercase tracking-wider">Bảo mật</span>
              <h4 className="text-xs font-bold text-teal-300 uppercase tracking-widest">Đánh giá từ Hội đồng Chiến lược</h4>
            </div>

            <p className="text-xs text-slate-300 italic leading-relaxed font-light">
              &ldquo;{report.consultantOpinion}&rdquo;
            </p>
          </div>

          <div className="pt-5 border-t border-slate-800/80 mt-5 relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center text-white text-sm font-black shadow-inner">
              TL
            </div>
            <div>
              <p className="text-xs font-bold text-white">Ban Cực đại hóa Doanh thu</p>
              <p className="text-[9px] text-blue-300">{publicConfig?.companyName || "TOLUCK"} Strategic Committee</p>
            </div>
          </div>
        </div>

      </div>
      </div>
      )}

      {activeTab === "email" && (
        <div className="space-y-6 animate-fadeIn print:hidden">
          {/* Email dispatch Control bar */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-500 shrink-0" />
                  Bảng Cấu Hình & Gửi Thử Email Khách Hàng
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Hệ thống tự động thiết lập và soạn thảo báo cáo Marketing dạng HTML Responsive dưới đây. Bạn có thể gửi thử tới hòm thư cá nhân để trải nghiệm.
                </p>
              </div>

              {/* SMTP configuration badge status */}
              <div className="flex items-center gap-2 self-start sm:self-center">
                {isSimulated ? (
                  <span className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    Chế độ: Mô phỏng & Xem Trước
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    Chế độ: SMTP Kích Hoạt Thực Tế
                  </span>
                )}
              </div>
            </div>

            {/* Email send controller container */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/50 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50/50 border border-blue-100/60 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="test-mode-toggle"
                    checked={useTestData}
                    onChange={(e) => setUseTestData(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded-sm focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="test-mode-toggle" className="text-xs font-extrabold text-blue-900 select-none cursor-pointer flex items-center gap-1.5 matches-label">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse shrink-0" />
                    Kích hoạt Chế độ Test (Sử dụng dữ liệu mẫu {publicConfig?.companyName || "TOLUCK"} cố định)
                  </label>
                </div>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Test Payload Enabled
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block" id="label-recipient-email">Địa chỉ Email nhận Báo cáo:</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="nhap.email@cua-ban.com"
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold text-slate-900"
                      id="input-recipient-email"
                    />
                  </div>
                </div>
                <button
                  onClick={sendStrategicEmail}
                  disabled={emailStatus === "sending" || diagnosticStatus === "testing"}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  id="btn-send-strategic-email"
                >
                  {emailStatus === "sending" ? (
                    <>
                      <RefreshCw className="animate-spin h-4 w-4 text-white hover:text-white" />
                      <span>Đang gửi...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Gửi Mail (Kèm PDF)</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleTestSmtpConnection}
                  disabled={emailStatus === "sending" || diagnosticStatus === "testing"}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  id="btn-test-smtp-verify"
                  title="Chẩn đoán SMTP: kiểm thử kết nối host và xác thực tài khoản tức thì"
                >
                  {diagnosticStatus === "testing" ? (
                    <>
                      <RefreshCw className="animate-spin h-4 w-4 text-rose-500" />
                      <span>Đang test...</span>
                    </>
                  ) : (
                    <>
                      <Wrench className="w-4 h-4 text-rose-600" />
                      <span>Test SMTP có sẵn</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Email delivery logs banner indication */}
            {emailMessage && (
              <div className={`p-4 rounded-xl border flex items-start gap-2.5 text-xs font-semibold ${
                emailStatus === "success"
                  ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                  : emailStatus === "error"
                    ? "bg-rose-50 border-rose-100 text-rose-800"
                    : "bg-blue-50 border-blue-100 text-blue-800"
              }`} id="email-status-banner">
                {emailStatus === "success" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 select-text">
                  <p className="font-bold">{emailStatus === "success" ? "Thông báo trạng thái:" : "Lỗi hệ thống khi gửi:"}</p>
                  <p className="text-gray-600 mt-0.5 leading-relaxed font-normal">{emailMessage}</p>
                </div>
              </div>
            )}

            {/* SMTP Diagnostic results section */}
            {diagnosticResult && (
              <div className={`p-4 rounded-xl border flex flex-col gap-2.5 text-xs font-semibold select-text ${
                diagnosticResult.success
                  ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                  : "bg-rose-50 border-rose-100 text-rose-800"
              }`} id="smtp-diagnostic-panel">
                <div className="flex items-start gap-2.5">
                  {diagnosticResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-bold">{diagnosticResult.success ? "Chẩn đoán SMTP thành công:" : "Kết quả chẩn đoán lỗi SMTP:"}</p>
                    <p className="text-gray-600 mt-0.5 leading-relaxed font-normal">{diagnosticResult.message}</p>
                  </div>
                </div>

                {/* Show detailed technical logs to pinpoint SMTP failure */}
                <div className="mt-2 bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[11px] leading-relaxed border border-slate-700/80 overflow-auto max-h-48 whitespace-pre-wrap">
                  <span className="text-pink-400 font-bold">=== CHI TIẾT KỸ THUẬT CHO DEVELOPER / ADMIN ===</span>
                  {"\n"}Trạng thái: <span className={diagnosticResult.success ? "text-emerald-400" : "text-rose-400"}>{diagnosticResult.success ? "SUCCESS" : "FAILED"}</span>
                  {diagnosticResult.error && `\nMã lỗi (Code): ${diagnosticResult.error}`}
                  {diagnosticResult.details && `\nChi tiết phản hồi:\n${JSON.stringify(diagnosticResult.details, null, 2)}`}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Webmail mockup (Gmail-style) */}
          <div className="border border-gray-200 rounded-2xl shadow-xl bg-white overflow-hidden">
            {/* Header style webmail top ribbon */}
            <div className="bg-slate-100 p-3 border-b border-gray-200/80 flex items-center justify-between">
              <div className="flex gap-1.5 pl-2">
                <span className="w-2.5 h-2.5 bg-rose-400 rounded-full inline-block"></span>
                <span className="w-2.5 h-2.5 bg-amber-400 rounded-full inline-block"></span>
                <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full inline-block"></span>
              </div>
              <div className="bg-white rounded-lg px-4 sm:px-20 py-1 text-slate-400 text-[10px] sm:text-xs font-mono shadow-xs border border-gray-200/50 truncate max-w-[180px] sm:max-w-none">
                https://mail.google.com/mail/u/0/#inbox/strategic-report
              </div>
              <div className="w-8"></div>
            </div>

            {/* Webmail Headers information info */}
            <div className="p-5 border-b border-gray-100 bg-slate-50/50 space-y-3 font-sans">
              <div className="flex flex-col sm:flex-row gap-2 justify-between">
                <div>
                  <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                    [{publicConfig?.companyName || "TOLUCK Agency"}] Báo cáo tư vấn & Thiết lập chiến dịch Marketing - {surveyData.company_name}
                  </h1>
                </div>
                <span className="text-[11px] text-slate-400 font-bold justify-self-end mt-1 font-mono">
                  {currentDate} (Gửi tự động)
                </span>
              </div>

              <div className="block space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3 font-normal">
                <div className="flex">
                  <span className="w-16 font-bold text-slate-400">Từ:</span>
                  <span className="font-semibold text-slate-800">{publicConfig?.companyName || "TOLUCK Agency"} &lt;{publicConfig?.companyEmail || "no-reply@toluck.com.vn"}&gt;</span>
                </div>
                <div className="flex">
                  <span className="w-16 font-bold text-slate-400">Đến:</span>
                  <span className="font-semibold text-slate-800">&lt;{recipientEmail}&gt;</span>
                </div>
                <div className="flex">
                  <span className="w-16 font-bold text-slate-400">Ký bởi:</span>
                  <span className="font-semibold text-teal-600 font-mono">toluck-crm-ai.services</span>
                </div>
              </div>
            </div>

            {/* Iframe displaying HTML with correct height */}
            <div className="relative bg-slate-100 flex flex-col justify-stretch">
              {!emailHtml ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white text-center space-y-3">
                  <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-xs sm:text-sm text-slate-500 font-bold">Đang tải và đồng bộ thiết kế HTML email template...</p>
                </div>
              ) : (
                <iframe
                  srcDoc={emailHtml}
                  className="w-full h-[650px] border-0 bg-white"
                  title="Live HTML Email Template"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer disclaimer */}
      <div className="text-center text-[10px] text-gray-400 border-t border-gray-100 pt-5 mt-5">
        Báo cáo phân tích này được phát hành chính trực tiếp bởi hệ thống {publicConfig?.companyName || "TOLUCK"} AI, kết hợp cùng hội đồng chiến lược tự động. 
        Đề án chi tiết có thời hạn đề xuất trong vòng 30 ngày kể từ ngày lập báo cáo ({currentDate}).
      </div>
    </div>
  );
}

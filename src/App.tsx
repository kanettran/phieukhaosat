import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import SidebarInfo from "./components/SidebarInfo";
import SurveyForm from "./components/SurveyForm";
import AssessmentReport from "./components/AssessmentReport";
import CmsAdminPanel from "./components/CmsAdminPanel";
import { SurveyData, AIReport } from "./types";
import { 
  Sparkles, Award, Star, Compass, ShieldCheck, Mail, Phone, ExternalLink,
  MessageCircle, BarChart, Trophy, FileText, ArrowUpRight, Lock, User, Eye, EyeOff, Building2, AlertCircle, X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Webhook defaults
const DEFAULT_WEBHOOK_URL = "https://ai.toluck.com.vn/webhook/phantichkhachhang";

// Fallback logic in case Gemini API is not yet configured or fails
function generateDynamicFallbackReport(data: SurveyData): AIReport {
  let infrastructureScore = 30;
  if (data.digital_assets.includes("Website")) infrastructureScore += 20;
  if (data.digital_assets.includes("CRM")) infrastructureScore += 15;
  if (data.tracking_tools.includes("Google Analytics")) infrastructureScore += 15;
  if (data.tracking_tools.includes("Facebook Pixel")) infrastructureScore += 20;

  let budgetScore = 40;
  if (data.service_budget === "3-5 triệu") budgetScore = 40;
  else if (data.service_budget === "5-10 triệu") budgetScore = 55;
  else if (data.service_budget === "10-20 triệu") budgetScore = 70;
  else if (data.service_budget === "20-50 triệu") budgetScore = 85;
  else budgetScore = 95;

  let strategyScore = 50;
  if (data.business_model.length > 50) strategyScore += 15;
  if (data.target_customer.length > 50) strategyScore += 15;
  if (data.pain_points.length > 0) strategyScore += 10;
  if (data.pain_points.includes("Thiếu chiến dịch")) strategyScore -= 10;

  let brandingScore = 45;
  if (data.strengths.length > 30) brandingScore += 20;
  if (data.unique_selling_point.length > 30) brandingScore += 20;
  if (data.brand_positioning.length > 30) brandingScore += 15;

  infrastructureScore = Math.min(100, infrastructureScore);
  budgetScore = Math.min(100, budgetScore);
  strategyScore = Math.min(100, strategyScore);
  brandingScore = Math.min(100, brandingScore);

  const readinessScore = Math.round((infrastructureScore + budgetScore + strategyScore + brandingScore) / 4);

  let maturityGrade = "C";
  if (readinessScore >= 85) maturityGrade = "A+";
  else if (readinessScore >= 75) maturityGrade = "A";
  else if (readinessScore >= 60) maturityGrade = "B";
  else if (readinessScore >= 45) maturityGrade = "C";
  else maturityGrade = "D";

  const channelsToUse = data.channels.length > 0 ? data.channels : ["Facebook Ads", "SEO Website", "TikTok Shop"];

  const recs = [
    `Chuẩn hóa lại kịch bản chăm sóc khách hàng và tối ưu tỷ lệ chuyển đối trực tiếp trên các tài sản số: ${data.digital_assets.join(", ") || "Hạ kỹ thuật hiện có"}.`,
    `Tập trung phân bổ ngân sách ${data.service_budget} ưu tiên cho 1-2 kênh tạo chuyển đổi nhanh nhất trước khi phân tán vốn rộng.`,
    `Cài đặt lại hệ thống tracking đo lường: ${data.tracking_tools.join(", ") || "Cấu hình Google Analytics 4 & FB Pixel"} để kiểm tra CPA thực tế.`
  ];

  if (data.pain_points.includes("Thiếu khách hàng")) {
    recs.push("Xây dựng Landing Page chuyên biệt cho dịch vụ mũi nhọn để chạy quảng cáo bứt phá nhanh.");
  }
  if (data.pain_points.includes("Thiếu nội dung")) {
    recs.push("Sản xuất chuỗi video ngắn đa kênh (Video 15-30s Reels/TikTok/Shorts) để kích thích tỷ lệ click tự nhiên.");
  }

  const painPointSolutions = data.pain_points.length > 0 
    ? data.pain_points.map(pn => ({
        painPoint: pn,
        solution: `TOLUCK cử chuyên viên tối ưu, thiết lập lại ma trận phễu hoặc kịch bản content để khắc phục điểm đau ${pn}.`
      }))
    : [{ painPoint: "Chưa quy hoạch luồng đi khách hàng", solution: "Thiết kế phễu bám đuổi chuyển đổi tự động (Remarketing) trực diện tệp khách mục tiêu." }];

  return {
    readinessScore,
    maturityGrade,
    scoreBreakdown: {
      infrastructure: infrastructureScore,
      budget: budgetScore,
      strategy: strategyScore,
      branding: brandingScore
    },
    swotAnalysis: {
      strengths: [
        data.strengths || "Doanh nghiệp đã định vị rõ sản phẩm thế mạnh và lĩnh vực đang hoạt động.",
        `Có kinh nghiệm sơ bộ vận hành các kênh truyền thông chủ chốt: ${channelsToUse.slice(0, 2).join(", ")}.`,
        "Ban lãnh đạo có nhận thức cực tốt về xu hướng Phòng Marketing thuê ngoài."
      ],
      weaknesses: [
        data.pain_points[0] || "Thiếu nhân sự chuyên môn hóa cứng để quản trị tổng thể chiến dịch.",
        "Thiếu các báo cáo đo lường chi ly hiệu quả/chi phí trên từng đơn hàng.",
        "Tần suất phủ sóng nội dung trên các nền tảng mạng xã hội chưa đồng đều."
      ],
      opportunities: [
        `Gia tăng 3.5 lần hiệu suất thu hút tệp khách ${data.target_customer} thông qua quảng cáo phễu của TOLUCK.`,
        "Sử dụng công cụ chatbot AI & Marketing Automation để chăm sóc tự động 24/7.",
        "Tối ưu chi phí nhân sự vận hành bằng cách ủy thác toàn diện cho TOLUCK Agency."
      ],
      threats: [
        `Sự cạnh tranh gay gắt về giá bán và chi phí thầu quảng cáo từ các đối thủ: ${data.competitors || "đơn vị cùng ngành"}.`,
        "Thuật toán của các hệ thống quảng cáo liên tục cập nhật tăng tính phân mảnh.",
        "Tâm lý khách hàng ngày càng khắc khe hơn khi đưa ra quyết định mua sắm."
      ]
    },
    channelStrategy: channelsToUse.map(ch => ({
      channelName: ch,
      priority: "Cao",
      reason: "Đây là điểm chạm có lưu lượng truy cập cao nhất của tệp khách mục tiêu.",
      actionRequired: "Kiểm tra lại content, hình ảnh banner và tiến hành A/B testing ngân sách nhỏ."
    })),
    painPointSolutions,
    recommendations: recs,
    consultantOpinion: `Mô hình kinh doanh về ${data.business_model} của doanh nghiệp đang sở hữu một thị trường ngách đầy hứa hẹn. Để đạt mục tiêu ${data.goal}, doanh nghiệp nên bắt đầu tối ưu phễu giữ chân khách trước khi chi lớn cho quảng cáo. Đồng hành hợp tác cùng TOLUCK Agency sẽ giúp doanh nghiệp rút ngắn đáng kể thời gian thử nghiệm kỹ thuật và tối ưu ngân sách tốt nhất.`
  };
}

export default function App() {
  const [webhookUrl, setWebhookUrl] = useState(DEFAULT_WEBHOOK_URL);
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [publicConfig, setPublicConfig] = useState({
    logo: "https://toluck.com.vn/logo.png",
    favicon: "https://toluck.com.vn/favicon.ico",
    footerText: "TOLUCK AGENCY © 2026 — ĐỐI TÁC CỰC ĐẠI HÓA DOANH THU & CHUYỂN ĐỔI SỐ",
    companyPhone: "0963 484 365",
    companyIntro: "Biểu mẫu này giúp TOLUCK đánh giá hiện trạng marketing, xác định cơ hội tăng trưởng và xây dựng chiến lược phù hợp cho doanh nghiệp của bạn.",
    companyEmail: "info@toluck.vn",
    companyName: "TOLUCK AGENCY",
    companyAddress: "Tòa nhà TOLUCK Building, Hà Nội, Việt Nam",
    companySubtitle: "Digital & AI Agency",
    fanpageUrl: "https://facebook.com/toluck.vn",
    landingHeroTitle: "DOANH NGHIỆP CỦA BẠN ĐANG LÃNG PHÍ BAO NHIÊU CƠ HỘI TĂNG TRƯỞNG?",
    landingHeroDesc: "Nhận ngay báo cáo đánh giá Marketing 100 điểm bằng AI giúp phát hiện điểm yếu, cơ hội tăng trưởng và chiến lược phù hợp cho doanh nghiệp.",
    partners: [] as { name: string; logo: string }[]
  });

  useEffect(() => {
    fetch("/api/public-config")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          const fetchedConfig = {
            logo: data.logo || "https://toluck.com.vn/logo.png",
            favicon: data.favicon || "https://toluck.com.vn/favicon.ico",
            footerText: data.footerText || "TOLUCK AGENCY © 2026 — ĐỐI TAC CỰC ĐẠI HÓA DOANH THU & CHUYỂN ĐỔI SỐ",
            companyPhone: data.companyPhone || "0963 484 365",
            companyIntro: data.companyIntro || "Biểu mẫu này giúp TOLUCK đánh giá hiện trạng marketing, xác định cơ hội tăng trưởng và xây dựng chiến lược phù hợp cho doanh nghiệp của bạn.",
            companyEmail: data.companyEmail || "info@toluck.vn",
            companyName: data.companyName || "TOLUCK AGENCY",
            companyAddress: data.companyAddress || "Tòa nhà TOLUCK Building, Hà Nội, Việt Nam",
            companySubtitle: data.companySubtitle || "Digital & AI Agency",
            fanpageUrl: data.fanpageUrl || "https://facebook.com/toluck.vn",
            landingHeroTitle: data.landingHeroTitle || "DOANH NGHIỆP CỦA BẠN ĐANG LÃNG PHÍ BAO NHIÊU CƠ HỘI TĂNG TRƯỞNG?",
            landingHeroDesc: data.landingHeroDesc || "Nhận ngay báo cáo đánh giá Marketing 100 điểm bằng AI giúp phát hiện điểm yếu, cơ hội tăng trưởng và chiến lược phù hợp cho doanh nghiệp.",
            partners: data.partners || []
          };
          setPublicConfig(fetchedConfig);
          
          const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
          if (link) {
            link.href = fetchedConfig.favicon;
          }

          // Dynamically adjust Page title and Meta description for perfect Google SEO
          const companyNameText = fetchedConfig.companyName;
          document.title = `${companyNameText} AI - Hệ Thống Chẩn Đoán & Đánh Giá Marketing Doanh Nghiệp Toàn Diện`;
          
          const metaDesc = document.querySelector("meta[name='description']");
          if (metaDesc) {
            metaDesc.setAttribute("content", fetchedConfig.companyIntro);
          }
        }
      })
      .catch(() => {});
  }, []);
  const [report, setReport] = useState<AIReport | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [activeView, setActiveView] = useState<"CLIENT" | "CMS">("CLIENT");

  // Lifted unified Auth state
  const [token, setToken] = useState<string>(() => localStorage.getItem("cms_token") || "");
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const cached = localStorage.getItem("cms_user");
    return cached ? JSON.parse(cached) : null;
  });

  // Client registration & login states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("register");
  const [pendingSurveyData, setPendingSurveyData] = useState<SurveyData | null>(null);

  // Modal input states
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "Báo cáo có miễn phí không?",
      a: "Hoàn toàn miễn phí 100%! Đây là hoạt động tài trợ từ TOLUCK nhằm hỗ trợ các doanh nghiệp SME nhận diện lỗ hổng vận hành, phát hiện cơ hội để bứt phá doanh thu mà không chịu bất cứ ràng buộc chi phí nào."
    },
    {
      q: "AI đánh giá dựa trên tiêu chí nào?",
      a: "AI đánh giá dựa trên bộ khung 8 trục chuẩn hóa từ Toluck Audit Core (Nền tảng kinh doanh, định vị thương hiệu, hệ thống digital, SEO, social media, hệ thống bán hàng, dữ liệu & đo lường, và khả năng tăng trưởng)."
    },
    {
      q: "Bao lâu nhận được kết quả?",
      a: "Toàn bộ quy trình từ lúc gửi thông tin tới khi nhận được báo cáo chiến lược chi tiết qua Email chỉ mất từ 3-5 phút nhờ hệ thống xử lý tự động song song của TOLUCK AI."
    },
    {
      q: "Thông tin có được bảo mật không?",
      a: "Cam kết bảo mật tuyệt đối 100% mọi số liệu kinh doanh, tệp đối thủ và thông tin liên lạc của doanh nghiệp bạn theo điều khoản bảo mật chuẩn NDA."
    },
    {
      q: "TOLUCK có tư vấn trực tiếp không?",
      a: "Có! Sau khi nhận báo cáo, chuyên viên tư vấn cao cấp của TOLUCK sẽ liên hệ đặt lịch tư vấn sâu kỹ thuật 1:1 hoàn toàn miễn phí để làm rõ các hành động then chốt trong lộ trình 90 ngày của doanh nghiệp bạn."
    }
  ];

  // Instantly load static pre-built test payload from database to bypass any webhook/AI generation (saves tokens)
  const handleLoadStaticTestData = async () => {
    setIsLoadingReport(true);
    setLoadingStep(0);
    try {
      const res = await fetch("/api/test-payload");
      if (res.ok) {
        const data = await res.json();
        // Skip calling webhooks or direct report APIs, set the loaded values directly
        setSurveyData(data.surveyData);
        setReport(data.reportData);
      } else {
        throw new Error("Unable to fetch pre-built test-payload");
      }
    } catch (err) {
      console.error("Error loading pre-built static data:", err);
      // Fallback
      const testData: SurveyData = {
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
      setSurveyData(testData);
      setReport(generateDynamicFallbackReport(testData));
    } finally {
      setIsLoadingReport(false);
    }
  };

  // Trigger test Webhook send with predefined mock data
  const handleSendTestPayload = () => {
    const testData: SurveyData = {
      company_name: "Thời Trang Cát Tường",
      website: "https://cattuongboutique.vn",
      fanpage: "https://facebook.com/cattuongboutique",
      industry: "Thời trang & Bán lẻ",
      year_established: "2021",
      employee_count: "15-50 người",
      contact_name: "Nguyễn Thị Cát Tường",
      position: "Giám Đốc Điều Hành",
      email: "hungtran.kanet@gmail.com",
      phone: "0912345678",
      business_model: "Bán lẻ quần áo thời trang thiết kế cao cấp cho nữ giới công sở",
      target_customer: "Nữ giới từ 25 - 40 tuổi, thu nhập khá, làm việc văn phòng tại các thành phố lớn",
      revenue: "500 - 1 tỷ / tháng",
      goal: "X3 doanh số bán lẻ, phủ sóng kênh TikTok Shop và xây dựng cộng đồng khách hàng trung thành",
      marketing_status: "Đã có đội ngũ tự chạy Ads nhưng chưa hiệu quả, chi phí thầu ngày càng cao",
      channels: ["Facebook Ads", "KOLs/KOCs", "TikTok Shop"],
      marketing_budget: "50 - 100 triệu",
      pain_points: [
        "Chi phí quảng cáo quá cao và không đem lại đơn hàng ổn định",
        "Thiếu ý tưởng content sáng tạo truyền thông thương hiệu",
        "Chưa đo lường được chi tiết tỷ lệ chuyển đổi hoặc CPA thực tế"
      ],
      strengths: "Có xưởng may thiết kế riêng, mẫu mã cập nhật liên tục hàng tuần, chất lượng gia công tỉ mỉ",
      unique_selling_point: "Đổi trả hoàn toàn miễn phí trong 7 ngày, hỗ trợ sửa size đo theo chuẩn cơ thể",
      competitors: "Zara, Elpis, Elise, các thương hiệu thiết kế tầm trung",
      brand_positioning: "Thương hiệu thời trang thiết kế sang trọng, tối giản nhưng giá cả hợp lý cận cao cấp",
      digital_assets: ["Fanpage Facebook", "Website", "Tài khoản TikTok Shop"],
      tracking_tools: ["Facebook Pixel", "Google Analytics"],
      services_needed: ["Quản trị và tối ưu quảng cáo đa kênh", "Xây dựng content định kỳ", "Tư vấn thiết lập phòng Marketing thuê ngoài"],
      service_budget: "20-50 triệu"
    };
    handleSurveySuccess(testData);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/cms/auth/logout", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
    } catch (e) {}
    localStorage.removeItem("cms_token");
    localStorage.removeItem("cms_user");
    setToken("");
    setCurrentUser(null);
    setActiveView("CLIENT");
  };

  // For nice dynamic text transitions during AI evaluation
  const loadingMessages = [
    "Khảo sát đã truyền thành công! Đang đồng bộ hóa dữ liệu an toàn tới hệ thống phân tích doanh nghiệp...",
    "Đang phân tích phản hồi để thiết lập các bảng chỉ số chiến lược...",
    "Trích xuất SWOT, đối thủ từ kết quả webhook và đề xuất ma trận kênh quảng cáo...",
    "Cấu hình hóa độ nóng Lead và cập nhật lịch sử tương tác chăm sóc...",
    "Hoàn thành báo cáo đánh giá chiến lược marketing..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoadingReport) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev < loadingMessages.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isLoadingReport]);

  const handleSurveySuccess = async (data: SurveyData, sessionBearerToken?: string) => {
    const activeToken = sessionBearerToken || token;
    const activeUser = currentUser;

    // Check if user is not logged in - then enforce registration first!
    if (!activeUser && !activeToken) {
      setPendingSurveyData(data);
      // Pre-fill fields
      setRegisterName(data.contact_name || "");
      setRegisterEmail(data.email || "");
      setRegisterPhone(data.phone || "");
      setAuthEmail(data.email || "");
      setAuthModalMode("register");
      setIsAuthModalOpen(true);
      return;
    }

    setSurveyData(data);
    setIsLoadingReport(true);

    let finalReport: AIReport | null = null;
    let webhookResultToDisplay: any = null;

    try {
      console.log("Submitting survey to Webhook proxy:", webhookUrl);
      const webhookResponse = await fetch("/api/submit-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl: webhookUrl,
          payload: data,
        }),
      });

      if (webhookResponse.ok) {
        const result = await webhookResponse.json();
        console.log("Result received from Webhook:", result);
        if (result && result.data.output) {
          webhookResultToDisplay = result.data.output;
          console.log("Result received from Webhook details:", result.data.output);
          const hookData = result.data.output;
          if (
            hookData && 
            (hookData.readinessScore !== undefined || 
             hookData.maturityGrade || 
             hookData.swotAnalysis)
          ) {
            finalReport = {
              readinessScore: Number(hookData.readinessScore || 75),
              maturityGrade: hookData.maturityGrade || "B",
              swotAnalysis: {
                strengths: Array.isArray(hookData.swotAnalysis?.strengths) 
                  ? hookData.swotAnalysis.strengths 
                  : ["Điểm mạnh từ dữ liệu webhook"],
                weaknesses: Array.isArray(hookData.swotAnalysis?.weaknesses) 
                  ? hookData.swotAnalysis.weaknesses 
                  : ["Cần nâng cấp hạ tầng số và CRM"],
                opportunities: Array.isArray(hookData.swotAnalysis?.opportunities) 
                  ? hookData.swotAnalysis.opportunities 
                  : ["Mở rộng phễu tiếp cận khách hàng tiềm năng"],
                threats: Array.isArray(hookData.swotAnalysis?.threats) 
                  ? hookData.swotAnalysis.threats 
                  : ["Áp lực cạnh tranh về độ phủ thương hiệu"]
              },
              scoreBreakdown: {
                infrastructure: Number(hookData.scoreBreakdown?.infrastructure || 70),
                budget: Number(hookData.scoreBreakdown?.budget || 65),
                strategy: Number(hookData.scoreBreakdown?.strategy || 80),
                branding: Number(hookData.scoreBreakdown?.branding || 75)
              },
              channelStrategy: Array.isArray(hookData.channelStrategy) 
                ? hookData.channelStrategy 
                : [
                    { 
                      channelName: "Facebook Ads & TikTok Shop", 
                      priority: "Cao", 
                      reason: "Dựa trên kết quả khảo sát từ webhook", 
                      actionRequired: "Quy hoạch luồng pixel chuyển đổi" 
                    }
                  ],
              painPointSolutions: Array.isArray(hookData.painPointSolutions) 
                ? hookData.painPointSolutions 
                : [
                    { 
                      painPoint: "Thiếu công nghệ đo lường quảng cáo", 
                      solution: "Hợp tác chặt chẽ cùng phòng ban TOLUCK triển khai CRM & Pixel theo dõi" 
                    }
                  ],
              recommendations: Array.isArray(hookData.recommendations) 
                ? hookData.recommendations 
                : [
                    "Đồng bộ hóa hạ tầng Web, Landing Page chuyên nghiệp.",
                    "Xác lập KPI chốt sale rõ ràng cho phòng kinh doanh.",
                    "Sử dụng phòng Marketing thuê ngoài TOLUCK tăng tốc phễu."
                  ],
              consultantOpinion: hookData.consultantOpinion || "Báo cáo chiến lược xây dựng hoàn toàn từ các ô dữ liệu webhook đã được tích hợp và điền trực quan."
            };
          }
        }
      }
    } catch (err) {
      console.warn("Webhook submission error:", err);
    }

    // Fallback/Direct AI report query if webhook did not generate a full report structure
    if (!finalReport) {
      try {
        console.log("Querying direct strategic advisory AI report with authorization bearer...");
        const customHeaders: any = { "Content-Type": "application/json" };
        if (activeToken) {
          customHeaders["Authorization"] = `Bearer ${activeToken}`;
        }
        const response = await fetch("/api/generate-report", {
          method: "POST",
          headers: customHeaders,
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const reportData: AIReport = await response.json();
          finalReport = reportData;
        } else {
          const errData = await response.json();
          alert(errData.message || "Tài khoản của bạn đã đạt giới hạn khảo sát hôm nay. Vui lòng liên hệ ban quản trị TOLUCK.");
          setIsLoadingReport(false);
          return;
        }
      } catch (err) {
        console.warn("Using fallback local calculations:", err);
        finalReport = generateDynamicFallbackReport(data);
      }
    }

    if (finalReport) {
      setReport(finalReport);

      // Auto trigger synchronizing Lead & Survey history in CRM
      try {
        console.log("Synchronizing client survey and strategic report to CRM database...");
        const customHeaders: any = { "Content-Type": "application/json" };
        if (activeToken) {
          customHeaders["Authorization"] = `Bearer ${activeToken}`;
        }
        await fetch("/api/record-lead", {
          method: "POST",
          headers: customHeaders,
          body: JSON.stringify({
            surveyData: data,
            reportData: finalReport
          })
        });
        console.log("CRM local database synchronization completed!");
      } catch (crmErr) {
        console.error("Failed to sync survey to CRM database:", crmErr);
      }

      // Auto trigger directly emailing report to the customer as per user requests
      try {
        console.log("Autodispatching strategic marketing report email straight to:", data.email);
        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            surveyData: data,
            reportData: finalReport
          })
        });
        console.log("Automatic email dispatch completed!");
      } catch (emErr) {
        console.error("Autodispatch email error:", emErr);
      }
    }

    // Transition smoothly
    setTimeout(() => {
      setIsLoadingReport(false);
    }, 2000);
  };

  const handleReset = () => {
    setSurveyData(null);
    setReport(null);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsAuthLoading(true);

    try {
      if (authModalMode === "register") {
        if (!registerEmail || !registerName || !authPassword) {
          throw new Error("Vui lòng điền đầy đủ các thông tin bắt buộc.");
        }
        
        const payload = {
          name: registerName,
          email: registerEmail,
          phone: registerPhone,
          password: authPassword,
        };

        const res = await fetch("/api/cms/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || "Đăng ký không thành công.");

        localStorage.setItem("cms_token", resData.token);
        localStorage.setItem("cms_user", JSON.stringify(resData.user));
        setToken(resData.token);
        setCurrentUser(resData.user);
        setIsAuthModalOpen(false);

        // Resume survey submission
        if (pendingSurveyData) {
          const updatedSurvey = {
            ...pendingSurveyData,
            email: registerEmail,
            contact_name: registerName,
            phone: registerPhone
          };
          handleSurveySuccess(updatedSurvey, resData.token);
          setPendingSurveyData(null);
        }
      } else {
        // Login flow
        if (!authEmail || !authPassword) {
          throw new Error("Vui lòng điền Email và Mật khẩu.");
        }

        const res = await fetch("/api/cms/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: authEmail, password: authPassword })
        });

        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || "Tài khoản hoặc mật khẩu không đúng.");

        localStorage.setItem("cms_token", resData.token);
        localStorage.setItem("cms_user", JSON.stringify(resData.user));
        setToken(resData.token);
        setCurrentUser(resData.user);
        setIsAuthModalOpen(false);

        // Resume survey submission if pending
        if (pendingSurveyData) {
          handleSurveySuccess(pendingSurveyData, resData.token);
          setPendingSurveyData(null);
        }
      }
      
      // Clear inputs
      setAuthPassword("");
    } catch (err: any) {
      setAuthError(err.message || String(err));
    } finally {
      setIsAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans" id="applet-viewport">
      {/* Premium Header with Webhook configurator */}
      <Header 
        webhookUrl={webhookUrl} 
        setWebhookUrl={setWebhookUrl} 
        geminiStatus={isLoadingReport ? "loading" : report ? "success" : "idle"}
        onSendTestPayload={handleSendTestPayload}
        onLoadStaticTestData={handleLoadStaticTestData}
        activeView={activeView}
        setActiveView={setActiveView}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenLogin={() => {
          setAuthEmail("");
          setAuthPassword("");
          setAuthError("");
          setAuthModalMode("login");
          setIsAuthModalOpen(true);
        }}
        logo={publicConfig.logo}
        companyName={publicConfig.companyName}
        companySubtitle={publicConfig.companySubtitle}
      />

      {/* Main body area */}
      <main className={`flex-1 w-full ${activeView === "CMS" || report ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" : ""}`}>
        <AnimatePresence mode="wait">
          {activeView === "CMS" ? (
            <motion.div
              key="cms-panel"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <CmsAdminPanel 
                token={token}
                setToken={setToken}
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
              />
            </motion.div>
          ) : (
            <React.Fragment>
              {/* STATE 1: SURVEY IN PROGRESS (9-SECTION COMPREHENSIVE LANDING PAGE) */}
              {!surveyData && !isLoadingReport && !report && (
                <motion.div
                  key="survey"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="w-full space-y-0"
                >
                  {/* HERO SECTION */}
                  <section className="relative overflow-hidden bg-slate-900 text-white py-16 lg:py-24">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-950/25 via-blue-950/60 to-slate-900 -z-10" />
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        {/* Hero Left */}
                        <div className="lg:col-span-7 space-y-6">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold font-mono tracking-wider">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            ĐÁNH GIÁ PHÒNG MARKETING BẰNG AI
                          </span>
                          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight uppercase leading-[1.1] font-sans">
                            {publicConfig.landingHeroTitle || "DOANH NGHIỆP CỦA BẠN ĐANG LÃNG PHÍ BAO NHIÊU CƠ HỘI TĂNG TRƯỞNG?"}
                          </h1>
                          <p className="text-sm sm:text-base text-slate-300 font-medium max-w-2xl leading-relaxed">
                            {publicConfig.landingHeroDesc || "Nhận ngay báo cáo đánh giá Marketing 100 điểm bằng AI giúp phát hiện điểm yếu, cơ hội tăng trưởng và chiến lược phù hợp cho doanh nghiệp."}
                          </p>
                          <ul className="space-y-2.5 text-xs sm:text-sm text-slate-200 font-semibold">
                            <li className="flex items-center gap-2">
                              <span className="text-emerald-400 font-bold font-mono">✓</span>
                              <span>Chấm điểm Marketing tổng thể</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="text-emerald-400 font-bold font-mono">✓</span>
                              <span>Phân tích SWOT doanh nghiệp</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="text-emerald-400 font-bold font-mono">✓</span>
                              <span>Đánh giá Website, SEO, Social Media</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="text-emerald-400 font-bold font-mono">✓</span>
                              <span>Đề xuất chiến lược 90 ngày</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="text-emerald-400 font-bold font-mono">✓</span>
                              <span>Báo cáo gửi về Email chỉ sau vài phút</span>
                            </li>
                          </ul>
                          <div className="pt-2">
                            <button
                              onClick={() => {
                                document.getElementById("form-section")?.scrollIntoView({ behavior: "smooth" });
                              }}
                              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 text-white font-extrabold text-xs sm:text-sm rounded-2xl uppercase tracking-wider shadow-lg shadow-blue-500/10 transition-all cursor-pointer inline-flex items-center gap-2"
                            >
                              <span>NHẬN BÁO CÁO MIỄN PHÍ</span>
                            </button>
                          </div>
                        </div>

                        {/* Hero Right: Mockup Dashboard AI Audit */}
                        <div className="lg:col-span-5">
                          <div className="relative bg-[#1e293b]/80 border border-slate-700/60 rounded-3xl shadow-2xl p-6 overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -z-10" />
                            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                              </div>
                              <span className="text-[10px] font-mono text-emerald-400 font-bold">TOLUCK_AI_AUDIT_v100</span>
                            </div>

                            <div className="pt-6 space-y-5">
                              {/* Total score ring */}
                              <div className="flex items-center gap-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
                                <div className="relative inline-flex items-center justify-center p-1 rounded-full bg-gradient-to-tr from-blue-500 to-emerald-400 shrink-0">
                                  <div className="bg-slate-900 rounded-full w-14 h-14 flex flex-col items-center justify-center">
                                    <span className="text-base font-black text-white leading-none">72</span>
                                    <span className="text-[8px] text-slate-400 font-bold mt-0.5">/100</span>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-sans">Marketing Score</h4>
                                  <p className="text-[10px] text-slate-400 leading-tight">Phòng Marketing hoạt động ở mức Khá, cần khắc phục ngay lộ trình Digital.</p>
                                </div>
                              </div>

                              {/* Beautiful illustration graphic of AI Marketing digital transform */}
                              <div className="relative h-24 rounded-2xl overflow-hidden border border-slate-750 bg-slate-950">
                                <img 
                                  src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80" 
                                  alt="AI Digital Transformation Nodes" 
                                  className="w-full h-full object-cover opacity-75"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent flex items-center p-3.5">
                                  <div>
                                    <span className="text-[8px] bg-emerald-500/20 text-emerald-300 font-mono font-black px-1.5 py-0.5 rounded uppercase">AI SYSTEM ACTIVE</span>
                                    <h5 className="text-[10px] text-white font-extrabold uppercase mt-1 leading-tight">Phân tích châm điểm tự động</h5>
                                  </div>
                                </div>
                              </div>

                              {/* Progress bar metrics */}
                              <div className="space-y-3.5">
                                <div className="space-y-1.5">
                                  <div className="flex justify-between text-[10px] font-bold text-slate-350 font-mono">
                                    <span>SEO SCORE</span>
                                    <span>65/100</span>
                                  </div>
                                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500 rounded-full w-[65%]" />
                                  </div>
                                </div>

                                <div className="space-y-1.5">
                                  <div className="flex justify-between text-[10px] font-bold text-slate-355 font-mono">
                                    <span>BRAND SCORE</span>
                                    <span>80/100</span>
                                  </div>
                                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full w-[80%]" />
                                  </div>
                                </div>

                                <div className="space-y-1.5">
                                  <div className="flex justify-between text-[10px] font-bold text-slate-360 font-mono">
                                    <span>GROWTH OPPORTUNITY</span>
                                    <span>87/100</span>
                                  </div>
                                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full w-[87%]" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* SECTION 2: TẠI SAO NHIỀU DOANH NGHIỆP KHÔNG TĂNG TRƯỞNG? */}
                  <section className="py-16 bg-slate-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="text-center max-w-3xl mx-auto mb-12">
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">
                          TẠI SAO NHIỀU DOANH NGHIỆP KHÔNG TĂNG TRƯỞNG?
                        </h2>
                        <div className="h-1 bg-emerald-550 bg-gradient-to-r from-blue-600 to-emerald-500 w-16 mx-auto mt-4 rounded-full" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-3">
                          <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 font-extrabold text-sm">01</div>
                          <h3 className="font-extrabold text-gray-950 text-sm">Không có chiến lược Marketing</h3>
                          <p className="text-xs text-gray-500 leading-relaxed font-semibold">Làm nhiều nhưng không biết điều gì hiệu quả.</p>
                        </div>

                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-3">
                          <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 font-extrabold text-sm">02</div>
                          <h3 className="font-extrabold text-gray-950 text-sm">Chi phí quảng cáo ngày càng tăng</h3>
                          <p className="text-xs text-gray-500 leading-relaxed font-semibold">Phụ thuộc hoàn toàn vào Ads.</p>
                        </div>

                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-3">
                          <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 font-extrabold text-sm">03</div>
                          <h3 className="font-extrabold text-gray-950 text-sm">Không đo lường được hiệu quả</h3>
                          <p className="text-xs text-gray-500 leading-relaxed font-semibold">Không có dữ liệu để ra quyết định.</p>
                        </div>

                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-3">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-extrabold text-sm">04</div>
                          <h3 className="font-extrabold text-gray-950 text-sm">Thiếu đội ngũ Marketing chuyên môn</h3>
                          <p className="text-xs text-gray-500 leading-relaxed font-semibold">Chi phí xây dựng phòng Marketing quá cao.</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* SECTION 3: AI MARKETING AUDIT SẼ PHÂN TÍCH NHỮNG GÌ? */}
                  <section className="py-16 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="text-center max-w-3xl mx-auto mb-12">
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">
                          AI MARKETING AUDIT SẼ PHÂN TÍCH NHỮNG GÌ?
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 mt-2 font-bold uppercase tracking-wide">Hệ thống của chúng tôi đánh giá dựa trên bộ khung 8 trục chuẩn hóa</p>
                        <div className="h-1 bg-gradient-to-r from-blue-600 to-emerald-500 w-16 mx-auto mt-4 rounded-full" />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                        {[
                          "Nền tảng kinh doanh", "Định vị thương hiệu", "Hệ thống Digital", "SEO & Google",
                          "Social Media", "Hệ thống bán hàng", "Dữ liệu & đo lường", "Khả năng tăng trưởng"
                        ].map((item, idx) => (
                          <div key={idx} className="p-6 rounded-3xl bg-slate-50 border border-gray-100/65 shadow-xs flex flex-col items-center text-center justify-center space-y-2">
                            <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 font-mono">{idx + 1}</span>
                            <span className="font-black text-gray-900 text-xs sm:text-sm leading-tight">{item}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-10 text-center">
                        <span className="inline-flex gap-2 items-center bg-blue-50 text-blue-700 px-6 py-2.5 rounded-full text-xs font-black uppercase font-mono">
                          <span>Chấm điểm toàn diện tối đa:</span>
                          <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-md text-[10px]">100 điểm</span>
                        </span>
                      </div>
                    </div>
                  </section>

                  {/* SECTION 4: BẠN SẼ NHẬN ĐƯỢC GÌ SAU KHẢO SÁT? */}
                  <section className="py-16 bg-slate-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        {/* Beautiful Real Image Report Box */}
                        <div className="lg:col-span-12 xl:col-span-5 order-2 lg:order-1">
                          <div className="bg-white rounded-3xl p-5 border border-gray-150 shadow-xl space-y-4 overflow-hidden relative group">
                            <div className="relative h-48 rounded-2xl overflow-hidden shadow-inner bg-slate-900 border border-gray-100">
                              <img 
                                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80" 
                                alt="AI Marketing Growth Analytics Data" 
                                className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition-all duration-500"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex flex-col justify-end p-4">
                                <span className="text-[9px] text-emerald-400 font-mono font-black tracking-widest uppercase mb-1">AI STRATEGY ACTIVE AUDIT</span>
                                <h3 className="text-white text-xs font-black uppercase tracking-normal">Bản phác thảo kế hoạch tăng trưởng 90 ngày</h3>
                              </div>
                            </div>
                            <div className="space-y-2 pb-1">
                              <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                                <span>Phát hiện 8 điểm nghẽn chuyển đổi</span>
                                <span className="text-emerald-600">✓ Đã tối ưu</span>
                              </div>
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full w-[85%]" />
                              </div>
                            </div>
                            <div className="flex gap-2 items-center justify-between pt-2 border-t border-gray-100">
                              <span className="text-[9px] text-gray-400 font-mono font-bold uppercase">TOLUCK AI ENGINE</span>
                              <span className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-black font-mono">100 ĐIỂM CHUẨN</span>
                            </div>
                          </div>
                        </div>

                        {/* Checklist details */}
                        <div className="lg:col-span-12 xl:col-span-7 order-1 lg:order-2 space-y-6">
                          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">
                            BẠN SẼ NHẬN ĐƯỢC GÌ SAU KHI KHẢO SÁT?
                          </h2>
                          <div className="h-1 bg-gradient-to-r from-blue-600 to-emerald-500 w-16 rounded-full" />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            {[
                              "Marketing Health Score",
                              "SWOT doanh nghiệp chi tiết",
                              "Phân tích hành vi đối thủ",
                              "Đề xuất kênh Marketing tối ưu",
                              "Roadmap hành động 90 ngày",
                              "Dự báo Traffic & Lead tự động",
                              "Kế hoạch tăng trưởng bền vững",
                              "Khuyến nghị gói giải pháp phù hợp"
                            ].map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-white/60 p-2.5 rounded-xl border border-gray-100">
                                <span className="text-emerald-500 font-extrabold font-mono text-sm">✓</span>
                                <span className="text-slate-800 text-xs font-bold">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* SECTION 5: VỀ TOLUCK */}
                  <section className="py-16 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-7 space-y-5">
                          <div className="flex items-center gap-3">
                            <img src={publicConfig.logo} alt="TOLUCK" className="h-8 object-contain" referrerPolicy="no-referrer" />
                          </div>
                          <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight leading-snug">
                            TOLUCK — ĐƠN VỊ TƯ VẤN MARKETING & CHUYỂN ĐỔI SỐ CHO DOANH NGHIỆP
                          </h2>
                          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                            TOLUCK là đối tác tin cậy chuyên cung cấp các giải pháp hoàn chỉnh từ Marketing Thuê Ngoài, SEO tổng lực, định vị Branding thương hiệu, thiết kế Web/Landing Page, cho đến cài đặt hệ thống quản trị CRM và quy trình Automation tối tân. Chúng tôi đồng hành giúp doanh nghiệp đột phá quy mô một cách thực chất và bền vững.
                          </p>
                        </div>

                        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                          {[
                            { value: "100+", label: "Khách hàng" },
                            { value: "500+", label: "Dự án" },
                            { value: "20+", label: "Ngành nghề" },
                            { value: "95%", label: "Khách hàng hài lòng" }
                          ].map((stat, idx) => (
                            <div key={idx} className="bg-blue-50/45 border border-blue-100/40 p-6 rounded-3xl text-center space-y-1">
                              <div className="text-2xl sm:text-3xl font-black text-blue-700 font-mono tracking-tight">{stat.value}</div>
                              <div className="text-[10px] text-blue-950 font-bold uppercase tracking-wider">{stat.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* SECTION 6: QUY TRÌNH ĐÁNH GIÁ */}
                  <section className="py-16 bg-slate-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="text-center max-w-3xl mx-auto mb-12">
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">
                          QUY TRÌNH ĐÁNH GIÁ CHẨN ĐOÁN
                        </h2>
                        <div className="h-1 bg-gradient-to-r from-blue-600 to-emerald-500 w-16 mx-auto mt-4 rounded-full" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                        {[
                          { title: "Bước 1", desc: "Điền khảo sát chi tiết" },
                          { title: "Bước 2", desc: "AI phân tích & đối soát" },
                          { title: "Bước 3", desc: "Khởi tạo báo cáo chiến lược" },
                          { title: "Bước 4", desc: "Gửi báo cáo qua Email" },
                          { title: "Bước 5", desc: "Đặt hẹn chuyên gia tư vấn 1:1" }
                        ].map((stepItem, idx) => (
                          <div key={idx} className="bg-white border border-gray-100 rounded-3xl p-5 text-center space-y-2 relative shadow-xs">
                            <span className="text-[9px] uppercase font-black text-emerald-600 font-mono tracking-widest">{stepItem.title}</span>
                            <div className="font-extrabold text-gray-900 text-xs leading-normal">{stepItem.desc}</div>
                            {idx < 4 && (
                              <div className="hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 items-center justify-center text-emerald-600 font-mono text-xs z-10 leading-none">
                                →
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* SECTION 7: BIỂU MẪU ĐÁNH GIÁ & GENERATE */}
                  <section className="relative overflow-hidden bg-slate-900 text-white py-16 lg:py-20" id="form-section">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-950/40 via-slate-900 to-slate-900 -z-10" />
                    <div className="max-w-4xl mx-auto px-4 sm:px-6">
                      <div className="text-center mb-10 space-y-2">
                        <span className="text-emerald-400 font-black tracking-widest uppercase text-[10px] font-mono">BẮT ĐẦU CHẨN ĐOÁN NGAY</span>
                        <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                          NHẬN BÁO CÁO ĐÁNH GIÁ MARKETING MIỄN PHÍ
                        </h2>
                        <p className="text-xs text-slate-350">
                          Quy trình bao gồm 6 nhóm câu hỏi: Thông tin doanh nghiệp, Thông tin marketing, Thông tin thương hiệu, Thông tin hệ thống digital, Mục tiêu kinh doanh, Ngân sách marketing.
                        </p>
                        <div className="h-1 bg-gradient-to-r from-blue-600 to-emerald-500 w-16 mx-auto rounded-full mt-3" />
                      </div>

                      {/* Embedded Survey Form */}
                      <div className="bg-white rounded-3xl text-gray-900 shadow-2xl p-6 sm:p-10 border border-indigo-900/40">
                        <SurveyForm 
                          webhookUrl={webhookUrl}
                          onSubmitSuccess={handleSurveySuccess}
                          companyPhone={publicConfig.companyPhone}
                          companyEmail={publicConfig.companyEmail}
                        />
                      </div>
                    </div>
                  </section>

                  {/* SECTION 8: KHÁCH HÀNG TIÊU BIỂU */}
                  <section className="py-12 bg-white overflow-hidden border-b border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="text-center max-w-3xl mx-auto mb-8">
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">ĐỐI TÁC TIN CẬY</h3>
                        <h4 className="text-base font-black text-slate-900 uppercase">DOANH NGHIỆP TRỌNG ĐIỂM</h4>
                      </div>

                      {/* Marquee list */}
                      <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12 opacity-80">
                        {(publicConfig.partners && publicConfig.partners.length > 0
                          ? publicConfig.partners
                          : [
                              { name: "NDS Business Care", logo: "" },
                              { name: "BFIT", logo: "" },
                              { name: "THADAHA", logo: "" },
                              { name: "SunnyDay", logo: "" },
                              { name: "Hà Linh Dental", logo: "" },
                              { name: "DISC Electric", logo: "" }
                            ]
                        ).map((partner, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center gap-2 hover:scale-105 transition-transform duration-200"
                          >
                            {partner.logo && (
                              <img 
                                src={partner.logo} 
                                alt={partner.name} 
                                className="h-6 sm:h-8 max-w-[120px] object-contain grayscale hover:grayscale-0 transition-all duration-300"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <span className="font-sans font-extrabold text-[11px] sm:text-xs text-slate-500 uppercase tracking-wider">
                              {partner.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* SECTION 9: CÂU HỎI THƯỜNG GẶP */}
                  <section className="py-16 bg-slate-50">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6">
                      <div className="text-center mb-12">
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">
                          CÂU HỎI THƯỜNG GẶP
                        </h2>
                        <div className="h-1 bg-gradient-to-r from-blue-600 to-emerald-500 w-16 mx-auto mt-4 rounded-full" />
                      </div>

                      <div className="space-y-4">
                        {faqs.map((faq, idx) => {
                          const isOpen = openFaq === idx;
                          return (
                            <div key={idx} className="bg-white rounded-2xl border border-gray-150 shadow-xs overflow-hidden">
                              <button
                                onClick={() => setOpenFaq(isOpen ? null : idx)}
                                className="w-full text-left p-5 flex justify-between items-center font-black text-gray-950 text-xs sm:text-sm outline-none cursor-pointer"
                              >
                                <span>{faq.q}</span>
                                <span className={`text-emerald-600 font-mono text-lg transition-transform ${isOpen ? "rotate-45" : ""}`}>+</span>
                              </button>
                              {isOpen && (
                                <div className="px-5 pb-5 text-gray-500 font-semibold text-xs sm:text-sm leading-relaxed border-t border-gray-50 pt-3">
                                  {faq.a}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                </motion.div>
              )}

            {/* STATE 2: LOADING REPORT (BEAUTIFUL AI ANALYSIS BACKDROP) */}
            {isLoadingReport && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="max-w-3xl mx-auto py-12 px-4 text-center space-y-8"
                id="report-loading-backdrop"
              >
                <div className="relative inline-flex items-center justify-center p-3">
                  <span className="absolute inset-0 rounded-full bg-emerald-100/60 animate-ping"></span>
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-100">
                    <Sparkles className="w-10 h-10 text-white animate-pulse" />
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">
                    TOLUCK AI đang kiến tạo kế hoạch của bạn
                  </h3>
                  
                  {/* Dynamically stepping text progress */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm max-w-md mx-auto space-y-2">
                    <div className="flex items-center gap-3">
                      <svg className="animate-spin h-4 w-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-xs font-semibold text-gray-700 font-mono text-left block">
                        {loadingMessages[loadingStep]}
                      </span>
                    </div>
                    
                    {/* Visual loader bar */}
                    <div className="h-1 bg-gray-100 w-full rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${(loadingStep + 1) * 20}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-xs text-gray-400 pt-3">
                    Quá trình chẩn đoán mất khoảng một vài giây...
                  </div>
                </div>

                {/* Informative Vietnamese submission alert required by the prompt */}
                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100/55 max-w-xl mx-auto text-left space-y-2.5">
                  <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <span>Xác nhận thông điệp TOLUCK Agency:</span>
                  </div>
                  <p className="text-xs sm:text-sm text-blue-900 font-medium leading-relaxed">
                    &ldquo;Cảm ơn bạn đã hoàn thành khảo sát. TOLUCK AI đang phân tích dữ liệu doanh nghiệp của bạn. Báo cáo đánh giá và đề xuất chiến lược sẽ được gửi về email trong vòng 3-5 phút.&rdquo;
                  </p>
                </div>
              </motion.div>
            )}

            {/* STATE 3: REPORT ARCHITECTURE READY */}
            {report && surveyData && !isLoadingReport && (
              <motion.div
                key="report"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Floating breadcrumbs or quick action for premium print */}
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-xs print:hidden">
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold">
                    <span className="text-gray-400">Trang chủ</span>
                    <span>/</span>
                    <span className="text-indigo-600">Báo cáo đánh giá Marketing #{surveyData.company_name}</span>
                  </div>
                  <span className="text-xs text-gray-400 italic">Lập báo cáo tức thì qua mô hình trí tuệ nhân tạo Gemini 3.5</span>
                </div>

                {/* Core interactive assessment readout report */}
                <AssessmentReport 
                  report={report} 
                  surveyData={surveyData} 
                  onReset={handleReset}
                  currentUser={currentUser}
                  publicConfig={publicConfig}
                />
              </motion.div>
            )}
          </React.Fragment>
          )}

        </AnimatePresence>
      </main>

      {/* Footer detailing rich company information for professional look & SEO */}
      <footer className="bg-slate-50 border-t border-gray-200/60 py-10 print:hidden mt-auto text-slate-600" id="toluck-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-200/55 text-left">
            
            {/* Column 1: Company Logo, Name and Description */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center space-x-3">
                {publicConfig.logo ? (
                  <img 
                    src={publicConfig.logo} 
                    alt={publicConfig.companyName} 
                    className="h-10 sm:h-12 w-auto object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white shadow-xs">
                    <span className="font-bold text-lg tracking-wider">T</span>
                  </div>
                )}
                <div>
                  <h3 className="font-black text-slate-900 tracking-tight text-xs sm:text-sm uppercase leading-tight">
                    {publicConfig.companyName}
                  </h3>
                  <p className="text-[9px] uppercase tracking-widest text-emerald-600 font-extrabold">{publicConfig.companySubtitle || "Digital & AI Agency"}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-normal max-w-sm">
                {publicConfig.companyIntro}
              </p>
            </div>

            {/* Column 2: Business Contact Info */}
            <div className="space-y-3.5">
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-900">Thông tin liên hệ</h4>
              <ul className="space-y-2.5 text-xs">
                {publicConfig.companyAddress && (
                  <li className="flex items-start gap-2 text-slate-600">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{publicConfig.companyAddress}</span>
                  </li>
                )}
                {publicConfig.companyPhone && (
                  <li className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span><b>Hotline:</b> <a href={`tel:${publicConfig.companyPhone}`} className="hover:text-blue-600 font-semibold">{publicConfig.companyPhone}</a></span>
                  </li>
                )}
                {publicConfig.companyEmail && (
                  <li className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span><b>Email:</b> <a href={`mailto:${publicConfig.companyEmail}`} className="hover:text-blue-600 font-semibold">{publicConfig.companyEmail}</a></span>
                  </li>
                )}
              </ul>
            </div>

            {/* Column 3: Links & Agency Values */}
            <div className="space-y-3.5">
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-900">Giải pháp & Truyền thông</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-light">
                Hệ thống chẩn đoán được phát triển bởi bộ phận R&D nhằm phát hiện các rào cản tăng trưởng và thiết lập giải pháp tự động xuất sắc dựa trên dữ liệu.
              </p>
              <div className="flex gap-4 text-xs font-semibold">
                <a href={publicConfig.fanpageUrl || "https://facebook.com/toluck.vn"} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Theo dõі Fanpage</span>
                </a>
              </div>
            </div>

          </div>

          {/* Bottom Copyright Text */}
          <div className="pt-6 text-center text-xs text-slate-400">
            <p className="font-semibold">{publicConfig.footerText}</p>
            <p className="text-[10px] text-slate-400/80 mt-1">Phát triển bởi đội ngũ kỹ sư AI kết hợp cùng các chuyên gia hàng đầu tại Việt Nam.</p>
          </div>
        </div>
      </footer>

      {/* Dynamic High-End Auth Modal (Login / Registration) */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" id="auth-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full border border-slate-100/80 space-y-6"
              id="auth-modal-content"
            >
              {/* Close Button only if NOT forced registration on pending Survey */}
              {!pendingSurveyData && (
                <button
                  onClick={() => setIsAuthModalOpen(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              <div className="text-center space-y-2.5">
                <div className="inline-flex p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 mb-2 shadow-xs">
                  {authModalMode === "register" ? (
                    <Award className="w-7 h-7" />
                  ) : (
                    <Lock className="w-7 h-7" />
                  )}
                </div>
                
                {pendingSurveyData ? (
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight uppercase">
                      Xác Nhận Đăng Ký Tài Khoản
                    </h3>
                    <p className="text-xs text-rose-600 font-bold bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl">
                      * Cập nhật mật khẩu để kích hoạt phân tích AI & Gửi báo cáo về Email của bạn.
                    </p>
                  </div>
                ) : (
                  <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                    {authModalMode === "register" ? "Đăng Ký Thành Viên" : "Đăng Nhập Hệ Thống"}
                  </h3>
                )}
                
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                  {authModalMode === "register" 
                    ? "Tạo tài khoản thành viên để bắt đầu quản lý phễu dữ liệu và đo lường trực tuyến cùng TOLUCK"
                    : "Sử dụng tài khoản quản trị hoặc tài khoản cá nhân được cấp để vào trang điều hành chuyên sâu"
                  }
                </p>
              </div>

              {authError && (
                <div className="flex items-start gap-2 bg-rose-50 border border-rose-100 p-3.5 rounded-xl text-rose-700 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authModalMode === "register" ? (
                  <React.Fragment>
                    {/* Register Fields */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Họ và Tên</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={registerName}
                          onChange={(e) => setRegisterName(e.target.value)}
                          placeholder="Nguyễn Văn A"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-semibold text-slate-800 bg-slate-50/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Địa chỉ Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          placeholder="example@gmail.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-semibold text-slate-800 bg-slate-50/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block font-sans">Số Điện Thoại (Tùy chọn)</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="tel"
                          value={registerPhone}
                          onChange={(e) => setRegisterPhone(e.target.value)}
                          placeholder="0963 xxx xxx"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-semibold text-slate-800 bg-slate-50/50"
                        />
                      </div>
                    </div>
                  </React.Fragment>
                ) : (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Địa chỉ Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="admin@toluck.vn"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-semibold text-slate-800 bg-slate-50/50"
                      />
                    </div>
                  </div>
                )}

                {/* Secure Password input for either register/login modes */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 block">
                      {authModalMode === "register" ? "Đặt Mật Khẩu Mới" : "Mật Khẩu"}
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-sans font-semibold text-slate-800 bg-slate-50/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full py-2.5 mt-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isAuthLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : authModalMode === "register" ? (
                    <React.Fragment>
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <span>Kích Hoạt Tài Khoản & Xem Báo Cáo</span>
                    </React.Fragment>
                  ) : (
                    <span>Đăng Nhập</span>
                  )}
                </button>
              </form>

              <div className="text-center pt-3 border-t border-slate-100 text-xs font-semibold">
                {authModalMode === "register" ? (
                  <p className="text-slate-500">
                    Đã có tài khoản?{" "}
                    <button
                      onClick={() => {
                        setAuthError("");
                        setAuthModalMode("login");
                      }}
                      className="text-indigo-600 hover:underline font-bold cursor-pointer"
                    >
                      Đăng Nhập Ngay
                    </button>
                  </p>
                ) : (
                  <p className="text-slate-500">
                    Chưa có tài khoản?{" "}
                    <button
                      onClick={() => {
                        setAuthError("");
                        setAuthModalMode("register");
                      }}
                      className="text-indigo-600 hover:underline font-bold cursor-pointer"
                    >
                      Đăng Ký Thành Viên Miễn Phí
                    </button>
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

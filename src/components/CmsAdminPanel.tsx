import React, { useState, useEffect } from "react";
import { 
  Lock, User, Users, Shield, FileSpreadsheet, Layers, BarChart, Settings, 
  Terminal, LogOut, CheckCircle, AlertCircle, Plus, Edit2, Trash2, Key, 
  Copy, ToggleLeft, ToggleRight, Check, History, MailCheck, Eye, Search, 
  MapPin, Phone, ShieldCheck, Mail, AlertTriangle, Play, CheckCircle2, RotateCcw,
  Download, Send, Upload, ClipboardList, Briefcase, DollarSign, ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart as ReBarChart, Bar, Legend, PieChart, Pie, Cell 
} from "recharts";
import QuotationPanel from "./QuotationPanel";

type TabType = "dashboard" | "users" | "surveys" | "crm" | "configs" | "logs" | "my-surveys" | "my-profile" | "quotations";

interface CmsAdminPanelProps {
  token?: string;
  setToken?: (token: string) => void;
  currentUser?: any;
  setCurrentUser?: (user: any) => void;
}

export default function CmsAdminPanel({
  token: propToken,
  setToken: propSetToken,
  currentUser: propCurrentUser,
  setCurrentUser: propSetCurrentUser,
}: CmsAdminPanelProps = {}) {
  // Session & Authentication states
  const [internalToken, setInternalToken] = useState<string>(() => localStorage.getItem("cms_token") || "");
  const [internalCurrentUser, setInternalCurrentUser] = useState<any>(() => {
    const cached = localStorage.getItem("cms_user");
    return cached ? JSON.parse(cached) : null;
  });

  const token = propToken !== undefined ? propToken : internalToken;
  const setToken = (t: string) => {
    setInternalToken(t);
    if (propSetToken) propSetToken(t);
  };

  const currentUser = propCurrentUser !== undefined ? propCurrentUser : internalCurrentUser;
  const setCurrentUser = (u: any) => {
    setInternalCurrentUser(u);
    if (propSetCurrentUser) propSetCurrentUser(u);
  };
  
  const isCustomer = currentUser?.role === "KHÁCH HÀNG";

  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Core CMS Data
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const cachedUser = localStorage.getItem("cms_user");
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser);
        if (parsed.role === "KHÁCH HÀNG") return "my-surveys";
      } catch (e) {}
    }
    return "dashboard";
  });

  const [cmsData, setCmsData] = useState<any>({
    users: [],
    surveys: [],
    crms: [],
    system_config: {},
    logs: [],
    login_history: [],
    quotations: [],
    projects: []
  });
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState("");

  // Customer portal specific states
  const [selectedHistorySurvey, setSelectedHistorySurvey] = useState<any>(null);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [profileStatus, setProfileStatus] = useState({ error: "", success: "", isSaving: false });

  // Dynamically update profile fields on user change
  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name || "",
        phone: currentUser.phone || ""
      });
    }
    if (currentUser?.role === "KHÁCH HÀNG" && activeTab !== "my-surveys" && activeTab !== "my-profile") {
      setActiveTab("my-surveys");
    }
  }, [currentUser]);

  // Modals & Temp Edit state variables
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({
    email: "",
    password: "",
    name: "",
    role: "NHÂN VIÊN",
    phone: "",
    branch: "Hà Nội",
    limits: { surveys: 10, aiAudits: 10, crms: 50, expDate: "2026-12-31" },
    avatar: "",
    isEdit: false
  });

  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [surveyForm, setSurveyForm] = useState({
    id: "",
    name: "",
    status: "Hoạt động",
    config: {
      logo: "https://toluck.com.vn/logo.png",
      colorTheme: "#1e3a8a",
      emailFrom: "info@toluck.com.vn",
      promptAi: "",
      webhookUrl: ""
    },
    isEdit: false
  });

  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [leadDetailTab, setLeadDetailTab] = useState<"info" | "survey" | "quote" | "project" | "care" | "doc">("info");
  const [prefillLeadId, setPrefillLeadId] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [newLogType, setNewLogType] = useState("Gọi điện");
  const [newLogDetail, setNewLogDetail] = useState("");
  const [crmNotesInput, setCrmNotesInput] = useState("");

  // System Configuration state
  const [configForm, setConfigForm] = useState({
    geminiApiKey: "",
    openaiApiKey: "",
    n8nWebhookUrl: "",
    smtpEmail: "",
    smtpHost: "",
    smtpPort: "",
    smtpPass: "",
    smtpFrom: "",
    logo: "",
    favicon: "",
    footerText: "",
    companyPhone: "",
    companyIntro: "",
    companyEmail: "",
    companyName: "",
    companyAddress: "",
    companySubtitle: "Digital & AI Agency",
    fanpageUrl: "https://facebook.com/toluck.vn",
    landingHeroTitle: "DOANH NGHIỆP CỦA BẠN ĐANG LÃNG PHÍ BAO NHIÊU CƠ HỘI TĂNG TRƯỞNG?",
    landingHeroDesc: "Nhận ngay báo cáo đánh giá Marketing 100 điểm bằng AI giúp phát hiện điểm yếu, cơ hội tăng trưởng và chiến lược phù hợp cho doanh nghiệp.",
    partners: [] as { name: string; logo: string }[]
  });
  const [configSaveStatus, setConfigSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [configErrorMessage, setConfigErrorMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [showChangePassModal, setShowChangePassModal] = useState(false);
  const [changePassForm, setChangePassForm] = useState({ oldPassword: "", newPassword: "" });
  const [changePassStatus, setChangePassStatus] = useState({ error: "", success: "" });

  const [showResetPassModal, setShowResetPassModal] = useState(false);
  const [resetPassEmail, setResetPassEmail] = useState("");

  // Fetch CMS core database from Server on mount or token change
  useEffect(() => {
    if (token) {
      fetchCmsData();
    }
  }, [token]);

  const fetchCmsData = async () => {
    setIsLoadingData(true);
    setDataError("");
    try {
      const res = await fetch("/api/cms/data", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) {
        if (res.status === 401) {
          // Token expired or invalid
          handleLogout();
          throw new Error("Phiên làm việc hết hạn. Vui lòng đăng nhập lại.");
        }
        throw new Error("Lỗi tải thông tin quản trị hệ thống.");
      }
      const data = await res.json();
      setCmsData(data);
      if (data.system_config) {
        setConfigForm({
          geminiApiKey: data.system_config.geminiApiKey || "",
          openaiApiKey: data.system_config.openaiApiKey || "",
          n8nWebhookUrl: data.system_config.n8nWebhookUrl || "",
          smtpEmail: data.system_config.smtpEmail || "",
          smtpHost: data.system_config.smtpHost || "",
          smtpPort: data.system_config.smtpPort || "",
          smtpPass: data.system_config.smtpPass || "",
          smtpFrom: data.system_config.smtpFrom || "",
          logo: data.system_config.logo || "",
          favicon: data.system_config.favicon || "",
          footerText: data.system_config.footerText || "",
          companyPhone: data.system_config.companyPhone || "",
          companyIntro: data.system_config.companyIntro || "",
          companyEmail: data.system_config.companyEmail || "",
          companyName: data.system_config.companyName || "",
          companyAddress: data.system_config.companyAddress || "",
          companySubtitle: data.system_config.companySubtitle || "Digital & AI Agency",
          fanpageUrl: data.system_config.fanpageUrl || "https://facebook.com/toluck.vn",
          landingHeroTitle: data.system_config.landingHeroTitle || "DOANH NGHIỆP CỦA BẠN ĐANG LÃNG PHÍ BAO NHIÊU CƠ HỘI TĂNG TRƯỞNG?",
          landingHeroDesc: data.system_config.landingHeroDesc || "Nhận ngay báo cáo đánh giá Marketing 100 điểm bằng AI giúp phát hiện điểm yếu, cơ hội tăng trưởng và chiến lược phù hợp cho doanh nghiệp.",
          partners: data.system_config.partners || []
        });
      }
    } catch (err: any) {
      setDataError(err.message || String(err));
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setIsLoggingIn(true);
    try {
      const res = await fetch("/api/cms/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput, password: passwordInput })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Đăng nhập thất bại.");
      }
      
      localStorage.setItem("cms_token", data.token);
      localStorage.setItem("cms_user", JSON.stringify(data.user));
      setToken(data.token);
      setCurrentUser(data.user);
      setAuthSuccess(`Xin chào ${data.user.name}! Đương quyền tối thượng của bạn đã được xác thực.`);
    } catch (err: any) {
      setAuthError(err.message || String(err));
    } finally {
      setIsLoggingIn(false);
    }
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
    setActiveTab("dashboard");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePassStatus({ error: "", success: "" });
    try {
      const res = await fetch("/api/cms/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(changePassForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể mật khẩu");
      setChangePassStatus({ error: "", success: "Thay đổi mật khẩu cá nhân thành công!" });
      setChangePassForm({ oldPassword: "", newPassword: "" });
      setTimeout(() => setShowChangePassModal(false), 2000);
    } catch (err: any) {
      setChangePassStatus({ error: err.message, success: "" });
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileStatus({ error: "", success: "", isSaving: true });
    try {
      const res = await fetch("/api/cms/auth/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(profileForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể cập nhật hồ sơ");
      
      localStorage.setItem("cms_user", JSON.stringify(data.user));
      setCurrentUser(data.user);
      setProfileStatus({ error: "", success: "Cập nhật thông tin cá nhân thành công!", isSaving: false });
    } catch (err: any) {
      setProfileStatus({ error: err.message, success: "", isSaving: false });
    }
  };

  // User Actions (Module 2)
  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/cms/users/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(userForm)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Lỗi lưu tài khoản.");
      }
      setShowUserModal(false);
      fetchCmsData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const deleteUser = async (email: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản này không?`)) return;
    try {
      const res = await fetch("/api/cms/users/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Lỗi xóa tài khoản.");
      }
      fetchCmsData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleLockUser = async (email: string) => {
    try {
      const res = await fetch("/api/cms/users/lock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error);
      }
      fetchCmsData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Survey Actions (Module 4)
  const saveSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/cms/surveys/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(surveyForm)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Lỗi lưu cấu hình khảo sát.");
      }
      setShowSurveyModal(false);
      fetchCmsData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const duplicateSurvey = async (id: string) => {
    try {
      const res = await fetch("/api/cms/surveys/duplicate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error("Chức năng bảo mật");
      fetchCmsData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleSurveyStatus = async (id: string) => {
    try {
      const res = await fetch("/api/cms/surveys/toggle-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error("Thao tác thất bại");
      fetchCmsData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const deleteSurvey = async (id: string) => {
    if (!confirm("Bạn có tin chắc muốn xóa vĩnh viễn mẫu khảo sát này không?")) return;
    try {
      const res = await fetch("/api/cms/surveys/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Thao tác thất bại");
      }
      fetchCmsData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // CRM Actions (Module 5)
  const saveCrmLeadNotes = async () => {
    if (!selectedLead) return;
    try {
      const res = await fetch("/api/cms/crm/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          id: selectedLead.id, 
          notes: crmNotesInput,
          isEdit: true 
        })
      });
      if (!res.ok) throw new Error("Lưu phản hồi thất bại");
      
      const updatedLead = { ...selectedLead, notes: crmNotesInput };
      setSelectedLead(updatedLead);
      fetchCmsData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const changeLeadPipeline = async (id: string, nextStatus: string) => {
    try {
      const res = await fetch("/api/cms/crm/update-pipeline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ id, status: nextStatus })
      });
      if (!res.ok) throw new Error("Thao tác thất bại");
      fetchCmsData();
      if (selectedLead && selectedLead.id === id) {
        setSelectedLead({ ...selectedLead, status: nextStatus });
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const addInteractionLog = async () => {
    if (!selectedLead || !newLogDetail.trim()) return;
    try {
      const res = await fetch("/api/cms/crm/add-log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          id: selectedLead.id, 
          type: newLogType, 
          detail: newLogDetail 
        })
      });
      if (!res.ok) throw new Error("Thêm nhật ký tương tác thất bại.");
      
      setNewLogDetail("");
      fetchCmsData();
      
      const updatedLogs = [
        { date: new Date().toISOString().split("T")[0], type: newLogType, detail: newLogDetail },
        ...(selectedLead.historyLogs || [])
      ];
      setSelectedLead({ ...selectedLead, historyLogs: updatedLogs });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const deleteLead = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa lead này vĩnh viễn khỏi CRM?")) return;
    try {
      const res = await fetch("/api/cms/crm/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error);
      }
      setSelectedLead(null);
      fetchCmsData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // System Config Action (Module 7)
  const handleSaveConfigs = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSaveStatus("saving");
    setConfigErrorMessage("");
    try {
      const res = await fetch("/api/cms/config/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(configForm)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể lưu cấu hình hệ thống.");
      }
      setConfigSaveStatus("success");
      fetchCmsData();
      setTimeout(() => setConfigSaveStatus("idle"), 3000);
    } catch (err: any) {
      setConfigSaveStatus("error");
      setConfigErrorMessage(err.message || String(err));
    }
  };

  // Filter lists by search query
  const filteredUsers = cmsData.users.filter((item: any) => 
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSurveys = cmsData.surveys.filter((item: any) =>
    item.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCrms = cmsData.crms.filter((item: any) =>
    item.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.contact?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.phone?.includes(searchQuery)
  );

  const filteredLogs = cmsData.logs.filter((item: any) =>
    item.user?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.detail?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- CUSTOMER PORTAL SURVEY HISTORY RETRIEVAL ---
  const myCrmRecord = cmsData.crms?.find(
    (c: any) => c.email?.toLowerCase() === currentUser?.email?.toLowerCase()
  );

  let mySurveyHistory: any[] = [];
  if (myCrmRecord) {
    mySurveyHistory = myCrmRecord.surveyHistory || [];
    
    // If we have a CRM record but no explicit surveyHistory array, build one from current state
    if (mySurveyHistory.length === 0) {
      mySurveyHistory = [
        {
          id: "historical-1",
          date: myCrmRecord.createdAt ? `${myCrmRecord.createdAt}T12:00:00Z` : new Date().toISOString(),
          surveyData: {
            company_name: myCrmRecord.company,
            contact_name: myCrmRecord.contact,
            email: myCrmRecord.email,
            phone: myCrmRecord.phone,
            goal: myCrmRecord.notes || "Khảo sát chiến lược ban đầu",
            marketing_status: "Đã thiết lập",
            channels: [],
            pain_points: [],
            digital_assets: [],
            tracking_tools: [],
            services_needed: [],
          },
          reportData: {
            readinessScore: myCrmRecord.marketingScore || 50,
            maturityGrade: myCrmRecord.marketingScore >= 80 ? "A" : myCrmRecord.marketingScore >= 60 ? "B" : myCrmRecord.marketingScore >= 40 ? "C" : "D",
            swotAnalysis: {
              strengths: ["Cơ sở hạ tầng và định vị tệp khách hàng khả quan"],
              weaknesses: ["Cần chuẩn hóa chiến lược truyền thông và quản trị dữ liệu"],
              opportunities: ["Ứng dụng phễu marketing tự động bám đuổi"],
              threats: ["Chi phí thầu quảng cáo biến động liên tục"]
            },
            scoreBreakdown: {
              infrastructure: myCrmRecord.marketingScore || 50,
              budget: myCrmRecord.marketingScore || 50,
              strategy: myCrmRecord.marketingScore || 50,
              branding: myCrmRecord.marketingScore || 50
            },
            channelStrategy: [
              {
                channelName: "Facebook Ads & Google Search",
                priority: "Cao",
                reason: "Duy trì bám đuổi hành vi khách hàng tiềm năng",
                actionRequired: "Quy hoạch pixel chuyển đổi tự động"
              }
            ],
            painPointSolutions: [
              {
                painPoint: "Thiếu đo lường tập trung và thất thoát khách hàng",
                solution: "Tích hợp Automation CRM & Setup tracking toàn luồng"
              }
            ],
            recommendations: [
              "Đẩy mạnh chiến dịch phễu bám đuổi trực tiếp trên website.",
              "Tối ưu tỉ lệ chuyển đổi nhân sự trực telesale."
            ],
            consultantOpinion: myCrmRecord.aiAuditResult || "Báo cáo chẩn đoán chiến lược marketing tổng thể."
          }
        }
      ];
    }
  }

  // Determine current active survey report to render on customer screen
  const currentSurveyItem = selectedHistorySurvey || mySurveyHistory[0] || null;

  // ===================== RENDER LOGIN IF NO TOKEN =====================
  if (!token) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border border-gray-100 shadow-xl space-y-6" id="cms-login-viewport">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 mb-2">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">TOLUCK CMS ADMIN</h2>
          <p className="text-xs text-gray-500 font-medium">Bảng điều hướng và phê chuẩn đại lý nhượng quyền B2B.</p>
        </div>

        {authError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {authSuccess && (
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-700 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{authSuccess}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5">Tài khoản Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="admin@toluck.vn"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm placeholder-gray-400 bg-gray-50 font-medium"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest">Mật khẩu tối mật</label>
              <button 
                type="button"
                onClick={() => {
                  setResetPassEmail(emailInput);
                  setShowResetPassModal(true);
                }}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Quên mật khẩu?
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Key className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm bg-gray-50 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoggingIn ? "Đang phê chuẩn..." : "Đăng nhập hệ thống"}
          </button>
        </form>

        <div className="pt-4 border-t border-gray-100 text-[11px] text-gray-400 space-y-1 bg-gray-50 -mx-8 -mb-8 p-6 rounded-b-3xl text-center">
          <p className="font-semibold text-gray-600">Đăng tài khoản mẫu trải nghiệm nhanh:</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button 
              onClick={() => { setEmailInput("admin@toluck.vn"); setPasswordInput("Admin@2026"); }}
              className="bg-white p-1.5 rounded-md border border-gray-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-600 font-mono transition-all text-[10px]"
            >
              admin@toluck.vn (Admin)
            </button>
            <button 
              onClick={() => { setEmailInput("staff@toluck.vn"); setPasswordInput("Staff@2026"); }}
              className="bg-white p-1.5 rounded-md border border-gray-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-600 font-mono transition-all text-[10px]"
            >
              staff@toluck.vn (Staff)
            </button>
            <button 
              onClick={() => { setEmailInput("ceo@toluck.vn"); setPasswordInput("Ceo@2026"); }}
              className="bg-white p-1.5 rounded-md border border-gray-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-600 font-mono transition-all text-[10px]"
            >
              ceo@toluck.vn (CEO)
            </button>
            <button 
              onClick={() => { setEmailInput("sales.fr@toluck.vn"); setPasswordInput("Sales@2026"); }}
              className="bg-white p-1.5 rounded-md border border-gray-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-600 font-mono transition-all text-[10px]"
            >
              sales.fr@toluck.vn (Manager)
            </button>
          </div>
        </div>

        {/* Mock Forgot Pass Modal */}
        <AnimatePresence>
          {showResetPassModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <motion.div 
                initial={{ transform: "scale(0.95)", opacity: 0 }}
                animate={{ transform: "scale(1)", opacity: 1 }}
                exit={{ transform: "scale(0.95)", opacity: 0 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-2xl max-w-sm w-full space-y-4"
              >
                <div className="flex items-center gap-3 text-amber-600">
                  <AlertTriangle className="w-6 h-6 shrink-0" />
                  <h3 className="font-black text-gray-900 text-lg">Yêu cầu khôi phục mật khẩu</h3>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Vì cơ chế bảo mật khóa 2 chiều JWT, yêu cầu đặt lại mật khẩu cho hòm thư <b>{resetPassEmail || "chưa nhập"}</b> đã được chuyển trực tiếp tới Admin. Bạn có thể sử dụng mật khẩu mặc định được cung cấp ở bên dưới để đăng nhập ngay.
                </p>
                <div className="bg-amber-50 p-3 rounded-lg text-amber-900 border border-amber-200 text-xs font-mono">
                  Mật khẩu Admin gốc: Admin@2026<br/>
                  Mật khẩu Staff gốc: Staff@2026<br/>
                  Mật khẩu CEO gốc: Ceo@2026<br/>
                  Mật khẩu Manager gốc: Sales@2026
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setShowResetPassModal(false)}
                    className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl"
                  >
                    Đã hiểu, quay lại
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ===================== PRE-COMPILATIONS FOR STATISTICS & CHARTS =====================
  // Chart Helper: Calculate leads arriving by Day
  const getLeadsByDayData = () => {
    const daysMap: Record<string, number> = {};
    // Seed some dates
    daysMap["2026-06-01"] = 1;
    daysMap["2026-06-02"] = 1;
    daysMap["2026-06-03"] = 1;
    daysMap["2026-06-04"] = 0;

    cmsData.crms.forEach((item: any) => {
      if (item.createdAt) {
        daysMap[item.createdAt] = (daysMap[item.createdAt] || 0) + 1;
      }
    });

    return Object.entries(daysMap)
      .map(([day, count]) => ({ day: day.substring(5), count }))
      .sort((a,b) => a.day.localeCompare(b.day));
  };

  // Pie chart helper: status distribution
  const getStatusChartData = () => {
    const statusCounts: Record<string, number> = {
      "Lead mới": 0,
      "Đã đánh giá": 0,
      "Đã tư vấn": 0,
      "Tiềm năng": 0,
      "Không tiềm năng": 0
    };
    cmsData.crms.forEach((item: any) => {
      if (item.status && statusCounts[item.status] !== undefined) {
        statusCounts[item.status]++;
      }
    });

    const COLORS = ["#3b82f6", "#06b6d4", "#eab308", "#10b981", "#ef4444"];
    return Object.entries(statusCounts).map(([status, count], idx) => ({
      name: status,
      value: count,
      color: COLORS[idx % COLORS.length]
    })).filter(c => c.value > 0);
  };

  const getBranchData = () => {
    const branchCounts: Record<string, number> = {};
    cmsData.crms.forEach((item: any) => {
      const b = item.branch || "Khác";
      branchCounts[b] = (branchCounts[b] || 0) + 1;
    });
    return Object.entries(branchCounts).map(([branch, count]) => ({ branch, count }));
  };

  const leadsByDay = getLeadsByDayData();
  const statusChartData = getStatusChartData();
  const branchData = getBranchData();

  // Stats Counters
  const totalLeads = cmsData.crms.length;
  const totalSurveys = cmsData.surveys.length;
  const totalUsers = cmsData.users.length;
  const totalEmailsSent = cmsData.logs.filter((l: any) => l.action?.toLowerCase().includes("gửi email") || l.action?.toLowerCase().includes("mail")).length + 2;


  // ===================== MAIN ADMIN LAYOUT =====================
  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 -mt-8 -mx-4 sm:-mx-6 lg:-mx-8 p-4 sm:p-6 lg:p-8 space-y-6" id="cms-dashboard">
      
      {/* CMS Top utility bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-gray-200/60 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 block">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">HỆ THỐNG QUẢN TRỊ TOLUCK CMS</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Tài khoản: <b className="text-indigo-600">{currentUser.name}</b> &bull; Vai trò: <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono font-bold text-[10px]">{currentUser.role}</span> &bull; Chi nhánh nhượng quyền: <b className="text-slate-700">{currentUser.branch || "Tổng bộ"}</b>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowChangePassModal(true)}
            className="px-3.5 py-2 hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all text-gray-700 cursor-pointer"
          >
            <Key className="w-3.5 h-3.5 text-orange-600" />
            <span>Đổi mật khẩu</span>
          </button>
          
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Nav Sidebar + Display Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-4 border border-gray-200/60 shadow-xs space-y-1.5">
          {isCustomer ? (
            <>
              <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase px-3 py-2">
                CỔNG KHÁCH HÀNG
              </div>
              
              <button
                onClick={() => { setActiveTab("my-surveys"); setSearchQuery(""); }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${activeTab === "my-surveys" ? "bg-indigo-600 text-white shadow-xs" : "hover:bg-slate-50 text-slate-600"}`}
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0" />
                <span>Khảo sát của tôi</span>
              </button>

              <button
                onClick={() => { setActiveTab("my-profile"); setSearchQuery(""); }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${activeTab === "my-profile" ? "bg-indigo-600 text-white shadow-xs" : "hover:bg-slate-50 text-slate-600"}`}
              >
                <User className="w-4 h-4 shrink-0" />
                <span>Hồ sơ & Bảo mật</span>
              </button>
            </>
          ) : (
            <>
              <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase px-3 py-2">
                Mục lục CMS
              </div>
              
              <button
                onClick={() => { setActiveTab("dashboard"); setSearchQuery(""); }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${activeTab === "dashboard" ? "bg-indigo-600 text-white shadow-xs" : "hover:bg-slate-50 text-slate-600"}`}
              >
                <BarChart className="w-4 h-4 shrink-0" />
                <span>Tổng quan & Biểu đồ</span>
              </button>

              <button
                onClick={() => { setActiveTab("crm"); setSearchQuery(""); }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${activeTab === "crm" ? "bg-indigo-600 text-white shadow-xs" : "hover:bg-slate-50 text-slate-600"}`}
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0" />
                <span>Quản lý Lead CRM</span>
              </button>

              <button
                onClick={() => { setActiveTab("quotations"); setSearchQuery(""); }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${activeTab === "quotations" ? "bg-indigo-600 text-white shadow-xs" : "hover:bg-slate-50 text-slate-600"}`}
              >
                <ClipboardList className="w-4 h-4 shrink-0" />
                <span>Quản lý Báo Giá</span>
              </button>

              <button
                onClick={() => { setActiveTab("surveys"); setSearchQuery(""); }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${activeTab === "surveys" ? "bg-indigo-600 text-white shadow-xs" : "hover:bg-slate-50 text-slate-600"}`}
              >
                <Layers className="w-4 h-4 shrink-0" />
                <span>Cấu hình khảo sát</span>
              </button>

              {currentUser.role === "ADMIN" && (
                <button
                  onClick={() => { setActiveTab("users"); setSearchQuery(""); }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${activeTab === "users" ? "bg-indigo-600 text-white shadow-xs" : "hover:bg-slate-50 text-slate-600"}`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>Quản trị người dùng</span>
                </button>
              )}

              <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase px-3 py-2 pt-4">
                Hệ thống tối mật
              </div>

              {currentUser.role === "ADMIN" && (
                <button
                  onClick={() => { setActiveTab("configs"); setSearchQuery(""); }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${activeTab === "configs" ? "bg-indigo-600 text-white shadow-xs" : "hover:bg-slate-50 text-slate-600"}`}
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>Cấu hình hệ thống</span>
                </button>
              )}

              <button
                onClick={() => { setActiveTab("logs"); setSearchQuery(""); }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${activeTab === "logs" ? "bg-indigo-600 text-white shadow-xs" : "hover:bg-slate-50 text-slate-600"}`}
              >
                <Terminal className="w-4 h-4 shrink-0" />
                <span>Nhật ký hoạt động</span>
              </button>
            </>
          )}

          <div className="pt-4 border-t border-gray-100/70 p-3 mt-4 space-y-2">
            <h4 className="text-[10px] font-black tracking-wider uppercase text-slate-400 flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-500" />
              <span>RBAC ACTIVE</span>
            </h4>
            <p className="text-[9px] leading-relaxed text-slate-400 font-medium">
              {isCustomer 
                ? "Báo cáo chiến lược và thông tin cá nhân của bạn được bảo mật tuyệt đối." 
                : "Bộ lọc phân quyền tự động loại bỏ các bản ghi không thuộc thẩm quyền của tài khoản."}
            </p>
          </div>
        </div>

        {/* Tab content area */}
        <div className="lg:col-span-4 space-y-6">

          {/* Search bar helper for rapid table lookups */}
          {activeTab !== "configs" && activeTab !== "dashboard" && activeTab !== "my-surveys" && activeTab !== "my-profile" && (
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder={`Tìm kiếm nhanh trong danh sách ${activeTab === "crm" ? "Leads" : activeTab === "users" ? "người dùng" : "biểu mẫu"}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-medium bg-white shadow-xs"
              />
            </div>
          )}

          <AnimatePresence mode="wait">
            
            {/* ======================= TAB: DASHBOARD (Overview) ======================= */}
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Micro numbers overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-gray-200/60 shadow-xs flex items-center gap-3">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Tổng số Lead CRM</p>
                      <h4 className="text-xl font-bold font-mono text-gray-900">{totalLeads}</h4>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-gray-200/60 shadow-xs flex items-center gap-3">
                    <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Mẫu khảo sát</p>
                      <h4 className="text-xl font-bold font-mono text-gray-900">{totalSurveys}</h4>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-gray-200/60 shadow-xs flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                      <MailCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Email Đã Gửi</p>
                      <h4 className="text-xl font-bold font-mono text-gray-900">{totalEmailsSent}</h4>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-gray-200/60 shadow-xs flex items-center gap-3">
                    <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Tài khoản</p>
                      <h4 className="text-xl font-bold font-mono text-gray-900">{totalUsers}</h4>
                    </div>
                  </div>
                </div>

                {/* Performance indicators */}
                <div className="bg-white p-6 rounded-3xl border border-gray-200/60 shadow-xs space-y-4">
                  <h3 className="font-extrabold text-gray-900 text-sm italic tracking-tight">
                    Chỉ số hiệu suất vận hành chuyển đổi (Conversion Rate)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5 p-4 bg-slate-50 rounded-2xl border border-gray-100">
                      <div className="flex justify-between text-xs text-gray-500 font-semibold">
                        <span>Tỉ lệ chuyển đổi khảo sát thành Lead</span>
                        <span className="font-mono text-blue-600 font-bold">100%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: "100%" }} />
                      </div>
                      <p className="text-[10px] text-gray-400">Tự động cấu tạo biểu ghi CRM ngay lập tức khi gửi form.</p>
                    </div>

                    <div className="space-y-1.5 p-4 bg-slate-50 rounded-2xl border border-gray-100">
                      <div className="flex justify-between text-xs text-gray-500 font-semibold">
                        <span>Tỉ lệ mở hòm thư email báo cáo (Ước lượng)</span>
                        <span className="font-mono text-teal-600 font-bold">85.4%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full" style={{ width: "85.4%" }} />
                      </div>
                      <p className="text-[10px] text-gray-400">Tính toán thông qua lượng liên kết mở PDF đính kèm theo dải IP.</p>
                    </div>

                    <div className="space-y-1.5 p-4 bg-slate-50 rounded-2xl border border-gray-100">
                      <div className="flex justify-between text-xs text-gray-500 font-semibold">
                        <span>Điểm Marketing trung bình của Leads</span>
                        <span className="font-mono text-indigo-600 font-bold">
                          {cmsData.crms.length > 0 
                            ? Math.round(cmsData.crms.reduce((acc: number, c: any) => acc + (c.marketingScore || 0), 0) / cmsData.crms.length)
                            : 50} pts
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${cmsData.crms.length > 0 ? (cmsData.crms.reduce((acc: number, c: any) => acc + (c.marketingScore || 0), 0) / cmsData.crms.length) : 50}%` }} />
                      </div>
                      <p className="text-[10px] text-gray-400">Do AI đánh giá dựa trên mức độ sẵn sàng budget & hạ tầng kỹ thuật.</p>
                    </div>
                  </div>
                </div>

                {/* Recharts Visualizations (Leads arrival + Status share) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Chart 1: Arrival trend */}
                  <div className="bg-white p-5 rounded-3xl border border-gray-200/60 shadow-xs space-y-4">
                    <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Số lượng Leads mới theo ngày</h4>
                    <div className="h-60 w-full font-mono text-[10px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={leadsByDay}>
                          <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="day" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" allowDecimals={false} />
                          <Tooltip />
                          <Area type="monotone" dataKey="count" stroke="#6366f1" fillOpacity={1} fill="url(#colorCount)" strokeWidth={2} name="Số Lead" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 2: Pipeline shares */}
                  <div className="bg-white p-5 rounded-3xl border border-gray-200/60 shadow-xs space-y-4">
                    <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Phân bổ Leads theo trạng thái Pipeline</h4>
                    <div className="h-60 w-full flex items-center justify-center">
                      {statusChartData.length > 0 ? (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          <div className="h-44 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={statusChartData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={45}
                                  outerRadius={65}
                                  paddingAngle={3}
                                  dataKey="value"
                                >
                                  {statusChartData.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] font-bold mt-1 text-slate-600">
                            {statusChartData.map((s: any, idx: number) => (
                              <span key={idx} className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: s.color }} />
                                <span>{s.name} ({s.value})</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">Không có dữ liệu cho biểu đồ trạng thái.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Branch leads arrival */}
                  <div className="bg-white p-5 rounded-3xl border border-gray-200/60 shadow-xs space-y-4">
                    <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Phân bổ Leads theo Chi nhánh vận hành</h4>
                    <div className="h-56 w-full font-mono text-[10px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ReBarChart data={branchData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="branch" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Số lượng leads" />
                        </ReBarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Active franchise branch overview card list */}
                  <div className="bg-white p-5 rounded-3xl border border-gray-200/60 shadow-xs space-y-4">
                    <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Thông tin bảo lãnh nhượng quyền</h4>
                    <div className="divide-y divide-gray-100 text-xs">
                      <div className="py-2.5 flex justify-between items-center">
                        <span className="font-semibold text-gray-700">Chiều sâu đại lý nhượng quyền</span>
                        <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">2 Chi nhánh Active</span>
                      </div>
                      <div className="py-2.5 flex justify-between items-center text-slate-500">
                        <span>Chi nhánh Hà Nội (HN)</span>
                        <b className="text-slate-800 font-mono">
                          {cmsData.crms.filter((c: any) => c.branch === "Hà Nội").length} Leads
                        </b>
                      </div>
                      <div className="py-2.5 flex justify-between items-center text-slate-500">
                        <span>Chi nhánh TP. Hồ Chí Minh (HCM)</span>
                        <b className="text-slate-800 font-mono">
                          {cmsData.crms.filter((c: any) => c.branch === "TP. Hồ Chí Minh").length} Leads
                        </b>
                      </div>
                      <div className="py-2.5 flex justify-between items-center text-slate-500">
                        <span>Các tỉnh / Khác</span>
                        <b className="text-slate-800 font-mono">
                          {cmsData.crms.filter((c: any) => c.branch !== "Hà Nội" && c.branch !== "TP. Hồ Chí Minh").length} Leads
                        </b>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ======================= TAB: CRM MANAGER (Module 5) ======================= */}
            {activeTab === "crm" && (
              <motion.div
                key="crm-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                
                {/* Leads list table column (Left) */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200/60 shadow-xs overflow-hidden space-y-4 p-4 lg:p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-sm">Danh sách Lead thu nạp</h3>
                      <p className="text-[10px] text-gray-400">Click vào dòng bất kỳ để xem chi tiết AI audit & lịch sử tương tác.</p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedLead(null);
                        // Mock adding manual client
                        const coName = prompt("Nhập tên doanh nghiệp:");
                        const contactName = prompt("Nhập tên người liên hệ:");
                        const emailAdd = prompt("Nhập email liên hệ:");
                        const phoneNum = prompt("Nhập số điện thoại:");
                        if (coName && contactName) {
                          fetch("/api/cms/crm/save", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              "Authorization": `Bearer ${token}`
                            },
                            body: JSON.stringify({
                              company: coName,
                              contact: contactName,
                              email: emailAdd || "",
                              phone: phoneNum || "",
                              branch: currentUser.branch || "Hà Nội",
                              assignedTo: currentUser.role === "NHÂN VIÊN" ? currentUser.email : "",
                              notes: "Khách hàng nhập thủ công qua quản trị hệ thống.",
                              isEdit: false
                            })
                          }).then(() => fetchCmsData());
                        }
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Thêm Lead thủ công</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-slate-400 uppercase text-[9px] font-bold tracking-widest">
                          <th className="py-2.5 px-3">Doanh nghiệp / Khách</th>
                          <th className="py-2.5 px-3">Chi nhánh</th>
                          <th className="py-2.5 px-3 text-center">Mức AI</th>
                          <th className="py-2.5 px-3">Pipeline</th>
                          <th className="py-2.5 px-3">Người phụ trách</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredCrms.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-400">
                              Không tìm thấy lead nào phù hợp thẩm quyền.
                            </td>
                          </tr>
                        ) : (
                          filteredCrms.map((lead: any) => {
                            const isSelected = selectedLead && selectedLead.id === lead.id;
                            return (
                              <tr 
                                key={lead.id}
                                onClick={() => { 
                                  setSelectedLead(lead); 
                                  setCrmNotesInput(lead.notes || "");
                                  setLeadDetailTab("info");
                                }}
                                className={`cursor-pointer transition-colors ${isSelected ? "bg-indigo-50/50 hover:bg-indigo-50" : "hover:bg-slate-50"}`}
                              >
                                <td className="py-3 px-3">
                                  <p className="font-extrabold text-slate-900 leading-tight">{lead.company}</p>
                                  <span className="text-[10px] text-slate-400 font-medium">{lead.contact} &bull; {lead.phone || lead.email}</span>
                                </td>
                                <td className="py-3 px-3">
                                  <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                                    <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                                    <span>{lead.branch}</span>
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <span className={`inline-block px-1.5 py-0.5 rounded-md font-mono font-black text-[10px] ${lead.marketingScore >= 75 ? "bg-emerald-50 text-emerald-700" : lead.marketingScore >= 50 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                                    {lead.marketingScore}pts
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <select
                                    value={lead.status || "Lead mới"}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => changeLeadPipeline(lead.id, e.target.value)}
                                    className="px-2 py-1 rounded-lg text-[10px] font-bold border border-gray-200 bg-white shadow-xs focus:ring-2 focus:ring-indigo-100"
                                  >
                                    <option value="Lead mới">ℹ️ Lead mới</option>
                                    <option value="Đã đánh giá">📝 Đã đánh giá</option>
                                    <option value="Đã tư vấn">💬 Đã tư vấn</option>
                                    <option value="Tiềm năng">🔥 Tiềm năng</option>
                                    <option value="Không tiềm năng">❌ Không tiềm năng</option>
                                  </select>
                                </td>
                                <td className="py-3 px-3">
                                  <select
                                    value={lead.assignedTo || ""}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => {
                                      // Save assigned user directly
                                      fetch("/api/cms/crm/save", {
                                        method: "POST",
                                        headers: {
                                          "Content-Type": "application/json",
                                          "Authorization": `Bearer ${token}`
                                        },
                                        body: JSON.stringify({
                                          id: lead.id,
                                          assignedTo: e.target.value,
                                          isEdit: true
                                        })
                                      }).then(() => fetchCmsData());
                                    }}
                                    className="px-2 py-1 rounded-lg text-[10px] border border-gray-200 bg-white font-medium focus:ring-2 focus:ring-indigo-100" 
                                    disabled={currentUser.role === "NHÂN VIÊN"}
                                  >
                                    <option value="">Chờ phân bổ...</option>
                                    {cmsData.users.filter((u: any) => u.role === "NHÂN VIÊN" || u.role === "ADMIN").map((user: any) => (
                                      <option key={user.email} value={user.email}>
                                        {user.name} ({user.branch})
                                      </option>
                                    ))}
                                  </select>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Selected Lead details panel (Right Column) */}
                <div className="lg:col-span-1 space-y-6">
                  {selectedLead ? (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-3xl border border-gray-200/60 shadow-xs p-5 space-y-5"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <b className="text-[10px] uppercase font-black text-indigo-600 tracking-wider">Chi Tiết Khách Hàng</b>
                          <h4 className="font-extrabold text-base text-gray-900 leading-tight mt-0.5">{selectedLead.company}</h4>
                          <p className="text-[11px] text-gray-500 font-medium">Bản ghi CRM #{selectedLead.id.split("-")[1] || selectedLead.id}</p>
                        </div>
                        
                        {currentUser.role === "ADMIN" && (
                          <button
                            onClick={() => deleteLead(selectedLead.id)}
                            className="p-1 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700 shrink-0 transition-colors"
                            title="Xóa Lead vĩnh viễn"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Interactive Section Selector tabs for Lead Details */}
                      <div className="flex border-b border-gray-100 gap-1.5 pb-1 text-[10.5px] overflow-x-auto no-scrollbar whitespace-nowrap scroll-smooth">
                        <button
                          onClick={() => setLeadDetailTab("info")}
                          type="button"
                          className={`pb-2 border-b-2 font-bold px-1 transition-colors ${leadDetailTab === "info" ? "border-indigo-600 text-indigo-650 font-black" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                        >
                          Thông tin
                        </button>
                        <button
                          onClick={() => setLeadDetailTab("survey")}
                          type="button"
                          className={`pb-2 border-b-2 font-bold px-1 transition-colors ${leadDetailTab === "survey" ? "border-indigo-600 text-indigo-650 font-black" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                        >
                          Khảo sát
                        </button>
                        <button
                          onClick={() => setLeadDetailTab("quote")}
                          type="button"
                          className={`pb-2 border-b-2 font-bold px-1 transition-colors ${leadDetailTab === "quote" ? "border-indigo-600 text-indigo-650 font-black" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                        >
                          Báo giá
                        </button>
                        <button
                          onClick={() => setLeadDetailTab("project")}
                          type="button"
                          className={`pb-2 border-b-2 font-bold px-1 transition-colors ${leadDetailTab === "project" ? "border-indigo-600 text-indigo-650 font-black" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                        >
                          Dự án
                        </button>
                        <button
                          onClick={() => setLeadDetailTab("care")}
                          type="button"
                          className={`pb-2 border-b-2 font-bold px-1 transition-colors ${leadDetailTab === "care" ? "border-indigo-600 text-indigo-650 font-black" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                        >
                          Chăm sóc
                        </button>
                        <button
                          onClick={() => setLeadDetailTab("doc")}
                          type="button"
                          className={`pb-2 border-b-2 font-bold px-1 transition-colors ${leadDetailTab === "doc" ? "border-indigo-600 text-indigo-650 font-black" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                        >
                          Tài liệu
                        </button>
                      </div>

                      {/* ==================== TAB 1: THÔNG TIN ==================== */}
                      {leadDetailTab === "info" && (
                        <>
                          <div className="text-xs space-y-2 bg-slate-50 p-3 rounded-2xl border border-gray-100">
                            <div className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span className="font-semibold text-slate-700">{selectedLead.contact}</span>
                            </div>
                            {selectedLead.email && (
                              <div className="flex items-center gap-2 font-mono">
                                <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span className="break-all">{selectedLead.email}</span>
                              </div>
                            )}
                            {selectedLead.phone && (
                              <div className="flex items-center gap-2 font-mono">
                                <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span>{selectedLead.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-gray-200 text-gray-500">
                              <span>Chi nhánh sở tại:</span>
                              <b className="text-gray-800 font-bold">{selectedLead.branch}</b>
                            </div>
                          </div>

                          {/* Quick AI Score display if available */}
                          {(() => {
                            const report = selectedLead.surveyHistory?.[0]?.reportData;
                            if (report) {
                              return (
                                <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex items-center justify-between shadow-sm">
                                  <div>
                                    <span className="text-[9px] font-black tracking-widest text-indigo-300 font-mono">ĐIỂM SẴN SÀNG</span>
                                    <div className="text-lg font-black tracking-tight mt-0.5">{report.readinessScore || 50} / 100</div>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[9px] font-black tracking-widest text-indigo-300 font-mono">XẾP HẠNG</span>
                                    <div className="text-2xl font-black text-sky-300 font-mono mt-0.5">{report.maturityGrade || "C"}</div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()}

                          {/* AI Audit result display readout */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Kết quả AI Audit nguyên bản</span>
                            <div className="bg-indigo-50/40 p-3.5 rounded-2xl border border-indigo-100/50 text-[11px] font-medium leading-relaxed max-h-40 overflow-y-auto no-scrollbar text-slate-705">
                              {selectedLead.aiAuditResult || "Không có dữ liệu khảo sát gốc (Do tạo tay)."}
                            </div>
                          </div>
                        </>
                      )}

                      {/* ==================== TAB 2: KHẢO SÁT ==================== */}
                      {leadDetailTab === "survey" && (
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
                          {(!selectedLead.surveyHistory || selectedLead.surveyHistory.length === 0) ? (
                            <div className="text-center p-6 text-gray-450 text-xs py-10">
                              <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                              <p className="font-semibold text-gray-500">Bản ghi thủ công</p>
                              <p className="text-[10px] text-slate-400">Chưa thu nạp được biểu mẫu câu trả lời khảo sát thực tế từ web.</p>
                            </div>
                          ) : (
                            (() => {
                              const surveyData = selectedLead.surveyHistory[0].surveyData;
                              return (
                                <div className="space-y-3.5 text-xs">
                                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl space-y-2">
                                    <h5 className="font-black text-slate-800 text-[10px] border-b border-slate-200/60 pb-1 uppercase tracking-wider">Doanh nghiệp & Liên hệ</h5>
                                    <div className="space-y-1 text-[11px]">
                                      <div><span className="text-slate-400 font-medium">Tên công ty:</span> <b className="text-slate-800 font-bold">{surveyData.company_name || "N/A"}</b></div>
                                      <div><span className="text-slate-400 font-medium">Người liên hệ:</span> <b className="text-slate-800 font-bold">{surveyData.contact_name || "N/A"} ({surveyData.position || "N/A"})</b></div>
                                      <div><span className="text-slate-400 font-medium">Email:</span> <span className="text-slate-700 font-medium break-all">{surveyData.email || "N/A"}</span></div>
                                      <div><span className="text-slate-400 font-medium">Số điện thoại:</span> <span className="text-slate-700 font-medium">{surveyData.phone || "N/A"}</span></div>
                                      {surveyData.website && <div><span className="text-slate-400 font-medium">Website: </span><a href={surveyData.website} target="_blank" rel="noopener noreferrer" className="text-indigo-605 underline font-semibold break-all">{surveyData.website}</a></div>}
                                      {surveyData.fanpage && <div><span className="text-slate-400 font-medium">Fanpage: </span><a href={surveyData.fanpage} target="_blank" rel="noopener noreferrer" className="text-indigo-605 underline font-semibold break-all">{surveyData.fanpage}</a></div>}
                                    </div>
                                  </div>

                                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl space-y-2">
                                    <h5 className="font-black text-slate-800 text-[10px] border-b border-slate-200/60 pb-1 uppercase tracking-wider">Hồ sơ Doanh nghiệp</h5>
                                    <div className="space-y-1 text-[11px]">
                                      <div><span className="text-slate-400 font-medium">Lĩnh vực hoạt động:</span> <b className="text-slate-700 font-semibold">{surveyData.industry || "N/A"}</b></div>
                                      <div><span className="text-slate-400 font-medium">Năm thành lập:</span> <b className="text-slate-700 font-semibold">{surveyData.year_established || "N/A"}</b></div>
                                      <div><span className="text-slate-400 font-medium">Quy mô nhân sự:</span> <b className="text-slate-700 font-semibold">{surveyData.employee_count || "N/A"}</b></div>
                                      <div><span className="text-slate-400 font-medium">Mô hình kinh doanh:</span> <b className="text-slate-700 font-semibold">{surveyData.business_model || "N/A"}</b></div>
                                      <div><span className="text-slate-400 font-medium">Khách hàng mục tiêu:</span> <b className="text-slate-700 font-semibold">{surveyData.target_customer || "N/A"}</b></div>
                                      <div><span className="text-slate-400 font-medium">Doanh thu năm:</span> <b className="text-slate-700 font-semibold text-indigo-650">{surveyData.revenue || "N/A"}</b></div>
                                    </div>
                                  </div>

                                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl space-y-2">
                                    <h5 className="font-black text-slate-800 text-[10px] border-b border-slate-200/60 pb-1 uppercase tracking-wider">Chiến lược & Hiện trạng</h5>
                                    <div className="space-y-1.5 text-[11px]">
                                      <div><span className="text-slate-400 font-medium block">Mục tiêu phát triển:</span><span className="text-slate-700 font-medium leading-relaxed block bg-white p-2 rounded-xl border border-slate-100 mt-1">{surveyData.goal || "Chưa gõ"}</span></div>
                                      <div><span className="text-slate-400 font-medium block">Hiện trạng Marketing:</span><span className="text-slate-700 font-medium leading-relaxed block bg-white p-2 rounded-xl border border-slate-100 mt-1">{surveyData.marketing_status || "N/A"}</span></div>
                                      <div><span className="text-slate-400 font-medium">Ngân sách hiện tại:</span> <b className="text-slate-700 font-semibold">{surveyData.marketing_budget || "N/A"}</b></div>
                                      <div><span className="text-slate-400 font-medium block">Dịch vụ cần thiết:</span> <b className="text-slate-700 font-semibold">{surveyData.services_needed?.join(", ") || "N/A"}</b></div>
                                      <div><span className="text-slate-400 font-medium">Ngân sách dự kiến:</span> <b className="text-slate-700 font-semibold text-indigo-650">{surveyData.service_budget || "Chưa rõ"}</b></div>
                                    </div>
                                  </div>

                                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl space-y-2">
                                    <h5 className="font-black text-slate-800 text-[10px] border-b border-slate-200/60 pb-1 uppercase tracking-wider">Công cụ số & Năng lực</h5>
                                    <div className="space-y-1 text-[11px]">
                                      <div><span className="text-slate-400 font-medium">Kênh đang vận hành:</span> <span className="font-semibold text-slate-700 block bg-white p-1.5 rounded-lg border border-slate-100 mt-0.5">{surveyData.channels?.join(", ") || "N/A"}</span></div>
                                      <div><span className="text-slate-400 font-medium">Tài sản hiện có:</span> <span className="font-semibold text-slate-700 block bg-white p-1.5 rounded-lg border border-slate-100 mt-0.5">{surveyData.digital_assets?.join(", ") || "N/A"}</span></div>
                                      <div><span className="text-slate-400 font-medium">Pixel / GA4 theo dõi:</span> <span className="font-semibold text-slate-700 block bg-white p-1.5 rounded-lg border border-slate-100 mt-0.5">{surveyData.tracking_tools?.join(", ") || "N/A"}</span></div>
                                      <div><span className="text-slate-400 font-medium block mt-1.5">Điểm mạnh tự tin:</span><span className="text-slate-755 block bg-white p-2 rounded-xl border border-slate-100 mt-0.5 font-medium leading-relaxed">{surveyData.strengths || "Chưa nêu"}</span></div>
                                      <div><span className="text-slate-400 font-medium block mt-1.5">USP Độc bản:</span><span className="text-slate-755 block bg-white p-2 rounded-xl border border-slate-100 mt-0.5 font-medium leading-relaxed">{surveyData.unique_selling_point || "Chưa định hình"}</span></div>
                                      <div><span className="text-slate-400 font-medium block mt-1.5">Đối thủ cạnh tranh:</span><span className="text-slate-755 block bg-white p-2 rounded-xl border border-slate-100 mt-0.5 font-medium leading-relaxed">{surveyData.competitors || "Chưa lập"}</span></div>
                                      <div><span className="text-slate-400 font-medium block mt-1.5">Định vị thương hiệu:</span><span className="text-slate-755 block bg-white p-2 rounded-xl border border-slate-100 mt-0.5 font-medium leading-relaxed">{surveyData.brand_positioning || "Chưa có"}</span></div>
                                    </div>
                                  </div>

                                  <div className="bg-red-50/60 border border-red-100 p-3 rounded-2xl space-y-1.5">
                                    <h5 className="font-black text-red-800 text-[10px] border-b border-red-200/40 pb-1 uppercase tracking-wider">Điểm đau & Khó khăn</h5>
                                    <ul className="list-decimal pl-4 space-y-1 text-slate-700 font-medium text-[11px] leading-relaxed">
                                      {surveyData.pain_points && surveyData.pain_points.length > 0 ? (
                                        surveyData.pain_points.map((pt: string, i: number) => (
                                          <li key={i}>{pt}</li>
                                        ))
                                      ) : (
                                        <p className="text-slate-400 italic">Doanh nghiệp chưa ghi nhận khó khăn nào.</p>
                                      )}
                                    </ul>
                                  </div>
                                </div>
                              );
                            })()
                          )}
                        </div>
                      )}

                      {/* ==================== TAB 3: BÁO GIÁ ==================== */}
                      {leadDetailTab === "quote" && (
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 no-scrollbar text-xs">
                          <div className="flex justify-between items-center bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100">
                            <span className="font-bold text-indigo-900 text-[10.5px]">Bảng Báo giá liên kết</span>
                            <button
                              type="button"
                              onClick={() => {
                                setPrefillLeadId(selectedLead.id);
                                setActiveTab("quotations");
                              }}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[9.5px] uppercase flex items-center gap-1 cursor-pointer transition-all"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Soạn báo giá mới</span>
                            </button>
                          </div>

                          {(() => {
                            const leadQuotes = (cmsData.quotations || []).filter((q: any) => q.customerId === selectedLead.id);
                            if (leadQuotes.length === 0) {
                              return (
                                <div className="text-center p-6 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                  <AlertCircle className="w-5 h-5 text-gray-300 mx-auto mb-1.5" />
                                  <p className="font-bold">Chưa tạo báo giá nào</p>
                                  <p className="text-[10px] text-gray-500">Click nút phía trên để tự động nạp liên hệ này vào biểu mẫu báo định thù.</p>
                                </div>
                              );
                            }

                            const getStatusColorLocal = (status: string) => {
                              switch (status) {
                                case "Nháp": return "bg-gray-100 text-gray-605 border-gray-200";
                                case "Đã gửi khách": return "bg-blue-50 text-blue-650 border-blue-200";
                                case "Đang xem xét": return "bg-amber-50 text-amber-600 border-amber-200";
                                case "Đàm phán": return "bg-purple-50 text-purple-650 border-purple-200";
                                case "Chấp nhận": return "bg-teal-50 text-teal-605 border-teal-200";
                                case "Từ chối": return "bg-red-50 text-red-655 border-red-200";
                                case "Chuyển hợp đồng": return "bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold";
                                default: return "bg-gray-100 text-gray-500";
                              }
                            };

                            return (
                              <div className="space-y-2.5">
                                {leadQuotes.map((q: any) => (
                                  <div key={q.id} className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="font-mono font-bold text-slate-900">{q.code}</span>
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getStatusColorLocal(q.status)}`}>
                                        {q.status}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                                      <span>Trị giá:</span>
                                      <b className="font-extrabold text-rose-700 font-mono">{(q.totalAmount || 0).toLocaleString()} đ</b>
                                    </div>
                                    <div className="text-[10px] text-gray-400">Hiệu lực đến: {q.expiryDate}</div>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* ==================== TAB 4: DỰ ÁN ==================== */}
                      {leadDetailTab === "project" && (
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 no-scrollbar text-xs">
                          {/* Inner quick add project form */}
                          <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl space-y-2.5">
                            <h5 className="font-black text-slate-800 text-[10px] uppercase tracking-wider flex items-center gap-1 border-b border-gray-200 pb-1.5">
                              <Plus className="w-3.5 h-3.5 text-indigo-650" />
                              <span>Đăng ký Dự án thi công</span>
                            </h5>
                            
                            <form onSubmit={async (e) => {
                              e.preventDefault();
                              const form = e.currentTarget;
                              const pName = (form.elements.namedItem("pName") as HTMLInputElement).value;
                              const pBudget = Number((form.elements.namedItem("pBudget") as HTMLInputElement).value) || 0;
                              const pStatus = (form.elements.namedItem("pStatus") as HTMLSelectElement).value;
                              const pNotes = (form.elements.namedItem("pNotes") as HTMLTextAreaElement).value;
                              
                              if (!pName) {
                                alert("Vui lòng nhập tên dự án.");
                                return;
                              }

                              try {
                                const res = await fetch("/api/cms/projects/save", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                    "Authorization": `Bearer ${token || internalToken}`
                                  },
                                  body: JSON.stringify({
                                    leadId: selectedLead.id,
                                    company: selectedLead.company,
                                    name: pName,
                                    status: pStatus,
                                    budget: pBudget,
                                    notes: pNotes,
                                    services: [],
                                    isEdit: false
                                  })
                                });
                                if (res.ok) {
                                  alert("Đăng ký thành công!");
                                  await fetchCmsData();
                                  form.reset();
                                } else {
                                  alert("Gặp sự cố máy chủ khi ghi nhận dự án.");
                                }
                              } catch (err: any) {
                                alert("Thao tác lỗi: " + err.message);
                              }
                            }} className="space-y-2">
                              <input
                                required
                                name="pName"
                                type="text"
                                placeholder="Gói thi công (E.g. Thiết kế Landing Page)"
                                className="w-full p-2 border border-gray-200 bg-white rounded-xl text-[11px]"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  name="pBudget"
                                  type="number"
                                  step={100000}
                                  placeholder="Ngân sách (đ)"
                                  className="w-full p-2 border border-gray-200 bg-white rounded-xl text-[11px] font-mono"
                                />
                                <select
                                  name="pStatus"
                                  className="w-full p-2 border border-gray-200 bg-white rounded-xl text-[11px] font-semibold text-slate-850"
                                >
                                  <option value="Lập kế hoạch">📝 Lập kế hoạch</option>
                                  <option value="Đang triển khai">🚀 Triển khai</option>
                                  <option value="Đang nghiệm thu">🔍 Nghiệm thu</option>
                                  <option value="Hoàn thành">🎉 Hoàn thành</option>
                                  <option value="Tạm ngưng">⏸️ Tạm ngưng</option>
                                </select>
                              </div>
                              <textarea
                                name="pNotes"
                                placeholder="Cam kết KPI số, thời gian bàn giao..."
                                rows={2}
                                className="w-full p-2 border border-gray-200 bg-white rounded-xl text-[11px]"
                              />
                              <button
                                type="submit"
                                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-[10px] uppercase transition-all shrink-0 cursor-pointer"
                              >
                                Thêm dự án mới
                              </button>
                            </form>
                          </div>

                          {/* Project list layout */}
                          {(() => {
                            const leadProjects = (cmsData.projects || []).filter((p: any) => p.leadId === selectedLead.id);
                            if (leadProjects.length === 0) {
                              return (
                                <div className="text-center p-6 text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                  <Briefcase className="w-5 h-5 text-gray-300 mx-auto mb-1.5" />
                                  <p className="font-bold">Đang trống dự án</p>
                                  <p className="text-[10px]">Chưa phát sinh hoạt động thi công cho hồ sơ này.</p>
                                </div>
                              );
                            }

                            return (
                              <div className="space-y-2">
                                <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">Các dự án đang chạy ({leadProjects.length})</span>
                                {leadProjects.map((p: any) => (
                                  <div key={p.id} className="bg-indigo-50/20 border border-slate-200/80 p-3 rounded-2xl space-y-1.5">
                                    <div className="flex justify-between items-start gap-1">
                                      <b className="font-bold text-slate-850 text-[11.5px] leading-snug">{p.name}</b>
                                      <span className="shrink-0 px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-150 rounded text-[8.5px] font-bold uppercase font-mono">
                                        {p.status}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10.5px] text-slate-500 font-mono">
                                      <span>Ngân sách:</span>
                                      <b className="text-indigo-700 font-extrabold">{(p.budget || 0).toLocaleString()} đ</b>
                                    </div>
                                    {p.notes && <p className="text-[10px] bg-white border border-slate-100 p-2 rounded-lg text-slate-600 block leading-relaxed italic mt-1 font-medium">"{p.notes}"</p>}
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* ==================== TAB 5: CHĂM SÓC ==================== */}
                      {leadDetailTab === "care" && (
                        <>
                          {/* Notes editor */}
                          <div className="space-y-2">
                            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Ghi chú nghiệp vụ</span>
                            <textarea
                              rows={3}
                              value={crmNotesInput}
                              onChange={(e) => setCrmNotesInput(e.target.value)}
                              placeholder="Nhập ghi chú quan trọng về khách hàng tại đây..."
                              className="w-full border border-gray-200 rounded-2xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-100 bg-gray-50/50 font-medium"
                            />
                            <button
                              onClick={saveCrmLeadNotes}
                              className="px-3 py-1.5 bg-slate-900 text-white font-bold rounded-xl text-[10px] hover:bg-black uppercase transition-all float-right cursor-pointer"
                            >
                              Lưu Ghi Chú
                            </button>
                            <div className="clear-both" />
                          </div>

                          {/* Interaction logging system */}
                          <div className="space-y-3 pt-3 border-t border-gray-100">
                            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Nhật ký tương tác tư vấn</span>
                            
                            <div className="flex gap-2">
                              <select
                                value={newLogType}
                                onChange={(e) => setNewLogType(e.target.value)}
                                className="bg-white border border-gray-200 text-[10px] font-bold px-2 py-1 rounded-xl focus:outline-none"
                              >
                                <option value="Gọi điện">📞 Gọi điện</option>
                                <option value="Gửi Mail">✉️ Gửi Mail</option>
                                <option value="Họp offline">🤝 Họp</option>
                                <option value="Gắn thẻ">🏷️ Gắn thẻ</option>
                              </select>
                              <input
                                type="text"
                                placeholder="Mô tả nội dung..."
                                value={newLogDetail}
                                onChange={(e) => setNewLogDetail(e.target.value)}
                                className="flex-1 bg-gray-50 border border-gray-200 text-xs px-2.5 py-1.5 rounded-xl outline-none"
                              />
                              <button
                                onClick={addInteractionLog}
                                className="px-2.5 bg-indigo-55 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 rounded-xl font-black text-[11px]"
                              >
                                Lưu log
                              </button>
                            </div>

                            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                              {(!selectedLead.historyLogs || selectedLead.historyLogs.length === 0) ? (
                                <p className="text-[10px] text-gray-400 italic">Chưa phát sinh lượt chăm sóc.</p>
                              ) : (
                                selectedLead.historyLogs.map((log: any, idx: number) => (
                                  <div key={idx} className="bg-slate-50 border border-gray-100/60 p-2 rounded-xl text-[10px] space-y-1">
                                    <div className="flex justify-between text-[9px] text-gray-400">
                                      <span className="font-bold uppercase text-indigo-600">{log.type}</span>
                                      <span className="font-mono">{log.date}</span>
                                    </div>
                                    <p className="text-gray-650 font-medium leading-relaxed">{log.detail}</p>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {/* ==================== TAB 6: TÀI LIỆU ==================== */}
                      {leadDetailTab === "doc" && (
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 no-scrollbar text-xs">
                          {/* Strategic AI Report Card */}
                          <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl flex flex-col items-center justify-center text-center space-y-2.5">
                            <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                              <FileSpreadsheet className="w-4 h-4" />
                            </div>
                            <div className="leading-tight">
                              <h6 className="font-extrabold text-slate-800 text-[11px]">Báo cáo Phân tích AI Audit</h6>
                              <p className="text-[10px] text-slate-500 mt-0.5">Tệp PDF chiến lược marketing và tối ưu hóa chuyển đổi tự động bởi AI.</p>
                            </div>
                            {selectedLead.surveyHistory?.[0]?.reportData ? (
                              <button
                                type="button"
                                onClick={async () => {
                                  setIsDownloadingPdf(true);
                                  try {
                                    const historyItem = selectedLead.surveyHistory[0];
                                    const response = await fetch("/api/download-pdf", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ surveyData: historyItem.surveyData, reportData: historyItem.reportData })
                                    });
                                    if (!response.ok) throw new Error("Thất bại khi xuất.");
                                    const blob = await response.blob();
                                    const url = window.URL.createObjectURL(blob);
                                    const link = document.createElement("a");
                                    link.href = url;
                                    link.download = `Bao_cao_marketing_${(historyItem.surveyData?.company_name || selectedLead.company).replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
                                    document.body.appendChild(link);
                                    link.click();
                                    link.remove();
                                    window.URL.revokeObjectURL(url);
                                  } catch (err: any) {
                                    alert("Lỗi tải báo cáo: " + err.message);
                                  } finally {
                                    setIsDownloadingPdf(false);
                                  }
                                }}
                                disabled={isDownloadingPdf}
                                className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-all outline-none cursor-pointer shadow-xs"
                              >
                                {isDownloadingPdf ? (
                                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Download className="w-3.5 h-3.5" />
                                )}
                                <span>Tải báo cáo phân tích</span>
                              </button>
                            ) : (
                              <p className="text-[10px] text-gray-400 italic">Doanh nghiệp này chưa tham gia khảo sát để trích xuất.</p>
                            )}
                          </div>

                          {/* Standard Standard Draft contract doc download card */}
                          <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl flex flex-col items-center justify-center text-center space-y-2.5">
                            <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                              <ClipboardList className="w-4 h-4" />
                            </div>
                            <div className="leading-tight">
                              <h6 className="font-extrabold text-emerald-850 text-[11px]">Hợp đồng mẫu chuẩn TOLUCK</h6>
                              <p className="text-[10px] text-slate-505 mt-0.5">Tệp tài liệu mẫu thỏa thuận cung cấp dịch vụ Marketing và số hóa doanh nghiệp.</p>
                            </div>
                            <a
                              href="https://docs.google.com/document/d/1u3bL20aEovpX4jD-Y8Y1M_T_4p6p9V6V/export?format=docx"
                              target="_blank"
                              rel="noreferrer"
                              className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-750 text-white rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-all outline-none shadow-xs"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Tải hợp đồng mẫu (.docx)</span>
                            </a>
                          </div>

                          {selectedLead.surveyHistory?.[0]?.reportData && (
                            (() => {
                              const report = selectedLead.surveyHistory[0].reportData;
                              return (
                                <div className="space-y-4 pt-3 border-t border-gray-100">
                                  {report.channelStrategy && (
                                    <div className="space-y-1.5">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phương án khai phá kênh</span>
                                      <div className="space-y-2">
                                        {report.channelStrategy.map((cs: any, idx: number) => (
                                          <div key={idx} className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl space-y-1">
                                            <div className="flex justify-between items-center">
                                              <b className="text-[11px] font-bold text-slate-800">{cs.channelName}</b>
                                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                                                cs.priority === "Cao" ? "bg-red-50 text-red-700" :
                                                cs.priority === "Trung bình" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
                                              }`}>{cs.priority}</span>
                                            </div>
                                            <p className="text-[10px] leading-relaxed text-slate-500 font-medium">{cs.actionRequired}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Recommendations Checklist */}
                                  {report.recommendations && (
                                    <div className="space-y-1.5">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hành động ưu tiên khuyên dùng</span>
                                      <div className="space-y-1.5">
                                        {report.recommendations.map((rec: string, idx: number) => (
                                          <div key={idx} className="flex gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100 items-start">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                                            <span className="text-slate-700 text-[10px] leading-relaxed font-semibold">{rec}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()
                          )}
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <div className="bg-white rounded-3xl border border-gray-200/60 shadow-xs p-6 text-center text-xs text-gray-400 py-16 space-y-2">
                      <AlertCircle className="w-8 h-8 text-indigo-500/50 mx-auto" />
                      <p className="font-semibold text-gray-500">Chưa có Lead nào được chọn</p>
                      <p className="text-[10px]">Nhấp vào một dòng bên danh sách để bóc tách thông tin thấu triệt.</p>
                    </div>
                  )}
                </div>

              </motion.div>
            )}

            {/* ======================= TAB: QUOTATIONS MANAGER ======================= */}
            {activeTab === "quotations" && (
              <motion.div
                key="quotations-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-3xl border border-gray-200/60 shadow-xs p-4 sm:p-6"
              >
                <QuotationPanel
                  token={token || internalToken}
                  currentUser={currentUser || internalCurrentUser}
                  crms={cmsData.crms || []}
                  quotations={cmsData.quotations || []}
                  projects={cmsData.projects || []}
                  fetchCmsData={fetchCmsData}
                  prefillLeadId={prefillLeadId}
                  onClearPrefillLead={() => setPrefillLeadId(null)}
                />
              </motion.div>
            )}

            {/* ======================= TAB: SURVEYS (Module 4) ======================= */}
            {activeTab === "surveys" && (
              <motion.div
                key="surveys-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-3xl border border-gray-200/60 shadow-xs p-4 sm:p-6 space-y-6"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-sm">Cập nhật & Cấu hình Biểu mẫu Khảo sát</h3>
                    <p className="text-[10px] text-gray-400">Lập ma trận tham số riêng biệt cho từng tệp khảo sát (logo, màu sắc, phễu webhook n8n, Prompt AI).</p>
                  </div>
                  
                  {(currentUser.role === "ADMIN" || currentUser.role === "CEO") && (
                    <button
                      onClick={() => {
                        setSurveyForm({
                          id: "",
                          name: "",
                          status: "Hoạt động",
                          config: {
                            logo: "https://toluck.com.vn/logo.png",
                            colorTheme: "#1e3a8a",
                            emailFrom: "info@toluck.com.vn",
                            promptAi: "Bạn là chuyên gia tư vấn chiến thức của TOLUCK Agency...",
                            webhookUrl: "https://ai.toluck.com.vn/webhook/phantichkhachhang"
                          },
                          isEdit: false
                        });
                        setShowSurveyModal(true);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tạo khảo sát mới</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredSurveys.map((survey: any) => (
                    <div key={survey.id} className="border border-gray-200/80 rounded-2xl p-4 space-y-4 shadow-xs relative">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${survey.status === "Hoạt động" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                            {survey.status}
                          </span>
                          <h4 className="font-extrabold text-sm text-gray-900 leading-tight mt-1">{survey.name}</h4>
                          <span className="text-[10px] text-gray-400 font-mono">ID: {survey.id} &bull; Lập ngày {survey.createdAt}</span>
                        </div>

                        <div className="flex gap-1 shrink-0">
                          {(currentUser.role === "ADMIN" || currentUser.role === "CEO") && (
                            <>
                              <button
                                onClick={() => duplicateSurvey(survey.id)}
                                className="p-1 hover:bg-indigo-50 rounded"
                                title="Nhân bản khảo sát"
                              >
                                <Copy className="w-3.5 h-3.5 text-indigo-500" />
                              </button>
                              
                              <button
                                onClick={() => {
                                  setSurveyForm({
                                    id: survey.id,
                                    name: survey.name,
                                    status: survey.status,
                                    config: {
                                      logo: survey.config?.logo || "https://toluck.com.vn/logo.png",
                                      colorTheme: survey.config?.colorTheme || "#1e3a8a",
                                      emailFrom: survey.config?.emailFrom || "info@toluck.com.vn",
                                      promptAi: survey.config?.promptAi || "",
                                      webhookUrl: survey.config?.webhookUrl || ""
                                    },
                                    isEdit: true
                                  });
                                  setShowSurveyModal(true);
                                }}
                                className="p-1 hover:bg-blue-50 rounded"
                                title="Sửa cấu hình chi tiết"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                              </button>

                              <button
                                onClick={() => toggleSurveyStatus(survey.id)}
                                className="p-1 hover:bg-amber-50 rounded"
                                title="Đóng rạp/Khai mở"
                              >
                                {survey.status === "Hoạt động" ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                              </button>
                            </>
                          )}
                          {currentUser.role === "ADMIN" && (
                            <button
                              onClick={() => deleteSurvey(survey.id)}
                              className="p-1 hover:bg-red-50 rounded"
                              title="Xóa vĩnh viễn"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-gray-100 text-[11px] space-y-1.5 text-gray-600">
                        <div className="flex justify-between">
                          <span>Tổng lượng nộp đã ghi nhận:</span>
                          <b className="text-gray-900 font-mono text-xs">{survey.usageCount || 0} lượt hoàn tất</b>
                        </div>
                        <div className="flex justify-between">
                          <span>Mailer người gửi SMTP:</span>
                          <span className="font-mono">{survey.config?.emailFrom || "info@toluck.com.vn"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Brand theme color:</span>
                          <span className="font-bold" style={{ color: survey.config?.colorTheme }}>{survey.config?.colorTheme || "#1e3a8a"}</span>
                        </div>
                        <div className="pt-1.5 border-t border-gray-200">
                          <span className="font-semibold block text-slate-700">API Webhook nộp lead:</span>
                          <span className="font-mono text-[9px] break-all block leading-tight text-gray-500">{survey.config?.webhookUrl || "Chờ liên kết..."}</span>
                        </div>
                      </div>

                      <div className="bg-indigo-50/30 p-3 rounded-xl border border-indigo-100/50 text-[10px] text-indigo-900 font-medium">
                        <span className="font-black text-[9px] uppercase tracking-wider block text-indigo-700 mb-0.5">Prompt định dạng chiến dịch (AI Agent instructions)</span>
                        <p className="line-clamp-2 leading-relaxed text-indigo-950">{survey.config?.promptAi || "Bạn là tư vấn viên marketing cấp cao của TOLUCK. Phân tích điểm yếu và đưa ra giải pháp..."}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ======================= TAB: USERS SETTINGS (Module 2 - ADMIN only) ======================= */}
            {activeTab === "users" && currentUser.role === "ADMIN" && (
              <motion.div
                key="users-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-3xl border border-gray-200/60 shadow-xs p-4 sm:p-6 space-y-6"
              >
                
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-sm">Quản lý Tài khoản & Định biên Quotas</h3>
                    <p className="text-[10px] text-gray-400">Thiết lập đặc quyền vai trò hệ thống, Reset mật khẩu và giới hạn quyền hạn trên từng chi nhánh.</p>
                  </div>

                  <button
                    onClick={() => {
                     setUserForm({
                        email: "",
                        password: "",
                        name: "",
                        role: "NHÂN VIÊN",
                        phone: "",
                        branch: "Hà Nội",
                        limits: { surveys: 5, aiAudits: 5, crms: 20, expDate: "2026-12-31" },
                        avatar: "",
                        isEdit: false
                      });
                      setShowUserModal(true);
                    }}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Cộng tác viên mới</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-slate-400 uppercase text-[9px] font-bold tracking-widest">
                        <th className="py-2.5 px-3">Cán bộ</th>
                        <th className="py-2.5 px-3">Hòm thư / Liên hệ</th>
                        <th className="py-2.5 px-3">Vai trò</th>
                        <th className="py-2.5 px-3">Chi nhánh</th>
                        <th className="py-2.5 px-3">Định ngạch Quota (Khảo sát/AI/CRM)</th>
                        <th className="py-2.5 px-3">Trạng thái</th>
                        <th className="py-2.5 px-3 text-right">Lựa chọn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredUsers.map((user: any) => (
                        <tr key={user.email} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 flex items-center gap-3">
                            <img src={user.avatar} alt="avatar" className="w-8 h-8 rounded-full border border-gray-200" referrerPolicy="no-referrer" />
                            <b className="font-extrabold text-slate-900 block">{user.name}</b>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-mono block">{user.email}</span>
                            <span className="text-[10px] text-gray-400 font-medium">{user.phone}</span>
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-700">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${user.role === 'ADMIN' ? 'bg-red-50 text-red-700' : user.role === 'CEO' ? 'bg-blue-50 text-blue-700' : user.role === 'GIÁM ĐỐC KINH DOANH NHƯỢNG QUYỀN' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-medium text-slate-600">{user.branch}</span>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] leading-relaxed text-gray-600">
                            {user.limits ? (
                              <div className="space-y-0.5">
                                <p>Sát lập/ngày: <b className="text-gray-900">{user.limits.surveys}</b></p>
                                <p>AI Audit/ngày: <b className="text-gray-900">{user.limits.aiAudits}</b></p>
                                <p>Khách quản lý: <b className="text-gray-900">{user.limits.crms}</b></p>
                                <p className="text-[9px] text-gray-400">Hết hạn: {user.limits.expDate}</p>
                              </div>
                            ) : (
                              "Vô hạn định"
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${user.status === 'Locked' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                              {user.status === 'Locked' ? 'Tài khóa bị Khóa' : 'Hoạt động'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => {
                                  setUserForm({
                                    email: user.email,
                                    password: "",
                                    name: user.name,
                                    role: user.role,
                                    phone: user.phone || "",
                                    branch: user.branch || "Hà Nội",
                                    limits: user.limits || { surveys: 10, aiAudits: 10, crms: 50, expDate: "2026-12-31" },
                                    avatar: user.avatar || "",
                                    isEdit: true
                                  });
                                  setShowUserModal(true);
                                }}
                                className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                                title="Sửa Quota & Thông tin"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => toggleLockUser(user.email)}
                                className={`p-1 hover:bg-slate-100 ${user.status === 'Locked' ? 'text-emerald-600' : 'text-amber-600'}`}
                                title={user.status === 'Locked' ? 'Khai mở tài khoản' : 'Khóa đóng'}
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => deleteUser(user.email)}
                                className="p-1 hover:bg-red-50 text-red-500 hover:text-red-700"
                                title="Trục xuất"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* ======================= TAB: APP CONFS (Module 7 - ADMIN only) ======================= */}
            {activeTab === "configs" && currentUser.role === "ADMIN" && (
              <motion.div
                key="configs-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-3xl border border-gray-200/60 shadow-xs p-4 sm:p-6 space-y-6"
              >
                <div>
                  <h3 className="font-extrabold text-gray-900 text-sm">Cấu hình tham số Hệ thống & Mailer SMTP</h3>
                  <p className="text-[10px] text-gray-400">Xác lập các đầu chỉ số chìa khóa API, cổng nộp webhook n8n gốc và các tham số gửi email từ hệ thống.</p>
                </div>

                {configSaveStatus === "success" && (
                  <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl text-teal-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-teal-600 shrink-0" />
                    <span>Lưu cấu hình hệ thống thành công. Phiên chạy Nodemailer và API Key Gemini đã được reload hoàn tất thông suốt!</span>
                  </div>
                )}

                {configSaveStatus === "error" && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                    <span>{configErrorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSaveConfigs} className="space-y-6">
                  
                  {/* API Section */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-wider pb-1 border-b border-gray-100">AI Model Credentials (Khóa API)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Google Gemini API Key</label>
                        <input
                          type="password"
                          value={configForm.geminiApiKey}
                          onChange={(e) => setConfigForm({ ...configForm, geminiApiKey: e.target.value })}
                          placeholder="AI Studio secret key (nhận diện qua process.env)"
                          className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Backup OpenAI API Key (Tùy chọn)</label>
                        <input
                          type="password"
                          value={configForm.openaiApiKey}
                          onChange={(e) => setConfigForm({ ...configForm, openaiApiKey: e.target.value })}
                          placeholder="sk-..."
                          className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mailer SMTP configuration Section */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-wider pb-1 border-b border-gray-100">SMTP Server Configuration (Bảo mật Mailer)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">SMTP Host</label>
                        <input
                          type="text"
                          required
                          value={configForm.smtpHost}
                          onChange={(e) => setConfigForm({ ...configForm, smtpHost: e.target.value })}
                          placeholder="mail.toluck.com.vn"
                          className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">SMTP Port</label>
                        <input
                          type="text"
                          required
                          value={configForm.smtpPort}
                          onChange={(e) => setConfigForm({ ...configForm, smtpPort: e.target.value })}
                          placeholder="465"
                          className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Địa chỉ hòm thư gửi đi (From Email)</label>
                        <input
                          type="text"
                          required
                          value={configForm.smtpFrom}
                          onChange={(e) => setConfigForm({ ...configForm, smtpFrom: e.target.value })}
                          placeholder="info@toluck.com.vn"
                          className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Tài khoản SMTP User</label>
                        <input
                          type="text"
                          required
                          value={configForm.smtpEmail}
                          onChange={(e) => setConfigForm({ ...configForm, smtpEmail: e.target.value })}
                          placeholder="info@toluck.com.vn"
                          className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Mật khẩu SMTP Password</label>
                        <input
                          type="password"
                          value={configForm.smtpPass === "CONFIGURED_IN_ENV" ? "" : configForm.smtpPass}
                          onChange={(e) => setConfigForm({ ...configForm, smtpPass: e.target.value })}
                          placeholder={configForm.smtpPass === "CONFIGURED_IN_ENV" ? "•••••••• (Đã cấu hình trong môi trường .env)" : "Nhập mật khẩu SMTP mới..."}
                          className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Webhook & Branding section */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-wider pb-1 border-b border-gray-100">Phễu Webhook & Agency Branding</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Default n8n Webhook URL</label>
                        <input
                          type="url"
                          required
                          value={configForm.n8nWebhookUrl}
                          onChange={(e) => setConfigForm({ ...configForm, n8nWebhookUrl: e.target.value })}
                          placeholder="https://ai.toluck.com.vn/webhook/phantichkhachhang"
                          className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 font-sans">Đường dẫn Agency Logo (Hỗ trợ upload ảnh trực tiếp)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            required
                            value={configForm.logo}
                            onChange={(e) => setConfigForm({ ...configForm, logo: e.target.value })}
                            placeholder="/logo.png"
                            className="flex-1 bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-100"
                          />
                          <label className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-2 rounded-xl text-xs cursor-pointer border border-indigo-100 flex items-center justify-center gap-1 shrink-0 whitespace-nowrap">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Tải ảnh lên</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setConfigForm(prev => ({ ...prev, logo: reader.result as string }));
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                        {configForm.logo && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-[10px] text-gray-400">Xem trước Logo:</span>
                            <img src={configForm.logo} alt="Preview Logo" className="h-6 bg-slate-900 px-2 py-1 rounded border border-gray-100 object-contain max-w-[150px]" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 font-sans">Đường dẫn Favicon (Hỗ trợ upload ảnh biểu tượng)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            required
                            value={configForm.favicon}
                            onChange={(e) => setConfigForm({ ...configForm, favicon: e.target.value })}
                            placeholder="/favicon.ico"
                            className="flex-1 bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-100"
                          />
                          <label className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-2 rounded-xl text-xs cursor-pointer border border-indigo-100 flex items-center justify-center gap-1 shrink-0 whitespace-nowrap">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Tải biểu tượng</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setConfigForm(prev => ({ ...prev, favicon: reader.result as string }));
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                        {configForm.favicon && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-[10px] text-gray-400">Xem trước Favicon:</span>
                            <img src={configForm.favicon} alt="Preview Favicon" className="w-5 h-5 bg-white p-0.5 rounded border border-gray-100 object-contain" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Mã định danh / Tên công ty (Email footer)</label>
                        <input
                          type="text"
                          required
                          value={configForm.companyName}
                          onChange={(e) => setConfigForm({ ...configForm, companyName: e.target.value })}
                          placeholder="v.d. CÔNG TY CỔ PHẦN CÔNG NGHỆ & TRUYỀN THÔNG TOLUCK"
                          className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Địa chỉ Trụ sở chính (Email footer)</label>
                        <input
                          type="text"
                          required
                          value={configForm.companyAddress}
                          onChange={(e) => setConfigForm({ ...configForm, companyAddress: e.target.value })}
                          placeholder="v.d. Tòa nhà TOLUCK Building, Hà Nội, Việt Nam"
                          className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Số điện thoại Hotline</label>
                        <input
                          type="text"
                          required
                          value={configForm.companyPhone}
                          onChange={(e) => setConfigForm({ ...configForm, companyPhone: e.target.value })}
                          placeholder="v.d. 0963 484 365"
                          className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Email liên hệ hỗ trợ</label>
                        <input
                          type="email"
                          required
                          value={configForm.companyEmail}
                          onChange={(e) => setConfigForm({ ...configForm, companyEmail: e.target.value })}
                          placeholder="v.d. info@toluck.vn"
                          className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Giới thiệu Công ty (Company Introduction)</label>
                      <textarea
                        required
                        value={configForm.companyIntro}
                        onChange={(e) => setConfigForm({ ...configForm, companyIntro: e.target.value })}
                        placeholder="Mô tả tóm tắt giới thiệu về công ty hoặc hỗ trợ khảo sát..."
                        rows={3}
                        className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-medium resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Dòng chữ khẩu hiệu giới thiệu (v.d. Digital & AI Agency)</label>
                        <input
                          type="text"
                          required
                          value={configForm.companySubtitle}
                          onChange={(e) => setConfigForm({ ...configForm, companySubtitle: e.target.value })}
                          placeholder="v.d. Digital & AI Agency"
                          className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Đường dẫn Fanpage / Mạng xã hội</label>
                        <input
                          type="url"
                          required
                          value={configForm.fanpageUrl}
                          onChange={(e) => setConfigForm({ ...configForm, fanpageUrl: e.target.value })}
                          placeholder="v.d. https://facebook.com/toluck.vn"
                          className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                        />
                      </div>
                    </div>

                    <div className="border-t border-dashed border-gray-200 pt-4 space-y-4">
                      <h4 className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider">Cấu hình Nội dung Trang chủ Landing Page</h4>
                      
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Tiêu đề chính Hero Banner</label>
                        <input
                          type="text"
                          required
                          value={configForm.landingHeroTitle}
                          onChange={(e) => setConfigForm({ ...configForm, landingHeroTitle: e.target.value })}
                          placeholder="DOANH NGHIỆP CỦA BẠN ĐANG LÃNG PHÍ BAO NHIÊU CƠ HỘI TĂNG TRƯỞNG?"
                          className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Đoạn văn mô tả tóm tắt Hero Banner</label>
                        <textarea
                          required
                          value={configForm.landingHeroDesc}
                          onChange={(e) => setConfigForm({ ...configForm, landingHeroDesc: e.target.value })}
                          placeholder="Nhận ngay báo cáo đánh giá Marketing 100 điểm bằng AI giúp phát hiện điểm yếu, cơ hội lượng và chiến lược..."
                          rows={3}
                          className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-medium resize-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Footer Text Bản Quyền</label>
                      <input
                        type="text"
                        required
                        value={configForm.footerText}
                        onChange={(e) => setConfigForm({ ...configForm, footerText: e.target.value })}
                        className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                      />
                    </div>

                    {/* QUẢN LÝ ĐỐI TÁC TIN CẬY (PARTNERS) */}
                    <div className="border-t border-gray-150 pt-5 mt-5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-1.5 font-sans">
                        <span>Danh Sách Đối Tác Tin Cậy (Khách Hàng Tiêu Biểu)</span>
                        <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-mono">
                          {configForm.partners?.length || 0} đối tác
                        </span>
                      </h4>
                      <p className="text-[11px] text-gray-500 mb-4 leading-relaxed font-semibold">
                        Quản lý danh sách các doanh nghiệp tiêu biểu hiển thị tại chân trang Landing Page. Bạn có thể thêm tên, tệp logo đính kèm trực tiếp hoặc URL ảnh.
                      </p>

                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {(configForm.partners || []).map((partner: any, idx: number) => (
                          <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-gray-200">
                            {/* Partner Logo and File Upload */}
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="w-10 h-10 bg-white rounded-xl border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                                {partner.logo ? (
                                  <img src={partner.logo} alt={partner.name} className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
                                ) : (
                                  <span className="text-[9px] text-gray-400 font-bold uppercase font-mono">LOGO</span>
                                )}
                              </div>
                              <label className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-2 py-1 rounded-lg text-[10px] cursor-pointer border border-gray-200 flex items-center gap-1 shrink-0 select-none">
                                <Upload className="w-3 h-3 text-slate-500" />
                                <span>Tải ảnh</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        const updated = [...(configForm.partners || [])];
                                        updated[idx] = { ...updated[idx], logo: reader.result as string };
                                        setConfigForm({ ...configForm, partners: updated });
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>
                            </div>

                            {/* Partner Name Input */}
                            <div className="flex-1 w-full min-w-0">
                              <input
                                type="text"
                                value={partner.name}
                                onChange={(e) => {
                                  const updated = [...(configForm.partners || [])];
                                  updated[idx] = { ...updated[idx], name: e.target.value };
                                  setConfigForm({ ...configForm, partners: updated });
                                }}
                                placeholder="Tên đối tác hoặc doanh nghiệp..."
                                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-semibold text-slate-705"
                              />
                            </div>

                            {/* Logo URL Input (optional text representation) */}
                            <div className="w-full sm:w-[200px]">
                              <input
                                type="text"
                                value={partner.logo || ""}
                                onChange={(e) => {
                                  const updated = [...(configForm.partners || [])];
                                  updated[idx] = { ...updated[idx], logo: e.target.value };
                                  setConfigForm({ ...configForm, partners: updated });
                                }}
                                placeholder="Đường dẫn Logo URL..."
                                className="w-full bg-white border border-gray-200 rounded-xl px-2 py-1.5 text-[10px] font-mono outline-none focus:ring-2 focus:ring-indigo-100"
                              />
                            </div>

                            {/* Action Button: Remove partner */}
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (configForm.partners || []).filter((_: any, pIdx: number) => pIdx !== idx);
                                setConfigForm({ ...configForm, partners: updated });
                              }}
                              className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-750 rounded-xl transition duration-150 self-end sm:self-auto font-bold shrink-0"
                              title="Xóa đối tác này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}

                        {/* Add new partner button */}
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...(configForm.partners || []), { name: "", logo: "" }];
                            setConfigForm({ ...configForm, partners: updated });
                          }}
                          className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-dashed border-gray-300 rounded-xl flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 font-bold cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm một đối tác mới</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={configSaveStatus === "saving"}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                    >
                      {configSaveStatus === "saving" ? "Đang cập nhật hệ thống..." : "Lưu cấu hình hệ thống"}
                    </button>
                  </div>

                </form>
              </motion.div>
            )}

            {/* ======================= TAB: SYSTEM EVENT LOGS (Module 8) ======================= */}
            {activeTab === "logs" && (
              <motion.div
                key="logs-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-3xl border border-gray-200/60 shadow-xs p-4 sm:p-6 space-y-4"
              >
                <div>
                  <h3 className="font-extrabold text-gray-900 text-sm">Nhật ký Hoạt động Hệ thống (System Event Logs)</h3>
                  <p className="text-[10px] text-gray-400">Ghi nhận toàn quyền thời gian thực tất cả lượt đăng nhập, thao tác cấu hình, chỉnh sửa dữ liệu và phát tác email SMTP.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-slate-400 uppercase text-[9px] font-bold tracking-widest">
                        <th className="py-2.5 px-3">Thời gian</th>
                        <th className="py-2.5 px-3">Tác nhân</th>
                        <th className="py-2.5 px-3">Hành động</th>
                        <th className="py-2.5 px-3">Chi tiết nghiệp vụ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-slate-700">
                      {filteredLogs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-mono text-[10px] text-gray-400">
                            {log.date}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-slate-800 font-mono">{log.user}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 max-w-sm break-words leading-relaxed text-[11px]">
                            {log.detail}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* ======================= TAB: CUSTOMER PORTAL - SURVEYS (my-surveys) ======================= */}
            {activeTab === "my-surveys" && isCustomer && (
              <motion.div
                key="my-surveys-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="bg-white p-6 rounded-3xl border border-gray-200/60 shadow-xs">
                  <h3 className="font-extrabold text-gray-900 text-base">Lịch sử đánh giá Hiệu năng & Vận hành Doanh nghiệp</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Xem chi tiết các báo cáo chẩn đoán chiến lược hỗ trợ tối ưu nguồn lực và nâng cao toàn diện hiệu quả hoạt động kinh doanh.</p>
                </div>

                {mySurveyHistory.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-gray-200/60 shadow-xs p-12 text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                      <FileSpreadsheet className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-800">Doanh nghiệp chưa hoàn thành bài test nào</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">Vui lòng quay lại màn hình chính của website để hoàn tất bài khảo sát tự động cùng trợ lý AI của Toluck.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                    {/* Left Column: List of surveys */}
                    <div className="lg:col-span-1 bg-white p-4 rounded-3xl border border-gray-200/60 shadow-xs space-y-3">
                      <div className="text-[10px] font-black tracking-wider text-slate-400 uppercase px-1">Lượt khảo sát ({mySurveyHistory.length})</div>
                      <div className="space-y-2">
                        {mySurveyHistory.map((historyItem: any, idx: number) => {
                          const isSelected = currentSurveyItem?.id === historyItem.id;
                          const showDate = new Date(historyItem.date).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric"
                          });
                          const score = historyItem.reportData?.readinessScore || 50;
                          return (
                            <button
                              key={historyItem.id}
                              onClick={() => setSelectedHistorySurvey(historyItem)}
                              className={`w-full text-left p-3.5 rounded-2xl border text-xs transition-all cursor-pointer block ${
                                isSelected 
                                  ? "bg-indigo-50 border-indigo-200 text-indigo-900 shadow-xs font-bold" 
                                  : "border-gray-100 hover:bg-slate-50 text-slate-600 bg-white"
                              }`}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase ${
                                  isSelected ? "bg-indigo-200/60 text-indigo-800" : "bg-slate-100 text-slate-500"
                                }`}>
                                  Lượt #{mySurveyHistory.length - idx}
                                </span>
                                <span className="text-[10px] font-mono text-gray-400">{showDate}</span>
                              </div>
                              <div className="font-semibold truncate text-slate-800 mb-1">{historyItem.surveyData?.company_name || "Doanh nghiệp"}</div>
                              <div className="text-[11px] text-gray-500 flex items-center justify-between">
                                <span>Điểm số: <b className="text-indigo-600 font-mono font-bold">{score}</b>/100</span>
                                <span className="font-extrabold text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">Hạng {historyItem.reportData?.maturityGrade || "C"}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right Column: Detail Report Viewer */}
                    <div className="lg:col-span-3 space-y-6">
                      {currentSurveyItem && (
                        <div className="bg-white rounded-3xl border border-gray-200/60 p-6 sm:p-8 shadow-xs space-y-8">
                          
                          {/* Segment Header */}
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-gray-100 gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-lg font-black text-gray-900">Chi tiết Báo cáo Đo lường Hiệu năng & Vận hành</h4>
                                <span className="bg-indigo-100 text-indigo-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">Hệ thống Verified</span>
                              </div>
                              <p className="text-xs text-gray-400 mt-1">Lượt chẩn đoán hoàn tất lúc: <span className="font-mono font-medium">{new Date(currentSurveyItem.date).toLocaleString("vi-VN")}</span></p>
                            </div>

                            {/* Client CTAs */}
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <button
                                onClick={() => {
                                  window.print();
                                }}
                                className="px-4 py-2 hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-gray-700 cursor-pointer w-full sm:w-auto"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>In Báo cáo (PDF)</span>
                              </button>
                            </div>
                          </div>

                          {/* 1. Readiness Dial & Status Card */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-indigo-900 text-white rounded-3xl p-6 sm:p-8">
                            <div className="md:col-span-1 text-center space-y-2">
                              <div className="relative inline-flex items-center justify-center">
                                {/* SVG Ring Gauge background */}
                                <svg className="w-32 h-32 transform -rotate-90">
                                  <circle cx="64" cy="64" r="50" strokeWidth="8" stroke="rgba(255,255,255,0.1)" fill="transparent" />
                                  <circle 
                                    cx="64" cy="64" r="50" strokeWidth="8" stroke="#38bdf8" fill="transparent"
                                    strokeDasharray="314.16"
                                    strokeDashoffset={314.16 - (314.16 * (currentSurveyItem.reportData?.readinessScore || 50)) / 100}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute text-center">
                                  <span className="text-3xl font-black font-mono">{currentSurveyItem.reportData?.readinessScore || 50}</span>
                                  <span className="text-[10px] block opacity-70 font-bold uppercase tracking-wider">/ 100 Điểm</span>
                                </div>
                              </div>
                              <div className="text-[10px] font-black tracking-widest uppercase opacity-70 mt-2 font-mono">ĐIỂM SẴN SÀNG</div>
                            </div>

                            <div className="md:col-span-2 space-y-3">
                              <span className="bg-sky-500/20 text-sky-200 text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full border border-sky-400/20 font-mono">XẾP HẠNG DOANH NGHIỆP</span>
                              <h2 className="text-xl font-black tracking-tight leading-none">Mức độ chín muồi Quản trị & Vận hành Chuyển đổi số: <span className="text-sky-300 font-mono text-3xl ml-1">{currentSurveyItem.reportData?.maturityGrade || "C"}</span></h2>
                              <p className="text-xs text-indigo-100 leading-relaxed font-semibold">Báo cáo đánh giá hạ tầng quản lý, năng lực số hóa quy trình vận hành nội bộ, chiến lược tiếp cận thị trường và phương án tối ưu dòng tài chính.</p>
                            </div>
                          </div>

                          {/* 2. Consultant Opinion Quote */}
                          {currentSurveyItem.reportData?.consultantOpinion && (
                            <div className="bg-slate-50 border-l-4 border-indigo-600 rounded-r-3xl p-5 italic text-slate-700 text-xs leading-relaxed font-medium relative">
                              <span className="absolute top-2 right-4 text-gray-200 text-5xl font-serif select-none pointer-events-none">“</span>
                              <div className="font-bold text-[10px] tracking-wider uppercase text-indigo-600 not-italic mb-1">KIẾN NGHỊ TỪ CHUYÊN GIA AI</div>
                              "{currentSurveyItem.reportData.consultantOpinion}"
                            </div>
                          )}

                          {/* 3. SWOT Matrix Segment */}
                          {currentSurveyItem.reportData?.swotAnalysis && (
                            <div className="space-y-4 border-t border-gray-155 border-gray-100 pt-6">
                              <h4 className="font-extrabold text-xs text-gray-400 uppercase tracking-widest">Ma trận phân tích chiến lược SWOT</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl">
                                  <div className="flex items-center gap-2 mb-2 font-bold text-xs text-emerald-800">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span>ĐIỂM MẠNH (STRENGTHS)</span>
                                  </div>
                                  <ul className="space-y-1.5 list-disc pl-4 text-slate-600 text-[11px] font-medium">
                                    {(currentSurveyItem.reportData.swotAnalysis.strengths || []).map((s: string, idx: number) => (
                                      <li key={idx} className="leading-relaxed">{s}</li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-2xl">
                                  <div className="flex items-center gap-2 mb-2 font-bold text-xs text-rose-800">
                                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                                    <span>ĐIỂM YẾU (WEAKNESSES)</span>
                                  </div>
                                  <ul className="space-y-1.5 list-disc pl-4 text-slate-600 text-[11px] font-medium">
                                    {(currentSurveyItem.reportData.swotAnalysis.weaknesses || []).map((w: string, idx: number) => (
                                      <li key={idx} className="leading-relaxed">{w}</li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="bg-sky-50/50 border border-sky-100 p-4 rounded-2xl">
                                  <div className="flex items-center gap-2 mb-2 font-bold text-xs text-sky-800">
                                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                                    <span>CƠ HỘI (OPPORTUNITIES)</span>
                                  </div>
                                  <ul className="space-y-1.5 list-disc pl-4 text-slate-600 text-[11px] font-medium">
                                    {(currentSurveyItem.reportData.swotAnalysis.opportunities || []).map((o: string, idx: number) => (
                                      <li key={idx} className="leading-relaxed">{o}</li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl">
                                  <div className="flex items-center gap-2 mb-2 font-bold text-xs text-amber-800">
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                    <span>THÁCH THỨC (THREATS)</span>
                                  </div>
                                  <ul className="space-y-1.5 list-disc pl-4 text-slate-600 text-[11px] font-medium">
                                    {(currentSurveyItem.reportData.swotAnalysis.threats || []).map((t: string, idx: number) => (
                                      <li key={idx} className="leading-relaxed">{t}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 4. Score Breakdown progress bars */}
                          {currentSurveyItem.reportData?.scoreBreakdown && (
                            <div className="space-y-4 pt-6 border-t border-gray-100">
                              <h4 className="font-extrabold text-xs text-gray-400 uppercase tracking-widest font-sans">Đánh giá trọng điểm hạ tầng kỹ thuật</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {Object.entries(currentSurveyItem.reportData.scoreBreakdown).map(([key, val]: [string, any]) => {
                                  const labelMap: any = {
                                    infrastructure: "Nền tảng hạ tầng số & Tracking",
                                    budget: "Ngân sách & Quản trị tài chính",
                                    strategy: "Kế hoạch chiến lược & Nhân sự",
                                    branding: "Định vị đại chúng & Điểm chạm thương hiệu"
                                  };
                                  return (
                                    <div key={key} className="space-y-2 bg-slate-50/50 border border-slate-100 p-4 rounded-2xl text-xs font-sans">
                                      <div className="flex justify-between items-center text-[11px] font-semibold text-slate-700">
                                        <span>{labelMap[key] || key}</span>
                                        <span className="font-bold font-mono text-indigo-600">{val}%</span>
                                      </div>
                                      <div className="w-full bg-slate-200/60 rounded-full h-1.5">
                                        <div 
                                          className="bg-indigo-600 h-1.5 rounded-full transition-all duration-1000" 
                                          style={{ width: `${val}%` }} 
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* 5. Channel Strategy Segment */}
                          {currentSurveyItem.reportData?.channelStrategy && (
                            <div className="space-y-4 pt-6 border-t border-gray-100">
                              <h4 className="font-extrabold text-xs text-gray-400 uppercase tracking-widest font-sans">Phương án phát triển kênh phân phối & điểm chạm khách hàng</h4>
                              <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                                <table className="w-full text-xs text-left">
                                  <thead>
                                    <tr className="bg-slate-50 text-slate-500 border-b border-gray-100 font-bold uppercase text-[9px] tracking-wider">
                                      <th className="py-2.5 px-4">Kênh phân bổ / Đối tác</th>
                                      <th className="py-2.5 px-4">Độ ưu tiên</th>
                                      <th className="py-2.5 px-4">Hành động then chốt</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100/60 font-medium text-slate-700">
                                    {(currentSurveyItem.reportData.channelStrategy || []).map((chan: any, idx: number) => (
                                      <tr key={idx} className="hover:bg-slate-50/40">
                                        <td className="py-3 px-4 font-bold text-slate-800">{chan.channelName}</td>
                                        <td className="py-3 px-4">
                                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-wide uppercase ${
                                            chan.priority === "Cao" ? "bg-red-50 text-red-700 border border-red-100" :
                                            chan.priority === "Trung bình" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                                            "bg-blue-50 text-blue-700 border border-blue-100"
                                          }`}>
                                            {chan.priority}
                                          </span>
                                        </td>
                                        <td className="py-3 px-4 text-slate-500 leading-relaxed text-[11px] font-medium">{chan.actionRequired}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* 6. Recommendations Checklist */}
                          {currentSurveyItem.reportData?.recommendations && (
                            <div className="space-y-4 pt-6 border-t border-gray-100">
                              <h4 className="font-extrabold text-xs text-gray-400 uppercase tracking-widest font-sans">Danh mục hành động ưu tiên khuyên dùng</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {(currentSurveyItem.reportData.recommendations || []).map((rec: string, idx: number) => (
                                  <div key={idx} className="flex items-start gap-2.5 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                    <span className="p-1 rounded-full bg-green-50 text-green-600 shrink-0 mt-0.5">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    </span>
                                    <span className="text-slate-700 text-[11px] leading-relaxed font-semibold">{rec}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ======================= TAB: CUSTOMER PORTAL - PROFILE & SECURITY (my-profile) ======================= */}
            {activeTab === "my-profile" && isCustomer && (
              <motion.div
                key="my-profile-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start"
              >
                {/* Section A: Update Personal Info */}
                <div className="bg-white rounded-3xl border border-gray-200/60 shadow-xs p-6 sm:p-8 space-y-6">
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-sm">Hồ sơ thông tin cá nhân</h3>
                    <p className="text-[10px] text-gray-400">Thay đổi thông tin liên lạc chính xác để phục vụ quá trình gửi thư báo cáo chiến lược marketing.</p>
                  </div>

                  {profileStatus.error && (
                    <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 font-medium">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{profileStatus.error}</span>
                    </div>
                  )}

                  {profileStatus.success && (
                    <div className="p-3 rounded-xl bg-green-50 text-green-700 text-xs flex items-center gap-2 font-medium">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>{profileStatus.success}</span>
                    </div>
                  )}

                  <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs font-sans">
                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-500">Tài khoản Email (KHÔNG THỂ THAY ĐỔI)</label>
                      <input 
                        type="email" 
                        value={currentUser?.email || ""} 
                        disabled 
                        className="w-full p-2.5 rounded-xl border border-gray-150 bg-gray-50 text-gray-400 outline-none font-semibold cursor-not-allowed font-sans"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-750 text-gray-700">Họ và tên khách hàng <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        value={profileForm.name} 
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        placeholder="Nguyễn Văn A"
                        className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500/20 font-semibold text-slate-800 bg-white"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-750 text-gray-700">Số điện thoại liên lạc</label>
                      <input 
                        type="text" 
                        value={profileForm.phone} 
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="09xx xxx xxx"
                        className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500/20 font-semibold text-slate-800 bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={profileStatus.isSaving}
                      className="w-full p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 cursor-pointer text-xs"
                    >
                      {profileStatus.isSaving ? "Đang lưu thay đổi..." : "Lưu hồ sơ cá nhân"}
                    </button>
                  </form>
                </div>

                {/* Section B: Update Security/Password */}
                <div className="bg-white rounded-3xl border border-gray-200/60 shadow-xs p-6 sm:p-8 space-y-6">
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-sm">Thiết lập bảo mật & Đổi mật khẩu</h3>
                    <p className="text-[10px] text-gray-400">Thay đổi mật khẩu đăng nhập định kỳ để tối ưu hóa an toàn bảo mật thông tin nội bộ của doanh nghiệp.</p>
                  </div>

                  {changePassStatus.error && (
                    <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 font-medium">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{changePassStatus.error}</span>
                    </div>
                  )}

                  {changePassStatus.success && (
                    <div className="p-3 rounded-xl bg-green-50 text-green-700 text-xs flex items-center gap-2 font-medium">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>{changePassStatus.success}</span>
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-4 text-xs font-sans">
                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-750 text-gray-700">Mật khẩu hiện tại <span className="text-red-500">*</span></label>
                      <input 
                        type="password" 
                        value={changePassForm.oldPassword} 
                        onChange={(e) => setChangePassForm({ ...changePassForm, oldPassword: e.target.value })}
                        placeholder="••••••••"
                        className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500/20 font-semibold bg-white"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-750 text-gray-700">Mật khẩu mới <span className="text-red-500">*</span></label>
                      <input 
                        type="password" 
                        value={changePassForm.newPassword} 
                        onChange={(e) => setChangePassForm({ ...changePassForm, newPassword: e.target.value })}
                        placeholder="Mật khẩu tối thiểu 6 ký tự"
                        className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500/20 font-semibold bg-white"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all cursor-pointer text-xs"
                    >
                      Cập nhật mật khẩu mới
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>


      {/* ======================= GLOBAL INTERFACES/MODALS ======================= */}
      {/* 1. Modals: Edit/Add User */}
      <AnimatePresence>
        {showUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ transform: "scale(0.95)", opacity: 0 }}
              animate={{ transform: "scale(1)", opacity: 1 }}
              exit={{ transform: "scale(0.95)", opacity: 0 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-2xl p-6 max-w-md w-full space-y-4"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-black text-gray-900 text-sm flex items-center gap-1.5 uppercase">
                  <User className="w-5 h-5 text-indigo-600" />
                  <span>{userForm.isEdit ? "Cấu hình Quota tài khoản" : "Khởi tạo cộng tác viên mới"}</span>
                </h3>
                <button onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-gray-600 font-mono text-sm leading-none">✕</button>
              </div>

              <form onSubmit={saveUser} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">Email hòm thư (Tài khóa)</label>
                  <input
                    type="email"
                    required
                    disabled={userForm.isEdit}
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-100 font-mono disabled:opacity-60"
                    placeholder="account@toluck.vn"
                  />
                </div>

                {!userForm.isEdit && (
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">Mật khẩu ban đầu</label>
                    <input
                      type="password"
                      required
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-100 font-mono"
                      placeholder="••••••••"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">Họ tên đầy đủ</label>
                  <input
                    type="text"
                    required
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 outline-none"
                    placeholder="Hùng Trần"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">Vai trò hệ thống</label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                      className="w-full border border-gray-200 bg-white rounded-xl px-2.5 py-1.5 text-xs font-semibold"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="CEO">CEO</option>
                      <option value="GIÁM ĐỐC KINH DOANH NHƯỢNG QUYỀN">GĐ NHƯỢNG QUYỀN</option>
                      <option value="NHÂN VIÊN">NHÂN VIÊN</option>
                      <option value="KHÁCH HÀNG">KHÁCH HÀNG</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">Chi nhánh quản lý</label>
                    <select
                      value={userForm.branch}
                      onChange={(e) => setUserForm({ ...userForm, branch: e.target.value })}
                      className="w-full border border-gray-200 bg-white rounded-xl px-2.5 py-1.5 text-xs"
                    >
                      <option value="Hà Nội">Hà Nội</option>
                      <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                      <option value="Tổng bộ TOLUCK">Tổng bộ TOLUCK</option>
                      <option value="Khách vãng lai">Khách vãng lai</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1 font-mono">Hình đại diện (URL hoặc tải trực tiếp)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userForm.avatar || ""}
                      onChange={(e) => setUserForm({ ...userForm, avatar: e.target.value })}
                      className="flex-1 bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-100"
                      placeholder="https://images.unsplash.com/photo-..."
                    />
                    <label className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-2 rounded-xl text-xs cursor-pointer border border-indigo-100 flex items-center justify-center gap-1 shrink-0 whitespace-nowrap">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Chọn ảnh</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setUserForm({ ...userForm, avatar: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  {userForm.avatar && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">Xem trước Avatar:</span>
                      <img src={userForm.avatar} alt="Preview Avatar" className="w-8 h-8 rounded-full border border-gray-200 object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1 font-mono">Điện thoại liên lạc</label>
                  <input
                    type="text"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 outline-none"
                    placeholder="09..."
                  />
                </div>

                {/* Quotas limiting sub-panel (Module 2 requirements) */}
                <div className="space-y-3 p-3 bg-slate-50 rounded-2xl border border-gray-100">
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Cấu hình giới hạn Quota tài khoản</span>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] text-gray-500 mb-0.5">Số khảo sát/ngày</label>
                      <input
                        type="number"
                        min={1}
                        value={userForm.limits.surveys}
                        onChange={(e) => setUserForm({ ...userForm, limits: { ...userForm.limits, surveys: parseInt(e.target.value) || 5 } })}
                        className="w-full border border-gray-200 bg-white px-2 py-1 rounded text-center font-bold font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 mb-0.5">Số AI Audits/ngày</label>
                      <input
                        type="number"
                        min={1}
                        value={userForm.limits.aiAudits}
                        onChange={(e) => setUserForm({ ...userForm, limits: { ...userForm.limits, aiAudits: parseInt(e.target.value) || 5 } })}
                        className="w-full border border-gray-200 bg-white px-2 py-1 rounded text-center font-bold font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 mb-0.5">Số CRM quản lý</label>
                      <input
                        type="number"
                        min={1}
                        value={userForm.limits.crms}
                        onChange={(e) => setUserForm({ ...userForm, limits: { ...userForm.limits, crms: parseInt(e.target.value) || 20 } })}
                        className="w-full border border-gray-200 bg-white px-2 py-1 rounded text-center font-bold font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] text-gray-500 mb-0.5">Thời hạn tài khoản (Y-M-D)</label>
                    <input
                      type="text"
                      placeholder="2026-12-31"
                      value={userForm.limits.expDate}
                      onChange={(e) => setUserForm({ ...userForm, limits: { ...userForm.limits, expDate: e.target.value } })}
                      className="w-full border border-gray-200 bg-white px-3 py-1 rounded text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowUserModal(false)}
                    className="px-4 py-2 hover:bg-gray-100 text-gray-500 rounded-xl font-bold font-mono"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
                  >
                    Xác nhận
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Modals: Edit/Add Survey */}
      <AnimatePresence>
        {showSurveyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ transform: "scale(0.95)", opacity: 0 }}
              animate={{ transform: "scale(1)", opacity: 1 }}
              exit={{ transform: "scale(0.95)", opacity: 0 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-2xl p-6 max-w-lg w-full space-y-4"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-black text-gray-900 text-sm flex items-center gap-1.5 uppercase">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <span>{surveyForm.isEdit ? "Cập nhật biểu mẫu khảo sát" : "Khởi tạo biểu mẫu khảo sát mới"}</span>
                </h3>
                <button onClick={() => setShowSurveyModal(false)} className="text-gray-400 hover:text-gray-600 font-mono text-sm leading-none">✕</button>
              </div>

              <form onSubmit={saveSurvey} className="space-y-4 text-xs font-medium">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">Tên khảo sát chiến lược</label>
                  <input
                    type="text"
                    required
                    value={surveyForm.name}
                    onChange={(e) => setSurveyForm({ ...surveyForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-100"
                    placeholder="Bản khảo sát marketing B2B chi nhánh..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">Brand theme color (Màu thương hiệu)</label>
                    <input
                      type="text"
                      required
                      value={surveyForm.config.colorTheme}
                      onChange={(e) => setSurveyForm({ ...surveyForm, config: { ...surveyForm.config, colorTheme: e.target.value } })}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 outline-none font-mono"
                      placeholder="#1e3a8a"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">Hòm thư gửi mail SMTP báo cáo</label>
                    <input
                      type="email"
                      required
                      value={surveyForm.config.emailFrom}
                      onChange={(e) => setSurveyForm({ ...surveyForm, config: { ...surveyForm.config, emailFrom: e.target.value } })}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 outline-none font-mono"
                      placeholder="info@toluck.com.vn"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">Đường dẫn logo đại lý URL</label>
                  <input
                    type="text"
                    required
                    value={surveyForm.config.logo}
                    onChange={(e) => setSurveyForm({ ...surveyForm, config: { ...surveyForm.config, logo: e.target.value } })}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 outline-none font-mono"
                    placeholder="https://toluck.com.vn/logo.png"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">n8n Webhook Url nộp lead (Tự động POST về)</label>
                  <input
                    type="url"
                    required
                    value={surveyForm.config.webhookUrl}
                    onChange={(e) => setSurveyForm({ ...surveyForm, config: { ...surveyForm.config, webhookUrl: e.target.value } })}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 outline-none font-mono"
                    placeholder="https://ai.toluck.com.vn/webhook/phantichkhachhang"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-600 mb-1">Mã lệnh huấn luyện AI (Prompt AI setup riêng của khảo sát)</label>
                  <textarea
                    rows={4}
                    required
                    value={surveyForm.config.promptAi}
                    onChange={(e) => setSurveyForm({ ...surveyForm, config: { ...surveyForm.config, promptAi: e.target.value } })}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-100 text-[11px] leading-relaxed"
                    placeholder="Bạn là cố vấn chiến lược của TOLUCK Agency. Hãy bóc tách dữ liệu điểm đau sau đây..."
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 text-xs font-bold font-mono">
                  <button
                    type="button"
                    onClick={() => setShowSurveyModal(false)}
                    className="px-4 py-2 hover:bg-gray-100 text-gray-500 rounded-xl"
                  >
                    Bỏ Qua
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                  >
                    Lưu Biểu Mẫu
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Modal: Change Password modal */}
      <AnimatePresence>
        {showChangePassModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ transform: "scale(0.95)", opacity: 0 }}
              animate={{ transform: "scale(1)", opacity: 1 }}
              exit={{ transform: "scale(0.95)", opacity: 0 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-2xl p-6 max-w-sm w-full space-y-4"
            >
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-extrabold text-gray-900 text-sm">Đổi mật khẩu người dùng</h3>
                <button onClick={() => setShowChangePassModal(false)} className="text-gray-400 font-mono text-xs">✕</button>
              </div>

              {changePassStatus.error && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-[11px] font-semibold">
                  {changePassStatus.error}
                </div>
              )}

              {changePassStatus.success && (
                <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-700 text-[11px] font-semibold">
                  {changePassStatus.success}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-gray-700 mb-1">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    required
                    value={changePassForm.oldPassword}
                    onChange={(e) => setChangePassForm({ ...changePassForm, oldPassword: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-1">Mật khẩu mới</label>
                  <input
                    type="password"
                    required
                    value={changePassForm.newPassword}
                    onChange={(e) => setChangePassForm({ ...changePassForm, newPassword: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 outline-none font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2 font-mono">
                  <button
                    type="button"
                    onClick={() => setShowChangePassModal(false)}
                    className="px-3 py-1.5 hover:bg-gray-100 text-gray-500 rounded-xl"
                  >
                    Bỏ qua
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                  >
                    Đổi mật khẩu
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

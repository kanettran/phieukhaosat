import React, { useState, useEffect } from "react";
import { 
  Users, UserPlus, Phone, Mail, Calendar, CheckSquare, Plus, Trash2, 
  MessageSquare, FileText, ChevronRight, Sliders, AlertCircle, 
  BarChart2, Award, Zap, Bell, Check, TrendingUp, Building2, Layers
} from "lucide-react";

// Types for our Custom CRM
export interface Interaction {
  id: string;
  date: string;
  type: "Call" | "Email" | "Meeting" | "Chat";
  content: string;
}

export interface Reminder {
  id: string;
  title: string;
  dueDate: string;
  priority: "High" | "Medium" | "Low";
  completed: boolean;
}

export interface Lead {
  id: string;
  contactName: string;
  companyName: string;
  email: string;
  phone: string;
  industry: string;
  employeeCount: string;
  marketingBudget: string;
  hasWebsite: boolean;
  hasPixel: boolean;
  emailOpens: number;
  websiteVisits: number;
  formSubmissions: number;
  interactions: Interaction[];
  reminders: Reminder[];
  createdAt: string;
}

// Initial demo database for immediate realistic high-quality content
const INITIAL_LEADS: Lead[] = [
  {
    id: "lead-1",
    contactName: "Trần Anh Hùng",
    companyName: "Công ty Cổ phần Thực phẩm An Nam",
    email: "hung.tran@annamfood.vn",
    phone: "0912345678",
    industry: "F&B / Thực phẩm",
    employeeCount: "50 - 200 người",
    marketingBudget: "20-50 triệu",
    hasWebsite: true,
    hasPixel: true,
    emailOpens: 4,
    websiteVisits: 12,
    formSubmissions: 1,
    createdAt: "2026-06-01",
    interactions: [
      { id: "i1", date: "2026-06-02", type: "Call", content: "Tư vấn sơ bộ về gói phòng Marketing thuê ngoài. Khách hàng cực kỳ quan tâm đến tối ưu quảng cáo Facebook Ads." },
      { id: "i2", date: "2026-06-02", type: "Email", content: "Đã gửi báo đề xuất dịch vụ sơ bộ và SWOT phân tích đối thủ cạnh tranh." }
    ],
    reminders: [
      { id: "r1", title: "Gọi lại chốt lịch hẹn ký hợp đồng", dueDate: "2026-06-05", priority: "High", completed: false },
      { id: "r2", title: "Gửi báo giá tùy chỉnh chi tiết", dueDate: "2026-06-04", priority: "Medium", completed: true }
    ]
  },
  {
    id: "lead-2",
    contactName: "Nguyễn Thị Mai",
    companyName: "Học viện Thẩm mỹ Maya",
    email: "mai.nguyen@mayabeauty.edu.vn",
    phone: "0987654321",
    industry: "Làm đẹp / Giáo dục",
    employeeCount: "10 - 50 người",
    marketingBudget: "10-20 triệu",
    hasWebsite: true,
    hasPixel: false,
    emailOpens: 1,
    websiteVisits: 3,
    formSubmissions: 1,
    createdAt: "2026-06-02",
    interactions: [
      { id: "i3", date: "2026-06-03", type: "Chat", content: "Khách hỏi qua tư vấn fanpage về chính sách cam kết doanh số KPI của TOLUCK." }
    ],
    reminders: [
      { id: "r3", title: "Gỡ khó về hạ tầng Google Analytics 4", dueDate: "2026-06-06", priority: "Low", completed: false }
    ]
  },
  {
    id: "lead-3",
    contactName: "Phạm Minh Đức",
    companyName: "Chuỗi phân phối Gia Dụng Star",
    email: "duc.pham@giadungstar.com",
    phone: "0905667788",
    industry: "Bán lẻ / Điện máy",
    employeeCount: "Dưới 10 người",
    marketingBudget: "3-5 triệu",
    hasWebsite: false,
    hasPixel: false,
    emailOpens: 0,
    websiteVisits: 1,
    formSubmissions: 1,
    createdAt: "2026-06-03",
    interactions: [],
    reminders: []
  }
];

export function calculateLeadScore(lead: Lead) {
  let score = 0;

  // 1. Demographics & Context (Max 45 points)
  // Company Size
  if (lead.employeeCount.includes("Trên 200")) score += 15;
  else if (lead.employeeCount.includes("50 - 200")) score += 10;
  else if (lead.employeeCount.includes("10 - 50")) score += 5;
  else score += 2;

  // Budget
  if (lead.marketingBudget === "Trên 50 triệu") score += 15;
  else if (lead.marketingBudget === "20-50 triệu") score += 12;
  else if (lead.marketingBudget === "10-20 triệu") score += 8;
  else if (lead.marketingBudget === "5-10 triệu") score += 5;
  else score += 2;

  // Tech Assets
  if (lead.hasWebsite) score += 8;
  if (lead.hasPixel) score += 7;

  // 2. Engagement score (Max 55 points)
  // Form submission
  if (lead.formSubmissions > 0) score += 20;

  // Website visits
  score += Math.min(15, lead.websiteVisits * 3);

  // Email opens
  score += Math.min(10, lead.emailOpens * 2.5);

  // Active interaction logs (answering calls, messages)
  score += Math.min(10, lead.interactions.length * 5);

  const finalScore = Math.min(100, score);
  
  // Decide temperature
  let temp: "Hot" | "Warm" | "Cold" = "Cold";
  if (finalScore >= 70) temp = "Hot";
  else if (finalScore >= 40) temp = "Warm";

  return { score: finalScore, temp };
}

interface CrmPanelProps {
  onAddContact?: (lead: Lead) => void;
  surveyData: any;
}

export default function CrmPanel({ surveyData }: CrmPanelProps) {
  const [leads, setLeads] = useState<Lead[]>(() => {
    const local = localStorage.getItem("toluck_crm_leads");
    return local ? JSON.parse(local) : INITIAL_LEADS;
  });

  const [selectedLeadId, setSelectedLeadId] = useState<string>(leads[0]?.id || "");
  const [activeTab, setActiveTab] = useState<"details" | "interactions" | "reminders" | "scoring">("details");

  // Interaction Form State
  const [newLogType, setNewLogType] = useState<"Call" | "Email" | "Meeting" | "Chat">("Call");
  const [newLogContent, setNewLogContent] = useState("");

  // Reminder Form State
  const [newReminderTitle, setNewReminderTitle] = useState("");
  const [newReminderDate, setNewReminderDate] = useState("");
  const [newReminderPriority, setNewReminderPriority] = useState<"High" | "Medium" | "Low">("Medium");

  // Add Contact manual state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState("");
  const [addCompany, setAddCompany] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addIndustry, setAddIndustry] = useState("");
  const [addEmployees, setAddEmployees] = useState("10 - 50 người");
  const [addBudget, setAddBudget] = useState("10-20 triệu");
  const [addHasWebsite, setAddHasWebsite] = useState(true);
  const [addHasPixel, setAddHasPixel] = useState(false);

  // Auto save leads
  useEffect(() => {
    localStorage.setItem("toluck_crm_leads", JSON.stringify(leads));
  }, [leads]);

  // Handle auto-adding the submitted survey to CRM if available
  useEffect(() => {
    if (surveyData && surveyData.company_name) {
      // Check if lead already exists by email / company
      const exists = leads.some(
        (l) => l.email.toLowerCase() === surveyData.email.toLowerCase() || 
               l.companyName.toLowerCase() === surveyData.company_name.toLowerCase()
      );

      if (!exists) {
        const newLead: Lead = {
          id: `survey-lead-${Date.now()}`,
          contactName: surveyData.contact_name || "Khách Hàng Khảo Sát",
          companyName: surveyData.company_name,
          email: surveyData.email,
          phone: surveyData.phone,
          industry: surveyData.industry || "Chưa phân loại",
          employeeCount: surveyData.employee_count || "10 - 50 người",
          marketingBudget: surveyData.marketing_budget || "10-20 triệu",
          hasWebsite: surveyData.digital_assets?.includes("Website") || false,
          hasPixel: surveyData.tracking_tools?.includes("Facebook Pixel") || false,
          emailOpens: 1,
          websiteVisits: 2,
          formSubmissions: 1,
          createdAt: new Date().toISOString().split('T')[0],
          interactions: [
            {
              id: `i-init-${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              type: "Chat",
              content: `Hoàn thành cuộc khảo sát nhu cầu phòng Marketing thuê ngoài TOLUCK. Mục tiêu: ${surveyData.goal}`
            }
          ],
          reminders: [
            {
              id: `r-init-${Date.now()}`,
              title: `Liên hệ tư vấn phân tích chiến dịch Marketing ${surveyData.company_name}`,
              dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              priority: "High",
              completed: false
            }
          ]
        };

        const updated = [newLead, ...leads];
        setLeads(updated);
        setSelectedLeadId(newLead.id);
      }
    }
  }, [surveyData]);

  const selectedLead = leads.find(l => l.id === selectedLeadId) || leads[0];

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName || !addCompany) return;

    const newLead: Lead = {
      id: `manual-lead-${Date.now()}`,
      contactName: addName,
      companyName: addCompany,
      email: addEmail,
      phone: addPhone,
      industry: addIndustry || "Bán lẻ",
      employeeCount: addEmployees,
      marketingBudget: addBudget,
      hasWebsite: addHasWebsite,
      hasPixel: addHasPixel,
      emailOpens: 0,
      websiteVisits: 1,
      formSubmissions: 0,
      createdAt: new Date().toISOString().split('T')[0],
      interactions: [],
      reminders: []
    };

    setLeads([newLead, ...leads]);
    setSelectedLeadId(newLead.id);
    setShowAddModal(false);

    // Reset fields
    setAddName("");
    setAddCompany("");
    setAddEmail("");
    setAddPhone("");
    setAddIndustry("");
  };

  const handleAddInteraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogContent.trim() || !selectedLead) return;

    const newInt: Interaction = {
      id: `int-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: newLogType,
      content: newLogContent
    };

    const updatedLeads = leads.map(l => {
      if (l.id === selectedLead.id) {
        return {
          ...l,
          interactions: [newInt, ...l.interactions]
        };
      }
      return l;
    });

    setLeads(updatedLeads);
    setNewLogContent("");
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle.trim() || !newReminderDate || !selectedLead) return;

    const newRem: Reminder = {
      id: `rem-${Date.now()}`,
      title: newReminderTitle,
      dueDate: newReminderDate,
      priority: newReminderPriority,
      completed: false
    };

    const updatedLeads = leads.map(l => {
      if (l.id === selectedLead.id) {
        return {
          ...l,
          reminders: [newRem, ...l.reminders]
        };
      }
      return l;
    });

    setLeads(updatedLeads);
    setNewReminderTitle("");
    setNewReminderDate("");
  };

  const toggleReminder = (reminderId: string) => {
    if (!selectedLead) return;
    const updatedLeads = leads.map(l => {
      if (l.id === selectedLead.id) {
        return {
          ...l,
          reminders: l.reminders.map(r => r.id === reminderId ? { ...r, completed: !r.completed } : r)
        };
      }
      return l;
    });
    setLeads(updatedLeads);
  };

  const handleDeleteLead = (idToDelete: string) => {
    if (confirm(`Bạn có chắc muốn xóa liên hệ ${leads.find(l => l.id === idToDelete)?.contactName}?`)) {
      const filtered = leads.filter(l => l.id !== idToDelete);
      setLeads(filtered);
      if (selectedLeadId === idToDelete && filtered.length > 0) {
        setSelectedLeadId(filtered[0].id);
      }
    }
  };

  const incrementEngagement = (type: "opens" | "visits") => {
    if (!selectedLead) return;
    const updatedLeads = leads.map(l => {
      if (l.id === selectedLead.id) {
        return {
          ...l,
          emailOpens: type === "opens" ? l.emailOpens + 1 : l.emailOpens,
          websiteVisits: type === "visits" ? l.websiteVisits + 1 : l.websiteVisits
        };
      }
      return l;
    });
    setLeads(updatedLeads);
  };

  // Summary Metrics
  const hotLeadsCount = leads.filter(l => calculateLeadScore(l).temp === "Hot").length;
  const warmLeadsCount = leads.filter(l => calculateLeadScore(l).temp === "Warm").length;
  const coldLeadsCount = leads.filter(l => calculateLeadScore(l).temp === "Cold").length;

  return (
    <div className="bg-slate-50 min-h-[500px] rounded-2xl border border-slate-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.05)] overflow-hidden font-sans flex flex-col lg:flex-row">
      
      {/* 1. Left Leads Navigation List */}
      <section className="w-full lg:w-80 bg-white border-r border-slate-200 shrink-0 flex flex-col justify-between">
        <div>
          {/* Section header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="flex items-center gap-2 font-bold text-slate-800 text-sm">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Khách hàng & Leads ({leads.length})</span>
            </span>
            <button 
              onClick={() => setShowAddModal(true)}
              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
              title="Thêm khách hàng thủ công"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>

          {/* Search/Filter mini metrics */}
          <div className="p-3 grid grid-cols-3 gap-1 border-b border-indigo-50/50 bg-white text-center text-[11px] font-bold">
            <span className="py-1 px-1.5 rounded bg-rose-50 border border-rose-100/80 text-rose-700">Hot ({hotLeadsCount})</span>
            <span className="py-1 px-1.5 rounded bg-amber-50 border border-amber-100/80 text-amber-700">Warm ({warmLeadsCount})</span>
            <span className="py-1 px-1.5 rounded bg-blue-50 border border-blue-100/80 text-blue-700">Cold ({coldLeadsCount})</span>
          </div>

          {/* Scrollable list */}
          <div className="overflow-y-auto max-h-[480px] divide-y divide-slate-100">
            {leads.length === 0 ? (
              <p className="p-6 text-xs text-slate-400 text-center italic">Chưa có liên hệ nào trong hệ thống</p>
            ) : (
              leads.map((l) => {
                const { score, temp } = calculateLeadScore(l);
                const isSelected = l.id === selectedLeadId;
                const badgeColor = 
                  temp === "Hot" ? "bg-rose-50 text-rose-700 border-rose-200" :
                  temp === "Warm" ? "bg-amber-50 text-amber-600 border-amber-200" :
                  "bg-blue-50 text-blue-600 border-blue-200";

                return (
                  <div 
                    key={l.id}
                    onClick={() => setSelectedLeadId(l.id)}
                    className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-all flex justify-between items-start gap-2 ${
                      isSelected ? "bg-slate-50 border-l-4 border-blue-600" : ""
                    }`}
                  >
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">{l.contactName}</h4>
                      <p className="text-[11px] text-slate-500 font-medium truncate max-w-[170px]">{l.companyName}</p>
                      <div className="flex gap-2 items-center text-[10px] text-slate-400 font-semibold font-mono">
                        <span>Score: <b className="text-slate-700">{score} pts</b></span>
                        <span className={`px-1.5 py-0.5 rounded border ${badgeColor}`}>{temp}</span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLead(l.id);
                      }}
                      className="p-1 hover:bg-rose-50 text-slate-350 hover:text-rose-600 rounded transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="p-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
          <span>Hệ thống CRM Hoạt Động</span>
          <span className="flex items-center gap-1 text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Tự Động Điểm Tin</span>
          </span>
        </div>
      </section>

      {/* 2. Right Contact Workspace */}
      {selectedLead ? (
        <main className="flex-1 bg-white p-6 flex flex-col justify-between">
          <div className="space-y-6">
            
            {/* Lead Title Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900">{selectedLead.contactName}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    calculateLeadScore(selectedLead).temp === "Hot" ? "bg-rose-50 text-rose-600 border-rose-200" :
                    calculateLeadScore(selectedLead).temp === "Warm" ? "bg-amber-50 text-amber-600 border-amber-200" :
                    "bg-blue-50 text-blue-600 border-blue-250"
                  }`}>
                    {calculateLeadScore(selectedLead).temp} Lead ({calculateLeadScore(selectedLead).score} pts)
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-normal flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{selectedLead.companyName} &mdash; <b>{selectedLead.industry}</b></span>
                </p>
              </div>

              {/* Engagement metrics fast adjusters */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 p-2 rounded-xl text-xs">
                <span className="font-bold text-slate-500 mr-2 text-[11px] uppercase tracking-wider">Hành trình:</span>
                <button
                  onClick={() => incrementEngagement("opens")}
                  className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 cursor-pointer transition-colors"
                  title="Mở mail tăng điểm tương tác"
                >
                  Mở Email ({selectedLead.emailOpens})
                </button>
                <button
                  onClick={() => incrementEngagement("visits")}
                  className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 cursor-pointer transition-colors"
                  title="Xem web chính tăng điểm tương tác"
                >
                  Xem Web ({selectedLead.websiteVisits})
                </button>
              </div>
            </div>

            {/* Sub-tab selection menu */}
            <div className="flex border-b border-slate-100 overflow-x-auto gap-1">
              {[
                { id: "details", label: "Hồ sơ chi tiết", icon: FileText },
                { id: "scoring", label: "Bộ chỉ số Lead Scoring", icon: Sliders },
                { id: "interactions", label: "Lịch sử cuộc gọi & chăm sóc", icon: Phone },
                { id: "reminders", label: "Nhắc nhở công việc", icon: CheckSquare }
              ].map((t) => {
                const IsActive = activeTab === t.id;
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`py-2 px-3.5 rounded-t-xl text-xs font-semibold flex items-center gap-1.5 border-t border-x -mb-[1px] transition-all cursor-pointer ${
                      IsActive 
                        ? "bg-white border-slate-200 text-blue-600 font-bold border-b-white z-10" 
                        : "bg-transparent border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT: DETAILS */}
            {activeTab === "details" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="crm-tab-details">
                {/* Contact metrics */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Thông tin liên hệ</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 pb-2 border-b border-slate-100">
                      <span className="text-slate-400">Email:</span>
                      <a href={`mailto:${selectedLead.email}`} className="font-bold text-blue-600 hover:underline">{selectedLead.email}</a>
                    </div>
                    <div className="flex justify-between items-center py-1 pb-2 border-b border-slate-100">
                      <span className="text-slate-400">Số điện thoại:</span>
                      <a href={`tel:${selectedLead.phone}`} className="font-bold text-slate-700">{selectedLead.phone}</a>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-400">Nguồn khách:</span>
                      <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">TOLUCK Biểu mẫu</span>
                    </div>
                  </div>
                </div>

                {/* Company specifications */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Thông số doanh nghiệp</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 pb-2 border-b border-slate-100">
                      <span className="text-slate-400">Quy mô nhân lực:</span>
                      <span className="font-bold text-slate-800">{selectedLead.employeeCount}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 pb-2 border-b border-slate-100">
                      <span className="text-slate-400">Ngân sách Marketing:</span>
                      <span className="font-bold text-blue-600">{selectedLead.marketingBudget}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-400">Tài sản hiện có:</span>
                      <span className="font-bold text-slate-700">
                        {selectedLead.hasWebsite ? "Đã có Website" : "Chưa có Web"} • {selectedLead.hasPixel ? "Có Pixel" : "Thiếu Pixel"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: LEAD SCORING EXPLANATION */}
            {activeTab === "scoring" && (
              <div className="space-y-4" id="crm-tab-scoring">
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-800 space-y-1">
                    <p className="font-bold">Hệ thống tính điểm tự động (Lead Scoring Engine):</p>
                    <p className="leading-relaxed">Tự động cộng dồn điểm nhân khẩu học doanh nghiệp cộng với độ nóng từ tương tác thực tế (Email, Website, Điền biểu mẫu) để xếp loại <b>Hot Lead</b> nhằm ưu tiên gọi chốt khách sớm nhất.</p>
                  </div>
                </div>

                {/* Live Scoring Calculator layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Category 1: Demographics */}
                  <div className="p-4 bg-white border border-slate-200/80 rounded-xl space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        Nhân khẩu (Tối đa 45đ)
                      </span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-600">
                      <li className="flex justify-between items-center">
                        <span>Quy mô nhân sự ({selectedLead.employeeCount}):</span>
                        <span className="font-bold text-slate-800 font-mono">
                          +{selectedLead.employeeCount.includes("Trên 200") ? "15" : selectedLead.employeeCount.includes("50 - 200") ? "10" : "5"} đ
                        </span>
                      </li>
                      <li className="flex justify-between items-center">
                        <span>Ngân sách marketing ({selectedLead.marketingBudget}):</span>
                        <span className="font-bold text-slate-800 font-mono">
                          +{selectedLead.marketingBudget.includes("Trên 50") ? "15" : selectedLead.marketingBudget.includes("20-50") ? "12" : "8"} đ
                        </span>
                      </li>
                      <li className="flex justify-between items-center">
                        <span>Website chuyên nghiệp ({selectedLead.hasWebsite ? "Có" : "Không"}):</span>
                        <span className="font-bold text-slate-800 font-mono">+{selectedLead.hasWebsite ? "8" : "0"} đ</span>
                      </li>
                      <li className="flex justify-between items-center">
                        <span>Mã theo dõi Facebook Pixel ({selectedLead.hasPixel ? "Có" : "Không"}):</span>
                        <span className="font-bold text-slate-800 font-mono">+{selectedLead.hasPixel ? "7" : "0"} đ</span>
                      </li>
                    </ul>
                  </div>

                  {/* Category 2: Engagement */}
                  <div className="p-4 bg-white border border-slate-200/80 rounded-xl space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-slate-400" />
                        Độ nóng Tương tác (Tối đa 55đ)
                      </span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-600">
                      <li className="flex justify-between items-center">
                        <span>Hoàn thành biểu mẫu khảo sát:</span>
                        <span className="font-bold text-emerald-600 font-mono">+{selectedLead.formSubmissions > 0 ? "20" : "0"} đ</span>
                      </li>
                      <li className="flex justify-between items-center">
                        <span>Lưu lượng truy cập Website ({selectedLead.websiteVisits} lần):</span>
                        <span className="font-bold text-slate-800 font-mono">+{Math.min(15, selectedLead.websiteVisits * 3)} đ</span>
                      </li>
                      <li className="flex justify-between items-center">
                        <span>Lượt mở Email đề xuất ({selectedLead.emailOpens} lần):</span>
                        <span className="font-bold text-slate-800 font-mono font-sans">+{Math.min(10, selectedLead.emailOpens * 2.5)} đ</span>
                      </li>
                      <li className="flex justify-between items-center">
                        <span>Lịch sử các lần liên hệ chốt ({selectedLead.interactions.length} lần):</span>
                        <span className="font-bold text-slate-800 font-mono">+{Math.min(10, selectedLead.interactions.length * 5)} đ</span>
                      </li>
                    </ul>
                  </div>

                </div>

                {/* Score representation thresholds banner */}
                <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600">Thang điểm tiêu chuẩn:</span>
                  <div className="flex gap-4 font-semibold text-[11px]">
                    <span className="flex items-center gap-1 text-rose-700">🔴 Hot Lead (≥ 70đ)</span>
                    <span className="flex items-center gap-1 text-amber-600">🟡 Warm Lead (40-69đ)</span>
                    <span className="flex items-center gap-1 text-blue-600">🔵 Cold Lead (&lt; 40đ)</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: INTERACTIONS HISTORY */}
            {activeTab === "interactions" && (
              <div className="space-y-4" id="crm-tab-interactions">
                {/* Form to submit interaction */}
                <form onSubmit={handleAddInteraction} className="bg-slate-50/75 p-4 rounded-xl border border-slate-150 flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Ghi nhận liên hệ mới:</span>
                    <div className="flex gap-1.5 shrink-0">
                      {["Call", "Email", "Meeting", "Chat"].map((ty) => (
                        <button
                          key={ty}
                          type="button"
                          onClick={() => setNewLogType(ty as any)}
                          className={`px-3 py-1 rounded bg-white text-xs font-semibold border cursor-pointer transition-all ${
                            newLogType === ty 
                              ? "border-blue-500 bg-blue-50/50 text-blue-600 font-bold" 
                              : "border-slate-200 text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          {ty}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newLogContent}
                      onChange={(e) => setNewLogContent(e.target.value)}
                      placeholder="Nhập nội dung cuộc gọi hoặc phản hồi từ khách hàng..."
                      required
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 bg-white"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer transition-colors shrink-0"
                    >
                      Lưu nhật ký
                    </button>
                  </div>
                </form>

                {/* Timeline rendering */}
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {selectedLead.interactions.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4">Chưa ghi nhận lịch sử trao đổi</p>
                  ) : (
                    selectedLead.interactions.map((int) => {
                      const interactionIcons = {
                        Call: "📞 Cuộc gọi",
                        Email: "✉️ Email",
                        Meeting: "🤝 Gặp mặt",
                        Chat: "💬 Tin nhắn"
                      };

                      return (
                        <div key={int.id} className="p-3 bg-white border border-slate-100 rounded-lg space-y-1.5 shadow-2xs">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-blue-600 tracking-wider bg-blue-50 px-2 py-0.5 rounded">{interactionIcons[int.type]}</span>
                            <span className="text-slate-400 font-mono">{int.date}</span>
                          </div>
                          <p className="text-xs text-slate-700 font-medium leading-relaxed">{int.content}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: REMINDERS & FOLLOW-UP */}
            {activeTab === "reminders" && (
              <div className="space-y-4" id="crm-tab-reminders">
                {/* Form to log follow-up tasks */}
                <form onSubmit={handleAddReminder} className="bg-slate-50/75 p-4 rounded-xl border border-slate-150 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-slate-500 uppercase font-black mb-1">Nội dung nhắc việc</label>
                    <input
                      type="text"
                      value={newReminderTitle}
                      onChange={(e) => setNewReminderTitle(e.target.value)}
                      placeholder="VD: Gửi đề xuất chiến dịch TikTok Shop..."
                      required
                      className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs focus:outline-none focus:border-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-black mb-1">Hạn hoàn thành</label>
                    <input
                      type="date"
                      value={newReminderDate}
                      onChange={(e) => setNewReminderDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs focus:outline-none focus:border-blue-500 bg-white font-mono"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer transition-colors"
                    >
                      Thống nhất nhắc việc
                    </button>
                  </div>
                </form>

                {/* Task Checklist */}
                <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
                  {selectedLead.reminders.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4">Chưa lập kế hoạch nhắc nhở follow-up</p>
                  ) : (
                    selectedLead.reminders.map((rem) => (
                      <div 
                        key={rem.id} 
                        onClick={() => toggleReminder(rem.id)}
                        className={`p-3 border rounded-lg flex items-center justify-between gap-3 cursor-pointer transition-all ${
                          rem.completed 
                            ? "bg-slate-50/60 border-slate-200 text-slate-400 opacity-75 line-through" 
                            : "bg-white border-slate-150 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                            rem.completed ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-350 bg-white hover:border-blue-500"
                          }`}>
                            {rem.completed && <Check className="w-3 h-3" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 leading-tight">{rem.title}</p>
                            <span className="text-[10px] font-mono text-slate-400 font-semibold">Chốt ngày: {rem.dueDate}</span>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5">
                          Follow-up Task
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
            <span>Quản trị viên: TOLUCK Consultant Team</span>
            <span>Khởi tạo hệ thống: {selectedLead.createdAt}</span>
          </div>
        </main>
      ) : (
        <div className="flex-1 bg-white p-6 flex flex-col items-center justify-center text-slate-400 text-xs italic">
          Vui lòng bấm 'Thêm' để khởi tạo khách hàng mới
        </div>
      )}

      {/* 3. Popup Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg transition-colors"
            >
              ✕
            </button>
            
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <UserPlus className="w-5 h-5 text-blue-600" />
              Khai báo Khách Hàng / Lead mới thủ công
            </h3>

            <form onSubmit={handleCreateLead} className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tên Khách Hàng *</label>
                <input
                  type="text"
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Họ và tên..."
                  className="w-full px-3 py-2 Border rounded-lg text-xs bg-slate-50 border-slate-200 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tên Doanh Nghiệp *</label>
                <input
                  type="text"
                  required
                  value={addCompany}
                  onChange={(e) => setAddCompany(e.target.value)}
                  placeholder="Công ty của khách..."
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-slate-50 border-slate-200 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email</label>
                <input
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="partner@company.com"
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-slate-50 border-slate-200 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  placeholder="09xx..."
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-slate-50 border-slate-200 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Lĩnh vực hoạt động</label>
                <input
                  type="text"
                  value={addIndustry}
                  onChange={(e) => setAddIndustry(e.target.value)}
                  placeholder="VD: Thương mại điện tử"
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-slate-50 border-slate-200 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Quy mô nhân lực</label>
                <select
                  value={addEmployees}
                  onChange={(e) => setAddEmployees(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-slate-50 border-slate-200 focus:bg-white focus:outline-none"
                >
                  <option>Dưới 10 người</option>
                  <option>10 - 50 người</option>
                  <option>50 - 200 người</option>
                  <option>Trên 200 người</option>
                </select>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ngân sách dự kiến</label>
                <select
                  value={addBudget}
                  onChange={(e) => setAddBudget(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-slate-50 border-slate-200 focus:bg-white focus:outline-none"
                >
                  <option>3-5 triệu</option>
                  <option>5-10 triệu</option>
                  <option>10-20 triệu</option>
                  <option>20-50 triệu</option>
                  <option>Trên 50 triệu</option>
                </select>
              </div>

              <div className="col-span-2 sm:col-span-1 flex items-center gap-4 mt-4">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-slate-600">
                  <input
                    type="checkbox"
                    checked={addHasWebsite}
                    onChange={(e) => setAddHasWebsite(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <span>Đã có Website</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-slate-600">
                  <input
                    type="checkbox"
                    checked={addHasPixel}
                    onChange={(e) => setAddHasPixel(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <span>Đã có FB Pixel</span>
                </label>
              </div>

              <div className="col-span-2 pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 cursor-pointer"
                >
                  Ghi Nhận & Khởi Tạo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

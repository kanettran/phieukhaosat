import React, { useState } from "react";
import { SurveyData } from "../types";
import { 
  Building, Globe, Link, Calendar, Users2, User, Key, Mail, Phone,
  ChevronRight, ChevronLeft, Send, Sparkles, HelpCircle, Check, MapPin,
  TrendingUp, Award, Laptop, Settings, ArrowRight, ShieldCheck, CheckSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SurveyFormProps {
  webhookUrl: string;
  onSubmitSuccess: (data: SurveyData) => void;
  companyPhone?: string;
  companyEmail?: string;
}

const INITIAL_SURVEY: SurveyData = {
  company_name: "",
  website: "",
  fanpage: "",
  industry: "",
  year_established: "",
  employee_count: "",
  contact_name: "",
  position: "",
  email: "",
  phone: "",
  business_model: "",
  target_customer: "",
  revenue: "100-500 triệu",
  goal: "Tăng doanh số",
  marketing_status: "Tự làm",
  channels: [],
  unused_channels: [],
  marketing_budget: "10-30 triệu",
  pain_points: [],
  strengths: "",
  unique_selling_point: "",
  competitors: "",
  brand_positioning: "",
  digital_assets: [],
  tracking_tools: [],
  services_needed: [],
  service_budget: "10-20 triệu",
};

export default function SurveyForm({ webhookUrl, onSubmitSuccess, companyPhone, companyEmail }: SurveyFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<SurveyData>(INITIAL_SURVEY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form selections definitions
  const revenueOptions = [
    "Dưới 100 triệu",
    "100-500 triệu",
    "500 triệu - 1 tỷ",
    "1-5 tỷ",
    "Trên 5 tỷ"
  ];

  const goalOptions = [
    "Tăng doanh số",
    "Mở rộng thị trường",
    "Xây dựng thương hiệu",
    "Chuyển đổi số",
    "Tăng đại lý",
    "Khác"
  ];

  const mktStatusOptions = [
    "Tự làm",
    "Có nhân viên marketing",
    "Thuê freelancer",
    "Thuê agency",
    "Chưa triển khai"
  ];

  const channelOptions = [
    "Facebook",
    "TikTok",
    "Youtube",
    "Google Ads",
    "SEO Website",
    "Email Marketing",
    "Zalo",
    "CRM",
    "Google Business"
  ];

  const mktBudgetOptions = [
    "Dưới 10 triệu",
    "10-30 triệu",
    "30-50 triệu",
    "50-100 triệu",
    "Trên 100 triệu"
  ];

  const painPointOptions = [
    "Thiếu khách hàng",
    "Chi phí quảng cáo cao",
    "Thiếu nội dung",
    "Thiếu chiến lược",
    "Website không hiệu quả",
    "SEO kém",
    "Không có nhân sự",
    "Không đo lường được hiệu quả"
  ];

  const assetOptions = [
    "Website",
    "Landing Page",
    "CRM",
    "Fanpage",
    "TikTok",
    "Youtube",
    "Google Business"
  ];

  const trackerOptions = [
    "Google Analytics",
    "Google Search Console",
    "Facebook Pixel",
    "TikTok Pixel"
  ];

  const serviceOptions = [
    "Chiến lược marketing",
    "SEO",
    "Google Maps",
    "Content",
    "Quảng cáo",
    "Thiết kế thương hiệu",
    "Landing Page",
    "Website",
    "Chatbot AI",
    "Automation Marketing",
    "CRM"
  ];

  const serviceBudgetOptions = [
    "3-5 triệu",
    "5-10 triệu",
    "10-20 triệu",
    "20-50 triệu",
    "Trên 50 triệu"
  ];

  // Validation before going to next step
  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (currentStep === 1) {
      if (!formData.company_name.trim()) newErrors.company_name = "Tên doanh nghiệp là bắt buộc";
      if (!formData.industry.trim()) newErrors.industry = "Ngành nghề kinh doanh là bắt buộc";
      if (!formData.contact_name.trim()) newErrors.contact_name = "Người liên hệ là bắt buộc";
      if (!formData.email.trim()) {
        newErrors.email = "Email là bắt buộc";
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Email không đúng định dạng";
      }
      if (!formData.phone.trim()) {
        newErrors.phone = "Số điện thoại là bắt buộc";
      } else if (formData.phone.trim().length < 8) {
        newErrors.phone = "Số điện thoại không hợp lệ";
      }
    } else if (currentStep === 2) {
      if (!formData.business_model.trim()) newErrors.business_model = "Vui lòng mô tả sản phẩm/dịch vụ kinh doanh";
      if (!formData.target_customer.trim()) newErrors.target_customer = "Vui lòng mô tả khách hàng mục tiêu";
    } else if (currentStep === 3) {
      if (formData.channels.length === 0) newErrors.channels = "Vui lòng chọn ít nhất 1 kênh marketing";
      if (formData.pain_points.length === 0) newErrors.pain_points = "Vui lòng chọn ít nhất 1 khó khăn chính";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 6));
    }
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleArrayChange = (field: keyof SurveyData, value: string) => {
    setFormData((prev) => {
      const currentArr = (prev[field] || []) as string[];
      const exists = currentArr.includes(value);
      const newArr = exists 
        ? currentArr.filter(item => item !== value)
        : [...currentArr, value];
      
      // Clean error for array if resolved
      if (errors[field]) {
        setErrors((errs) => {
          const copy = { ...errs };
          delete copy[field];
          return copy;
        });
      }

      return { ...prev, [field]: newArr };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(step)) return;

    setIsSubmitting(true);

    try {
      // 1. Send actual POST request to configured webhook URL via our express proxy
      const webhookResponse = await fetch("/api/submit-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl: webhookUrl,
          payload: formData,
        }),
      });

      console.log("Webhook submission initiated via proxy proxy", webhookResponse);
    } catch (err) {
      console.warn("Webhook direct submission warning:", err);
    } finally {
      setIsSubmitting(false);
      // Callback to trigger success view + local AI generation in parent App.tsx
      onSubmitSuccess(formData);
    }
  };

  // Stepper Header
  const steps = [
    { num: 1, name: "Thông tin doanh nghiệp" },
    { num: 2, name: "Tình hình kinh doanh" },
    { num: 3, name: "Hiện trạng Marketing" },
    { num: 4, name: "Thương hiệu & Cạnh tranh" },
    { num: 5, name: "Hạ tầng Digital" },
    { num: 6, name: "Mục tiêu hợp tác" }
  ];

  return (
    <div className="flex flex-col lg:flex-row bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.05)] overflow-hidden font-sans" id="survey-container">
      {/* Sleek Left Sidebar for Desktop */}
      <aside className="w-80 bg-[#0F172A] text-slate-200 p-6 flex flex-col justify-between shrink-0 hidden lg:flex border-r border-slate-800">
        <div>
          {/* Logo & Brand Header */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-xl">T</div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight text-white uppercase">TOLUCK</h1>
              <p className="text-[10px] uppercase tracking-widest text-blue-400 font-semibold font-sans">Digital Agency</p>
            </div>
          </div>

          <nav className="space-y-1">
            {steps.map((s) => (
              <div
                key={s.num}
                onClick={() => {
                  if (s.num < step) {
                    setStep(s.num);
                  } else if (s.num > step && validateStep(step)) {
                    setStep(s.num);
                  }
                }}
                className={`flex items-center gap-3 p-3 rounded-lg mb-1 transition-all duration-200 cursor-pointer ${
                  s.num === step
                    ? "bg-white/10 opacity-100 border-l-4 border-blue-500 text-white"
                    : "opacity-60 hover:opacity-90"
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                  s.num === step ? "bg-blue-600 text-white" : "bg-white/10 text-slate-300"
                }`}>
                  {s.num < step ? <Check className="w-3.5 h-3.5" /> : `0${s.num}`}
                </div>
                <span className="text-sm font-medium">{s.name}</span>
              </div>
            ))}
          </nav>
        </div>

        <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60">
          <p className="text-[10px] uppercase text-slate-400 mb-1 font-bold tracking-wider">Hỗ trợ trực tuyến</p>
          <p className="text-xs text-white font-semibold">Hotline: {companyPhone || "0963 484 365"}</p>
          <p className="text-[10px] text-slate-500 mt-1">{companyEmail || "info@toluck.vn"}</p>
        </div>
      </aside>

      {/* Right Side Inputs Area */}
      <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between bg-white">
        {/* Step progress tracker */}
        <div className="mb-8 lg:hidden" id="survey-progress-stepper">
          <div className="flex items-center justify-between">
            {steps.map((s) => (
              <React.Fragment key={s.num}>
                {/* Node */}
                <button
                  type="button"
                  onClick={() => {
                    // Navigate only to prior steps or if validation passes
                    if (s.num < step) {
                      setStep(s.num);
                    } else if (s.num > step && validateStep(step)) {
                      setStep(s.num);
                    }
                  }}
                  className={`flex flex-col items-center relative z-10 cursor-pointer focus:outline-none transition-all duration-300 ${
                    s.num === step 
                      ? "text-blue-600 scale-105 font-bold" 
                      : s.num < step 
                        ? "text-emerald-500 font-medium" 
                        : "text-slate-400"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all duration-300 ${
                    s.num === step 
                      ? "bg-blue-50 border-blue-500 text-blue-600 shadow-sm" 
                      : s.num < step 
                        ? "bg-emerald-50 border-emerald-500 text-emerald-500" 
                        : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}>
                    {s.num < step ? <Check className="w-4 h-4" /> : s.num}
                  </div>
                  <span className="text-[10px] sm:text-xs mt-1.5 hidden md:block whitespace-nowrap">{s.name}</span>
                </button>

                {/* Line connector */}
                {s.num < 6 && (
                  <div className="flex-1 h-[2px] mx-2 bg-slate-100 rounded-full relative overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500 ease-out"
                      style={{ 
                        width: s.num < step ? "100%" : "0%" 
                      }}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="mt-4 flex justify-between items-center bg-slate-50/70 py-2.5 px-4 rounded-xl border border-slate-100">
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">Bước {step} của 6</span>
            <span className="text-xs text-slate-600 font-medium">{steps[step - 1].name}</span>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6" id="toluck-form-element">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* ===================== STEP 1: BUSINESS ENVIRONMENT ===================== */}
              {step === 1 && (
                <div className="space-y-4" id="step-1-fields">
                  <div className="border-b border-gray-100 pb-3">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Building className="w-5 h-5 text-indigo-500" />
                      Phần 1. Thông tin doanh nghiệp
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Thông tin cơ bản giúp TOLUCK liên hệ và gửi báo cáo phân tích chi tiết.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Tên doanh nghiệp */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                        Tên doanh nghiệp <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleTextChange}
                        placeholder="Ví dụ: Công ty Thời trang TOLUCK"
                        className={`w-full px-4 py-2.5 rounded-xl border ${errors.company_name ? 'border-rose-500 focus:ring-rose-500/20' : 'border-gray-200 focus:ring-indigo-500/20'} text-sm focus:outline-none focus:ring-2 focus:border-indigo-500 transition-all`}
                        required
                        id="m-company-name-input"
                      />
                      {errors.company_name && <p className="text-[11px] text-rose-500">{errors.company_name}</p>}
                    </div>

                    {/* Ngành nghề kinh doanh */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                        Ngành nghề kinh doanh <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="industry"
                        value={formData.industry}
                        onChange={handleTextChange}
                        placeholder="Ví dụ: Bán lẻ, F&B, Logistics, Giáo dục..."
                        className={`w-full px-4 py-2.5 rounded-xl border ${errors.industry ? 'border-rose-500 focus:ring-rose-500/20' : 'border-gray-200 focus:ring-indigo-500/20'} text-sm focus:outline-none focus:ring-2 focus:border-indigo-500 transition-all`}
                        required
                      />
                      {errors.industry && <p className="text-[11px] text-rose-500">{errors.industry}</p>}
                    </div>

                    {/* Website */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Website</label>
                      <input
                        type="text"
                        name="website"
                        value={formData.website}
                        onChange={handleTextChange}
                        placeholder="Ví dụ: toluck.vn"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm focus:outline-none transition-all"
                      />
                    </div>

                    {/* Fanpage */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Fanpage</label>
                      <input
                        type="text"
                        name="fanpage"
                        value={formData.fanpage}
                        onChange={handleTextChange}
                        placeholder="facebook.com/toluckagency"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm focus:outline-none transition-all"
                      />
                    </div>

                    {/* Năm thành lập */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Năm thành lập</label>
                      <input
                        type="text"
                        name="year_established"
                        value={formData.year_established}
                        onChange={handleTextChange}
                        placeholder="Ví dụ: 2021"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm focus:outline-none transition-all"
                      />
                    </div>

                    {/* Quy mô nhân sự */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Quy mô nhân sự</label>
                      <input
                        type="text"
                        name="employee_count"
                        value={formData.employee_count}
                        onChange={handleTextChange}
                        placeholder="Ví dụ: 10-50 nhân sự"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-50 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Người liên hệ & Chức vụ */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                        Người liên hệ <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="contact_name"
                        value={formData.contact_name}
                        onChange={handleTextChange}
                        placeholder="Họ và Tên"
                        className={`w-full px-4 py-2.5 rounded-xl border ${errors.contact_name ? 'border-rose-500 focus:ring-rose-500/20' : 'border-gray-200 focus:ring-indigo-500/20'} text-sm focus:outline-none focus:ring-2 focus:border-indigo-500 transition-all`}
                        required
                      />
                      {errors.contact_name && <p className="text-[11px] text-rose-500">{errors.contact_name}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">Chức vụ</label>
                      <input
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleTextChange}
                        placeholder="CEO / CMO / Director"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm focus:outline-none transition-all"
                      />
                    </div>

                    {/* Số điện thoại */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                        Số điện thoại <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleTextChange}
                        placeholder="Ví dụ: 0987654321"
                        className={`w-full px-4 py-2.5 rounded-xl border ${errors.phone ? 'border-rose-500 focus:ring-rose-500/20' : 'border-gray-200 focus:ring-indigo-500/20'} text-sm focus:outline-none focus:ring-2 focus:border-indigo-500 transition-all`}
                        required
                      />
                      {errors.phone && <p className="text-[11px] text-rose-500">{errors.phone}</p>}
                    </div>
                  </div>

                  {/* Email nhận báo cáo */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                      Email nhận báo cáo nhận diện <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleTextChange}
                      placeholder="marketing@doanhnghiep.com"
                      className={`w-full px-4 py-2.5 rounded-xl border ${errors.email ? 'border-rose-500 focus:ring-rose-500/20' : 'border-gray-200 focus:ring-indigo-500/20'} text-sm focus:outline-none focus:ring-2 focus:border-indigo-500 transition-all`}
                      required
                    />
                    {errors.email && <p className="text-[11px] text-rose-500">{errors.email}</p>}
                  </div>
                </div>
              )}

              {/* ===================== STEP 2: BUSINESS SITUATION ===================== */}
              {step === 2 && (
                <div className="space-y-5" id="step-2-fields">
                  <div className="border-b border-gray-100 pb-3">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-indigo-500" />
                      Phần 2. Tình hình kinh doanh
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Phục vụ việc xác định mô hình dòng tiền và hướng tiếp cận tệp khách hàng mục tiêu hiệu quả.</p>
                  </div>

                  {/* Doanh nghiệp đang kinh doanh sản phẩm hoặc dịch vụ gì? */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      Doanh nghiệp đang kinh doanh sản phẩm hoặc dịch vụ gì? <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      name="business_model"
                      value={formData.business_model}
                      onChange={handleTextChange}
                      rows={3}
                      placeholder="Mô tả cụ thể dòng sản phẩm chính của bạn (ví dụ: bán quần áo trẻ em cao cấp thương hiệu tự thiết kế)..."
                      className={`w-full px-4 py-2.5 rounded-xl border ${errors.business_model ? 'border-rose-500 focus:ring-rose-500/20' : 'border-gray-200 focus:ring-indigo-500/20'} text-sm focus:outline-none focus:ring-2 focus:border-indigo-500 transition-all`}
                      required
                    />
                    {errors.business_model && <p className="text-[11px] text-rose-500">{errors.business_model}</p>}
                  </div>

                  {/* Khách hàng mục tiêu là ai? */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      Khách hàng mục tiêu là ai? <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      name="target_customer"
                      value={formData.target_customer}
                      onChange={handleTextChange}
                      rows={3}
                      placeholder="Nhân khẩu học, hành vi hoặc sở thích (ví dụ: mẹ bỉm sữa 25-35 tuổi tại Hà Nội, thu nhập trên 15 triệu/tháng)..."
                      className={`w-full px-4 py-2.5 rounded-xl border ${errors.target_customer ? 'border-rose-500 focus:ring-rose-500/20' : 'border-gray-200 focus:ring-indigo-500/20'} text-sm focus:outline-none focus:ring-2 focus:border-indigo-500 transition-all`}
                      required
                    />
                    {errors.target_customer && <p className="text-[11px] text-rose-500">{errors.target_customer}</p>}
                  </div>

                  {/* Doanh thu trung bình hàng tháng */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700 block">Doanh thu trung bình hàng tháng?</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
                      {revenueOptions.map((opt) => (
                        <label 
                          key={opt}
                          className={`flex items-center justify-center text-center p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                            formData.revenue === opt 
                              ? "bg-indigo-50/70 border-indigo-500 text-indigo-700 shadow-xs" 
                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="revenue"
                            value={opt}
                            checked={formData.revenue === opt}
                            onChange={handleTextChange}
                            className="sr-only"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Mục tiêu lớn nhất */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700 block">Mục tiêu lớn nhất trong 12 tháng tới?</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
                      {goalOptions.map((opt) => (
                        <label 
                          key={opt}
                          className={`flex items-center justify-center p-3 rounded-xl border text-xs font-semibold text-center cursor-pointer transition-all ${
                            formData.goal === opt 
                              ? "bg-indigo-50/70 border-indigo-500 text-indigo-700 shadow-xs" 
                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="goal"
                            value={opt}
                            checked={formData.goal === opt}
                            onChange={handleTextChange}
                            className="sr-only"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ===================== STEP 3: MARKETING STATUS ===================== */}
              {step === 3 && (
                <div className="space-y-5" id="step-3-fields">
                  <div className="border-b border-gray-100 pb-3">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Award className="w-5 h-5 text-indigo-500" />
                      Phần 3. Hiện trạng marketing
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Chuẩn bị cơ sở so sánh để phân bổ ngân sách và thiết kế hệ thống báo cáo.</p>
                  </div>

                  {/* Cách làm marketing hiện tại */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700 block">Hiện doanh nghiệp đang làm marketing như thế nào?</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {mktStatusOptions.map((opt) => (
                        <label 
                          key={opt}
                          className={`flex items-center justify-center p-3 text-center rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                            formData.marketing_status === opt 
                              ? "bg-indigo-50/70 border-indigo-500 text-indigo-700 shadow-xs" 
                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="marketing_status"
                            value={opt}
                            checked={formData.marketing_status === opt}
                            onChange={handleTextChange}
                            className="sr-only"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Kênh marketing đang sử dụng */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-gray-700 block">
                        Các kênh marketing đang sử dụng <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-indigo-500 font-semibold">Chọn nhiều</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {channelOptions.map((opt) => {
                        const isChecked = formData.channels.includes(opt);
                        return (
                          <label 
                            key={opt}
                            className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                              isChecked 
                                ? "bg-indigo-50/50 border-indigo-400 text-indigo-700" 
                                : "bg-white border-gray-100 text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleArrayChange("channels", opt)}
                              className="w-4 h-4 rounded-md text-indigo-600 border-gray-300 focus:ring-indigo-500 cursor-pointer"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                    {errors.channels && <p className="text-[11px] text-rose-500">{errors.channels}</p>}
                  </div>

                  {/* Kênh marketing CHƯA từng sử dụng */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-gray-700 block">
                        Các kênh marketing doanh nghiệp CHƯA triển khai / CHƯA làm bao giờ
                      </label>
                      <span className="text-[10px] text-teal-600 font-semibold font-mono uppercase">Chọn nhiều</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {channelOptions.map((opt) => {
                        const isChecked = formData.unused_channels?.includes(opt);
                        return (
                          <label 
                            key={`unused-${opt}`}
                            className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                              isChecked 
                                ? "bg-teal-50/50 border-teal-400 text-teal-700" 
                                : "bg-white border-gray-100 text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked || false}
                              onChange={() => handleArrayChange("unused_channels", opt)}
                              className="w-4 h-4 rounded-md text-teal-600 border-gray-300 focus:ring-teal-500 cursor-pointer"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ngân sách marketing hàng tháng */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700 block">Ngân sách marketing mỗi tháng</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {mktBudgetOptions.map((opt) => (
                        <label 
                          key={opt}
                          className={`flex items-center justify-center p-3 text-center rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                            formData.marketing_budget === opt 
                              ? "bg-indigo-50/70 border-indigo-500 text-indigo-700 shadow-xs" 
                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="marketing_budget"
                            value={opt}
                            checked={formData.marketing_budget === opt}
                            onChange={handleTextChange}
                            className="sr-only"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Điều đang gặp khó khăn nhất */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-gray-700 block">
                        Điều doanh nghiệp đang gặp khó khăn nhất? <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-indigo-500 font-semibold">Chọn nhiều</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {painPointOptions.map((opt) => {
                        const isChecked = formData.pain_points.includes(opt);
                        return (
                          <label 
                            key={opt}
                            className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                              isChecked 
                                ? "bg-amber-50/40 border-amber-400 text-amber-800" 
                                : "bg-white border-gray-100 text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleArrayChange("pain_points", opt)}
                              className="w-4 h-4 rounded text-amber-500 border-gray-300 focus:ring-amber-500 cursor-pointer"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                    {errors.pain_points && <p className="text-[11px] text-rose-500">{errors.pain_points}</p>}
                  </div>
                </div>
              )}

              {/* ===================== STEP 4: BRAND STATUS ===================== */}
              {step === 4 && (
                <div className="space-y-5" id="step-4-fields">
                  <div className="border-b border-gray-100 pb-3">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Laptop className="w-5 h-5 text-indigo-500" />
                      Phần 4. Thương hiệu & Cạnh tranh
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Giúp TOLUCK phân tích lợi thế cạnh tranh để tìm góc định vị tối ưu nhất.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Điểm mạnh */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">Điểm mạnh lớn nhất của doanh nghiệp?</label>
                      <textarea
                        name="strengths"
                        value={formData.strengths}
                        onChange={handleTextChange}
                        rows={3}
                        placeholder="Ví dụ: Quy trình sản xuất tự động, nguồn hàng chất lượng cao giá tại xưởng, mặt bằng lưu kho rộng..."
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm focus:outline-none transition-all"
                      />
                    </div>

                    {/* Điểm khác biệt */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">Điểm khác biệt lớn nhất so với đối thủ (USP)?</label>
                      <textarea
                        name="unique_selling_point"
                        value={formData.unique_selling_point}
                        onChange={handleTextChange}
                        rows={3}
                        placeholder="Tại sao khách hàng phải mua sản phẩm của bạn chứ không phải của người khác? Bảo hành trọn đời, miễn phí vận chuyển..."
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm focus:outline-none transition-all"
                      />
                    </div>

                    {/* Đối thủ cạnh tranh */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">Liệt kê 3 đối thủ cạnh tranh chính</label>
                      <textarea
                        name="competitors"
                        value={formData.competitors}
                        onChange={handleTextChange}
                        rows={3}
                        placeholder="Nêu rõ tên doanh nghiệp hoặc website của đối thủ cạnh tranh chính trực tiếp..."
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm focus:outline-none transition-all"
                      />
                    </div>

                    {/* Định vị thương hiệu mong muốn */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">Khách hàng nên nhớ đến thương hiệu như thế nào?</label>
                      <textarea
                        name="brand_positioning"
                        value={formData.brand_positioning}
                        onChange={handleTextChange}
                        rows={3}
                        placeholder="Ví dụ: Cao cấp, Uy tín, Giá rẻ bình dân, Chất lượng phục vụ tốt nhất, Độc đáo..."
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ===================== STEP 5: DIGITAL INFRASTRUCTURE ===================== */}
              {step === 5 && (
                <div className="space-y-5" id="step-5-fields">
                  <div className="border-b border-gray-100 pb-3">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-indigo-500" />
                      Phần 5. Hạ tầng Digital
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Đánh giá mức độ chuyển đổi số và khả năng ứng dụng các công nghệ tracking đa kênh.</p>
                  </div>

                  {/* Doanh nghiệp hiện có */}
                  <div className="space-y-3">
                    <div className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-100/40 mb-2">
                      <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider mb-1">
                        Doanh nghiệp hiện có những kênh / hệ thống nào?
                      </h4>
                      <p className="text-[11px] text-gray-500">Tích chọn các tài sản số mà bạn đã sở hữu hoặc phát triển.</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {assetOptions.map((opt) => {
                        const isChecked = formData.digital_assets.includes(opt);
                        return (
                          <label 
                            key={opt}
                            className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                              isChecked 
                                ? "bg-indigo-50/50 border-indigo-400 text-indigo-700" 
                                : "bg-white border-gray-100 text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleArrayChange("digital_assets", opt)}
                              className="w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500 cursor-pointer"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Đã cài tracking tools */}
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <div className="bg-teal-50/40 p-4 rounded-xl border border-teal-100/40 mb-2">
                      <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wider mb-1">
                        Đã cài đặt các công cụ đo lường / pixel nào?
                      </h4>
                      <p className="text-[11px] text-gray-500">Khả năng thu thập chân dung khách hàng và tối ưu hóa chuyển đổi quảng cáo.</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {trackerOptions.map((opt) => {
                        const isChecked = formData.tracking_tools.includes(opt);
                        return (
                          <label 
                            key={opt}
                            className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                              isChecked 
                                ? "bg-teal-50/40 border-teal-400 text-teal-800" 
                                : "bg-white border-gray-100 text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleArrayChange("tracking_tools", opt)}
                              className="w-4 h-4 rounded text-teal-600 border-gray-300 focus:ring-teal-500 cursor-pointer"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ===================== STEP 6: COOPERATION GOAL ===================== */}
              {step === 6 && (
                <div className="space-y-5" id="step-6-fields">
                  <div className="border-b border-gray-100 pb-3">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <CheckSquare className="w-5 h-5 text-indigo-500" />
                      Phần 6. Mục tiêu hợp tác
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Xác lập phạm vi công việc dự kiến và sự chuẩn bị ngân sách để TOLUCK xây dựng phương án tốt nhất.</p>
                  </div>

                  {/* Doanh nghiệp muốn TOLUCK hỗ trợ: */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-gray-700 block">
                        Các dịch vụ mong muốn TOLUCK hỗ trợ truyền thông:
                      </label>
                      <span className="text-[10px] text-indigo-500 font-semibold">Chọn nhiều</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {serviceOptions.map((opt) => {
                        const isChecked = formData.services_needed.includes(opt);
                        return (
                          <label 
                            key={opt}
                            className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                              isChecked 
                                ? "bg-indigo-50/50 border-indigo-400 text-indigo-700" 
                                : "bg-white border-gray-100 text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleArrayChange("services_needed", opt)}
                              className="w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500 cursor-pointer"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ngân sách dự kiến */}
                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    <label className="text-xs font-semibold text-gray-700 block">Ngân sách đầu tư triển khai mỗi tháng dự kiến?</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {serviceBudgetOptions.map((opt) => (
                        <label 
                          key={opt}
                          className={`flex items-center justify-center p-3 text-center rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                            formData.service_budget === opt 
                              ? "bg-indigo-50/70 border-indigo-500 text-indigo-700 shadow-xs" 
                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="service_budget"
                            value={opt}
                            checked={formData.service_budget === opt}
                            onChange={handleTextChange}
                            className="sr-only"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Advanced webhook confirmation indicator */}
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-500 flex gap-2.5 items-start mt-4">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-700">Xác nhận chuyển dữ liệu an toàn</p>
                      <p className="mt-0.5 text-[11px] leading-normal text-gray-500">
                        Bằng việc gửi biểu mẫu, toàn bộ dữ liệu JSON được định dạng bảo mật sẽ chuyển thẳng về webhook rảnh tay <span className="font-mono text-indigo-600 break-all">{webhookUrl}</span> và kích hoạt TOLUCK AI tư vấn tự động.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Stepper control buttons */}
          <div className="flex justify-between items-center pt-5 border-t border-gray-100">
            <button
              type="button"
              onClick={handlePrev}
              disabled={step === 1}
              className={`flex items-center gap-1.5 py-2.5 px-5 rounded-xl border text-sm font-semibold transition-all ${
                step === 1 
                  ? "bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed" 
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </button>

            {step < 6 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white border-0 rounded-xl text-sm font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <span>Tiếp tục</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 py-3 px-7 bg-blue-600 hover:bg-blue-700 text-white border-0 rounded-xl text-sm font-bold shadow-md shadow-blue-100 hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                id="submit-survey-btn"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>TOLUCK AI Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 animate-pulse text-blue-200" />
                    <span>Nhận Báo Cáo Đánh Giá Miễn Phí</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

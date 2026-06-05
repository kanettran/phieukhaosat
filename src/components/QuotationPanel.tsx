import React, { useState, useEffect } from "react";
import { 
  Plus, Search, Filter, Edit, Trash2, Mail, Download, ArrowLeft, 
  Trash, FileText, Check, CheckCircle, HelpCircle, XCircle, 
  Send, AlertTriangle, Briefcase, Calendar, User, Building, 
  DollarSign, FileSpreadsheet, Layers, FileCheck, ClipboardList, Info, Percent
} from "lucide-react";
import { Quotation, QuotationServiceItem, CRMProject } from "../types";

interface QuotationPanelProps {
  token: string;
  currentUser: any;
  crms: any[];
  quotations: Quotation[];
  projects: CRMProject[];
  fetchCmsData: () => Promise<void>;
  prefillLeadId?: string | null;
  onClearPrefillLead?: () => void;
}

// Default prices and descriptions for the TOLUCK Service Library
const SERVICE_LIBRARY = [
  { name: "Marketing thuê ngoài", price: 15000000, desc: "Phòng marketing thuê ngoài trọn gói, lập kế hoạch và triển khai đa kênh cam kết KPI tăng trưởng số." },
  { name: "SEO", price: 8000000, desc: "Tối ưu hóa công cụ tìm kiếm Google bền vững, đẩy hàng trăm từ khóa phủ ngành lên Top 1-5." },
  { name: "Google Maps", price: 3000050, desc: "Xác minh, tối ưu hóa hiển thị Địa điểm Local SEO Google Maps, phủ sóng tiếp cận khách hàng bán kính gần." },
  { name: "Landing Page", price: 5000000, desc: "Thiết kế trang đích chuyển đổi cao, tối ưu UI/UX, tích hợp các hệ tracking đo lường và CRM đón lead." },
  { name: "Website", price: 15000000, desc: "Thiết kế Website chuẩn SEO WordPress/React hiện đại, giao diện độc bản bảo mật cao." },
  { name: "Content", price: 6000000, desc: "Sản xuất nội dung, hình ảnh chuyên gia chuẩn định vị thương hiệu cho kênh Website và Fanpage doanh nghiệp." },
  { name: "Branding", price: 12000000, desc: "Tư vấn và thiết kế bộ nhận diện thương hiệu chuyên nghiệp (Logo, Catalogue, Profile, Brand Guidelines)." },
  { name: "Automation", price: 10000000, desc: "Xây dựng hệ thống tự động hóa chăm sóc khách hàng (Chatbot AI, Email Automation Workflow)." },
  { name: "CRM", price: 18000000, desc: "Triển khai, huấn luyện và cấu hình phần mềm quản trị quan hệ khách hàng CRM chuyên sâu cho đội sales." },
  { name: "AI Agent", price: 25000000, desc: "Tích hợp trợ lý ảo trí tuệ nhân tạo AI Agent, tự động hóa phản hồi đa nền tảng và báo cáo số liệu 24/7." }
];

export default function QuotationPanel({
  token,
  currentUser,
  crms,
  quotations = [],
  projects = [],
  fetchCmsData,
  prefillLeadId,
  onClearPrefillLead
}: QuotationPanelProps) {
  // Navigation View: 'list' | 'editor'
  const [viewMode, setViewMode] = useState<"list" | "editor">("list");
  
  // List State Filters
  const [filterStaff, setFilterStaff] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDays, setFilterDays] = useState("all"); // 'all' | '7' | '30'
  const [searchQuery, setSearchQuery] = useState("");

  // Editor State
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [companyInput, setCompanyInput] = useState("");
  const [contactInput, setContactInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [templateId, setTemplateId] = useState<"template01" | "template02" | "template03">("template01");
  const [expiryDateInput, setExpiryDateInput] = useState("");
  const [quoteCode, setQuoteCode] = useState("");
  const [quoteStatus, setQuoteStatus] = useState<Quotation["status"]>("Nháp");

  // Services in current editing quotation
  const [servicesInput, setServicesInput] = useState<QuotationServiceItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [vatPercent, setVatPercent] = useState(10); // Standard 10% VAT default

  // Operation flags
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Auto Calculations
  const [subtotal, setSubtotal] = useState(0);
  const [discountValue, setDiscountValue] = useState(0);
  const [vatValue, setVatValue] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  // Status List definitions
  const STATUSES: Quotation["status"][] = [
    "Nháp", "Đã gửi khách", "Đang xem xét", "Đàm phán", "Chấp nhận", "Từ chối", "Hết hiệu lực", "Chuyển hợp đồng"
  ];

  // Unique staff emails in charge of quotes
  const uniqueStaff = Array.from(new Set(quotations.map(q => q.assignedTo).filter(Boolean)));

  // If prefilled with a lead from CRM, load editor instantly
  useEffect(() => {
    if (prefillLeadId) {
      const lead = crms.find(c => c.id === prefillLeadId);
      if (lead) {
        initNewQuotationForm();
        setSelectedCustomerId(lead.id);
        setCompanyInput(lead.company || "");
        setContactInput(lead.contact || "");
        setEmailInput(lead.email || "");
        setPhoneInput(lead.phone || "");
        // If they requested specific services, pre-add those
        if (lead.surveyHistory?.[0]?.surveyData?.services_needed) {
          const needed = lead.surveyHistory[0].surveyData.services_needed;
          const prefilledServices = needed.map((servName: string) => {
            const matched = SERVICE_LIBRARY.find(s => s.name.toLowerCase() === servName.toLowerCase());
            return {
              name: servName,
              desc: matched?.desc || "Dịch vụ do khách hàng đề xuất.",
              qty: 1,
              price: matched?.price || 10000000,
              total: matched?.price || 10000000
            };
          });
          setServicesInput(prefilledServices);
        }
        setViewMode("editor");
        if (onClearPrefillLead) onClearPrefillLead();
      }
    }
  }, [prefillLeadId, crms]);

  // Recalculate quotation summary totals
  useEffect(() => {
    const calculatedSubtotal = servicesInput.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const calculatedDiscountVal = Math.round(calculatedSubtotal * (discountPercent / 100));
    const subAfterDiscount = Math.max(0, calculatedSubtotal - calculatedDiscountVal);
    const calculatedVatVal = Math.round(subAfterDiscount * (vatPercent / 100));
    const calculatedTotal = subAfterDiscount + calculatedVatVal;

    setSubtotal(calculatedSubtotal);
    setDiscountValue(calculatedDiscountVal);
    setVatValue(calculatedVatVal);
    setTotalAmount(calculatedTotal);
  }, [servicesInput, discountPercent, vatPercent]);

  // Autofill customer elements from dropdown
  useEffect(() => {
    if (selectedCustomerId && !isEditMode) {
      const selected = crms.find(c => c.id === selectedCustomerId);
      if (selected) {
        setCompanyInput(selected.company || "");
        setContactInput(selected.contact || "");
        setEmailInput(selected.email || "");
        setPhoneInput(selected.phone || "");
        setQuoteNotes(`Chào anh/chị ${selected.contact},\nTOLUCK Agency xin gửi đến quý công ty phương án triển khai & mức ngân sách dự kiến cho các gói dịch vụ hỗ trợ tối ưu bán hàng.`);
      }
    }
  }, [selectedCustomerId, crms]);

  const initNewQuotationForm = () => {
    setIsEditMode(false);
    setEditId("");
    setSelectedCustomerId("");
    setCompanyInput("");
    setContactInput("");
    setEmailInput("");
    setPhoneInput("");
    setQuoteNotes("");
    setTemplateId("template01");
    // Code will be generated server-side or customized
    const generatedCode = `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setQuoteCode(generatedCode);
    setQuoteStatus("Nháp");
    setExpiryDateInput(new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0]); // 30 days expiration
    setServicesInput([
      { name: "Marketing thuê ngoài", desc: "Triển khai phòng marketing trọn gói cho doanh nghiệp trong 01 tháng đầu chuẩn bị tối ưu dữ liệu.", qty: 1, price: 15000000, total: 15000000 }
    ]);
    setDiscountPercent(0);
    setVatPercent(10);
    setActionMessage(null);
  };

  const handleEditClick = (q: Quotation) => {
    setIsEditMode(true);
    setEditId(q.id);
    setSelectedCustomerId(q.customerId || "");
    setCompanyInput(q.company || "");
    setContactInput(q.customerName || "");
    setEmailInput(q.email || "");
    setPhoneInput(q.phone || "");
    setQuoteNotes(q.notes || "");
    setTemplateId(q.templateId || "template01");
    setQuoteCode(q.code);
    setQuoteStatus(q.status);
    setExpiryDateInput(q.expiryDate || "");
    setDiscountPercent(q.discountPercent || 0);
    setVatPercent(q.vatPercent || 10);
    // Deep clone services to avoid editing props
    setServicesInput(q.services.map(s => ({ ...s })));
    setActionMessage(null);
    setViewMode("editor");
  };

  const handleAddServiceItem = () => {
    setServicesInput([
      ...servicesInput,
      { name: "Dịch vụ mới", desc: "Mô tả phạm vi bàn giao cụ thể phác thảo cho đối tác...", qty: 1, price: 5000000, total: 5000000 }
    ]);
  };

  const handleRemoveServiceItem = (idx: number) => {
    if (servicesInput.length <= 1) {
      alert("Phải có ít nhất 1 dịch vụ trong bảng báo giá.");
      return;
    }
    setServicesInput(servicesInput.filter((_, i) => i !== idx));
  };

  const handleServiceFieldChange = (idx: number, field: keyof QuotationServiceItem, value: any) => {
    const updated = [...servicesInput];
    const item = { ...updated[idx] };
    
    if (field === "name") {
      item.name = value;
      // In case they selected a standard service name, autofill price & desc
      const matched = SERVICE_LIBRARY.find(s => s.name === value);
      if (matched) {
        item.price = matched.price;
        item.desc = matched.desc;
      }
    } else if (field === "desc") {
      item.desc = value;
    } else if (field === "qty") {
      item.qty = Math.max(1, Number(value) || 1);
    } else if (field === "price") {
      item.price = Math.max(0, Number(value) || 0);
    }

    item.total = item.qty * item.price;
    updated[idx] = item;
    setServicesInput(updated);
  };

  // Service library quick append
  const handleQuickAppendService = (libraryItem: typeof SERVICE_LIBRARY[0]) => {
    // Check if service already exists with same name to group or append a separate line
    const existsIdx = servicesInput.findIndex(s => s.name === libraryItem.name);
    if (existsIdx !== -1) {
      const updated = [...servicesInput];
      updated[existsIdx].qty += 1;
      updated[existsIdx].total = updated[existsIdx].qty * updated[existsIdx].price;
      setServicesInput(updated);
    } else {
      setServicesInput([
        ...servicesInput,
        {
          name: libraryItem.name,
          desc: libraryItem.desc,
          qty: 1,
          price: libraryItem.price,
          total: libraryItem.price
        }
      ]);
    }
  };

  const handleSaveQuotation = async (customStatus?: Quotation["status"]) => {
    if (!companyInput.trim() || !contactInput.trim()) {
      setActionMessage({ type: "error", text: "Vui lòng nhập tên công ty và người liên hệ đại diện." });
      return;
    }

    setIsSubmitting(true);
    setActionMessage(null);

    const targetStatus = customStatus || quoteStatus;

    try {
      const res = await fetch("/api/cms/quotations/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          id: editId,
          isEdit: isEditMode,
          code: quoteCode,
          customerId: selectedCustomerId,
          customerName: contactInput,
          company: companyInput,
          email: emailInput,
          phone: phoneInput,
          services: servicesInput,
          subtotal,
          discountPercent,
          discountValue,
          vatPercent,
          vatValue,
          totalAmount,
          notes: quoteNotes,
          status: targetStatus,
          templateId,
          expiryDate: expiryDateInput,
          assignedTo: isEditMode ? undefined : currentUser.email
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({
          type: "success",
          text: isEditMode 
            ? `Cập nhật thành công báo giá ${quoteCode} trị giá ${totalAmount.toLocaleString("vi-VN")} đ`
            : `Đã khởi tạo lưu nháp báo giá ${quoteCode} của ${companyInput}!`
        });
        await fetchCmsData();
        
        // Wait minor delay then return to list
        setTimeout(() => {
          setViewMode("list");
        }, 1500);
      } else {
        setActionMessage({ type: "error", text: data.error || "Gặp sự cố khi lưu báo giá lên máy chủ." });
      }
    } catch (e: any) {
      setActionMessage({ type: "error", text: `Lỗi kết nối máy chủ: ${e.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPDF = async (quote: Quotation) => {
    setActionMessage({ type: "info", text: `Đang liên hệ biên soạn xuất bản tệp PDF Báo giá ${quote.code}...` });
    try {
      const res = await fetch("/api/cms/quotations/export-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ id: quote.id })
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Bao_gia_TOLUCK_${quote.code}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setActionMessage({ type: "success", text: `Tải xuống PDF ${quote.code} chất lượng cao chuẩn A4 thành công!` });
      } else {
        const errorText = await res.text();
        setActionMessage({ type: "error", text: `Không thể tạo PDF báo giá: ${errorText}` });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: `Lỗi download tệp: ${err.message}` });
    }
  };

  const handleSendEmail = async (quote: Quotation) => {
    if (!quote.email) {
      alert("Khách hàng này chưa được cập nhật địa chỉ email nhận thư.");
      return;
    }
    
    const confirmSend = window.confirm(`Bạn có chắc chắn muốn phát báo giá ${quote.code} (Tổng: ${quote.totalAmount.toLocaleString("vi-VN")} đ) đến thư điện tử của đối tác (${quote.email}) không? Hệ thống sẽ tạo mộc đỏ mây và tệp PDF ký số gửi kèm.`);
    if (!confirmSend) return;

    setActionMessage({ type: "info", text: `Hộp thư TOLUCK đang nén PDF mộc đỏ và gửi thư tín đến khách hàng... Vui lòng đợi trong giây lát.` });

    try {
      const res = await fetch("/api/cms/quotations/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ id: quote.id })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({
          type: "success",
          text: data.isSimulated 
            ? `📨 [CHẾ ĐỘ MÔ PHỎNG] Báo giá ${quote.code} mô phỏng gửi thành công tới ${quote.email} (Đã ghi nhận lịch sử log CRM!)`
            : `📨 [THỰC TẾ SMTP] Báo giá ${quote.code} kèm mộc đỏ PDF đã được chuyển phát thành công tới ${quote.email}!`
        });
        await fetchCmsData();
      } else {
        setActionMessage({ type: "error", text: data.error || "Gửi thư qua SMTP thất bại. Hãy kiểm tra lại SMTP Hosting." });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: `Sự cố gửi mail: ${err.message}` });
    }
  };

  const handleDeleteQuotation = async (id: string, code: string) => {
    const isConfirm = window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn báo giá ${code}? Thao tác này KHÔNG THỂ khôi phục.`);
    if (!isConfirm) return;

    try {
      const res = await fetch("/api/cms/quotations/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });

      if (res.ok) {
        setActionMessage({ type: "success", text: `Đã xóa vĩnh viễn báo giá ${code}` });
        await fetchCmsData();
      } else {
        const err = await res.json();
        setActionMessage({ type: "error", text: err.error || "Không thể xóa báo giá này." });
      }
    } catch (e: any) {
      setActionMessage({ type: "error", text: `Sự cố: ${e.message}` });
    }
  };

  const handleConvertContractToProject = async (quote: Quotation) => {
    const confirmConvert = window.confirm(`Bạn muốn chuyển đổi báo giá ${quote.code} thành Hợp đồng thi công thực tế? Thao tác này sẽ tự động tạo một dự án mới và đưa vào TAB 4 CRM.`);
    if (!confirmConvert) return;

    setActionMessage({ type: "info", text: "Đang lập dự án kỹ thuật triển khai cho khách hàng..." });

    try {
      const res = await fetch("/api/cms/projects/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          leadId: quote.customerId,
          company: quote.company,
          name: `Hợp đồng Gói ${quote.services[0]?.name || "Số hóa"} & Giải Pháp Marketing`,
          status: "Lập kế hoạch",
          budget: quote.totalAmount,
          notes: `Khởi tạo bàn giao từ Bảng báo giá đã duyệt ${quote.code}. Mã thanh toán MB: ${quote.code}. Ghi chú báo giá: ${quote.notes}`,
          services: quote.services.map(s => s.name),
          isEdit: false
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Now set quotation status to "Chuyển hợp đồng"
        await fetch("/api/cms/quotations/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            id: quote.id,
            isEdit: true,
            status: "Chuyển hợp đồng"
          })
        });

        setActionMessage({ type: "success", text: `🎉 Chúc mừng! Báo giá ${quote.code} đã được pháp lý hóa thành công và đưa vào quản trị dự án!` });
        await fetchCmsData();
      } else {
        setActionMessage({ type: "error", text: data.error || "Không thể khởi tạo dự án tự động." });
      }
    } catch (e: any) {
      setActionMessage({ type: "error", text: `Lỗi chuyển giao hợp đồng: ${e.message}` });
    }
  };

  // List filter engine
  const filteredQuotations = quotations.filter(q => {
    // 1. Staff Filter
    if (filterStaff && q.assignedTo !== filterStaff) return false;
    
    // 2. Customer Filter (CustomerId links)
    if (filterCustomer && q.customerId !== filterCustomer) return false;

    // 3. Status Filter
    if (filterStatus && q.status !== filterStatus) return false;

    // 4. Days Filter
    if (filterDays !== "all") {
      const qDate = new Date(q.createdAt);
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - Number(filterDays));
      if (qDate < limitDate) return false;
    }

    // 5. Search Query (Text bounds search)
    if (searchQuery) {
      const sLower = searchQuery.toLowerCase();
      const codeMatch = q.code?.toLowerCase().includes(sLower);
      const companyMatch = q.company?.toLowerCase().includes(sLower);
      const contactMatch = q.customerName?.toLowerCase().includes(sLower);
      if (!codeMatch && !companyMatch && !contactMatch) return false;
    }

    return true;
  });

  // KPI Calculations
  const calculatedStats = {
    totalValue: quotations.reduce((sum, q) => sum + (q.status !== "Từ chối" ? q.totalAmount : 0), 0),
    negotiatingValue: quotations.filter(q => ["Đang xem xét", "Đàm phán", "Đã gửi khách"].includes(q.status)).reduce((sum, q) => sum + q.totalAmount, 0),
    approvedValue: quotations.filter(q => ["Chấp nhận", "Chuyển hợp đồng"].includes(q.status)).reduce((sum, q) => sum + q.totalAmount, 0),
    totalCount: quotations.length
  };

  const getStatusColor = (status: Quotation["status"]) => {
    switch (status) {
      case "Nháp": return "bg-gray-100 text-gray-600 border-gray-200";
      case "Đã gửi khách": return "bg-blue-50 text-blue-600 border-blue-200";
      case "Đang xem xét": return "bg-amber-50 text-amber-600 border-amber-200";
      case "Đàm phán": return "bg-purple-50 text-purple-600 border-purple-200";
      case "Chấp nhận": return "bg-teal-50 text-teal-600 border-teal-200";
      case "Từ chối": return "bg-red-50 text-red-600 border-red-200";
      case "Hết hiệu lực": return "bg-slate-100 text-slate-500 border-slate-200";
      case "Chuyển hợp đồng": return "bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold";
      default: return "bg-gray-100 text-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-600" />
            <span>Ban Quản Lý Báo Giá Dịch Vụ TOLUCK</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">Lập phương án kỹ thuật, biểu giá chiết khấu và tự động xuất hóa đơn mộc đỏ gửi đối tác.</p>
        </div>

        {viewMode === "list" ? (
          <button
            onClick={() => { initNewQuotationForm(); setViewMode("editor"); }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Báo Giá Mới</span>
          </button>
        ) : (
          <button
            onClick={() => setViewMode("list")}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl flex items-center gap-2 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay về danh sách</span>
          </button>
        )}
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-2xl text-xs font-medium border flex items-start gap-2.5 animate-fade-in ${
          actionMessage.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
          actionMessage.type === "error" ? "bg-red-50 text-red-800 border-red-200" :
          "bg-indigo-50 text-indigo-800 border-indigo-200"
        }`}>
          {actionMessage.type === "success" && <FileCheck className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />}
          {actionMessage.type === "error" && <AlertTriangle className="w-4.5 h-4.5 text-red-600 shrink-0 mt-0.5" />}
          {actionMessage.type === "info" && <Info className="w-4.5 h-4.5 text-indigo-600 shrink-0 mt-0.5" />}
          <div>{actionMessage.text}</div>
          <button className="ml-auto hover:opacity-60 text-[10px]" onClick={() => setActionMessage(null)}>Đóng</button>
        </div>
      )}

      {/* ========================================================
          LIST MODE: Dashboard Statistics & Table
          ======================================================== */}
      {viewMode === "list" && (
        <div className="space-y-6">
          
          {/* Visual KPI Mini Dashboards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-250/60 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tổng giá trị tư vấn</p>
                <h4 className="text-sm md:text-base font-extrabold font-mono text-gray-900">{calculatedStats.totalValue.toLocaleString("vi-VN")} đ</h4>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-250/60 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Đang đàm phán</p>
                <h4 className="text-sm md:text-base font-extrabold font-mono text-gray-900">{calculatedStats.negotiatingValue.toLocaleString("vi-VN")} đ</h4>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-250/60 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Đã chốt hợp đồng</p>
                <h4 className="text-sm md:text-base font-extrabold font-mono text-gray-900">{calculatedStats.approvedValue.toLocaleString("vi-VN")} đ</h4>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-250/60 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tổng số hồ sơ</p>
                <h4 className="text-sm md:text-base font-extrabold font-mono text-blue-900">{calculatedStats.totalCount} bản ghi</h4>
              </div>
            </div>
          </div>

          {/* FILTERS PANEL */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200/70 shadow-xs space-y-3.5">
            <h4 className="text-[10.5px] uppercase font-black text-slate-400 tracking-wider">Mạng lưới bộ lọc báo giá</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Query search searchbar */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Mã báo giá, đối tác, cty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 outline-none text-xs bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Staff filter dropdown */}
              <select
                value={filterStaff}
                onChange={(e) => setFilterStaff(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-gray-200 outline-none text-xs bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">-- Theo nhân viên phụ trách --</option>
                {uniqueStaff.map((email, i) => (
                  <option key={i} value={email}>{email}</option>
                ))}
              </select>

              {/* Status filter dropdown */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-gray-200 outline-none text-xs bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">-- Theo trạng thái --</option>
                {STATUSES.map((status, i) => (
                  <option key={i} value={status}>{status}</option>
                ))}
              </select>

              {/* Time age filter */}
              <select
                value={filterDays}
                onChange={(e) => setFilterDays(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-gray-200 outline-none text-xs bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">Mọi thời đại</option>
                <option value="7">Năm sinh 7 ngày gần đây</option>
                <option value="30">Trong phạm vi 30 ngày qua</option>
              </select>
            </div>
          </div>

          {/* DATA TABLE */}
          <div className="bg-white rounded-2xl border border-gray-200/70 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-4">Mã báo giá</th>
                    <th className="p-4">Doanh nghiệp</th>
                    <th className="p-4">Người phụ trách</th>
                    <th className="p-4">Ngày tạo</th>
                    <th className="p-4 text-right">Trị giá thanh toán</th>
                    <th className="p-4 text-center">Trạng thái</th>
                    <th className="p-4">Hạn hiệu lực</th>
                    <th className="p-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredQuotations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-400 font-medium">
                        Không phát hiện bảng báo giá nào thỏa mãn điều kiện lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredQuotations.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50/55 transition-colors font-medium">
                        <td className="p-4 font-mono font-bold text-slate-900">{q.code}</td>
                        <td className="p-4">
                          <p className="font-bold text-slate-800 text-xs">{q.company}</p>
                          <p className="text-[10px] text-gray-400">{q.customerName} | {q.phone || "N/A"}</p>
                        </td>
                        <td className="p-4">
                          <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold">{q.assignedTo.split("@")[0]}</span>
                        </td>
                        <td className="p-4 text-gray-500 font-mono text-[10.5px]">{q.createdAt}</td>
                        <td className="p-4 text-right font-extrabold font-mono text-rose-700 text-xs">{q.totalAmount.toLocaleString("vi-VN")} đ</td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(q.status)}`}>
                            {q.status}
                          </span>
                        </td>
                        <td className="p-4 text-gray-500 font-mono text-[10.5px]">{q.expiryDate}</td>
                        <td className="p-4">
                          <div className="flex justify-center items-center gap-1.5">
                            
                            {/* Edit Action */}
                            <button
                              onClick={() => handleEditClick(q)}
                              className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg hover:text-indigo-600"
                              title="Sửa báo giá chuyên nghiệp"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {/* Export PDF Action */}
                            <button
                              onClick={() => handleDownloadPDF(q)}
                              className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg hover:text-emerald-600"
                              title="Biên dịch tệp PDF chuẩn A4"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {/* Send Email Action */}
                            <button
                              onClick={() => handleSendEmail(q)}
                              className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg hover:text-blue-600"
                              title="Gửi thư điện tử kèm đính kèm PDF đóng mộc đỏ"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>

                            {/* Convert to pipeline contract if accepted */}
                            {["Chấp nhận", "Đàm phán", "Đang xem xét"].includes(q.status) && (
                              <button
                                onClick={() => handleConvertContractToProject(q)}
                                className="p-1.5 bg-emerald-55 hover:bg-emerald-100 text-emerald-800 rounded-lg"
                                title="Chuyển hóa hồ sơ bàn giao thành Dự án triển khai"
                              >
                                <Briefcase className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Danger deleting option */}
                            {(currentUser.role === "ADMIN" || currentUser.role === "CEO") && (
                              <button
                                onClick={() => handleDeleteQuotation(q.id, q.code)}
                                className="p-1.5 hover:bg-red-55 hover:text-red-600 text-gray-400 rounded-lg transition-colors"
                                title="Xóa hồ sơ lưu vĩnh viễn"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          EDITOR & CREATOR MODE (Interactive Forms)
          ======================================================== */}
      {viewMode === "editor" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Workspace Form (Left/Center) */}
          <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-6">
            
            {/* Header section of creator */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase">
                  {isEditMode ? `Cập nhật hồ sơ Báo giá #${quoteCode}` : "Tạo lập phương án tài chính & Kế hoạch"}
                </h3>
                <p className="text-[10px] text-gray-450">Hãy điền thông tin và lựa chọn cấu hình các dịch vụ cung ứng TOLUCK.</p>
              </div>

              {/* Status display */}
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="text-gray-400 font-medium">Trạng thái:</span>
                <select
                  value={quoteStatus}
                  onChange={(e) => setQuoteStatus(e.target.value as Quotation["status"])}
                  className={`px-2 py-1 rounded-lg border text-[11px] font-bold ${getStatusColor(quoteStatus)} outline-none`}
                >
                  {STATUSES.map((st, i) => (
                    <option key={i} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Part 1: Client details cards */}
            <div className="space-y-4">
              <h4 className="text-[10.5px] font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                <span>Thành phần Đối tác & Thông tin liên hệ</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                {/* Select CRM lead for auto populate (Only allowed on creation) */}
                {!isEditMode && (
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Truy lục CRM Lead nhanh (Đồng bộ CMS)</label>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-250 bg-white text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-705"
                    >
                      <option value="">-- Click để liên kết nhanh với khách hàng có sẵn trong CRM --</option>
                      {crms.map((lead) => (
                        <option key={lead.id} value={lead.id}>{lead.company} ({lead.contact})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Tên Doanh nghiệp / Công ty *</label>
                  <div className="relative">
                    <Building className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Công ty CP TOLUCK Agency"
                      value={companyInput}
                      onChange={(e) => setCompanyInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-250 text-xs outline-none focus:ring-2 focus:ring-indigo-505/20 bg-white font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Người đại diện liên hệ *</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Võ Thị Thúy"
                      value={contactInput}
                      onChange={(e) => setContactInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-250 text-xs outline-none focus:ring-2 focus:ring-indigo-505/20 bg-white font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Địa chỉ Email nhận thư</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      placeholder="info@toluck.vn"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-250 text-xs outline-none focus:ring-2 focus:ring-indigo-505/20 bg-white font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Số điện thoại liên lạc</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="0963 484 365"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-250 text-xs outline-none focus:ring-2 focus:ring-indigo-505/20 bg-white font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Part 2: Quote details Services Lists */}
            <div className="space-y-4 pt-3 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <h4 className="text-[10.5px] font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Giải pháp chi tiết & Cơ cấu đầu tư</span>
                </h4>

                <button
                  onClick={handleAddServiceItem}
                  className="px-2.5 py-1 bg-indigo-50 text-indigo-650 hover:bg-indigo-100 border border-indigo-200 text-[10px] font-black uppercase rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Dịch vụ tự chọn</span>
                </button>
              </div>

              {/* Dynamic services listing rows */}
              <div className="space-y-4">
                {servicesInput.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl border border-gray-200 bg-slate-50/25 space-y-3 relative group">
                    <button
                      onClick={() => handleRemoveServiceItem(idx)}
                      className="p-1 hover:bg-rose-50 text-gray-300 hover:text-rose-600 rounded-lg absolute right-3 top-3 transition-colors opacity-60 group-hover:opacity-100"
                      title="Xóa dòng dịch vụ"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                      {/* Service name selector or manual typing */}
                      <div className="sm:col-span-8 space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Tên dịch vụ đề xuất</label>
                        <select
                          value={item.name}
                          onChange={(e) => handleServiceFieldChange(idx, "name", e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs outline-none font-bold text-slate-800"
                        >
                          <option value="">-- Gõ tùy ý hoặc chọn từ thư viện --</option>
                          {SERVICE_LIBRARY.map((lib, x) => (
                            <option key={x} value={lib.name}>{lib.name} ({lib.price.toLocaleString()}đ)</option>
                          ))}
                          {item.name && !SERVICE_LIBRARY.some(l => l.name === item.name) && (
                            <option value={item.name}>{item.name} (Tùy chỉnh)</option>
                          )}
                        </select>
                      </div>

                      {/* Manual text backup just in case name needs quick fine-tune */}
                      <div className="sm:col-span-8 space-y-1">
                        <input
                          type="text"
                          placeholder="Hoặc tùy biến tên chiến dịch..."
                          value={item.name}
                          onChange={(e) => handleServiceFieldChange(idx, "name", e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white/70"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Số lượng</label>
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => handleServiceFieldChange(idx, "qty", e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-center font-mono font-bold"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1 text-right">
                        <label className="text-[9px] font-bold text-gray-400 uppercase block pl-2">Thành tiền (đ)</label>
                        <div className="text-xs font-mono font-extrabold text-slate-900 mt-2">
                          {(item.total || 0).toLocaleString()} đ
                        </div>
                      </div>

                      <div className="sm:col-span-12 space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Chi tiết giải pháp bàn giao phạm vi công việc</label>
                        <textarea
                          rows={1}
                          placeholder="Mô tả cụ thể cam kết tần suất bài viết, số từ khóa SEO, thời gian hoàn thành..."
                          value={item.desc}
                          onChange={(e) => handleServiceFieldChange(idx, "desc", e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs bg-white text-slate-700 outline-none"
                        />
                      </div>

                      <div className="sm:col-span-4 space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Đơn giá áp dụng (đ)</label>
                        <input
                          type="number"
                          value={item.price}
                          step={500000}
                          onChange={(e) => handleServiceFieldChange(idx, "price", e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Part 3: Allowances (Discount, VAT, Note) */}
            <div className="space-y-4 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="text-[10.5px] font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5" />
                  <span>Chiết khấu & Điều khoản thuế</span>
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase">Giảm giá (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                      className="w-full px-3 py-1.5 rounded-xl border border-gray-250 text-xs font-bold font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase">Thuế GTGT VAT (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={vatPercent}
                      onChange={(e) => setVatPercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                      className="w-full px-3 py-1.5 rounded-xl border border-gray-250 text-xs font-bold font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase">Hạn hiệu lực báo giá</label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="date"
                      value={expiryDateInput}
                      onChange={(e) => setExpiryDateInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-250 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Note options */}
              <div className="space-y-3">
                <h4 className="text-[10.5px] font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Cam kết và thỏa ước ghi chú</span>
                </h4>

                <div className="space-y-1">
                  <textarea
                    rows={4}
                    placeholder="Nhập ghi chú pháp lý hoặc cam kết kỹ thuật..."
                    value={quoteNotes}
                    onChange={(e) => setQuoteNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-250 text-xs bg-gray-50/50 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Form actions */}
            <div className="flex justify-end gap-3.5 border-t border-gray-100 pt-5">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={() => handleSaveQuotation("Nháp")}
                disabled={isSubmitting}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 border border-slate-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Đặt lưu..." : "Lưu Nháp"}
              </button>

              <button
                type="button"
                onClick={() => handleSaveQuotation()}
                disabled={isSubmitting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? "Đang xử lý..." : isEditMode ? "Lưu thay đổi" : "Khởi tạo chính thức"}
              </button>
            </div>

          </div>

          {/* Right Rail Details: Live PDF Branding Checklist, Library */}
          <div className="space-y-6">
            
            {/* Live Computations Box */}
            <div className="bg-slate-900 text-white p-5 rounded-3xl border border-gray-800 shadow-lg space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Hạch toán tự động tương tác</span>
              </h3>

              <div className="space-y-2.5 text-xs font-medium border-b border-gray-800 pb-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Tạm tính (Lũy kế):</span>
                  <span className="font-mono font-bold text-gray-250">{subtotal.toLocaleString()} đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Chiết khấu ({discountPercent}%):</span>
                  <span className="font-mono font-bold text-rose-450">-{discountValue.toLocaleString()} đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Thuế GTGT VAT ({vatPercent}%):</span>
                  <span className="font-mono font-bold text-indigo-350">+{vatValue.toLocaleString()} đ</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 animate-pulse">
                <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">Cộng Thanh Toán:</span>
                <span className="text-lg font-black font-mono text-emerald-400">{totalAmount.toLocaleString()}đ</span>
              </div>
            </div>

            {/* Template Selector Card */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
              <h3 className="text-[10.5px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Layers className="w-3.5 h-3.5" />
                <span>Thiết kế & Mẫu hóa đơn</span>
              </h3>

              <div className="grid grid-cols-1 gap-2.5">
                <button
                  type="button"
                  onClick={() => setTemplateId("template01")}
                  className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all text-xs ${
                    templateId === "template01" ? "border-emerald-600 bg-emerald-50/20" : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="w-5 h-5 bg-emerald-600 rounded-lg shrink-0 shrink flex items-center justify-center text-white text-[10px] font-bold">1</div>
                  <div>
                    <p className="font-bold text-emerald-800">Mẫu 01: TOLUCK Emerald</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Màu xanh mạ lam truyền thống, thanh lịch, chuẩn mực kinh tế ban kiểm thính.</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateId("template02")}
                  className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all text-xs ${
                    templateId === "template02" ? "border-blue-600 bg-blue-50/20" : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="w-5 h-5 bg-blue-600 rounded-lg shrink flex items-center justify-center text-white text-[10px] font-bold">2</div>
                  <div>
                    <p className="font-bold text-blue-800">Mẫu 02: Royal Blue Tech</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Phong cách công nghiệp đột phá công nghệ, chuyên nghiệp cho giải pháp ERP.</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateId("template03")}
                  className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all text-xs ${
                    templateId === "template03" ? "border-indigo-600 bg-indigo-50/20" : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="w-5 h-5 bg-indigo-600 rounded-lg shrink flex items-center justify-center text-white text-[10px] font-bold">3</div>
                  <div>
                    <p className="font-bold text-indigo-805">Mẫu 03: Premium Indigo</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Xu hướng thiết kế số hóa tối tân, thích hợp các hợp đồng AI dồi dào tài chính.</p>
                  </div>
                </button>
              </div>

              {/* Automatic elements checklists */}
              <div className="mt-3 bg-gray-50 p-3 rounded-xl space-y-2 border border-slate-100 text-[11px] text-slate-505 font-medium leading-relaxed">
                <p className="font-bold text-slate-700 select-none pb-1.5 border-b border-gray-200 uppercase text-[9px] tracking-wider">Hạ tầng tự động hóa đi kèm:</p>
                <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Tự động tích hợp Logo TOLUCK</div>
                <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Tự động đính Trụ sở & Giấy phép GĐK</div>
                <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Ký tên số tự động của GĐ Võ Thị Thúy</div>
                <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Cộp dấu mộc đỏ Công ty (Mẫu tròn chuẩn)</div>
                <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Tích hợp mã VietQR MB Bank biến động tiền</div>
              </div>
            </div>

            {/* Quick Service Library Picker */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
              <h3 className="text-[10.5px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Bàn phím chọn nhanh thư viện TOLUCK</span>
              </h3>

              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                {SERVICE_LIBRARY.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleQuickAppendService(item)}
                    className="w-full text-left p-2 hover:bg-slate-55 border border-transparent hover:border-slate-200 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{item.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{item.price.toLocaleString("vi-VN")} đ</p>
                    </div>
                    <div className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-lg">Add</div>
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

/**
 * types.ts
 * Shared TypeScript types for TOLUCK Agency Marketing Survey & AI Report
 */

export interface SurveyData {
  company_name: string;
  website: string;
  fanpage: string;
  industry: string;
  year_established: string;
  employee_count: string;
  contact_name: string;
  position: string;
  email: string;
  phone: string;
  business_model: string;
  target_customer: string;
  revenue: string;
  goal: string;
  marketing_status: string;
  channels: string[];
  unused_channels?: string[];
  marketing_budget: string;
  pain_points: string[];
  strengths: string;
  unique_selling_point: string;
  competitors: string;
  brand_positioning: string;
  digital_assets: string[];
  tracking_tools: string[];
  services_needed: string[];
  service_budget: string;
}

export interface SwotAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface ScoreBreakdown {
  infrastructure: number;
  budget: number;
  strategy: number;
  branding: number;
}

export interface ChannelStrategyItem {
  channelName: string;
  priority: string;
  reason: string;
  actionRequired: string;
}

export interface PainPointSolutionItem {
  painPoint: string;
  solution: string;
}

export interface AIReport {
  readinessScore: number;
  maturityGrade: string;
  swotAnalysis: SwotAnalysis;
  scoreBreakdown: ScoreBreakdown;
  channelStrategy: ChannelStrategyItem[];
  painPointSolutions: PainPointSolutionItem[];
  recommendations: string[];
  consultantOpinion: string;
}

export interface QuotationServiceItem {
  id?: string;
  name: string;
  desc: string;
  qty: number;
  price: number;
  total: number;
}

export interface QuotationSentHistory {
  date: string;
  toEmail: string;
  status: string;
}

export interface Quotation {
  id: string; // e.g. "qt-1780564111779"
  code: string; // e.g. "QT-2026-0001"
  customerId: string; // links to Lead ID "crm-..."
  customerName: string; // Representative contact
  company: string; // Company Name
  email: string;
  phone: string;
  assignedTo: string; // Employee email in charge
  createdAt: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  services: QuotationServiceItem[];
  subtotal: number; // Tạm tính
  discountPercent: number; // % Chiết khấu
  discountValue: number; // Giá trị chiết khấu
  vatPercent: number; // % VAT
  vatValue: number; // Giá trị VAT
  totalAmount: number; // Tổng cộng thanh toán
  notes: string; // Ghi chú báo giá
  status: "Nháp" | "Đã gửi khách" | "Đang xem xét" | "Đàm phán" | "Chấp nhận" | "Từ chối" | "Hết hiệu lực" | "Chuyển hợp đồng";
  templateId: "template01" | "template02" | "template03";
  pdfUrl?: string; // Generated PDF file url
  sentHistory?: QuotationSentHistory[]; // Email shipment log
}

export interface CRMProject {
  id: string;
  leadId: string;
  company: string;
  name: string;
  status: "Lập kế hoạch" | "Đang triển khai" | "Đang nghiệm thu" | "Hoàn thành" | "Tạm ngưng";
  startDate: string;
  endDate: string;
  notes: string;
  budget: number;
  services: string[];
}


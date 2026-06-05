import React, { useState } from "react";
import { Settings, BarChart2, CheckCircle2, ShieldCheck, Link2, Sparkles, Database, FileText, LayoutDashboard, User, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HeaderProps {
  webhookUrl: string;
  setWebhookUrl: (url: string) => void;
  geminiStatus: "idle" | "loading" | "success" | "error";
  geminiError?: string;
  onSendTestPayload: () => void;
  onLoadStaticTestData: () => void;
  activeView: "CLIENT" | "CMS";
  setActiveView: (view: "CLIENT" | "CMS") => void;
  currentUser?: any;
  onLogout?: () => void;
  onOpenLogin?: () => void;
  logo?: string;
  companyName?: string;
  companySubtitle?: string;
}

export default function Header({
  webhookUrl,
  setWebhookUrl,
  geminiStatus,
  geminiError,
  onSendTestPayload,
  onLoadStaticTestData,
  activeView,
  setActiveView,
  currentUser,
  onLogout,
  onOpenLogin,
  logo,
  companyName,
  companySubtitle,
}: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [tempUrl, setTempUrl] = useState(webhookUrl);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setWebhookUrl(tempUrl);
    setShowSettings(false);
  };

  const isAdmin = currentUser?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-xs" id="toluck-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Agency Title */}
          <div className="flex items-center space-x-3 py-1">
            {logo ? (
              <img 
                src={logo} 
                alt={companyName || "Logo"} 
                className="h-11 sm:h-12 md:h-13 w-auto max-w-[200px] object-contain transition-all"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-600 text-white shadow-xs">
                <span className="font-bold text-lg sm:text-xl tracking-wider">T</span>
              </div>
            )}
            <div>
              <h1 className="font-extrabold text-slate-900 tracking-tight text-xs sm:text-sm uppercase leading-tight">
                {companyName || "TOLUCK AGENCY"}
              </h1>
              <p className="text-[9px] uppercase tracking-widest text-emerald-600 font-extrabold">{companySubtitle || "Digital & AI Agency"}</p>
            </div>
          </div>

          {/* Right Status Panel */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Display logged in user info & Logout */}
            {currentUser ? (
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-slate-700 text-xs sm:text-sm font-semibold max-w-[200px] sm:max-w-xs shrink-0 shadow-2xs">
                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0 uppercase">
                  {currentUser.name ? currentUser.name.charAt(0) : "U"}
                </div>
                <div className="flex flex-col text-left truncate leading-tight">
                  <span className="truncate max-w-[80px] sm:max-w-[120px] font-bold text-slate-800">{currentUser.name}</span>
                  <span className="text-[9px] text-indigo-500 font-bold uppercase">{currentUser.role === "ADMIN" ? "Admin" : currentUser.role === "CEO" ? "CEO" : "Thành viên"}</span>
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors ml-1 shrink-0"
                    title="Đăng xuất khỏi tài khoản"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center space-x-1.5 py-2 px-3 sm:px-4 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100/80 transition-all text-xs sm:text-sm font-bold text-blue-700 cursor-pointer shadow-2xs"
                title="Đăng nhập tài khoản"
              >
                <User className="w-4 h-4 shrink-0 text-blue-600" />
                <span>Đăng Nhập</span>
              </button>
            )}

            {/* CMS Toggle Button to navigate admin panel - Only displayed to admin */}
            {isAdmin && (
              <button
                onClick={() => setActiveView(activeView === "CLIENT" ? "CMS" : "CLIENT")}
                className={`flex items-center space-x-1.5 py-2 px-3 sm:px-4 rounded-xl transition-all text-xs sm:text-sm font-black cursor-pointer ${
                  activeView === "CMS"
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md animate-pulse"
                    : "bg-amber-100 hover:bg-amber-200 ring-1 ring-amber-300/50 text-amber-800"
                }`}
                title="Chuyển đổi giao diện giữa Khách hàng Khảo sát và Ban quản trị CMS"
                id="cms-toggle-btn"
              >
                {activeView === "CMS" ? (
                  <>
                    <FileText className="w-4 h-4 text-white shrink-0" />
                    <span>Về Khảo Sát</span>
                  </>
                ) : (
                  <>
                    <LayoutDashboard className="w-4 h-4 shrink-0 text-amber-700" />
                    <span>Quản Trị CMS</span>
                  </>
                )}
              </button>
            )}

            {/* Direct load static test data - Only displayed to admin */}
            {isAdmin && activeView === "CLIENT" && (
              <button
                onClick={onLoadStaticTestData}
                className="flex items-center space-x-1.5 py-2 px-3 sm:px-4 rounded-xl bg-teal-50 hover:bg-teal-100 ring-1 ring-teal-200/50 text-teal-700 transition-all text-xs sm:text-sm font-bold cursor-pointer"
                title="Xem ngay báo cáo với dữ liệu mẫu cố định (tiết kiệm token, không gọi webhook)"
                id="load-static-test-btn"
              >
                <Database className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Test với data có sẵn</span>
              </button>
            )}

            {/* Quick Test Webhook button - Only displayed to admin */}
            {isAdmin && activeView === "CLIENT" && (
              <button
                onClick={onSendTestPayload}
                className="flex items-center space-x-1.5 py-2 px-3 sm:px-4 rounded-xl bg-blue-50 hover:bg-blue-100 ring-1 ring-blue-200/50 text-blue-700 transition-all text-xs sm:text-sm font-bold cursor-pointer"
                title="Tự động tạo điền thông tin khảo sát mẫu và gửi test đến Webhook"
                id="send-test-payload-btn"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse shrink-0" />
                <span>Payload Test</span>
              </button>
            )}

            {/* Custom Settings Config - Only displayed to admin */}
            {isAdmin && activeView === "CLIENT" && (
              <button
                onClick={() => {
                  setTempUrl(webhookUrl);
                  setShowSettings(!showSettings);
                }}
                className="flex items-center space-x-1.5 py-2 px-2.5 sm:px-4 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 transition-all text-xs sm:text-sm font-medium border border-gray-200 cursor-pointer"
                aria-label="Cấu hình Webhook"
                id="webhook-config-btn"
              >
                <Settings className="w-4 h-4 text-gray-500" />
                <span className="hidden md:inline">Cấu hình Webhook</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Webhook configuration dropdown dialog */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 right-0 left-0 bg-white border-b border-gray-200 shadow-xl py-6 px-4 z-50"
            id="webhook-settings-panel"
          >
            <div className="max-w-3xl mx-auto">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-blue-600" />
                    Cấu hình Webhook gửi dữ liệu (POST)
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Theo yêu cầu hệ thống, biểu mẫu hoàn thành sẽ tự động tạo một HTTP POST gửi về webhook. 
                    Bạn có thể sửa địa chỉ này thành URL n8n thực tế hoặc mock URL của bạn để kiểm nghiệm.
                  </p>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="url"
                    value={tempUrl}
                    onChange={(e) => setTempUrl(e.target.value)}
                    placeholder="https://YOUR-N8N-WEBHOOK"
                    required
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-mono text-gray-700 placeholder-gray-400 bg-gray-50"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
                  >
                    Lưu cấu hình
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-100 text-xs">
                  <div className="flex items-center gap-2 text-gray-600">
                    <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                    <span><b>Lưu ý:</b> Dữ liệu payload JSON sẽ được gửi chính xác theo định dạng yêu cầu.</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <BarChart2 className="w-4 h-4 text-blue-500 shrink-0" />
                    <span><b>AI Assistant:</b> Server sẽ đồng thời tạo một Báo cáo Sẵn sàng Marketing chuyên nghiệp thông qua mô hình Gemini 3.5.</span>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

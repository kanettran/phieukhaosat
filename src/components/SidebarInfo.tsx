import React from "react";
import { Shield, Sparkles, TrendingUp, Users, Target, Rocket } from "lucide-react";

export default function SidebarInfo() {
  return (
    <div className="space-y-6 text-gray-700 font-sans" id="sidemenu-info-panel">
      {/* TOLUCK Mission Banner */}
      <div className="p-6 rounded-2xl bg-[#0F172A] text-slate-200 shadow-xl relative overflow-hidden">
        {/* Abstract decorative graphic */}
        <div className="absolute right-0 top-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-blue-500/10 blur-xl"></div>
        <div className="absolute left-10 bottom-0 w-24 h-24 rounded-full bg-teal-500/10 blur-xl"></div>

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3 h-3 text-teal-300" />
            TỐI ƯU TĂNG TRƯỞNG
          </span>
          <h3 className="text-xl font-bold tracking-tight text-white mb-2 leading-snug">
            Giải pháp phòng Marketing thuê ngoài toàn diện
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed font-light mb-6">
            Không tốn chi phí xây dựng cơ cấu, không lo nhân sự rời đi. TOLUCK mang đến hệ thống nhân sự tinh nhuệ nhất từ Chiến lược gia, Content, Designer, Ads và Automation để đồng hành cùng mục tiêu phát triển của bạn.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div>
              <p className="text-2xl font-black text-blue-400 tracking-tight">95%</p>
              <p className="text-[11px] text-slate-300 mt-1 uppercase font-medium tracking-wider">Doanh nghiệp hài lòng</p>
            </div>
            <div>
              <p className="text-2xl font-black text-blue-400 tracking-tight">3.5x</p>
              <p className="text-[11px] text-slate-300 mt-1 uppercase font-medium tracking-wider">Tỷ lệ chuyển đổi Ads</p>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose TOLUCK list */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-5">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          LỢI THẾ CỦA DOANH NGHIỆP KHI HỢP TÁC
        </h4>

        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-none p-2 w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-semibold text-slate-900">Chiến lược định hướng dữ liệu</h5>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Tổ chức phân tích kỹ tệp khách mục tiêu, đối thủ và hành vi để thiết lập phễu đúng ngay từ đầu.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-none p-2 w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-semibold text-slate-900">Tiết kiệm 70% ngân sách vận hành</h5>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Sở hữu trọn gói một phòng Marketing đa nhiệm chuẩn quốc tế chỉ bằng ngân sách thuê một nhân sự cứng.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-none p-2 w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-semibold text-slate-900">Hạ tầng Digital chuẩn chỉnh</h5>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Cài đặt đầy đủ các tracking tool, đo lường rõ ràng, báo cáo tự động hiệu suất đầu tư quảng cáo.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Quote block */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] italic relative text-sm text-slate-600">
        <p className="relative z-10 leading-relaxed">
          &ldquo;Doanh nghiệp vừa và nhỏ thường mất ít nhất 6 tháng đến 1 năm để thử và sai khi tự xây phòng Marketing. Giải pháp thuê ngoài giúp họ bứt phá nhanh gấp 3 lần với chi phí tối ưu.&rdquo;
        </p>
        <div className="mt-4 flex items-center gap-2.5 not-italic">
          <div className="w-8 h-8 rounded-full bg-[#0F172A] flex items-center justify-center text-white font-bold text-xs shadow-inner">
            TL
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-950">Mạnh Cường Đặng</p>
            <p className="text-[10px] text-slate-400">Trưởng bộ phận Chiến lược, TOLUCK</p>
          </div>
        </div>
      </div>
    </div>
  );
}

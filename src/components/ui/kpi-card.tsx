import { type LucideIcon } from "lucide-react";

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  className?: string;
}

export function KpiCard({ icon: Icon, label, value, className }: KpiCardProps) {
  return (
    <div className={`bg-white flex items-center gap-3 p-[25px] rounded-[24px] border border-[rgba(247,247,247,0.3)] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] ${className || ""}`}>
      <div className="bg-[#e1ebef] rounded-full p-3 shrink-0">
        <Icon size={20} className="text-[#08526e]" />
      </div>
      <div className="flex flex-col min-w-0">
        <p className="text-[#737373] text-xs leading-4">{label}</p>
        <p className="text-[#262626] text-base font-semibold leading-6">{value}</p>
      </div>
    </div>
  );
}

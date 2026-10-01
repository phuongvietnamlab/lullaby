import { Hotel } from "lucide-react";

type AdminLoadingProps = {
  label?: string;
  className?: string;
};

export function AdminLoading({ label = "Đang tải dữ liệu", className = "" }: AdminLoadingProps) {
  return (
    <div className={`admin-loading-state ${className}`} role="status" aria-live="polite">
      <span className="admin-loading-orbit" aria-hidden="true">
        <Hotel className="admin-loading-icon" size={23} strokeWidth={1.9} />
      </span>
      <span className="admin-loading-label">{label}</span>
      <span className="sr-only">Đang tải</span>
    </div>
  );
}

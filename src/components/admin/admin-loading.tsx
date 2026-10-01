import { Hotel, LoaderCircle } from "lucide-react";

type AdminLoadingProps = {
  label?: string;
  className?: string;
};

export function AdminLoading({ label = "Đang tải dữ liệu", className = "" }: AdminLoadingProps) {
  return (
    <div className={`admin-loading-state ${className}`} role="status" aria-live="polite">
      <span className="admin-loading-mark" aria-hidden="true">
        <LoaderCircle className="admin-loading-spinner" size={48} strokeWidth={1.8} />
        <Hotel className="admin-loading-hotel" size={17} strokeWidth={2.1} />
      </span>
      <span className="admin-loading-label">{label}</span>
      <span className="sr-only">Đang tải</span>
    </div>
  );
}

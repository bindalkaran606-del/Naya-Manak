import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck } from "lucide-react";

interface StatusBadgeProps {
  status: "current" | "under_revision" | "withdrawn" | string;
  reaffirmationYear?: number | null;
  qcoMandatory?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  reaffirmationYear,
  qcoMandatory,
  className = "",
}) => {
  const id = `standard-status-${React.useId().replace(/[^a-zA-Z0-9-]/g, "").toLowerCase()}`;
  const normalized = (status || "current").toLowerCase();

  let badgeStyle = "text-emerald-800";
  let label = "Current";
  let icon = <CheckCircle2 className="w-3 h-3 text-emerald-600" />;

  if (normalized.includes("revision") || normalized === "under_revision") {
    badgeStyle = "text-amber-800";
    label = "Under revision";
    icon = <AlertTriangle className="w-3 h-3 text-amber-600" />;
  } else if (normalized.includes("withdraw") || normalized === "withdrawn" || normalized === "superseded") {
    badgeStyle = "text-rose-800";
    label = "Withdrawn / superseded";
    icon = <XCircle className="w-3 h-3 text-rose-600" />;
  }

  return (
    <div className={`standard-status inline-flex flex-wrap items-center gap-x-3 gap-y-1 ${className}`} data-testid={id}>
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-sans ${badgeStyle}`}
        data-testid={`${id}-label`}
      >
        {icon}
        <span>{label}</span>
        {reaffirmationYear && (
          <span className="text-[11px] text-slate-500" title={`Reaffirmed in ${reaffirmationYear}`} data-testid={`${id}-reaffirmation`}>· {reaffirmationYear}</span>
        )}
      </span>

      {qcoMandatory && (
        <span
          className="inline-flex items-center gap-1.5 text-xs text-[#334155] border-l border-[#E5DFD5] pl-3"
          title="Covered under Mandatory Quality Control Order (QCO)"
          data-testid={`${id}-qco`}
        >
          <ShieldCheck className="w-3 h-3 text-[#334155]" />
          <span>Mandatory QCO</span>
        </span>
      )}
    </div>
  );
};

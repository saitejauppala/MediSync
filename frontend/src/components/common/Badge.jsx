import React from 'react';
import { ShieldCheck, AlertCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-[#202020] text-text-secondary border-border',
    red: 'bg-[#202020] text-white border-[#404040]',
    redSolid: 'bg-white text-black border-transparent',
    emergency: 'bg-[#262626] text-white border-[#525252] font-semibold',
    verified: 'bg-[#202020] text-[#d4d4d4] border-[#404040]',
    pending: 'bg-[#202020] text-[#a3a3a3] border-[#404040]',
    confirmed: 'bg-[#202020] text-[#d4d4d4] border-[#404040]',
    rejected: 'bg-[#202020] text-[#a3a3a3] border-[#404040]',
    completed: 'bg-[#202020] text-[#d4d4d4] border-[#404040]',
    cancelled: 'bg-[#202020] text-text-secondary border-[#404040]',
    govt: 'bg-zinc-800 text-zinc-200 border-zinc-700',
    private: 'bg-[#202020] text-[#d4d4d4] border-[#404040]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        variants[variant] || variants.default
      } ${className}`}
    >
      {children}
    </span>
  );
};

export const VerifiedBadge = ({ isVerified = true }) => {
  if (!isVerified) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#202020] text-[#d4d4d4] border border-[#404040]">
      <ShieldCheck className="w-3 h-3 text-[#d4d4d4]" />
      Verified Hospital
    </span>
  );
};

export const EmergencyBadge = ({ hasEmergency = true, label = '24/7 Emergency' }) => {
  if (!hasEmergency) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#262626] text-white border border-[#525252]">
      <AlertCircle className="w-3 h-3 text-white" />
      {label}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const configs = {
    pending: { label: 'Pending Review', variant: 'pending', icon: Clock },
    confirmed: { label: 'Confirmed', variant: 'confirmed', icon: CheckCircle2 },
    rejected: { label: 'Declined', variant: 'rejected', icon: XCircle },
    completed: { label: 'Completed', variant: 'completed', icon: CheckCircle2 },
    cancelled: { label: 'Cancelled', variant: 'cancelled', icon: XCircle },
  };

  const config = configs[status] || { label: status, variant: 'default', icon: Clock };
  const Icon = config.icon;

  return (
    <Badge variant={config.variant}>
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
    </Badge>
  );
};

export default Badge;

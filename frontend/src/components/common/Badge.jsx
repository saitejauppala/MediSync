import React from 'react';
import { ShieldCheck, AlertCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-[#202020] text-text-secondary border-border',
    red: 'bg-red-950/60 text-red-400 border-red-900/60',
    redSolid: 'bg-red-600 text-white border-transparent',
    emergency: 'bg-red-900/80 text-white border-red-500/80 animate-pulse font-bold',
    verified: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
    pending: 'bg-amber-950/60 text-amber-400 border-amber-800/60',
    confirmed: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
    rejected: 'bg-red-950/80 text-red-300 border-red-900',
    completed: 'bg-blue-950/60 text-blue-400 border-blue-800/60',
    cancelled: 'bg-[#202020] text-text-secondary border-[#404040]',
    govt: 'bg-zinc-800 text-zinc-200 border-zinc-700',
    private: 'bg-red-950/40 text-red-300 border-red-800/40',
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
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/70">
      <ShieldCheck className="w-3 h-3 text-emerald-400" />
      Verified Hospital
    </span>
  );
};

export const EmergencyBadge = ({ hasEmergency = true }) => {
  if (!hasEmergency) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-900 text-white border border-red-500 shadow-sm shadow-red-500/30">
      <AlertCircle className="w-3 h-3 text-white" />
      24/7 Emergency
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

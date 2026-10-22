import React from 'react';

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'primary',
  badgeText
}) {
  const variantStyles = {
    primary: {
      bg: 'bg-white',
      border: 'border-slate-200/80',
      iconBg: 'bg-sky-50 text-sky-600',
      valueColor: 'text-slate-900'
    },
    success: {
      bg: 'bg-white',
      border: 'border-emerald-200/80',
      iconBg: 'bg-emerald-50 text-emerald-600',
      valueColor: 'text-emerald-700'
    },
    warning: {
      bg: 'bg-white',
      border: 'border-amber-200/80',
      iconBg: 'bg-amber-50 text-amber-600',
      valueColor: 'text-amber-700'
    },
    danger: {
      bg: 'bg-white',
      border: 'border-rose-200/80',
      iconBg: 'bg-rose-50 text-rose-600',
      valueColor: 'text-rose-700'
    },
    neutral: {
      bg: 'bg-white',
      border: 'border-slate-200/80',
      iconBg: 'bg-slate-100 text-slate-600',
      valueColor: 'text-slate-800'
    }
  };

  const style = variantStyles[variant] || variantStyles.primary;

  return (
    <div className={`rounded-2xl border p-5 shadow-xs transition hover:shadow-md ${style.bg} ${style.border}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {Icon && (
          <div className={`rounded-xl p-2.5 ${style.iconBg}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className={`text-3xl font-extrabold tracking-tight ${style.valueColor}`}>
          {value !== undefined && value !== null ? value : '—'}
        </span>
        {badgeText && (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {badgeText}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-slate-500 leading-normal">
          {subtitle}
        </p>
      )}
    </div>
  );
}

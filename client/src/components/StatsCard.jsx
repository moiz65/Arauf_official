import React from 'react';
import { ArrowUp, ArrowDown, Minus, Activity } from 'lucide-react';

const StatsCard = ({ 
  title, 
  amount, 
  currency = 'PKR', 
  change, 
  changeType = 'neutral',
  icon,
  color = 'blue',
  subtitle
}) => {
  // Enhanced color configurations
  const colorConfig = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      accent: 'bg-blue-100',
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      accent: 'bg-green-100',
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      accent: 'bg-red-100',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      accent: 'bg-purple-100',
    },
    yellow: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-600',
      accent: 'bg-yellow-100',
    }
  };

  const changeConfig = {
    up: {
      icon: ArrowUp,
      color: 'text-green-500',
    },
    down: {
      icon: ArrowDown,
      color: 'text-red-500',
    },
    neutral: {
      icon: Minus,
      color: 'text-gray-400',
    },
    warning: {
      icon: ArrowUp,
      color: 'text-yellow-500',
    },
    good: {
      icon: ArrowDown,
      color: 'text-green-500',
    }
  };

  const ChangeIcon = changeConfig[changeType].icon;

  const formatAmount = (value) => {
    if (value >= 1000000) return `${(value/1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value/1000).toFixed(1)}K`;
    return value;
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-xs border border-gray-100 w-full h-full">
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xs font-medium text-gray-500">{title}</h3>
        {icon && (
          <div className={`p-2 rounded-lg ${colorConfig[color].bg} ${colorConfig[color].text}`}>
            {React.cloneElement(icon, { className: 'w-4 h-4' })}
          </div>
        )}
      </div>
      
      {/* Main Content */}
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-lg font-semibold text-gray-900">
          {currency && currency !== '' && `${currency} `}{formatAmount(amount)}
        </span>
        {change && (
          <span className={`text-xs flex items-center ${changeConfig[changeType].color}`}>
            <ChangeIcon className="w-3 h-3 mr-0.5" />
            {change}
          </span>
        )}
      </div>
      
      {/* Subtitle or Mini Trend Indicator */}
      <div className="flex items-center">
        {subtitle ? (
          <span className="text-xs text-gray-500">{subtitle}</span>
        ) : (
          <>
            <Activity className="w-3 h-3 text-gray-400 mr-1" />
            <span className="text-xs text-gray-500">Monthly trend</span>
          </>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
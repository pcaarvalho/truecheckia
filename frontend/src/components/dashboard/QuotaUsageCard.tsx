import { useEffect, useState } from 'react';
import { Activity, Calendar, TrendingUp } from 'lucide-react';
import { authService } from '@/services/api';

interface UsageData {
  currentUsage: number;
  limit: number;
  resetDate: string;
  dailyAverage: number;
}

export const QuotaUsageCard = () => {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    try {
      const response = await authService.get('/api/user/usage');
      setUsage(response.data);
    } catch (error) {
      console.error('Erro ao buscar dados de uso:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = () => {
    if (!usage) return 0;
    return (usage.currentUsage / usage.limit) * 100;
  };

  const getDaysUntilReset = () => {
    if (!usage) return 0;
    const resetDate = new Date(usage.resetDate);
    const today = new Date();
    const diffTime = resetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getUsageColor = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return 'text-red-400';
    if (percentage >= 75) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getProgressBarColor = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 animate-pulse">
        <div className="h-6 bg-slate-700 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-slate-700 rounded w-3/4"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Uso Mensal</h3>
        <Activity size={20} className={getUsageColor()} />
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Análises realizadas</span>
            <span className={`font-medium ${getUsageColor()}`}>
              {usage?.currentUsage || 0} / {usage?.limit || 0}
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
              style={{ width: `${Math.min(getUsagePercentage(), 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-center space-x-2">
            <Calendar size={16} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Renova em</p>
              <p className="text-sm text-white font-medium">{getDaysUntilReset()} dias</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <TrendingUp size={16} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Média diária</p>
              <p className="text-sm text-white font-medium">
                {usage?.dailyAverage?.toFixed(1) || '0.0'} análises
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

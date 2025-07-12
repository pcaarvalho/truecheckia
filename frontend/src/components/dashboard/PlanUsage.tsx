import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { Crown, BarChart3, FileText, AlertCircle, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PlanLimits {
  canAnalyze: boolean;
  canGenerateReport: boolean;
  limits: {
    analyses: {
      used: number;
      max: number;
      remaining: number;
    };
    reports: {
      used: number;
      max: number;
      remaining: number;
    };
    fileSize: number;
    videoLength: number;
  };
  resetDate: string;
}

const PlanUsage: React.FC = () => {
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlanLimits();
  }, []);

  const fetchPlanLimits = async () => {
    try {
      const response = await api.get('/api/plans/check-limits');
      setLimits(response.data.data);
    } catch (error) {
      console.error('Erro ao buscar limites do plano:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const calculatePercentage = (used: number, max: number) => {
    if (max === 0) return 0;
    return Math.round((used / max) * 100);
  };

  const formatResetDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} dias` : 'Hoje';
  };

  if (loading || !limits || !user?.plan) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  const analysesPercentage = calculatePercentage(limits.limits.analyses.used, limits.limits.analyses.max);
  const reportsPercentage = calculatePercentage(limits.limits.reports.used, limits.limits.reports.max);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Crown className="w-6 h-6 text-purple-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Plano {user.plan.plan?.displayName || user.plan.planType}
          </h3>
        </div>
        <button
          onClick={() => navigate('/subscription')}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
        >
          Gerenciar plano
          <ArrowUpRight className="w-4 h-4 ml-1" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Análises */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <BarChart3 className="w-5 h-5 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Análises</span>
            </div>
            <span className="text-sm text-gray-600">
              {limits.limits.analyses.used} / {limits.limits.analyses.max === 99999 ? '∞' : limits.limits.analyses.max}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(analysesPercentage)}`}
              style={{ width: `${limits.limits.analyses.max === 99999 ? 0 : analysesPercentage}%` }}
            />
          </div>
          {!limits.canAnalyze && (
            <p className="text-xs text-red-600 mt-1 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              Limite atingido - Faça upgrade para continuar
            </p>
          )}
        </div>

        {/* Relatórios */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <FileText className="w-5 h-5 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Relatórios</span>
            </div>
            <span className="text-sm text-gray-600">
              {limits.limits.reports.used} / {limits.limits.reports.max === 99999 ? '∞' : limits.limits.reports.max}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(reportsPercentage)}`}
              style={{ width: `${limits.limits.reports.max === 99999 ? 0 : reportsPercentage}%` }}
            />
          </div>
          {!limits.canGenerateReport && (
            <p className="text-xs text-red-600 mt-1 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              Limite atingido - Faça upgrade para continuar
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Limites renovam em: {formatResetDate(limits.resetDate)}</span>
          <div className="flex items-center space-x-4">
            <span>Arquivo: {limits.limits.fileSize}MB</span>
            <span>Vídeo: {limits.limits.videoLength}min</span>
          </div>
        </div>
      </div>

      {user.plan.status === 'TRIAL' && user.plan.trialEndsAt && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <div className="flex-1">
              <p className="text-sm text-yellow-800 font-medium">Período de trial</p>
              <p className="text-xs text-yellow-700">
                Expira em {formatResetDate(user.plan.trialEndsAt)}
              </p>
            </div>
            <button
              onClick={() => navigate('/subscription/upgrade')}
              className="text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
            >
              Assinar agora
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanUsage;
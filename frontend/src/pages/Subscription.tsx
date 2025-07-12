import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { 
  Crown, CreditCard, Calendar, BarChart3, FileText, 
  AlertCircle, Check, X, Loader2, ArrowUpRight, 
  Clock, Gift, Rocket, Briefcase 
} from 'lucide-react';
import toast from 'react-hot-toast';
import PlanUsage from '../components/dashboard/PlanUsage';
import { formatCurrency } from '../utils/formatters';

interface CurrentPlan {
  id: string;
  planId: string;
  planType: string;
  status: string;
  isTrialUsed: boolean;
  trialEndsAt: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string | null;
  analysesUsed: number;
  reportsUsed: number;
  plan: {
    id: string;
    name: string;
    displayName: string;
    description: string;
    price: number;
    currency: string;
    maxAnalyses: number;
    maxFileSize: number;
    maxVideoLength: number;
    maxReports: number;
    features: any;
  };
  usage: {
    analyses: {
      used: number;
      max: number;
      percentage: number;
    };
    reports: {
      used: number;
      max: number;
      percentage: number;
    };
  };
  hasActiveSubscription: boolean;
}

interface AvailablePlan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  price: number;
  currency: string;
  maxAnalyses: number;
  maxFileSize: number;
  maxVideoLength: number;
  maxReports: number;
  features: any;
}

const Subscription: React.FC = () => {
  const [currentPlan, setCurrentPlan] = useState<CurrentPlan | null>(null);
  const [availablePlans, setAvailablePlans] = useState<AvailablePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingPlan, setChangingPlan] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [currentResponse, plansResponse] = await Promise.all([
        api.get('/api/plans/current'),
        api.get('/api/plans/available')
      ]);

      setCurrentPlan(currentResponse.data.data);
      setAvailablePlans(plansResponse.data.data);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar informações do plano');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePlan = async (newPlanId: string) => {
    if (changingPlan) return;
    
    setChangingPlan(newPlanId);
    try {
      const response = await api.post('/api/plans/select', { planId: newPlanId });
      toast.success(response.data.data.message);
      
      // Atualiza dados do usuário
      const userResponse = await api.get('/api/auth/me');
      updateUser(userResponse.data.user);
      
      // Recarrega dados
      await fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao mudar plano');
    } finally {
      setChangingPlan(null);
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'FREE':
        return <Gift className="w-6 h-6" />;
      case 'STARTER':
        return <Rocket className="w-6 h-6" />;
      case 'PRO':
        return <Crown className="w-6 h-6" />;
      case 'ENTERPRISE':
        return <Briefcase className="w-6 h-6" />;
      default:
        return <Crown className="w-6 h-6" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getDaysRemaining = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!currentPlan) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Nenhum plano ativo</h2>
            <p className="text-gray-600 mb-6">Você precisa selecionar um plano para continuar</p>
            <button
              onClick={() => navigate('/select-plan')}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
            >
              Escolher um plano
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isCurrentPlan = (planId: string) => currentPlan.planId === planId;
  const canDowngrade = currentPlan.plan.price > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Assinatura</h1>
          <p className="mt-2 text-gray-600">Gerencie seu plano e acompanhe seu uso</p>
        </div>

        {/* Status do Plano Atual */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <div className={`p-3 rounded-lg mr-4 ${
                currentPlan.plan.name === 'FREE' ? 'bg-gray-100' :
                currentPlan.plan.name === 'STARTER' ? 'bg-blue-100' :
                currentPlan.plan.name === 'PRO' ? 'bg-purple-100' :
                'bg-yellow-100'
              }`}>
                {getPlanIcon(currentPlan.plan.name)}
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {currentPlan.plan.displayName}
                </h2>
                <p className="text-gray-600 mt-1">{currentPlan.plan.description}</p>
                
                {/* Status do Plano */}
                <div className="mt-4 flex flex-wrap gap-3">
                  {currentPlan.status === 'TRIAL' && currentPlan.trialEndsAt && (
                    <div className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                      <Clock className="w-4 h-4 mr-1" />
                      Trial expira em {getDaysRemaining(currentPlan.trialEndsAt)} dias
                    </div>
                  )}
                  
                  {currentPlan.status === 'ACTIVE' && (
                    <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      <Check className="w-4 h-4 mr-1" />
                      Plano Ativo
                    </div>
                  )}

                  {currentPlan.currentPeriodEnd && (
                    <div className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      <Calendar className="w-4 h-4 mr-1" />
                      Renova em {formatDate(currentPlan.currentPeriodEnd)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {currentPlan.plan.price > 0 && (
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(currentPlan.plan.price, currentPlan.plan.currency)}
                </div>
                <div className="text-gray-600">por mês</div>
              </div>
            )}
          </div>
        </div>

        {/* Uso do Plano */}
        <div className="mb-8">
          <PlanUsage />
        </div>

        {/* Planos Disponíveis */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            {canDowngrade ? 'Alterar Plano' : 'Fazer Upgrade'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {availablePlans.map((plan) => {
              const isCurrent = isCurrentPlan(plan.id);
              const isDowngrade = plan.price < currentPlan.plan.price;
              const isUpgrade = plan.price > currentPlan.plan.price;

              return (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-lg shadow-sm p-6 border-2 ${
                    isCurrent ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        Plano Atual
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {plan.displayName}
                    </h4>
                    <div className="mt-2">
                      <span className="text-2xl font-bold">
                        {formatCurrency(plan.price, plan.currency)}
                      </span>
                      <span className="text-gray-600">/mês</span>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-6 text-sm">
                    <li className="flex items-center">
                      <BarChart3 className="w-4 h-4 text-gray-400 mr-2" />
                      <span>{plan.maxAnalyses === 99999 ? 'Análises ilimitadas' : `${plan.maxAnalyses} análises/mês`}</span>
                    </li>
                    <li className="flex items-center">
                      <FileText className="w-4 h-4 text-gray-400 mr-2" />
                      <span>{plan.maxReports === 99999 ? 'Relatórios ilimitados' : `${plan.maxReports} relatórios/mês`}</span>
                    </li>
                  </ul>

                  {!isCurrent && (
                    <button
                      onClick={() => handleChangePlan(plan.id)}
                      disabled={changingPlan !== null}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                        changingPlan === plan.id
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : isDowngrade
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {changingPlan === plan.id ? (
                        <span className="flex items-center justify-center">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Processando...
                        </span>
                      ) : (
                        <>
                          {isDowngrade ? 'Fazer Downgrade' : 'Fazer Upgrade'}
                          {isUpgrade && <ArrowUpRight className="w-4 h-4 inline ml-1" />}
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Avisos */}
        {currentPlan.status === 'TRIAL' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 text-yellow-600 mr-3 mt-0.5" />
              <div>
                <h4 className="text-lg font-semibold text-yellow-900">
                  Período de Trial Ativo
                </h4>
                <p className="mt-1 text-yellow-800">
                  Você está no período de trial gratuito de 7 dias. Aproveite para testar todos os recursos!
                  Após o término, você precisará escolher um plano pago para continuar.
                </p>
                {currentPlan.trialEndsAt && (
                  <p className="mt-2 text-sm text-yellow-700">
                    Seu trial expira em {formatDate(currentPlan.trialEndsAt)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscription;
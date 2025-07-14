import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import {
  Check,
  X,
  Loader2,
  Crown,
  Rocket,
  Briefcase,
  Gift,
  Sparkles,
  Shield,
  Zap,
  Users,
  BarChart3,
  FileText,
  Globe,
  HeadphonesIcon,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatPrice } from '../utils/formatters';

interface Plan {
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
  features: {
    textAnalysis: boolean;
    imageAnalysis: boolean;
    videoAnalysis: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
    customReports: boolean;
    teamCollaboration: boolean;
    advancedFilters: boolean;
    exportData: boolean;
    whiteLabel: boolean;
    dedicatedSupport?: boolean;
    sla?: boolean;
    customIntegration?: boolean;
  };
}

const SelectPlan: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  // Dados do plano atual do usuário
  const currentPlan = user?.subscription?.plan?.name || 'FREE';
  const isTrialActive = user?.subscription?.isTrial;
  const hasActiveSubscription = user?.subscription && !user?.subscription?.canceled;

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await api.get('/api/plans/available');
      setPlans(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      toast.error('Erro ao carregar planos disponíveis');
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    setIsSubmitting(true);

    try {
      const response = await api.post('/api/plans/select', { planId });
      const { message, requiresPayment, trialDays } = response.data.data;

      toast.success(message);

      // Atualiza dados do usuário
      const userResponse = await api.get('/api/auth/me');
      updateUser(userResponse.data.user);

      // Redireciona para dashboard ou página de pagamento
      if (requiresPayment && trialDays === 0) {
        navigate('/subscription/payment');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Erro ao selecionar plano:', error);
      toast.error(error.response?.data?.message || 'Erro ao selecionar plano');
    } finally {
      setIsSubmitting(false);
      // Não resetar selectedPlan para manter contexto visual após erro
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'FREE':
        return <Gift className="w-10 h-10" />;
      case 'STARTER':
        return <Rocket className="w-10 h-10" />;
      case 'PRO':
        return <Crown className="w-10 h-10" />;
      case 'ENTERPRISE':
        return <Briefcase className="w-10 h-10" />;
      default:
        return <Crown className="w-10 h-10" />;
    }
  };


  const getButtonText = (planName: string) => {
    // Se é o plano atual
    if (planName === currentPlan && hasActiveSubscription) {
      return 'Plano Atual';
    }

    // Se está em trial
    if (isTrialActive) {
      if (planName === 'FREE') {
        return 'Voltar para Free';
      }
      return planName === currentPlan ? 'Plano em Trial' : 'Mudar de Plano';
    }

    // Para upgrades/downgrades
    const planOrder = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];
    const currentIndex = planOrder.indexOf(currentPlan);
    const targetIndex = planOrder.indexOf(planName);

    if (targetIndex > currentIndex) {
      return 'Fazer Upgrade';
    } else if (targetIndex < currentIndex) {
      return 'Fazer Downgrade';
    }

    // Padrão
    return planName === 'FREE' ? 'Começar Grátis' : 'Iniciar Trial';
  };

  const isCurrentPlan = (planName: string) => {
    return planName === currentPlan && hasActiveSubscription;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      <div className="relative z-10 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center p-2 bg-purple-600/10 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Escolha o Plano Perfeito
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-6">
              Desbloqueie todo o potencial da detecção de IA com nossos planos flexíveis
            </p>

            {/* Current Plan Info */}
            {hasActiveSubscription && (
              <div className="inline-flex items-center px-6 py-3 bg-gray-900/50 backdrop-blur-xl rounded-full border border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-gray-300">Você está no plano</span>
                  <span className="font-bold text-white">{currentPlan}</span>
                  {isTrialActive && (
                    <span className="ml-2 px-2 py-1 bg-yellow-600/20 text-yellow-400 text-xs rounded-full font-medium">
                      TRIAL ATIVO
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 stagger-children">
            {plans.map((plan, index) => (
              <div
                key={plan.id}
                className={`relative group animate-fadeIn ${selectedPlan === plan.id ? 'scale-105' : ''}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Badges */}
                {plan.name === 'PRO' && !isCurrentPlan(plan.name) && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg flex items-center animate-pulse">
                      <Zap className="w-4 h-4 mr-1" />
                      Mais Popular
                    </div>
                  </div>
                )}

                {isCurrentPlan(plan.name) && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg flex items-center">
                      <Check className="w-4 h-4 mr-1" />
                      Seu Plano Atual
                    </div>
                  </div>
                )}

                {/* Card */}
                <div
                  className={`
                  h-full bg-gray-900/50 backdrop-blur-xl rounded-2xl p-8 
                  border transition-all duration-300
                  ${
                    isCurrentPlan(plan.name)
                      ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)] bg-green-900/10'
                      : plan.name === 'PRO'
                        ? 'border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.3)]'
                        : 'border-gray-800 hover:border-gray-700'
                  }
                  ${selectedPlan === plan.id && !isCurrentPlan(plan.name) ? 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]' : ''}
                `}
                >
                  {/* Plan Header */}
                  <div className="text-center mb-8">
                    <div
                      className={`
                      inline-flex p-4 rounded-2xl mb-6 transition-all duration-300
                      ${
                        plan.name === 'FREE'
                          ? 'bg-gray-800/50 text-gray-400'
                          : plan.name === 'STARTER'
                            ? 'bg-blue-900/50 text-blue-400'
                            : plan.name === 'PRO'
                              ? 'bg-purple-900/50 text-purple-400'
                              : 'bg-gradient-to-br from-yellow-900/50 to-orange-900/50 text-yellow-400'
                      }
                    `}
                    >
                      {getPlanIcon(plan.name)}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">{plan.displayName}</h3>
                    <p className="text-gray-400 text-sm mb-6 min-h-[48px]">{plan.description}</p>

                    {/* Pricing */}
                    <div className="mb-6">
                      <div className="flex items-baseline justify-center">
                        <span className="text-2xl text-gray-400 mr-1">R$</span>
                        <span className="text-5xl font-bold text-white">
                          {plan.price === 0 ? '0' : formatPrice(plan.price).integer}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-2xl text-gray-400 ml-1">
                            ,{formatPrice(plan.price).decimal}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 mt-2">por mês</p>
                      {plan.price > 0 && (
                        <div className="mt-4 inline-flex items-center px-3 py-1 bg-green-900/30 border border-green-800 rounded-full">
                          <Shield className="w-4 h-4 text-green-400 mr-1" />
                          <span className="text-green-400 text-sm font-medium">7 dias grátis</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Plan Limits */}
                  <div className="space-y-4 mb-8">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                        <div className="flex items-center">
                          <BarChart3 className="w-5 h-5 text-gray-400 mr-2" />
                          <span className="text-gray-300 text-sm">Análises/mês</span>
                        </div>
                        <span className="text-white font-bold">
                          {plan.maxAnalyses === 99999 ? '∞' : plan.maxAnalyses}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 text-gray-400 mr-2" />
                          <span className="text-gray-300 text-sm">Relatórios/mês</span>
                        </div>
                        <span className="text-white font-bold">
                          {plan.maxReports === 99999 ? '∞' : plan.maxReports}
                        </span>
                      </div>
                    </div>

                    <div className="h-px bg-gray-800"></div>

                    {/* Features */}
                    <div className="space-y-3">
                      {[
                        { key: 'textAnalysis', icon: FileText, label: 'Análise de Texto' },
                        { key: 'imageAnalysis', icon: Globe, label: 'Análise de Imagens' },
                        { key: 'videoAnalysis', icon: Globe, label: 'Análise de Vídeos' },
                        { key: 'apiAccess', icon: Globe, label: 'Acesso à API' },
                        {
                          key: 'prioritySupport',
                          icon: HeadphonesIcon,
                          label: 'Suporte Prioritário',
                        },
                        { key: 'teamCollaboration', icon: Users, label: 'Colaboração em Equipe' },
                      ].map(({ key, label }) => {
                        const isIncluded = plan.features?.[key as keyof typeof plan.features] || false;
                        return (
                          <div key={key} className="flex items-center">
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 ${
                                isIncluded
                                  ? 'bg-green-900/50 text-green-400'
                                  : 'bg-gray-800/50 text-gray-600'
                              }`}
                            >
                              {isIncluded ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <X className="w-3 h-3" />
                              )}
                            </div>
                            <span
                              className={`text-sm ${
                                isIncluded ? 'text-gray-300' : 'text-gray-600'
                              }`}
                            >
                              {label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isSubmitting || isCurrentPlan(plan.name)}
                    className={`
                      w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300
                      flex items-center justify-center group relative overflow-hidden
                      ${
                        isCurrentPlan(plan.name)
                          ? 'bg-green-600 text-white cursor-default'
                          : selectedPlan === plan.id
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white scale-105'
                            : plan.name === 'FREE'
                              ? 'bg-gray-800 hover:bg-gray-700 text-white'
                              : plan.name === 'STARTER'
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : plan.name === 'PRO'
                                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                                  : 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white'
                      } 
                      ${isSubmitting || isCurrentPlan(plan.name) ? 'opacity-75 cursor-not-allowed' : ''}
                    `}
                  >
                    {/* Button Background Effect */}
                    {!isCurrentPlan(plan.name) && (
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    )}

                    {/* Button Content */}
                    <span className="relative flex items-center">
                      {isSubmitting && selectedPlan === plan.id ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Processando...
                        </>
                      ) : isCurrentPlan(plan.name) ? (
                        <>
                          <Check className="w-5 h-5 mr-2" />
                          {getButtonText(plan.name)}
                        </>
                      ) : (
                        <>
                          {getButtonText(plan.name)}
                          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold text-white mb-8">Perguntas Frequentes</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-6 border border-gray-800">
                <Shield className="w-8 h-8 text-purple-400 mx-auto mb-4" />
                <h4 className="text-white font-semibold mb-2">
                  Posso cancelar a qualquer momento?
                </h4>
                <p className="text-gray-400 text-sm">
                  Sim! Você pode cancelar ou mudar seu plano quando quiser, sem taxas adicionais.
                </p>
              </div>

              <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-6 border border-gray-800">
                <Zap className="w-8 h-8 text-purple-400 mx-auto mb-4" />
                <h4 className="text-white font-semibold mb-2">Como funciona o período de trial?</h4>
                <p className="text-gray-400 text-sm">
                  Você tem 7 dias grátis para testar todos os recursos dos planos pagos.
                </p>
              </div>

              <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-6 border border-gray-800">
                <HeadphonesIcon className="w-8 h-8 text-purple-400 mx-auto mb-4" />
                <h4 className="text-white font-semibold mb-2">Preciso de cartão de crédito?</h4>
                <p className="text-gray-400 text-sm">
                  Não! Você pode começar o trial sem precisar cadastrar cartão de crédito.
                </p>
              </div>
            </div>

            <p className="text-gray-400 mt-12">
              Ainda tem dúvidas?
              <a
                href="/contact"
                className="text-purple-400 hover:text-purple-300 ml-2 inline-flex items-center"
              >
                Fale conosco
                <ArrowRight className="w-4 h-4 ml-1" />
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectPlan;

import { FileText, Upload, History, BarChart, Settings, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const quickActions = [
  {
    title: 'Nova Análise',
    description: 'Analise textos com IA',
    icon: FileText,
    to: '/dashboard',
    color: 'from-blue-500 to-blue-600',
    iconColor: 'text-blue-300',
  },
  {
    title: 'Upload de Arquivo',
    description: 'Analise documentos e imagens',
    icon: Upload,
    to: '/dashboard?tab=upload',
    color: 'from-purple-500 to-purple-600',
    iconColor: 'text-purple-300',
    badge: 'Em breve',
  },
  {
    title: 'Histórico',
    description: 'Veja análises anteriores',
    icon: History,
    to: '/dashboard?tab=history',
    color: 'from-green-500 to-green-600',
    iconColor: 'text-green-300',
  },
  {
    title: 'Relatórios',
    description: 'Estatísticas detalhadas',
    icon: BarChart,
    to: '/reports',
    color: 'from-orange-500 to-orange-600',
    iconColor: 'text-orange-300',
  },
  {
    title: 'Configurações',
    description: 'Personalize sua conta',
    icon: Settings,
    to: '/settings',
    color: 'from-gray-500 to-gray-600',
    iconColor: 'text-gray-300',
  },
  {
    title: 'Ajuda',
    description: 'Guias e suporte',
    icon: HelpCircle,
    to: '/help',
    color: 'from-pink-500 to-pink-600',
    iconColor: 'text-pink-300',
  },
];

export const QuickActions = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {quickActions.map((action, index) => {
        const Icon = action.icon;
        return (
          <Link
            key={index}
            to={action.to}
            className="group relative bg-slate-800 hover:bg-slate-700 rounded-xl p-6 border border-slate-700 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
          >
            {action.badge && (
              <span className="absolute top-4 right-4 px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full font-medium">
                {action.badge}
              </span>
            )}

            <div
              className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
            >
              <Icon size={24} className="text-white" />
            </div>

            <h3 className="text-white font-semibold mb-1">{action.title}</h3>
            <p className="text-gray-400 text-sm">{action.description}</p>
          </Link>
        );
      })}
    </div>
  );
};

import { FileText, Video, Image, CheckCircle, XCircle, Clock, Activity } from 'lucide-react';

interface Analysis {
  id: string;
  fileName: string;
  fileType: 'TEXT' | 'VIDEO' | 'IMAGE';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  confidence: number;
  isAIGenerated: boolean;
  createdAt: string;
}

interface RecentAnalysesProps {
  analyses: Analysis[];
  onViewAll?: () => void;
}

export const RecentAnalyses = ({ analyses, onViewAll }: RecentAnalysesProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'FAILED':
        return <XCircle size={16} className="text-red-500" />;
      case 'PROCESSING':
        return <Activity size={16} className="text-blue-500 animate-pulse" />;
      default:
        return <Clock size={16} className="text-yellow-500" />;
    }
  };

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'TEXT':
        return <FileText size={16} className="text-blue-400" />;
      case 'VIDEO':
        return <Video size={16} className="text-purple-400" />;
      case 'IMAGE':
        return <Image size={16} className="text-green-400" />;
      default:
        return <FileText size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {analyses.map(analysis => (
        <div
          key={analysis.id}
          className="flex items-center justify-between p-4 bg-dark-800 rounded-lg border border-dark-700 hover:border-dark-600 transition-colors"
        >
          <div className="flex items-center space-x-3">
            {getFileTypeIcon(analysis.fileType)}
            <div>
              <h3 className="text-white font-medium">{analysis.fileName}</h3>
              <p className="text-sm text-dark-400">
                {new Date(analysis.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {analysis.status === 'COMPLETED' && (
              <div className="text-right">
                <div className="text-sm font-medium text-white">
                  {analysis.confidence.toFixed(1)}%
                </div>
                <div className="text-xs text-dark-400">
                  {analysis.isAIGenerated ? 'IA Detectada' : 'Humano'}
                </div>
              </div>
            )}
            {getStatusIcon(analysis.status)}
          </div>
        </div>
      ))}

      {onViewAll && (
        <div className="pt-4 border-t border-dark-700">
          <button
            onClick={onViewAll}
            className="text-primary-500 hover:text-primary-400 text-sm font-medium transition-colors"
          >
            Ver todas as análises →
          </button>
        </div>
      )}
    </div>
  );
};

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string
  icon: LucideIcon
  trend?: string
  trendUp?: boolean
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
}

const colorClasses = {
  blue: 'text-blue-500 bg-blue-500/10',
  green: 'text-green-500 bg-green-500/10',
  purple: 'text-purple-500 bg-purple-500/10',
  orange: 'text-orange-500 bg-orange-500/10',
  red: 'text-red-500 bg-red-500/10'
}

export const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendUp = true, 
  color = 'blue' 
}: StatsCardProps) => {
  return (
    <div className="card hover:scale-105 transition-transform duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-dark-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {trend && (
            <div className="flex items-center space-x-1 mt-2">
              {trendUp ? (
                <TrendingUp size={14} className="text-green-500" />
              ) : (
                <TrendingDown size={14} className="text-red-500" />
              )}
              <span className={`text-sm font-medium ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
                {trend}
              </span>
            </div>
          )}
        </div>
        
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  )
} 
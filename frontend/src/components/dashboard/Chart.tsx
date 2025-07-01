import { useEffect, useRef } from 'react'

interface ChartProps {
  type: 'line' | 'bar' | 'pie' | 'doughnut'
  data: {
    labels: string[]
    datasets: Array<{
      label?: string
      data: number[]
      backgroundColor?: string | string[]
      borderColor?: string
      borderWidth?: number
    }>
  }
  options?: any
}

export const Chart = ({ type, data, options = {} }: ChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<any>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // Mock chart rendering - in a real app, you'd use Chart.js or similar
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Mock chart rendering based on type
    if (type === 'pie' || type === 'doughnut') {
      renderPieChart(ctx, data)
    } else {
      renderLineChart(ctx, data)
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
      }
    }
  }, [type, data, options])

  const renderPieChart = (ctx: CanvasRenderingContext2D, data: any) => {
    const centerX = 150
    const centerY = 150
    const radius = 100
    
    let total = data.datasets[0].data.reduce((a: number, b: number) => a + b, 0)
    let currentAngle = 0
    
    data.datasets[0].data.forEach((value: number, index: number) => {
      const sliceAngle = (value / total) * 2 * Math.PI
      
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
      ctx.closePath()
      
      const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444']
      ctx.fillStyle = colors[index % colors.length]
      ctx.fill()
      
      currentAngle += sliceAngle
    })
  }

  const renderLineChart = (ctx: CanvasRenderingContext2D, data: any) => {
    const width = 300
    const height = 200
    const padding = 40
    
    const maxValue = Math.max(...data.datasets[0].data)
    const minValue = Math.min(...data.datasets[0].data)
    const range = maxValue - minValue
    
    ctx.strokeStyle = '#3B82F6'
    ctx.lineWidth = 2
    ctx.beginPath()
    
    data.datasets[0].data.forEach((value: number, index: number) => {
      const x = padding + (index / (data.datasets[0].data.length - 1)) * (width - 2 * padding)
      const y = height - padding - ((value - minValue) / range) * (height - 2 * padding)
      
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    
    ctx.stroke()
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={300}
        height={200}
        className="w-full h-auto"
      />
      
      {/* Mock legend for pie charts */}
      {type === 'pie' && (
        <div className="mt-4 flex flex-wrap gap-4">
          {data.labels.map((label, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'][index % 5]
                }}
              />
              <span className="text-sm text-dark-300">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 
import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = 'md'
}) => {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  };

  return (
    <div
      className={`skeleton ${roundedClasses[rounded]} ${className}`}
      style={{
        width: width,
        height: height
      }}
    />
  );
};

interface CardSkeletonProps {
  lines?: number;
  showAvatar?: boolean;
  showImage?: boolean;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  lines = 3,
  showAvatar = false,
  showImage = false
}) => {
  return (
    <div className="p-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl">
      {showImage && (
        <Skeleton className="w-full h-48 mb-4" rounded="lg" />
      )}
      
      <div className="flex items-start space-x-4">
        {showAvatar && (
          <Skeleton className="w-12 h-12 flex-shrink-0" rounded="full" />
        )}
        
        <div className="flex-1 space-y-3">
          <Skeleton className="w-3/4 h-4" />
          {Array.from({ length: lines }).map((_, index) => (
            <Skeleton
              key={index}
              className={`h-3 ${index === lines - 1 ? 'w-1/2' : 'w-full'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const StatsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="text-center p-6 rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50"
        >
          <Skeleton className="w-20 h-8 mx-auto mb-2" />
          <Skeleton className="w-16 h-4 mx-auto mb-1" />
          <Skeleton className="w-12 h-3 mx-auto" />
        </div>
      ))}
    </div>
  );
};

export const FeatureSkeleton: React.FC = () => {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="p-8 rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50"
        >
          <Skeleton className="w-16 h-16 mx-auto mb-6 rounded-2xl" />
          <Skeleton className="w-32 h-6 mx-auto mb-4" />
          <div className="space-y-2">
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-5/6 h-4" />
            <Skeleton className="w-4/6 h-4" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const TestimonialSkeleton: React.FC = () => {
  return (
    <div className="grid md:grid-cols-3 gap-8">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="p-8 rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50"
        >
          <div className="flex items-center mb-6">
            {Array.from({ length: 5 }).map((_, starIndex) => (
              <Skeleton key={starIndex} className="w-5 h-5 mr-1" />
            ))}
          </div>
          
          <div className="space-y-3 mb-6">
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-5/6 h-4" />
            <Skeleton className="w-4/6 h-4" />
          </div>
          
          <div className="flex items-center space-x-4">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1">
              <Skeleton className="w-24 h-4 mb-1" />
              <Skeleton className="w-32 h-3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Skeleton; 
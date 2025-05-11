
import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'full' | 'icon-only';
}

const Logo: React.FC<LogoProps> = ({
  className = "",
  variant = 'default'
}) => {
  if (variant === 'icon-only') {
    return (
      <div className={`flex items-center ${className}`}>
        <img 
          src="/lovable-uploads/f08ede10-a902-42ac-ad8b-9ec80ae081c2.png" 
          alt="White Paper Systems Logo" 
          className="h-8 w-auto" 
        />
      </div>
    );
  }
  
  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src="/lovable-uploads/a5faa576-4cfa-4071-863c-5cfac82a795f.png" 
        alt="White Paper Systems Logo" 
        className="h-8 sm:h-10 w-auto" 
      />
    </div>
  );
};

export default Logo;

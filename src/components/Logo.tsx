
import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'full' | 'icon-only';
}

const Logo: React.FC<LogoProps> = ({ className = "", variant = 'default' }) => {
  if (variant === 'icon-only') {
    return (
      <div className={`flex items-center ${className}`}>
        <img 
          src="/lovable-uploads/6015fa67-2064-4662-9756-da0bfc5ea7cd.png" 
          alt="White Paper Systems Logo" 
          className="h-8 w-auto" 
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src="/lovable-uploads/450f2cc0-d3de-4b08-a6cd-f53502a3610d.png" 
        alt="White Paper Systems Logo"
        className="h-8 sm:h-10 w-auto" 
      />
    </div>
  );
};

export default Logo;

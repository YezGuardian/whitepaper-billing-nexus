
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
    return <div className={`flex items-center ${className}`}>
        <img alt="White Paper Systems Logo" className="h-8 w-auto" src="/lovable-uploads/668f9483-bfa9-49aa-9ceb-5b4f071a86c7.png" />
      </div>;
  }
  return <div className={`flex items-center ${className}`}>
      <img src="/lovable-uploads/668f9483-bfa9-49aa-9ceb-5b4f071a86c7.png" alt="White Paper Systems Logo" className="h-8 sm:h-10 w-auto" />
    </div>;
};
export default Logo;

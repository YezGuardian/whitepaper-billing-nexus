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
        <img alt="White Paper Systems Logo" className="h-8 w-auto" src="/lovable-uploads/08462601-b235-4b7b-b61f-5e63c695ba5c.png" />
      </div>;
  }
  return <div className={`flex items-center ${className}`}>
      <img alt="White Paper Systems Logo" className="h-8 sm:h-10 w-auto" src="/lovable-uploads/32a9720a-9116-4c99-8b74-9c1cf83cfcea.png" />
    </div>;
};
export default Logo;
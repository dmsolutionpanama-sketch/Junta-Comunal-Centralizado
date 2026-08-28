import React from 'react';
import {
  Zap,
  Droplets,
  TreePine,
  HeartHandshake,
  FileCheck,
  Trophy,
  HelpCircle,
  LucideProps,
} from 'lucide-react';

interface CategoryIconProps extends LucideProps {
  name: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, ...props }) => {
  switch (name) {
    case 'Zap':
      return <Zap {...props} />;
    case 'Droplets':
      return <Droplets {...props} />;
    case 'TreePine':
      return <TreePine {...props} />;
    case 'HeartHandshake':
      return <HeartHandshake {...props} />;
    case 'FileCheck':
      return <FileCheck {...props} />;
    case 'Trophy':
      return <Trophy {...props} />;
    default:
      return <HelpCircle {...props} />;
  }
};

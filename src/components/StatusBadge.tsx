
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
  type?: 'invoice' | 'quote';
}

const StatusBadge = ({ status, type = 'invoice' }: StatusBadgeProps) => {
  const getStatusConfig = () => {
    if (type === 'invoice') {
      switch (status) {
        case 'draft':
          return { color: 'bg-gray-200 text-gray-800', label: 'Draft' };
        case 'sent':
          return { color: 'bg-blue-100 text-blue-800', label: 'Sent' };
        case 'paid':
          return { color: 'bg-green-100 text-green-800', label: 'Paid' };
        case 'overdue':
          return { color: 'bg-red-100 text-red-800', label: 'Overdue' };
        case 'cancelled':
          return { color: 'bg-gray-100 text-gray-800', label: 'Cancelled' };
        default:
          return { color: 'bg-gray-200 text-gray-800', label: status };
      }
    } else {
      switch (status) {
        case 'draft':
          return { color: 'bg-gray-200 text-gray-800', label: 'Draft' };
        case 'sent':
          return { color: 'bg-blue-100 text-blue-800', label: 'Sent' };
        case 'accepted':
          return { color: 'bg-green-100 text-green-800', label: 'Accepted' };
        case 'rejected':
          return { color: 'bg-red-100 text-red-800', label: 'Rejected' };
        case 'expired':
          return { color: 'bg-yellow-100 text-yellow-800', label: 'Expired' };
        default:
          return { color: 'bg-gray-200 text-gray-800', label: status };
      }
    }
  };

  const { color, label } = getStatusConfig();

  return (
    <Badge className={cn('font-normal', color)}>
      {label}
    </Badge>
  );
};

export default StatusBadge;

interface StatusBadgeProps {
  status: string;
  type?: 'invoice' | 'order' | 'subscription' | 'default';
}

const getStatusColor = (status: string, type: string) => {
  const lowerStatus = status.toLowerCase();

  if (type === 'invoice') {
    switch (lowerStatus) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'not set':
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  }

  if (type === 'order') {
    switch (lowerStatus) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'preparing':
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  if (type === 'subscription') {
    switch (lowerStatus) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'trial':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  return 'bg-gray-100 text-gray-800 border-gray-200';
};

export const StatusBadge = ({ status, type = 'default' }: StatusBadgeProps) => {
  const colorClasses = getStatusColor(status, type);

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${colorClasses}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

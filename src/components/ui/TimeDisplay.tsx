import { format } from 'date-fns';
import { ar } from 'date-fns/locale/ar';

export function TimeDisplay({ date }: { date: string | Date }) {
  try {
    const formattedTime = format(new Date(date), 'hh:mm a', { locale: ar });
    return <span className="text-xs text-gray-500">{formattedTime}</span>;
  } catch (error) {
    console.error('Error formatting time:', error);
    return <span className="text-xs text-gray-500">--:--</span>;
  }
}

export function DateDisplay({ date }: { date: string | Date }) {
  try {
    const formattedDate = format(new Date(date), 'dd/MM/yyyy', { locale: ar });
    return <span>{formattedDate}</span>;
  } catch (error) {
    console.error('Error formatting date:', error);
    return <span>--/--/----</span>;
  }
}

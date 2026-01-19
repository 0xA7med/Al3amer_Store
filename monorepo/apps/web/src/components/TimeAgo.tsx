import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface TimeAgoProps {
    date: string;
    className?: string;
}

/**
 * TimeAgo component - displays relative time (e.g., "2 hours ago")
 * with full date/time shown on hover
 */
export function TimeAgo({ date, className = '' }: TimeAgoProps) {
    const dateObj = new Date(date);

    // Format relative time in Arabic
    const relativeTime = formatDistanceToNow(dateObj, {
        addSuffix: true,
        locale: ar
    });

    // Format full date for tooltip
    const fullDate = dateObj.toLocaleDateString('ar-EG', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    return (
        <span
            className={`cursor-help ${className}`}
            title={fullDate}
        >
            {relativeTime}
        </span>
    );
}

/**
 * Format date in DD/MM/YYYY hh:mm A format
 */
export function formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

export default TimeAgo;

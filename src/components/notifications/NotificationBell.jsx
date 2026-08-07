import React from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function NotificationBell({ user }) {
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ owner_email: user?.email, read: false }, '-created_date', 20),
    enabled: !!user?.email,
    refetchInterval: 30000,
  });

  const count = notifications.length;

  return (
    <Link to="/notifications" className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-secondary transition-all">
      <Bell className="w-4 h-4 text-muted-foreground" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
}
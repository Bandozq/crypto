import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bell, Flame, TrendingUp, Calendar, CheckCircle, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NotificationsPanelProps {
  children: React.ReactNode;
  onUnreadCountChange?: (count: number) => void;
}

interface Notification {
  id: string;
  type: 'hot' | 'new' | 'alert' | 'price';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  data?: any;
}

export default function NotificationsPanel({ children, onUnreadCountChange }: NotificationsPanelProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'hot',
      title: 'Hot Opportunity Alert!',
      message: 'Illuvium (ILV) has reached a hotness score of 285 - trending in P2E games!',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      isRead: false,
    },
    {
      id: '2', 
      type: 'new',
      title: 'New Airdrop Available',
      message: 'LayerZero Protocol airdrop registration is now live with high potential rewards.',
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      isRead: false,
    },
    {
      id: '3',
      type: 'price',
      title: 'Price Movement Alert',
      message: 'Axie Infinity (AXS) up 12% in the last hour - P2E sector gaining momentum.',
      timestamp: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
      isRead: false,
    },
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Update parent component with unread count changes
  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'hot':
        return <Flame className="h-4 w-4 text-crypto-red" />;
      case 'new':
        return <Calendar className="h-4 w-4 text-crypto-blue" />;
      case 'price':
        return <TrendingUp className="h-4 w-4 text-crypto-green" />;
      default:
        return <Bell className="h-4 w-4 text-gray-400" />;
    }
  };

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case 'hot':
        return 'bg-red-600';
      case 'new':
        return 'bg-blue-600';
      case 'price':
        return 'bg-green-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto bg-crypto-card border-gray-600">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white flex items-center">
              <Bell className="mr-2 h-5 w-5 text-crypto-blue" />
              Notifications
              {unreadCount > 0 && (
                <Badge className="ml-2 bg-crypto-red text-white">
                  {unreadCount}
                </Badge>
              )}
            </DialogTitle>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={markAllAsRead}
                className="text-crypto-blue hover:bg-gray-700"
              >
                Mark all read
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="mx-auto h-12 w-12 text-gray-500 mb-4" />
              <p className="text-gray-400">No notifications yet</p>
              <p className="text-sm text-gray-500">We'll notify you about hot opportunities!</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border transition-all hover:bg-gray-700 ${
                  notification.isRead 
                    ? 'bg-gray-800 border-gray-600' 
                    : 'bg-gray-750 border-crypto-blue border-opacity-50'
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`p-2 rounded-full ${getNotificationBadgeColor(notification.type)} bg-opacity-20`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-medium text-sm ${
                          notification.isRead ? 'text-gray-300' : 'text-white'
                        }`}>
                          {notification.title}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                          className="h-6 w-6 p-0 hover:bg-gray-600"
                        >
                          <X className="h-3 w-3 text-gray-400" />
                        </Button>
                      </div>
                      <p className={`text-sm mt-1 ${
                        notification.isRead ? 'text-gray-400' : 'text-gray-200'
                      }`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center mt-2 space-x-2">
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                        </span>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-crypto-blue rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <Separator className="bg-gray-600" />
        
        <div className="text-center">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
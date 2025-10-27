import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  type: 'match' | 'message' | 'like' | 'system';
  userId?: string;
  matchId?: string;
  chatId?: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

class NotificationService {
  private expoPushToken: string | null = null;

  /**
   * Register for push notifications and get the push token
   */
  async registerForPushNotifications(): Promise<string | null> {
    let token = null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }
      
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        if (!projectId) {
          throw new Error('Project ID not found');
        }
        
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('Push token:', token);
      } catch (error) {
        console.error('Error getting push token:', error);
        return null;
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    this.expoPushToken = token;
    return token;
  }

  /**
   * Send a local notification
   */
  async sendLocalNotification(notification: NotificationData): Promise<void> {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: {
          type: notification.type,
          userId: notification.userId,
          matchId: notification.matchId,
          chatId: notification.chatId,
          ...notification.data,
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Show immediately
    });

    console.log('Local notification scheduled:', notificationId);
  }

  /**
   * Send a push notification via Expo Push API
   */
  async sendPushNotification(
    expoPushToken: string,
    notification: NotificationData
  ): Promise<void> {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: {
        type: notification.type,
        userId: notification.userId,
        matchId: notification.matchId,
        chatId: notification.chatId,
        ...notification.data,
      },
      priority: 'high',
    };

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      console.log('Push notification sent:', result);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  /**
   * Get the current push token
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
  }

  /**
   * Set notification badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Add notification listener
   */
  addNotificationListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  /**
   * Add notification response listener (when user taps notification)
   */
  addNotificationResponseListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  /**
   * Remove notification listener
   */
  removeNotificationListener(subscription: Notifications.Subscription): void {
    Notifications.removeNotificationSubscription(subscription);
  }

  /**
   * Send notification via Supabase Edge Function
   */
  async sendNotificationViaFunction(
    userId: string,
    notificationType: 'match' | 'message' | 'like' | 'system',
    title: string,
    body: string,
    data?: Record<string, any>,
    relatedId?: string
  ): Promise<any> {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          user_id: userId,
          notification_type: notificationType,
          title,
          body,
          data,
          related_id: relatedId,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send notification');
      }

      return result;
    } catch (error) {
      console.error('Error sending notification via function:', error);
      throw error;
    }
  }

  /**
   * Send match notification via Edge Function
   */
  async sendMatchNotification(userId: string, matchedUserId: string, matchId: string): Promise<any> {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/send-match-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          user_id: userId,
          matched_user_id: matchedUserId,
          match_id: matchId,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send match notification');
      }

      return result;
    } catch (error) {
      console.error('Error sending match notification:', error);
      throw error;
    }
  }

  /**
   * Send message notification via Edge Function
   */
  async sendMessageNotification(
    recipientId: string,
    senderId: string,
    messageId: string,
    matchId: string,
    messageText: string
  ): Promise<any> {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/send-message-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          recipient_id: recipientId,
          sender_id: senderId,
          message_id: messageId,
          match_id: matchId,
          message_text: messageText,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message notification');
      }

      return result;
    } catch (error) {
      console.error('Error sending message notification:', error);
      throw error;
    }
  }

  /**
   * Send like notification via Edge Function
   */
  async sendLikeNotification(likedUserId: string, likerId: string, swipeId: string): Promise<any> {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/send-like-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          liked_user_id: likedUserId,
          liker_id: likerId,
          swipe_id: swipeId,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send like notification');
      }

      return result;
    } catch (error) {
      console.error('Error sending like notification:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export types
export type { NotificationData };

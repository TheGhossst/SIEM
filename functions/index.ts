import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

admin.initializeApp();

const logsCollection = admin.firestore().collection('logs');
const alertsCollection = admin.firestore().collection('alerts');
const notificationRulesCollection = admin.firestore().collection('notificationRules');

interface Event {
  id?: string;
  type: string;
  source: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string; // ISO string
  additionalData?: Record<string, any>;
}

export const processIncomingEvents = functions.pubsub.onMessagePublished(
  {
    topic: 'incoming-events',
  },
  async (event) => {
    try {
      const messageData = event.data?.message?.data;
      if (!messageData) {
        functions.logger.error('No message data found.');
        return;
      }

      const eventMessage: Event = JSON.parse(Buffer.from(messageData, 'base64').toString());

      if (!eventMessage.severity || !['info', 'warning', 'critical'].includes(eventMessage.severity)) {
        functions.logger.error('Invalid event severity:', eventMessage.severity);
        return;
      }

      const timestamp = new Date().toISOString();
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;

      const processedEvent = {
        ...eventMessage,
        timestamp,
        processed: true,
      };

      await logsCollection.doc(year.toString()).collection(month.toString()).add(processedEvent);

      if (eventMessage.severity === 'critical') {
        await alertsCollection.add({
          ...processedEvent,
          status: 'active',
        });

        await notifyUsers(processedEvent);
      }

      functions.logger.info('Event processed successfully:', processedEvent);
    } catch (error) {
      functions.logger.error('Error processing Pub/Sub event:', error);
    }
  }
);

async function notifyUsers(event: Event) {
  const rulesSnapshot = await notificationRulesCollection
    .where('severity', '==', event.severity)
    .get();

  rulesSnapshot.forEach(async (doc) => {
    const rule = doc.data();

    if (rule.email) {
      functions.logger.info(`Sending email to ${rule.email} for event:`, event);
    }

    if (rule.pushNotification) {
      const message = {
        notification: {
          title: `New ${event.severity} Event`,
          body: event.message,
        },
        topic: `alerts-${event.severity}`,
      };
      await admin.messaging().send(message);
      functions.logger.info('Push notification sent for event:', event);
    }
  });
}

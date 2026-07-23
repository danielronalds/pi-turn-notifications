export interface Notification {
	title: string;
	body: string;
	playSound: boolean;
}

export interface NotificationProviderFeatures {
	sound: boolean;
}

export interface NotificationProvider {
	getSupportedFeatures(): NotificationProviderFeatures;
	sendNotification(notification: Notification): Promise<void>;
}

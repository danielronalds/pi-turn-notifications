import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { Notification, NotificationProvider } from "./notification-provider.ts";

const NOTIFICATION_SERVICE = "org.freedesktop.Notifications";
const NOTIFICATION_OBJECT_PATH = "/org/freedesktop/Notifications";
const NOTIFICATION_METHOD_SIGNATURE = "susssasa{sv}i";

export class LinuxProvider implements NotificationProvider {
	constructor(private readonly pi: Pick<ExtensionAPI, "exec">) {}

	getSupportedFeatures() {
		// TODO: Investigate reliable Linux notification sound support.
		return { sound: false };
	}

	async sendNotification({ title, body }: Notification) {
		await this.pi.exec("busctl", [
			"--user",
			"--quiet",
			"--timeout=5s",
			"--", // Prevent the negative expiry from being parsed as a busctl option.
			"call",
			NOTIFICATION_SERVICE,
			NOTIFICATION_OBJECT_PATH,
			NOTIFICATION_SERVICE,
			"Notify",
			NOTIFICATION_METHOD_SIGNATURE,
			"Pi",
			"0",
			"",
			title,
			body,
			"0",
			"0",
			"-1",
		]);
	}
}

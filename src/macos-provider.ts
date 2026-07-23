import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { Notification, NotificationProvider } from "./notification-provider.ts";

const notificationScript = `
on run argv
	if (item 3 of argv) is "true" then
		display notification (item 2 of argv) with title (item 1 of argv) sound name "default"
	else
		display notification (item 2 of argv) with title (item 1 of argv)
	end if
end run
`.trim();

export class MacosProvider implements NotificationProvider {
	constructor(private readonly pi: Pick<ExtensionAPI, "exec">) {}

	getSupportedFeatures() {
		return { sound: true };
	}

	async sendNotification({ title, body, playSound }: Notification) {
		await this.pi.exec("/usr/bin/osascript", ["-e", notificationScript, title, body, String(playSound)]);
	}
}

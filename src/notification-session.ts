import { basename } from "node:path";
import type { SessionEntry, TurnEndEvent } from "@earendil-works/pi-coding-agent";
import type { NotificationProvider } from "./notification-provider.ts";

const NOTIFICATION_BODY_MAX_LENGTH = 200;
export const NOTIFICATION_STATE_ENTRY = "turn-notification-state";

interface NotificationState {
	enabled: boolean;
}

export class NotificationSession {
	enabled = false;
	private latestMessageText = "";

	constructor(private readonly provider?: NotificationProvider) {}

	restore(entries: SessionEntry[]) {
		this.enabled = false;

		for (const entry of entries) {
			if (entry.type !== "custom" || entry.customType !== NOTIFICATION_STATE_ENTRY) {
				continue;
			}

			const state = entry.data as NotificationState | undefined;
			if (typeof state?.enabled === "boolean") {
				this.enabled = state.enabled;
			}
		}
	}

	resetMessage() {
		this.latestMessageText = "";
	}

	captureAssistantMessage(message: TurnEndEvent["message"]) {
		if (message.role !== "assistant") {
			return;
		}

		const messageText = message.content
			.filter((block) => block.type === "text")
			.map((block) => block.text)
			.join("\n")
			.trim();

		if (messageText) {
			this.latestMessageText = messageText;
		}
	}

	async notify(cwd: string) {
		if (!this.enabled || !this.latestMessageText) {
			return;
		}

		if (!this.provider) {
			console.error(`Desktop notifications are not supported on ${process.platform}`);
			return;
		}

		const directoryName = basename(cwd) || cwd;
		const title = `"${directoryName}"`;
		const messageCharacters = Array.from(this.latestMessageText.replace(/\s+/g, " ").trim());
		const body =
			messageCharacters.length > NOTIFICATION_BODY_MAX_LENGTH
				? `${messageCharacters.slice(0, NOTIFICATION_BODY_MAX_LENGTH - 3).join("").trimEnd()}...`
				: messageCharacters.join("");
		this.latestMessageText = "";

		await this.provider.sendNotification({ title, body });
	}
}

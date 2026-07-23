import { basename } from "node:path";
import type { SessionEntry, TurnEndEvent } from "@earendil-works/pi-coding-agent";
import type { NotificationProvider } from "./notification-provider.ts";

const NOTIFICATION_BODY_MAX_LENGTH = 200;
export const NOTIFICATION_STATE_ENTRY = "turn-notification-state";

export interface NotificationState {
	enabled: boolean;
	soundEnabled: boolean;
}

export class NotificationSession {
	enabled = false;
	soundEnabled = true;
	private latestMessageText = "";

	constructor(private readonly provider?: NotificationProvider) {}

	restore(entries: SessionEntry[]) {
		this.enabled = false;
		this.soundEnabled = true;

		for (const entry of entries) {
			if (entry.type !== "custom" || entry.customType !== NOTIFICATION_STATE_ENTRY) {
				continue;
			}

			const state = entry.data as Partial<NotificationState> | undefined;
			if (typeof state?.enabled === "boolean") {
				this.enabled = state.enabled;
				this.soundEnabled = typeof state.soundEnabled === "boolean" ? state.soundEnabled : true;
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

		await this.provider.sendNotification({ title, body, playSound: this.soundEnabled });
	}
}

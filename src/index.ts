import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { MacosProvider } from "./macos-provider.ts";
import { NotificationSession, NOTIFICATION_STATE_ENTRY } from "./notification-session.ts";

function getNotificationProvider(pi: ExtensionAPI) {
	switch (process.platform) {
		case "darwin":
			return new MacosProvider(pi);
		default:
			return undefined;
	}
}

export default function (pi: ExtensionAPI) {
	const notificationProvider = getNotificationProvider(pi);
	const notifications = new NotificationSession(notificationProvider);

	function updateStatus(ctx: ExtensionContext) {
		ctx.ui.setStatus("turn-notifications", notifications.enabled ? "notifications: on" : undefined);
	}

	function restoreState(ctx: ExtensionContext) {
		notifications.restore(ctx.sessionManager.getBranch());
		updateStatus(ctx);
	}

	pi.registerCommand("opt-in", {
		description: "Enable or disable desktop notifications for this session",
		handler: async (_args, ctx) => {
			if (!ctx.hasUI) {
				return;
			}

			const selection = await ctx.ui.select(
				`Desktop notifications are currently ${notifications.enabled ? "on" : "off"}`,
				["On", "Off"],
			);
			if (!selection) {
				return;
			}

			const enabled = selection === "On";
			if (enabled !== notifications.enabled) {
				notifications.enabled = enabled;
				pi.appendEntry(NOTIFICATION_STATE_ENTRY, { enabled });
			}

			updateStatus(ctx);
			ctx.ui.notify(`Desktop notifications ${enabled ? "enabled" : "disabled"}`, "info");
		},
	});

	pi.on("session_start", (_event, ctx) => {
		restoreState(ctx);
	});

	pi.on("session_tree", (_event, ctx) => {
		restoreState(ctx);
	});

	pi.on("agent_start", () => {
		notifications.resetMessage();
	});

	pi.on("turn_end", (event) => {
		notifications.captureAssistantMessage(event.message);
	});

	pi.on("agent_settled", async (_event, ctx) => {
		await notifications.notify(ctx.cwd);
	});
}

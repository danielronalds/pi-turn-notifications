import {
	getSettingsListTheme,
	type ExtensionAPI,
	type ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { Container, type SettingItem, SettingsList, Text } from "@earendil-works/pi-tui";
import { LinuxProvider } from "./linux-provider.ts";
import { MacosProvider } from "./macos-provider.ts";
import {
	NotificationSession,
	NOTIFICATION_STATE_ENTRY,
	type NotificationState,
} from "./notification-session.ts";

function getNotificationProvider(pi: ExtensionAPI) {
	switch (process.platform) {
		case "darwin":
			return new MacosProvider(pi);
		case "linux":
			return new LinuxProvider(pi);
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
		description: "Configure desktop notifications for this session",
		handler: async (_args, ctx) => {
			if (ctx.mode !== "tui") {
				if (ctx.hasUI) {
					ctx.ui.notify("/opt-in requires TUI mode", "error");
				}
				return;
			}

			if (!notificationProvider) {
				ctx.ui.notify(`Desktop notifications are not supported on ${process.platform}`, "error");
				return;
			}

			const items: SettingItem[] = [
				{
					id: "notifications",
					label: "Desktop notifications",
					description: "Notify when Pi has finished responding and is waiting for input.",
					currentValue: notifications.enabled ? "On" : "Off",
					values: ["On", "Off"],
				},
			];

			if (notificationProvider.getSupportedFeatures().sound) {
				items.push({
					id: "sound",
					label: "Play sound",
					description: "Request a desktop notification sound.",
					currentValue: notifications.soundEnabled ? "On" : "Off",
					values: ["On", "Off"],
				});
			}

			await ctx.ui.custom((tui, theme, _keybindings, done) => {
				const container = new Container();
				container.addChild(
					new Text(theme.fg("accent", theme.bold("Desktop Notification Settings")), 1, 1),
				);

				const settingsList = new SettingsList(
					items,
					items.length,
					getSettingsListTheme(),
					(id, newValue) => {
						if (id === "notifications") {
							notifications.enabled = newValue === "On";
						} else if (id === "sound") {
							notifications.soundEnabled = newValue === "On";
						} else {
							return;
						}

						pi.appendEntry<NotificationState>(NOTIFICATION_STATE_ENTRY, {
							enabled: notifications.enabled,
							soundEnabled: notifications.soundEnabled,
						});
						updateStatus(ctx);
					},
					() => done(undefined),
				);
				container.addChild(settingsList);

				return {
					render: (width: number) => container.render(width),
					invalidate: () => container.invalidate(),
					handleInput: (data: string) => {
						settingsList.handleInput(data);
						tui.requestRender();
					},
				};
			});
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

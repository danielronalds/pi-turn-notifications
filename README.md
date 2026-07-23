# Pi Opt-In

A [Pi](https://github.com/earendil-works/pi-mono) extension that sends a notification when Pi has finished responding and is waiting for input.

Notifications are disabled by default and can be enabled independently for each Pi session.

## Install

Copy and run:

```bash
pi install git:github.com/danielronalds/pi-opt-in
```

Restart Pi or run `/reload` in an existing Pi session after installation.

### Requirements

- macOS, or Linux with:
  - `busctl`, normally provided by systemd
  - A graphical user D-Bus session
  - A Freedesktop-compatible notification service
- Pi 0.80.6 or later

## Usage

Run:

```text
/opt-in
```

Use the settings menu to enable or disable desktop notifications. Providers may expose additional settings for supported features, such as notification sounds on macOS. New sessions start with notifications disabled. State is retained when reloading or resuming the same session.

macOS may ask for permission to send notifications the first time the extension runs. Notification sounds may be suppressed by macOS notification settings or Focus mode.

On Linux, notifications are sent silently through the standard Freedesktop notification service using `busctl`.

## Limitations

Linux notifications require `busctl` and an active graphical notification service. Headless environments, containers without access to the user D-Bus, and ordinary SSH sessions are not supported.

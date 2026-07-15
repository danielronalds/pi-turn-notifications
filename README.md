# Pi Opt-In

A [Pi](https://github.com/earendil-works/pi-mono) extension that sends a notification when Pi has finished responding and is waiting for input.

Notifications are disabled by default and can be enabled independently for each Pi session.

> This extension is very vibecoded. Do not expect perfection, it does what it says on the tin

## Install

Copy and run:

```bash
pi install git:github.com/danielronalds/pi-opt-in
```

Restart Pi or run `/reload` in an existing Pi session after installation.

### Requirements

- macOS
- Pi 0.80.6 or later

## Usage

Run:

```text
/opt-in
```

Select **On** or **Off** in the menu. New sessions start with notifications disabled. State is retained when reloading or resuming the same session.

macOS may ask for permission to send notifications the first time the extension runs.

## Limitations

Currently this extension only supports macOS, linux support will be added.

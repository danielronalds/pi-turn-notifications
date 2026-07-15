# AGENTS.md

## Project overview

`pi-opt-in` is a public Pi package that provides opt-in desktop notifications when Pi has finished responding and is waiting for user input.

Repository: `https://github.com/danielronalds/pi-opt-in`

Install with:

```bash
pi install git:github.com/danielronalds/pi-opt-in
```

The project is licensed under MIT, copyright Daniel Ronalds.

## Current behaviour

- macOS is the only supported platform.
- Notifications are disabled by default for every new Pi session.
- `/opt-in` opens a small UI for selecting On or Off.
- The setting is persisted in the session and restored after reloads and resumes.
- State follows the active session branch and is restored after tree navigation.
- A footer status is displayed while notifications are enabled.
- Notifications fire only after `agent_settled`, when Pi has no automatic retry, compaction retry, tool continuation, or queued follow-up remaining.
- Individual tool-call turns do not produce notifications.
- A notification is sent only when the settled run produced non-empty assistant text.
- The title is the current directory basename enclosed in quotation marks.
- The body is a whitespace-normalised copy of the assistant message, truncated to 200 Unicode characters.
- Native notifications are sent through the built-in `/usr/bin/osascript` command.

## Repository structure

```text
AGENTS.md
LICENSE
README.md
package.json
src/
  index.ts
  macos-provider.ts
  notification-provider.ts
  notification-session.ts
```

`src/index.ts` is the Pi extension entry point and composition root. Session-scoped notification behaviour lives in `src/notification-session.ts`, while platform-specific delivery is implemented behind the provider contract. `package.json` declares `src/index.ts` explicitly under `pi.extensions`, so the `src` directory does not need to follow Pi's conventional `extensions` layout.

Keep `src/index.ts` as the single entry point. Add future platform integrations as focused provider modules, such as `src/linux-provider.ts`.

## Important implementation details

### Event lifecycle

Use `turn_end` only to capture the latest assistant text. Do not send the notification from `turn_end`, because Pi emits it for turns that continue into tool calls.

Send notifications from `agent_settled`. Do not replace this with `agent_end`, because Pi may still retry, compact, or process queued messages after `agent_end`.

Reset captured message text on `agent_start` so stale output cannot leak into a later run.

### Session state

Notification state is stored with `pi.appendEntry()` using the custom entry type `turn-notification-state`.

Restore the latest value from `ctx.sessionManager.getBranch()` on both:

- `session_start`
- `session_tree`

Preserve the `turn-notification-state` identifier unless a migration is implemented. Its older name is intentional and changing it would make existing sessions lose their saved preference.

New sessions must continue to default to notifications being disabled.

### Notification execution

Use `pi.exec()` with a command and separate argument array. Do not build a shell command containing the notification title or body. Passing values as AppleScript arguments avoids shell and AppleScript quoting problems.

Keep a platform guard so unsupported systems do nothing rather than attempting to execute `osascript`.

### Package dependencies

Pi provides `@earendil-works/pi-coding-agent` at runtime. Keep it as an optional peer dependency and do not bundle it. Marking it optional also prevents package installation from attempting to install another copy of Pi.

The extension currently has no third-party runtime dependencies.

## Development workflow

Read Pi's extension and package documentation before changing lifecycle behaviour, persistence, commands, or package metadata:

- `docs/extensions.md`
- `docs/packages.md`

Pi loads TypeScript extensions directly, so no compilation output is committed.

After changing the extension, run:

```bash
pi --list-models -e . >/tmp/pi-opt-in-models.txt
test -s /tmp/pi-opt-in-models.txt
npm pack --dry-run --ignore-scripts
git diff --check
```

The first command verifies that Pi can discover and load the local package. The package dry run verifies that `src/index.ts`, `README.md`, `LICENSE`, and `package.json` are included in the npm tarball.

Before a release, also test the Git source:

```bash
pi --list-models -e git:github.com/danielronalds/pi-opt-in
```

Perform these manual checks in an interactive Pi session:

1. Start a new session and confirm notifications are off.
2. Run `/opt-in`, select On, and confirm the footer status appears.
3. Submit a prompt that uses tools and confirm intermediate tool turns do not notify.
4. Confirm the final settled assistant response produces one notification.
5. Run `/reload` and confirm the enabled state is restored.
6. Resume the session and confirm the enabled state is restored.
7. Select Off and confirm the footer status and desktop notifications stop.

macOS may require notification or Automation permission during manual testing.

## Code and documentation conventions

- Use TypeScript and follow the existing tab indentation in `src/index.ts`.
- Prefer descriptive names, early returns, and simple control flow.
- Avoid explicit return types where TypeScript can infer them.
- Keep comments for non-obvious reasoning rather than restating code.
- Use LF line endings.
- Use UK English in documentation.
- Do not use emojis or em dashes.
- Use conventional commit messages.
- Keep README usage, package metadata, and the registered command aligned when renaming anything user-facing.

## Packaging and publishing

The package name is `pi-opt-in`. It includes the `pi-package` keyword for Pi package discovery.

The unscoped `pi-opt-in` npm name was available when the project was named, but availability must be checked again immediately before publishing. If publishing a scoped package instead, set public access and update the README installation command accordingly.

The existing npm package `pi-nudge` is owned by another developer and provides similar terminal notification behaviour. Do not rename this package to `pi-nudge` or imply ownership of that package.

## Known limitations and future work

### Linux support

Linux support is planned but not implemented. Add it behind platform-specific behaviour without changing the macOS path. Prefer native tools that are commonly available, and document any required dependency.

### Focus detection

The extension does not currently suppress notifications when the exact Pi terminal is focused.

Detecting only the frontmost terminal application is straightforward but insufficient when multiple windows, tabs, or splits are open. Exact focus detection is terminal-specific. Ghostty exposes AppleScript objects for its front window, selected tab, focused terminal, terminal title, and working directory. A robust implementation could assign a unique title to the Pi terminal and compare it with Ghostty's focused terminal. Comparing only the working directory is ambiguous when multiple terminals share a directory.

Do not assume `ctx.ui.isTerminalFocused()` exists in stock Pi unless current Pi documentation confirms it.

### Custom icons and click actions

AppleScript's `display notification` does not support a custom icon or click action. `terminal-notifier` supports custom icons and actions such as opening a URL or executing a command, but it would introduce an external dependency.

Opening a URL does not reliably focus an existing browser tab. Reliably selecting an existing tab requires browser-specific automation that searches by URL, focuses the matching tab, and optionally opens a new tab as a fallback.

## Author configuration copy

The author also maintains a copy of the extension in the `llm-configs` repository at `pi/extensions/turn-notification.ts`. This repository's `src/index.ts` is the public package source. When working in the author's environment, keep the personal configuration copy synchronised with user-facing command and behaviour changes, but do not assume that separate repository exists for other contributors.

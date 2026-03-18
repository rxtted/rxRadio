# rxRadio

`rxRadio` is a FiveM radio list resource built around `pma-voice`. It shows the current radio channel roster, highlights active speakers, supports custom radio display names, and ships with a rebuilt React + TypeScript NUI for this fork.

This resource is a fork of `x-radiolist`.

## Features

- Live radio member list driven by `pma-voice`
- Active speaking indicator for radio users
- Channel header with frequency, channel name, and online count
- React + TypeScript NUI with Vite build pipeline
- Player-editable radio HUD position and scale
- Client-local layout persistence for the radio HUD
- `/callsign` support for custom player radio names
- Optional RP-name support through ESX or QBCore
- Optional QBCore on-duty callsign enforcement
- Optional server ID display next to names
- Configurable named radio channels
- Optional access restriction by job/gang/group
- `ox_lib` notifications for UI/name/channel actions

## Dependencies

Start these before `rxRadio`:

- `ox_lib`
- `pma-voice`

## Installation

1. Download a release from the right hand side.
2. Place the resource in your server resources folder as `rxRadio`.
3. Ensure dependencies start before it.
4. Add `ensure rxRadio` to your server config.

Example:

```cfg
ensure ox_lib
ensure pma-voice
ensure rxRadio
```

## Commands

Default commands from the current config:

- `/ch [channel]`
  Joins a radio frequency. Use `/ch 0` to leave radio.
- `/radiodisplay`
  Toggles the radio list UI.
- `/radiodisplayedit`
  Enables or disables HUD edit mode.
- `/radiodisplayreset`
  Resets the saved HUD layout back to the default profile.
- `/callsign [name]`
  Sets your radio display name when custom names are enabled.

Edit mode finishes through the configured keybind:

- `RETURN`


## UI Notes

The current NUI stack is built from:

- React
- TypeScript
- Vite

Runtime behavior:

- FiveM loads the built UI from `web/dist`
- the default HUD position is top-right anchored
- players can reposition and resize the HUD in edit mode
- saved layout data is stored locally per client with resource KVPs

Frontend development:

- run `bun run dev` for the Vite dev server
- run `bun run build` to rebuild the FiveM UI bundle into `web/dist`
- run `bun run lint` to lint the frontend

## Developing From Source

If you are working from source:

1. Install [Bun](https://bun.sh/).
2. Open the repository root.
3. Install dependencies with `bun install`.
4. Use the scripts below depending on whether you are developing, validating, or packaging.

Available scripts

- `bun run dev`
  Starts the Vite dev server for working on the React NUI in a browser.
- `bun run build`
  Runs TypeScript compilation and builds the production NUI into `web/dist` for FiveM.
- `bun run lint`
  Runs ESLint across the frontend source.
- `bun run preview`
  Serves the built frontend locally for previewing the production bundle.
- `bun run packaging -- <version>`
  Builds the frontend and creates a drag-and-drop release zip using [scripts/create-release.sh](/mnt/d/projects/fivem/rotten-development/rxradio/scripts/create-release.sh).

## Framework Notes

When `Config.UseRPName` is enabled:

- ESX uses `xPlayer.getName()` for RP names
- QBCore uses character first/last name for RP names
- QBCore can force job callsigns onto the radio name while on duty for jobs listed in `Config.JobsWithCallsign`

If RP names are disabled, the resource falls back to the player server name unless the player has set a custom radio name.

## License

This repository still includes the upstream [LICENSE](/mnt/d/projects/fivem/rotten-development/rxradio/LICENSE). Review it before redistributing modified versions of the resource.

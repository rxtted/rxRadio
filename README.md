# rxRadio

`rxRadio` is a FiveM radio list resource built around `pma-voice`. It shows who is on the active radio channel, highlights active speakers, supports custom player display names, and ships with a rebuilt NUI created in React with TypeScript for this fork.

This resource is a fork of `x-radiolist`

## Features

- Live radio member list synced from `pma-voice`
- Speaking indicator for active radio users
- Custom radio UI with channel name, frequency badge, and online count
- Optional player-customized display names
- Optional RP-name support through ESX or QBCore
- Optional server ID display next to names
- Configurable named radio channels
- Optional visibility restriction by job/gang/group
- Built-in `/ch` command to join or leave radio channels through `pma-voice`
- `ox_lib` notifications for name/channel actions

## Dependencies

Add these resources before `rxRadio`:

- `pma-voice`
- `ox_lib`

## Installation

1. Place the resource in your server resources folder as `rxRadio`.
2. Ensure dependencies start before it.
3. Add `ensure rxRadio` to your server config.

Example:

```server.cfg
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
- `/callsign [name]`
  Sets your radio display name when custom names are enabled.

## Configuration

Primary configuration lives in [shared/config.lua](/mnt/d/Projects/FiveM/rotten-development/rxRadio/shared/config.lua).

Notable defaults:

- `Config.UseRPName = false`
- `Config.RadioListVisibilityCommand = "radiodisplay"`
- `Config.RadioListChangeNameCommand = "callsign"`
- `Config.LetPlayersChangeRadioChannelsName = false`
- `Config.ShowPlayersServerIdNextToTheirName = true`
- `Config.PlayerServerIdPosition = "right"`
- `Config.RadioListOnlyShowsToGroupsWithAccess = false`

Adjust these mappings directly in [shared/config.lua](/mnt/d/Projects/FiveM/rotten-development/rxRadio/shared/config.lua).

## Framework Notes

When `Config.UseRPName` is enabled:

- ESX uses the player job name for access checks and `xPlayer.getName()` for RP names.
- QBCore uses character first/last name for RP names.
- QBCore can force job callsigns onto the radio name while on duty for jobs listed in `Config.JobsWithCallsign`.

If RP names are disabled, the resource falls back to the player's server name unless the player has set a custom radio name.


## License

This repository still includes the upstream [LICENSE](/mnt/d/Projects/FiveM/rotten-development/rxRadio/LICENSE). Review it before redistributing modified versions of the resource.

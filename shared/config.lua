Config = {}

Config.UseRPName = false                                 -- If set to true, it uses either esx-legacy or qb-core built-in function to get players' RP name

Config.LetPlayersChangeVisibilityOfRadioList = true     -- Let players to toggle visibility of the list
Config.RadioListVisibilityCommand = "radiodisplay"      -- Only works if Config.LetPlayersChangeVisibilityOfRadioList is set to true
Config.HideRadioListVisibilityByDefault = false         -- If set to true and a player joins the server, don't show the radio list until the player execute the Config.RadioListVisibilityCommand command
Config.RadioListEditCommand = "radiodisplayedit"        -- Lets players edit the radio list on screen
Config.RadioListEditConfirmCommand = "radiodisplayeditconfirm"
Config.RadioListEditConfirmKeybind = "RETURN"
Config.RadioListResetCommand = "radiodisplayreset"
Config.RadioListEditModeEnabledMessage = "You can now edit the radio list. Drag or resize it and press [%s] to finish."
Config.RadioListEditModeDisabledMessage = "Radio list edit mode disabled."
Config.RadioListEditModeSavedMessage = "Radio list layout saved."
Config.RadioListResetMessage = "Radio list layout reset to the default profile."

Config.LetPlayersSetTheirOwnNameInRadio = true          -- Let players to customize how their name is displayed on the list
Config.RadioListChangeNameCommand = "callsign"          -- Only works if Config.LetPlayersSetTheirOwnNameInRadio is set to true
Config.ResetPlayersCustomizedNameOnExit = true          -- Resets customized name players set for themselves on their server exit

Config.LetPlayersChangeRadioChannelsName = false        -- Let players to change the name of the radio channels **they are currently joined in**
Config.ModifyRadioChannelNameCommand = "nameofradio"    -- Changes the name of the radio channel **that the player is currently joined in**

Config.ShowPlayersServerIdNextToTheirName = true        -- Shows the players' server id next to their name on the radio list
Config.PlayerServerIdPosition = "right"                 -- Position of player's server id next to their name on the radio list ("right" or "left")

Config.RadioListOnlyShowsToGroupsWithAccess = false     -- If true, the radio list only shows to Config.GroupsWithAccessToTheRadioList
Config.GroupsWithAccessToTheRadioList = {
    ["police"] = true,
    ["ambulance"] = true,
}

Config.JobsWithCallsign = {
    ["police"] = true,
    ["ambulance"] = true,
}

Config.LetPlayersOverrideRadioChannelsWithName = false

Config.RadioChannelsWithName = {
    ["10"] = "PAN LONDON",
    ["2"] = "FIRE",
    ["3"] = "CIVILIAN",
}

Config.Notification = function(source, message, type)
    TriggerClientEvent("ox_lib:notify", source, {title = message, type = type or "inform", duration = 5000})
end

Config.ClientNotification = function(message, notificationType)
    TriggerEvent("ox_lib:notify", {
        title = "rxRadio",
        description = message,
        type = notificationType or "inform",
        duration = 5000
    })
end

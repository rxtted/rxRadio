Config = {}

Config.UseRPName = false                                 -- If set to true, it uses either esx-legacy or qb-core built-in function to get players' RP name

Config.LetPlayersChangeVisibilityOfRadioList = true     -- Let players to toggle visibility of the list
Config.RadioListVisibilityCommand = "radiodisplay"         -- Only works if Config.LetPlayersChangeVisibilityOfRadioList is set to true
Config.HideRadioListVisibilityByDefault = false         -- If set to true and a player joins the server, don't show the radio list until the player execute the Config.RadioListVisibilityCommand command

Config.LetPlayersSetTheirOwnNameInRadio = true          -- Let players to customize how their name is displayed on the list
Config.RadioListChangeNameCommand = "callsign"       -- Only works if Config.LetPlayersSetTheirOwnNameInRadio is set to true
Config.ResetPlayersCustomizedNameOnExit = true          -- Resets customized name players set for themselves on their server exit

Config.LetPlayersChangeRadioChannelsName = false         -- Let players to change the name of the radio channels **they are currently joined in**
Config.ModifyRadioChannelNameCommand = "nameofradio"    -- Changes the name of the radio channel **that the player is currently joined in** => this is a validation to prevent normal players from modifying the name of the restricted channels they don't have access to(such as police, & etc)

Config.ShowPlayersServerIdNextToTheirName = true        -- Shows the players' server id next to their name on the radio list
Config.PlayerServerIdPosition = "right"                 -- Position of player's server id next to their name on the radio list ("right" or "left") => Only works if Config.ShowPlayersServerIdNextToTheirName is set to true

Config.RadioListOnlyShowsToGroupsWithAccess = false     -- If true, the radio list only shows to Config.GroupsWithAccessToTheRadioList
Config.GroupsWithAccessToTheRadioList = {               -- For ESX it checks if the players' job name matches with any of these groups - For QB it checks if the players' gang name matches and/or if the players' job name matches and they are onduty...
    ["police"] = true,
    ["ambulance"] = true,
}

Config.JobsWithCallsign = {                             -- It only detects callsign if the framework is "QB"
    ["police"] = true,
    ["ambulance"] = true,
}

Config.LetPlayersOverrideRadioChannelsWithName = false  -- Let players change the name of radio channels that are in Config.RadioChannelsWithName => Only works if Config.LetPlayersChangeRadioChannelsName is set to true

Config.RadioChannelsWithName = {
    ["41"] = "PAN LONDON",                                    
    ["42"] = "INTEROPS",                                   
    ["43"] = "INCIDENT 1",    
    ["44"] = "INCIDENT 2",
    ["45"] = "INCIDENT 3",
    ["46"] = "FTS 1",
    ["47"] = "FTS 2",
    ["48"] = "TACOPS 1",
    ["49"] = "TACOPS 2",                            
    ["31"] = "LFB OPS 1",
    ["32"] = "LFB OPS 2",
    ["33"] = "BA TEAM 1",
    ["34"] = "BA TEAM 2",
    ["21"] = "LAS OPS 1",
    ["22"] = "LAS OPS 2",
    ["23"] = "HEMS AIR DESK",
    ["24"] = "TRAUMA DESK",
    ["51"] = "P2P 1",
    ["52"] = "P2P 2",
    ["53"] = "P2P 3",
    ["54"] = "P2P 4",
    ["55"] = "P2P 5",
    ["11"] = "INCIDENT 1",
    ["12"] = "INCIDENT 2",
    ["13"] = "INCIDENT 3",
}

Config.Notification = function(source, message, type)
    TriggerClientEvent("ox_lib:notify", source, {title = message, type = type or "inform", duration = 5000})
    -- TriggerClientEvent("t-notify:client:Custom", source, {title = message, style = type or "info", duration = 5000})
    -- TriggerClientEvent("esx:showNotification", source, message, type or "info", 5000)
    -- TriggerClientEvent("QBCore:Notify", source, message, type or "primary", 5000)
    -- TriggerClientEvent("okokNotify:Alert", source, message, nil, 5000, type or "info")
end
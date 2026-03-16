local playerServerID = GetPlayerServerId(PlayerId())
local playersInRadio, currentRadioChannel, currentRadioChannelName = {}, nil, nil
local allowedToSeeRadioList, radioListVisibility = true, true
local radioListMoveMode = false
local temporaryName = "temporaryPlayerNameAsAWorkaroundForABugInPMA-VOICEWhichEventsGetCalledTwiceWhileThePlayerConnectsToTheRadioForFirstTime"

local function notifyMoveMode(message, notificationType)
    Config.ClientNotification(message, notificationType)
end

local function closeTheRadioList()
    playersInRadio, currentRadioChannel, currentRadioChannelName = {}, nil, nil
    SendNUIMessage({ clearRadioList = true })
end

local function modifyTheRadioListVisibility(state)
    SendNUIMessage({ changeVisibility = true, visible = (allowedToSeeRadioList and state) or false })
end

local function setRadioListMoveMode(state)
    if radioListMoveMode == state then return end
    radioListMoveMode = state
    SetNuiFocus(state, state)
    SetNuiFocusKeepInput(false)

    if not state then
        SetNuiFocus(false, false)
    end

    SendNUIMessage({ changeMoveMode = true, moveMode = state })
end

RegisterNUICallback("finishMoveMode", function(_, cb)
    if radioListMoveMode then
        setRadioListMoveMode(false)
        notifyMoveMode(Config.RadioListMoveModeSavedMessage)
    end

    cb({})
end)

local function addServerIdToPlayerName(serverId, playerName)
    if Config.ShowPlayersServerIdNextToTheirName then
        if Config.PlayerServerIdPosition == "left" then playerName = ("(%s) %s"):format(serverId, playerName)
        elseif Config.PlayerServerIdPosition == "right" then playerName = ("%s (%s)"):format(playerName, serverId) end
    end
    return playerName
end

local function addPlayerToTheRadioList(playerId, playerName)
    if playersInRadio[playerId] then return end
    playersInRadio[playerId] = temporaryName
    playersInRadio[playerId] = addServerIdToPlayerName(playerId, playerName or Player(playerId).state[Shared.State.nameInRadio] or callback.await(Shared.Callback.getPlayerName, false, playerId))
    SendNUIMessage({
        self = playerId == playerServerID,
        radioId = playerId,
        radioName = playersInRadio[playerId],
        channel = currentRadioChannelName,
        channelFrequency = currentRadioChannel
    })
end

local function removePlayerFromTheRadioList(playerId)
    if not playersInRadio[playerId] then return end
    if playersInRadio[playerId] == temporaryName then return end
    if playerId == playerServerID then closeTheRadioList() return end
    playersInRadio[playerId] = nil
    SendNUIMessage({ radioId = playerId })
end

RegisterNetEvent("pma-voice:addPlayerToRadio", function(playerId)
    if not currentRadioChannel or not (currentRadioChannel > 0) then return end
    addPlayerToTheRadioList(playerId)
end)

RegisterNetEvent("pma-voice:removePlayerFromRadio", function(playerId)
    if not currentRadioChannel or not (currentRadioChannel > 0) then return end
    removePlayerFromTheRadioList(playerId)
end)

RegisterNetEvent("pma-voice:syncRadioData", function()
    closeTheRadioList()
    local _playersInRadio
    _playersInRadio, currentRadioChannel, currentRadioChannelName = callback.await(Shared.Callback.getPlayersInRadio, false)
    for playerId, playerName in pairs(_playersInRadio) do
        addPlayerToTheRadioList(playerId, playerName)
    end
    _playersInRadio = nil
end)

-- set talkingState on radio for self
RegisterNetEvent("pma-voice:radioActive")
AddEventHandler("pma-voice:radioActive", function(talkingState)
    SendNUIMessage({ radioId = playerServerID, radioTalking = talkingState })
end)

-- set talkingState on radio for other radio members
RegisterNetEvent("pma-voice:setTalkingOnRadio")
AddEventHandler("pma-voice:setTalkingOnRadio", function(source, talkingState)
    SendNUIMessage({ radioId = source, radioTalking = talkingState })
end)

AddStateBagChangeHandler(Shared.State.allowedToSeeRadioList, ("player:%s"):format(playerServerID), function(bagName, key, value)
    local receivedPlayerServerId = tonumber(bagName:gsub('player:', ''), 10)
    if not receivedPlayerServerId or receivedPlayerServerId ~= playerServerID then return end
    allowedToSeeRadioList = (value == nil and false) or value
    modifyTheRadioListVisibility(radioListVisibility)
end)

if Config.LetPlayersChangeVisibilityOfRadioList then
    ---@diagnostic disable-next-line: missing-parameter
    RegisterCommand(Config.RadioListVisibilityCommand,function()
        radioListVisibility = not radioListVisibility
        modifyTheRadioListVisibility(radioListVisibility)
    end)
    TriggerEvent("chat:addSuggestion", "/"..Config.RadioListVisibilityCommand, "Show/Hide Radio List")
end

RegisterCommand(Config.RadioListMoveCommand, function()
    setRadioListMoveMode(not radioListMoveMode)

    if radioListMoveMode then
        notifyMoveMode(Config.RadioListMoveModeEnabledMessage:format(Config.RadioListMoveConfirmKeybind))
    else
        notifyMoveMode(Config.RadioListMoveModeDisabledMessage)
    end
end, false)

RegisterCommand(Config.RadioListMoveConfirmCommand, function()
    if not radioListMoveMode then return end
    setRadioListMoveMode(false)
    notifyMoveMode(Config.RadioListMoveModeSavedMessage)
end, false)

RegisterKeyMapping(Config.RadioListMoveConfirmCommand, "Finish moving the radio list", "keyboard", Config.RadioListMoveConfirmKeybind)
TriggerEvent("chat:addSuggestion", "/"..Config.RadioListMoveCommand, "Move the radio list on screen")

if Config.LetPlayersSetTheirOwnNameInRadio then
    TriggerEvent("chat:addSuggestion", "/"..Config.RadioListChangeNameCommand, "Customize your name to be shown in radio list", { { name = "customized name", help = "Enter your desired name to be shown in radio list" } })
end

RegisterCommand("ch", function(_, args)
    local channel = tonumber(args[1])
    if not args[1] then
        return TriggerEvent("chat:addMessage", {
            color = { 255, 200, 0 },
            args = { "rxRadio", "Usage: /ch [channel] or /ch 0 to leave radio" }
        })
    end

    if not channel then
        return TriggerEvent("chat:addMessage", {
            color = { 255, 80, 80 },
            args = { "rxRadio", "Channel must be a number" }
        })
    end

    channel = math.floor(channel)

    if channel < 0 then
        return TriggerEvent("chat:addMessage", {
            color = { 255, 80, 80 },
            args = { "rxRadio", "Channel must be 0 or higher" }
        })
    end

    exports["pma-voice"]:setRadioChannel(channel)
end, false)

TriggerEvent("chat:addSuggestion", "/ch", "Join or leave a PMA voice radio channel", {
    { name = "channel-frequency", help = "Use 0 to leave radio" }
})

if Config.HideRadioListVisibilityByDefault then
    SetTimeout(1000, function()
        radioListVisibility = false
        modifyTheRadioListVisibility(radioListVisibility)
    end)
end

if Config.LetPlayersChangeRadioChannelsName then
    TriggerEvent("chat:addSuggestion", "/"..Config.ModifyRadioChannelNameCommand, "Modify the name of the radio channel you are currently in", { { name = "customized name", help = "Enter your desired name to set it as you current radio channel's name" } })
end

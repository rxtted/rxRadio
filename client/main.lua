local playerServerID = GetPlayerServerId(PlayerId())
local playersInRadio, currentRadioChannel, currentRadioChannelName = {}, nil, nil
local allowedToSeeRadioList, radioListVisibility = true, true
local radioListEditMode = false
local radioLayoutKvpKey = ("%s_layout"):format(GetCurrentResourceName())
local temporaryName = "temporaryPlayerNameAsAWorkaroundForABugInPMA-VOICEWhichEventsGetCalledTwiceWhileThePlayerConnectsToTheRadioForFirstTime"

local function notifyEditMode(message, notificationType)
    Config.ClientNotification(message, notificationType)
end

local function loadSavedRadioLayout()
    local raw = GetResourceKvpString(radioLayoutKvpKey)
    if not raw or raw == "" then return nil end

    local ok, decoded = pcall(json.decode, raw)
    if not ok or type(decoded) ~= "table" then return nil end

    local x, y, scale = tonumber(decoded.x), tonumber(decoded.y), tonumber(decoded.scale)
    if not x or not y or not scale then return nil end

    return { x = x, y = y, scale = scale }
end

local function saveRadioLayout(layout)
    if type(layout) ~= "table" then return end

    local x, y, scale = tonumber(layout.x), tonumber(layout.y), tonumber(layout.scale)
    if not x or not y or not scale then return end

    SetResourceKvp(radioLayoutKvpKey, json.encode({
        x = x,
        y = y,
        scale = scale
    }))
end

local function resetRadioLayout()
    DeleteResourceKvp(radioLayoutKvpKey)
    SendNUIMessage({ resetSavedLayout = true })
end

local function restoreSavedRadioLayout()
    local savedLayout = loadSavedRadioLayout()

    if savedLayout then
        SendNUIMessage({ applySavedLayout = true, layout = savedLayout })
        return
    end

    SendNUIMessage({ resetSavedLayout = true })
end

local function closeTheRadioList()
    playersInRadio, currentRadioChannel, currentRadioChannelName = {}, nil, nil
    SendNUIMessage({ clearRadioList = true })
end

local function modifyTheRadioListVisibility(state)
    SendNUIMessage({ changeVisibility = true, visible = (allowedToSeeRadioList and state) or false })
end

local function setRadioListEditMode(state)
    if radioListEditMode == state then return end
    radioListEditMode = state
    SetNuiFocus(state, state)
    SetNuiFocusKeepInput(false)

    if not state then
        SetNuiFocus(false, false)
    end

    SendNUIMessage({ changeEditMode = true, editMode = state })
end

RegisterNUICallback("finishEditMode", function(data, cb)
    if radioListEditMode then
        saveRadioLayout(data and data.layout)
        setRadioListEditMode(false)
        notifyEditMode(Config.RadioListEditModeSavedMessage)
    end

    cb({})
end)

RegisterNUICallback("cancelEditMode", function(_, cb)
    if radioListEditMode then
        restoreSavedRadioLayout()
        setRadioListEditMode(false)
        notifyEditMode(Config.RadioListEditModeCancelledMessage)
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
    playersInRadio[playerId] = addServerIdToPlayerName(playerId, playerName or Player(playerId).state[Shared.State.nameInRadio])
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

local function getUsedDebugMockEntryKeys()
    local usedEntryKeys = {}

    for _, playerName in pairs(playersInRadio) do
        if type(playerName) == "string" then
            local standardSuffix = playerName:match("^[A-Z]+%-(2%d%d)$")
            if standardSuffix then
                usedEntryKeys["standard:"..standardSuffix] = true
            end

            local commandDigit = playerName:match("^[A-Z]+%-7(%d) | 17%dBX$")
            if commandDigit then
                usedEntryKeys["command:"..commandDigit] = true
            end
        end
    end

    return usedEntryKeys
end

local function countExistingDebugCommandEntries()
    local commandEntryCount = 0

    for _, playerName in pairs(playersInRadio) do
        if type(playerName) == "string" and playerName:match("^[A-Z]+%-7%d | 17%dBX$") then
            commandEntryCount += 1
        end
    end

    return commandEntryCount
end

local function buildDebugMockEntryPool()
    local entryPool = {}

    for tens = 0, 9 do
        for ones = 0, 9 do
            local suffix = ("2%s%s"):format(tens, ones)
            entryPool[#entryPool + 1] = {
                key = "standard:"..suffix,
                buildName = function(prefix)
                    return ("%s-%s"):format(prefix, suffix)
                end
            }
        end
    end

    for digit = 0, 9 do
        local commandDigit = tostring(digit)
        entryPool[#entryPool + 1] = {
            key = "command:"..commandDigit,
            buildName = function(prefix)
                return ("%s-7%s | 17%sBX"):format(prefix, commandDigit, commandDigit)
            end
        }
    end

    return entryPool
end

local function getNextDebugMockRadioId()
    local availableRadioIds = {}

    for debugRadioId = 10, 200 do
        if not playersInRadio[debugRadioId] then
            availableRadioIds[#availableRadioIds + 1] = debugRadioId
        end
    end

    if #availableRadioIds == 0 then
        return nil
    end

    return availableRadioIds[math.random(1, #availableRadioIds)]
end

local function addDebugMockEntries(count)
    if not currentRadioChannel or currentRadioChannel <= 0 then
        notifyEditMode("Join a radio channel before adding mock entries.", "error")
        return
    end

    local usedEntryKeys = getUsedDebugMockEntryKeys()
    local callsignPrefixes = { "AW", "ON", "XN", "INT" }
    local availableEntries, availableCommandEntries = {}, {}

    for _, entry in ipairs(buildDebugMockEntryPool()) do
        if not usedEntryKeys[entry.key] then
            availableEntries[#availableEntries + 1] = entry

            if entry.key:sub(1, 8) == "command:" then
                availableCommandEntries[#availableCommandEntries + 1] = entry
            end
        end
    end

    local availableIdCount = 0
    for debugRadioId = 10, 200 do
        if not playersInRadio[debugRadioId] then
            availableIdCount += 1
        end
    end

    local availableEntryCount = math.min(#availableEntries, availableIdCount)
    local existingCommandEntryCount = countExistingDebugCommandEntries()
    local requiredCommandEntryCount = math.min(math.max(0, 5 - existingCommandEntryCount), count)

    if count > availableEntryCount then
        notifyEditMode(("Only %s unique mock entries are available right now."):format(availableEntryCount), "error")
        return
    end

    if requiredCommandEntryCount > #availableCommandEntries then
        notifyEditMode(("Only %s command mock entr%s are available right now."):format(#availableCommandEntries, #availableCommandEntries == 1 and "y" or "ies"), "error")
        return
    end

    local selectedEntries = {}

    for _ = 1, requiredCommandEntryCount do
        local randomIndex = math.random(1, #availableCommandEntries)
        local commandEntry = table.remove(availableCommandEntries, randomIndex)

        for entryIndex, entry in ipairs(availableEntries) do
            if entry.key == commandEntry.key then
                table.remove(availableEntries, entryIndex)
                break
            end
        end

        selectedEntries[#selectedEntries + 1] = commandEntry
    end

    while #selectedEntries < count do
        local randomIndex = math.random(1, #availableEntries)
        local entry = table.remove(availableEntries, randomIndex)
        selectedEntries[#selectedEntries + 1] = entry
    end

    for _, entry in ipairs(selectedEntries) do
        local debugRadioId = getNextDebugMockRadioId()
        local prefix = callsignPrefixes[math.random(1, #callsignPrefixes)]

        if not debugRadioId then break end
        addPlayerToTheRadioList(debugRadioId, entry.buildName(prefix))
    end

    notifyEditMode(("Added %s mock radio entr%s."):format(count, count == 1 and "y" or "ies"))
end

RegisterNetEvent(Shared.Event.addPlayerToRadio, function(playerId, playerName, channelName, channelFrequency)
    if not playerId or not playerName or not channelFrequency then return end

    currentRadioChannel = channelFrequency
    currentRadioChannelName = channelName or currentRadioChannelName
    addPlayerToTheRadioList(playerId, playerName)
end)

RegisterNetEvent(Shared.Event.removePlayerFromRadio, function(playerId)
    if not playerId then return end
    removePlayerFromTheRadioList(playerId)
end)

RegisterNetEvent(Shared.Event.updatePlayerDisplay, function(playerId, playerName, channelName, channelFrequency)
    if not playerId or not playerName then return end

    currentRadioChannel = channelFrequency or currentRadioChannel
    currentRadioChannelName = channelName or currentRadioChannelName
    playersInRadio[playerId] = addServerIdToPlayerName(playerId, playerName)

    SendNUIMessage({
        self = playerId == playerServerID,
        radioId = playerId,
        radioName = playersInRadio[playerId],
        channel = currentRadioChannelName,
        channelFrequency = currentRadioChannel
    })
end)

RegisterNetEvent(Shared.Event.updateChannelDisplay, function(channelName, channelFrequency)
    if not channelFrequency then return end

    currentRadioChannel = channelFrequency
    currentRadioChannelName = channelName or channelFrequency

    SendNUIMessage({
        channel = currentRadioChannelName,
        channelFrequency = currentRadioChannel
    })
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

RegisterNetEvent("pma-voice:radioActive")
AddEventHandler("pma-voice:radioActive", function(talkingState)
    SendNUIMessage({ radioId = playerServerID, radioTalking = talkingState })
end)

RegisterNetEvent("pma-voice:setTalkingOnRadio")
AddEventHandler("pma-voice:setTalkingOnRadio", function(source, talkingState)
    SendNUIMessage({ radioId = source, radioTalking = talkingState })
end)

AddStateBagChangeHandler(Shared.State.allowedToSeeRadioList, ("player:%s"):format(playerServerID), function(bagName, _, value)
    local receivedPlayerServerId = tonumber(bagName:gsub('player:', ''), 10)
    if not receivedPlayerServerId or receivedPlayerServerId ~= playerServerID then return end
    allowedToSeeRadioList = (value == nil and false) or value
    modifyTheRadioListVisibility(radioListVisibility)
end)

CreateThread(function()
    Wait(250)
    local savedLayout = loadSavedRadioLayout()
    if savedLayout then
        SendNUIMessage({ applySavedLayout = true, layout = savedLayout })
    end
end)

if Config.LetPlayersChangeVisibilityOfRadioList then
    RegisterCommand(Config.RadioListVisibilityCommand, function()
        radioListVisibility = not radioListVisibility
        modifyTheRadioListVisibility(radioListVisibility)
    end)
    TriggerEvent("chat:addSuggestion", "/"..Config.RadioListVisibilityCommand, "Show/Hide Radio List")
end

RegisterCommand(Config.RadioListEditCommand, function()
    setRadioListEditMode(not radioListEditMode)

    if radioListEditMode then
        notifyEditMode(Config.RadioListEditModeEnabledMessage:format(Config.RadioListEditConfirmKeybind, Config.RadioListEditCancelKeybind))
    else
        notifyEditMode(Config.RadioListEditModeDisabledMessage)
    end
end, false)

RegisterCommand(Config.RadioListResetCommand, function()
    if radioListEditMode then
        setRadioListEditMode(false)
    end

    resetRadioLayout()
    notifyEditMode(Config.RadioListResetMessage)
end, false)
TriggerEvent("chat:addSuggestion", "/"..Config.RadioListEditCommand, "Edit the radio list on screen")
TriggerEvent("chat:addSuggestion", "/"..Config.RadioListResetCommand, "Reset the radio list layout to the default profile")

if Config.Debug and Config.Debug.Enabled then
    RegisterCommand(Config.Debug.MockRadioEntriesCommand, function(_, args)
        local count = tonumber(args[1])

        if not count then
            notifyEditMode("Usage: /"..Config.Debug.MockRadioEntriesCommand.." [count]", "error")
            return
        end

        count = math.floor(count)
        if count <= 0 then
            notifyEditMode("Mock entry count must be 1 or higher.", "error")
            return
        end

        addDebugMockEntries(count)
    end, false)

    TriggerEvent("chat:addSuggestion", "/"..Config.Debug.MockRadioEntriesCommand, "Add local AW-2xx mock entries to the radio list", {
        { name = "count", help = "Number of unique mock entries to add" }
    })
end

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

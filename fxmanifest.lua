fx_version  "cerulean"
use_experimental_fxv2_oal   "yes"
lua54       "yes"
game        "gta5"

name        "rxRadio"
version     "0.1"
description "A fork of xRadiolist : List of players in each radio channels to be used with PMA-VOICE"

dependencies {
    "ox_lib",
    "pma-voice"
}

ui_page "web/dist/index.html"

files {
    "web/dist/index.html",
    "web/dist/*",
    "web/dist/assets/*"
}

shared_scripts {
    "shared/*.lua"
}

server_script {
    "module/**/server.lua",
    "server/*.lua"
}

client_script {
    "module/**/client.lua",
    "client/*.lua"
}

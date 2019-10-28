# steam-web-auth
This will give you your 2FA code and you will be able to act on mobile confirmations from anywhere.
# Setup
You need to have node installed and then you can simply clone this repository
```
git clone https://github.com/zecjy/steam-web-auth
```
Then jump to steam-web-auth/server and install the needed npm packages and run it once to configure your account, so fill everything in.
You can get the secrets from the unencrypted maFile from steamDesktopAuthentificator (https://github.com/Jessecar96/SteamDesktopAuthenticator)
```
cd steam-web-auth/server
npm install
node app.js
CTRL+C
```
You need to install forever to keep it running so install it and the start it
```
npm install forever
forever start app.js
```
Lastly you need to go to steam-web-auth/server/files/main.js and edit your IP and port with your favorited editor.

If you want to use another account just delete the settings.json file in steam-web-auth/server and start it via node again.

# Screenshots
![screenshot](https://i.gyazo.com/d3a6b5f4c5018a860a185b7bdb19276f.png)
![screenshot](https://i.gyazo.com/2dededa4d1a5fae31cded0c59dc8a6bf.png)

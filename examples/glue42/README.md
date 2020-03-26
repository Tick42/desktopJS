desktopJS and [Glue42](https://glue42.com/ "Glue42")
======================================================

Steps to run:
0. Make sure you have ```node``` & ```npm``` installed
1. Download and install [latest Glue42 Enterprise 3.9](https://enterprise.glue42.com/install/enterprise/feature/desktop-js/3.9.0-alpha.0.0/GlueInstallerEnterprise.exe "Download link")
2. Clone https://github.com/Tick42/desktopJS
3. Start desktop JS
```bat
cd desktopJS && npm i && npm run bootstrap && npm run build && npm start
```
4.Put the `desktopjs-glue42.json` in `%localappdata%\Tick42\GlueDesktop\config\apps`
5. Enable `auto-injection` in `%localappdata%\Tick42\GlueDesktop\config\system.json`
```json
   "autoInjectAPI": {
            "enabled": true,
            "version": "5.*",
            "autoInit": true
        },
```
5. Start Glue42 Desktop and open the 'desktopJS Glue42' application (it should be on the top of the list)

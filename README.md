This program and the accompanying materials are
made available under the terms of the Eclipse Public License v2.0 which accompanies
this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

SPDX-License-Identifier: EPL-2.0

Copyright Contributors to the Zowe Project.
# explorer-ip
The Zowe Desktop application to monitor TCP/IP stack using the EZBNMIFR network management interface

## Installation:
### Building web content (webClient)
The webClient can be built on z/OS platform as well as off z/OS. 

**Note:** If you decide to build the webClient off z/OS then you should move the built content (content of the `web/` directory) to the z/OS anyway. Make sure you transfer the built artifacts to the z/OS as ASCII files and tag them as ASCII files in z/OS USS after they are transferred. An example how to tag the files: `chtag -Rtc ISO8859-1 /path/to/app-dir/web`  

1. Clone zlux repository:
    1. `git clone --recursive git@github.com:zowe/zlux.git`
    2. `cd zlux`
    3. `git submodule foreach "git checkout master"`

2. Navigate to the `zlux-app-manager/virtual-desktop` directory and run `npm install` in the directory. If `npm install` fails then expand the following Hint block which contains information about how to possibly resolve the `npm install` failure.
   <details><summary>Hint</summary>
    
    1. If you get the following failure:
        ```bash
        npm ERR! Error while executing:
        npm ERR! /C/Rocket/bin/git ls-remote -h -t https://github.com/zowe/zlux-widgets.git
        npm ERR!
        npm ERR! fatal: unable to access 'https://github.com/zowe/zlux-widgets.git/': SSL certificate problem: unable to get local issuer certificate
        npm ERR!
        npm ERR! exited with error code: 128      
        ```
        then it could mean that your local git is not properly configured to access github via **https**. Either configure your local git to access github using **https** or if you use **ssl** to access github then you can try to modify the `zlux-app-manager/virtual-desktop/package.json` file so that you change `git+https://github.com/zowe/zlux-widgets.git` to `git+git@github.com:zowe/zlux-widgets.git` in the line [here](https://github.com/zowe/zlux-app-manager/blob/1556eeac4ef844022bb60fa4dc2d75f2d09091a0/virtual-desktop/package.json#L32). 
    2. After configuring **https** or changing the package.json, please run the `npm install` again.
    3. If it's installed sucessfully, you should see a message like:
        ```
        added 827 packages from 391 contributors and audited 833 packages in 54.331s
        ```
   </details>
3. Navigate back to the `zlux` root directory, e.g. using `cd ../..` command.
4. Clone the IP explorer app repository `git clone ...`
5. Navigate to the `webClient` part of the IP explorer app repository (`cd app-dir/webClient`) and run `npm install`.
6. set and export the `MVD_DESKTOP_DIR` variable to point to the `zlux/zlux-app-manager/virtual-desktop/`:
   ```
   export MVD_DESKTOP_DIR=/your/path/to/zlux/zlux-app-manager/virtual-desktop/
   ```
7. Run `npm run build`. If successful, you should see some content in the `app-dir/web` directory. 

### Building dataService
The dataService has to built on z/OS platform.
1. Go to the plugin's `/dataService` directory.
2. In the `build/` directory, git clone https://github.com/zowe/zss/ OR create a symbolic link to already existing zss repository, e.g. using `ln -s /path/to/existing/zss build/zss`.
3. Run the `build/build.sh` script. The build should succeed and create a `/lib` folder in the git root directory, which contains a compiled dll (.so).

### File Structure Example
install-dir
  - dataService
    - build
      - build.sh
      - pluginAPI.x
      - tmp
      - zss
    - deploy.sh
    - src
      - ipExplorerDataService.c
  - lib
    - ipExplorer.so
  - pluginDefinition.json
  - web
    - assets
    - main.js
  - webClient
  - ...

### Installing the plugin
Run `<your-zowe-instance>/bin/install-app.sh <path-to-plugin>`.

Where `<path-to-plugin>` is directory with `web/`, `lib/` and `pluginDefinition.json` files

## Installing using pax
Its recommended to install all your extensions in same folder. 
If you have defined `ZWE_EXTENSION_DIR` in `instance.env`, specifying target directory via `-d` option is optional
```
cd $RUNTIME_DIR/bin
zowe-install-component.sh -i $INSTANCE_DIR -o /path/to/explorer-ip.pax -d /var/zowe/extensions
```

You will need to **restart zowe** for `ipExplorer.so` dataservice dll to load alongwith `zssServer` on startup.

More info, about [installing extension here](https://docs.zowe.org/stable/extend/install-configure-zos-extensions.html#install-with-zowe-install-component-sh-technical-preview)

## Troubleshooting
To turn on logging, add the following snippet into your zluxserver.json file:

```
"logLevels": {
   "org.zowe.explorer-ip": 4
}
```

The number after the plugin identifier represents the level of logging. This is read into the server at startup.

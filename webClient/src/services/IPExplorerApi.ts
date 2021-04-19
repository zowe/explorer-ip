/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

  SPDX-License-Identifier: EPL-2.0

  Copyright Contributors to the Zowe Project.
*/
import { ReactMVDResources } from '../common/types';

interface IPExplorerApi {
    resources: ReactMVDResources,
    tcpipJobName: string,
}

class IPExplorerApi {
    constructor(resources: ReactMVDResources, tcpipJobName?: string){
        this.resources = resources;
        this.tcpipJobName = tcpipJobName || "*";
    }

    public getPreferences(): Promise<Response> {
        const destination = ZoweZLUX.uriBroker.pluginConfigForScopeUri(this.resources.pluginDefinition.getBasePlugin(),'user', 'prefs');
        return this.doGetRequest(destination);
    }

    public setPreference(name, message): Promise<Response> {
        const destination = ZoweZLUX.uriBroker.pluginConfigForScopeUri(this.resources.pluginDefinition.getBasePlugin(),'user', 'prefs', name);
        const configWithMatadata = {
            _metadataVersion: "1.1",
            _objectType: `org.zowe.explorer-ip.prefs.${name}`,
            ...message
          };
        return this.doPutRequest(destination, JSON.stringify(configWithMatadata));
    }

    public getDefaultTCPIPName(): Promise<Response> {
        const destination = ZoweZLUX.uriBroker.pluginRESTUri(this.resources.pluginDefinition.getBasePlugin(), 'ipExplorer', 'gettcpipname');
        return this.doGetRequest(destination);
    }

    public getInfo(): Promise<Response> {
        const destination = ZoweZLUX.uriBroker.pluginRESTUri(this.resources.pluginDefinition.getBasePlugin(), 'ipExplorer', `${this.tcpipJobName}/info`);
        return this.doGetRequest(destination);
    }

    public getPorts(): Promise<Response> {
        const destination = ZoweZLUX.uriBroker.pluginRESTUri(this.resources.pluginDefinition.getBasePlugin(), 'ipExplorer', `${this.tcpipJobName}/ports`);
        return this.doGetRequest(destination);
    }

    public getConnections(): Promise<Response> {
        const destination = ZoweZLUX.uriBroker.pluginRESTUri(this.resources.pluginDefinition.getBasePlugin(), 'ipExplorer', `${this.tcpipJobName}/connections`);
        return this.doGetRequest(destination);
    }

    private doGetRequest(destination): Promise<Response> {
        return fetch(destination, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            })
            .then(res => {
                if (!res.ok) {
                    throw Error(res.statusText);
                }
                return res.status === 204 ? null : res.json();
            });
    }

    private doPutRequest(destination, message): Promise<Response> {
        return fetch(destination, {
            method: 'PUT',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: message,
            })
            .then(res => {
                if (res.status >= 400) {
                    throw Error(res.statusText);
                }
                return res.json();
            });
    }
}

export default IPExplorerApi;

/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

  SPDX-License-Identifier: EPL-2.0

  Copyright Contributors to the Zowe Project.
*/

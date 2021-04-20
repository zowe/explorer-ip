/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

  SPDX-License-Identifier: EPL-2.0

  Copyright Contributors to the Zowe Project.
*/
import { ReactMVDResources as ReactMVDResourcesType } from 'pluginlib/react-inject-resources';
import { WithTranslation } from 'react-i18next';

export type ReactMVDResources = ReactMVDResourcesType; // REVIEW

export interface Page {
    id: string;
    label: string;
    component: JSX.Element;
}

export interface TableProps extends WithTranslation {
  ports: Ports,
  getPorts: any,
  savePreferences: any,
  preferredSorting: any,
  t: any,
  loading: boolean,
  logger: any,
  predefinedFilter?: string,
  openJobActions: ZLUX.Action[],
}

export interface OPDataRow {
    localIPaddress: string;
    localPort: number;
    remoteIPaddress: string;
    remotePort: number;
    state: string;
    startTime: Date;
    lastActivity: Date;
    bytesIn: number;
    bytesOut: number;
    asid: string;
    tcb: string;
    resourceName: string;
    resourceID: number;
  }

export interface RPDataRow {
    portRange?: boolean;
    portNumber: number;
    portNumberEnd: number;
    jobname: string;
    safname: string;
    flags: {
      IPV6: boolean,
      RANGE: boolean,
      UNRSV: boolean,
      TCP: boolean,
    },
    useType: {
      RESERVED:  boolean,
      AUTHPORT:  boolean,
      JOBNAME:  boolean,
    },
    rsvOptions:{
      AUTOLOG:  boolean,
      DELAYACKS:  boolean,
      SHAREPORT:  boolean,
      SHAREPORTWLM:  boolean,
      BIND:  boolean,
      SAF:  boolean,
      NOSMC:  boolean,
      NOSMCR:  boolean,
    },
    unrsvOptions:{
      PORTUDENY:  boolean,
      PORTUSAF:  boolean,
      PORTUWHENLISTEN:  boolean,
      PORTUWHENBIND:  boolean,
    },
    resv: string,
    PORTBindAddr4?: string,
    PORTBindAddr6?: string,
}

export interface TCPInfo {
    IPv6Enabled: boolean;
    stackStartTime: string;
}

export interface HeadCell {
    id: keyof OPDataRow | keyof RPDataRow;
    label: string;
    numeric: boolean;
}

export type Order = 'asc' | 'desc';

export interface Ports {
    ports: any[];
    timestamp: Date;
    error: string;
    loading?: boolean;
}

/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

  SPDX-License-Identifier: EPL-2.0

  Copyright Contributors to the Zowe Project.
*/

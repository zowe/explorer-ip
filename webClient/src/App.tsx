/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

  SPDX-License-Identifier: EPL-2.0

  Copyright Contributors to the Zowe Project.
*/
import * as React from 'react';
import OccupiedPortsTable from './components/OccupiedPortsTable';
import ReservedPortsTable from './components/ReservedPortsTable';
import NavigationTabs from './components/NavigationTabs';
import { withTranslation } from 'react-i18next';
import { Page, Ports, TCPInfo, OPDataRow, RPDataRow } from './common/types';
import STCKtoTS from './utilities/STCKtoTS';

interface AppState {
  started: Date,
  ipv6: boolean,
  occupiedPorts: Ports,
  reservedPorts: Ports,
  loading: boolean,
  preferences: any,
}

class App extends React.Component<any, AppState> {
  private log: ZLUX.ComponentLogger;
  readonly state: Readonly<AppState>
  t: any;

  constructor(props: any){
    super(props);
    const metadata = this.props.resources.launchMetadata;
    this.log = this.props.resources.logger;
    this.state = {
      started: new Date(0),
      ipv6: false,
      occupiedPorts: {ports: [], timestamp: new Date(0), loading: true, error: null},
      reservedPorts: {ports: [], timestamp: new Date(0), loading: true, error: null},
      loading: true,
      preferences: {predefinedFilter: (metadata && metadata.data && metadata.data.type === 'filter') ? metadata.data.value : ''},
    };
    this.getOccupiedPortsList = this.getOccupiedPortsList.bind(this);
    this.getReservedPortsList = this.getReservedPortsList.bind(this);
    this.savePreferences = this.savePreferences.bind(this);
    this.getPreferences();
  };

  componentDidMount() {
    this.props.ipexplorerApi.getInfo()
      .then((response: {info: TCPInfo}) => {
        this.setState({ipv6: response.info.IPv6Enabled, started: STCKtoTS(response.info.stackStartTime)});
      });
    // Workaround to support adjustable height.
    const pluginsCollection = document.getElementsByClassName("react-plugin-container");
    Array.from(pluginsCollection)
      .filter(element => element.children && element.children[0].id === 'ipexplorer-root')
      .forEach(element => element.setAttribute("style", "height: 100%"));
  }

  getOccupiedPortsList(): void {
    this.setState({loading: true});
    this.props.ipexplorerApi.getConnections()
      .then((response: {connections: OPDataRow[]}) => {
        this.setState({loading: false, occupiedPorts: {ports: response.connections, timestamp: new Date(), error: null}});
      })
      .catch(err => {
        this.log.warn(err.message);
        this.setState({loading: false, occupiedPorts: {ports: [], timestamp: new Date(0), error: err.message}});
      });
  }

  getReservedPortsList(): void {
    this.setState({loading: true});
    this.props.ipexplorerApi.getPorts()
      .then((response: {ports: RPDataRow[]}) => {
        const reserved = response.ports.map(p => ({...p, useType: Object.keys(p.useType).filter(k => p.useType[k])[0]}))
        this.setState({loading: false, reservedPorts: {ports: reserved, timestamp: new Date(), error: null}});
      })
      .catch(err => {
        this.log.warn(err.message);
        this.setState({loading: false, reservedPorts: {ports: [], timestamp: new Date(0), error: err.message}});
      });
  }

  getPreferences(): void {
    this.props.ipexplorerApi.getPreferences()
      .then((response: { contents: any }) => {
        if (response) {
          this.setState({preferences: {...this.state.preferences, ...response.contents}});
        }
    });
  }

  savePreferences(name: string, pref: any): void {
    this.setState({preferences: {...this.state.preferences, [name]: pref}});
    this.props.ipexplorerApi.setPreference(name, pref);
  }

  public render(): JSX.Element {
    const { t } = this.props;
    this.t = t;

    const commonProps = {
      ipexplorerApi: this.props.ipexplorerApi,
      savePreferences: this.savePreferences,
      started: this.state.started,
      ipv6: this.state.ipv6,
      loading: this.state.loading,
      logger: this.log,
      t: this.props.t,
      predefinedFilter: this.state.preferences.predefinedFilter || '',
    }

    const OPTableProps = {
      ports: this.state.occupiedPorts,
      getPorts: this.getOccupiedPortsList,
      preferredSorting: this.state.preferences.OPTableSorting || {},
    };

    const RPTableProps = {
      ports: this.state.reservedPorts,
      getPorts: this.getReservedPortsList,
      preferredSorting: this.state.preferences.RPTableSorting || {},
    };

    const pages: Page[] = [
      {
        id: 'occupied-ports',
        label: 'Active Connections',
        component: <OccupiedPortsTable {...commonProps} {...OPTableProps}/>
      },
      {
        id: 'reserved-ports',
        label: 'Reserved Ports',
        component: <ReservedPortsTable {...commonProps} {...RPTableProps}/>
      },
    ];

    return (
      <div id="ipexplorer-root" style={{height: '100%'}}>
        <NavigationTabs pages={pages}/>
      </div>
    );
  }
}

export default withTranslation('translation')(App);

/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

  SPDX-License-Identifier: EPL-2.0

  Copyright Contributors to the Zowe Project.
*/

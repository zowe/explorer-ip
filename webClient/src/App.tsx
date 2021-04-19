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
import TCPIPDialog from './components/TCPIPDialog';
import Footer from './components/Footer';
import { withTranslation } from 'react-i18next';
import { Page, Ports, TCPInfo, OPDataRow, RPDataRow } from './common/types';
import STCKtoTS from './utilities/STCKtoTS';
import IPExplorerApi from './services/IPExplorerApi';
import CircularProgress from '@material-ui/core/CircularProgress';
import styles from './App-css';

interface AppState {
  started: Date,
  ipv6: boolean,
  occupiedPorts: Ports,
  reservedPorts: Ports,
  loading: boolean,
  preferences: any,
  tcpipName: string,
  ipexplorerApi: any,
  preload: boolean,
  showTCPIPDialog: boolean,
  openJobActions: ZLUX.Action[],
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
      tcpipName: '',
      ipexplorerApi: new IPExplorerApi(this.props.resources),
      preload: true,
      showTCPIPDialog: false,
      openJobActions: null,
    };
    this.getOccupiedPortsList = this.getOccupiedPortsList.bind(this);
    this.getReservedPortsList = this.getReservedPortsList.bind(this);
    this.savePreferences = this.savePreferences.bind(this);
    this.runPreload();
  };

  componentDidMount() {
    this.findActions();
    // Workaround to support adjustable height.
    const pluginsCollection = document.getElementsByClassName("react-plugin-container");
    Array.from(pluginsCollection)
      .filter(element => element.children && element.children[0].id === 'ipexplorer-root')
      .forEach(element => element.setAttribute("style", "height: 100%"));
  }

  getOccupiedPortsList(): void {
    this.setState({loading: true});
    this.state.ipexplorerApi.getConnections()
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
    this.state.ipexplorerApi.getPorts()
      .then((response: {ports: RPDataRow[]}) => {
        const reserved = response.ports.map(p => ({...p, useType: Object.keys(p.useType).filter(k => p.useType[k])[0]}))
        this.setState({loading: false, reservedPorts: {ports: reserved, timestamp: new Date(), error: null}});
      })
      .catch(err => {
        this.log.warn(err.message);
        this.setState({loading: false, reservedPorts: {ports: [], timestamp: new Date(0), error: err.message}});
      });
  }

  runPreload() {
    this.fetchPreferences()
      .then((preferences: any) => {
        this.setState({preferences: {...this.state.preferences, ...preferences}});
        if (preferences.tcpip && preferences.tcpip.tcpipName && typeof preferences.tcpip.tcpipName === 'string') {
          this.setState({tcpipName: preferences.tcpip.tcpipName});
          return preferences.tcpip.tcpipName;
        } else {
          return this.fetchDefaultTCPIPName();
        };
      })
      .then((tcpipName: string) => {
        this.setState({ipexplorerApi: new IPExplorerApi(this.props.resources, tcpipName), preload: false}, this.getTCPIPInfo);
      });
  }

  getTCPIPInfo() {
    this.setState({started: new Date(0), ipv6: false}, () => {
      this.state.ipexplorerApi.getInfo()
        .then((response: {info: TCPInfo}) => {
          this.setState({ipv6: response.info.IPv6Enabled, started: STCKtoTS(response.info.stackStartTime)});
        });
    });
  }

  fetchDefaultTCPIPName() {
    return this.state.ipexplorerApi.getDefaultTCPIPName()
      .then((response: {tcpip: {tcpipName: string}}) => {
        this.setState({tcpipName: response.tcpip.tcpipName});
        this.savePreferences("tcpip", {"tcpipName": response.tcpip.tcpipName});
        return response.tcpip.tcpipName;
    }).catch((error: Error) => {
      this.log.warn(`Could not fetch default TCPIP job name. ${error.message}`);
      const tcpipName = "*"
      this.setState({tcpipName});
      return tcpipName;
    });
  }

  fetchPreferences() {
    return this.state.ipexplorerApi.getPreferences()
      .then((response: { contents: any }) => {
        return response ? response.contents : {};
    }).catch((error: Error) => {
      this.log.warn(`Could not fetch application preferences. ${error.message}`);
      return {};
    });
  }

  savePreferences(name: string, pref: any): void {
    this.setState({preferences: {...this.state.preferences, [name]: pref}});
    this.state.ipexplorerApi.setPreference(name, pref)
      .catch((error: Error) => {
        this.log.warn(`Could not save application preferences. ${error.message}`);
      });
  }

  findActions(): void {
    const dispatcher = ZoweZLUX.dispatcher;
    const screenContext: any = {
      sourcePluginID: "org.zowe.explorer-ip",
      type: "open-job",
    };
    const recognizers = dispatcher.getRecognizers(screenContext);
    if (recognizers.length > 0) {
      const actions = recognizers
        .map((recognizer: ZLUX.RecognizerObject) => dispatcher.getAction(recognizer))
        .filter((action: ZLUX.Action) => !!action)
        .map((action: ZLUX.Action) => {
          if(typeof action.targetMode === 'string') {
            action.targetMode = ZoweZLUX.dispatcher.constants.ActionTargetMode[action.targetMode];
          }
          if(typeof action.type === 'string') {
            action.type = ZoweZLUX.dispatcher.constants.ActionType[action.type];
          }
          return action;
        })
        this.setState({openJobActions: actions});
    } 
  }

  public render(): JSX.Element {
    const { t } = this.props;
    this.t = t;

    const commonProps = {
      savePreferences: this.savePreferences,
      loading: this.state.loading,
      logger: this.log,
      t: this.props.t,
      predefinedFilter: this.state.preferences.predefinedFilter || '',
      openJobActions: this.state.openJobActions,
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

    const setTCPIPName = (tcpipName: string) => {
      if(tcpipName === this.state.tcpipName) {
        this.setState({showTCPIPDialog: false});
      } else {
        this.setState({
          tcpipName, 
          ipexplorerApi: new IPExplorerApi(this.props.resources, tcpipName),
          showTCPIPDialog: false
        }, () => {
          this.getTCPIPInfo();
          this.getOccupiedPortsList();
          this.getReservedPortsList();
          this.savePreferences("tcpip", {tcpipName});
        })
      }
    }

    const setDefaultTCPIPName = () => { 
      this.setState({showTCPIPDialog: false, preload: true});
      this.fetchDefaultTCPIPName()
        .then((tcpipName: string) => this.setState({
          ipexplorerApi: new IPExplorerApi(this.props.resources, tcpipName),
          preload: false
        }, () => {
            this.getTCPIPInfo(), 
            this.getOccupiedPortsList(), 
            this.getReservedPortsList()
        }));
    }

    return (
      <div id="ipexplorer-root" style={{height: '100%'}}>
        {this.state.preload
          ? <div style={{...styles.flexCenter, ...styles.layer as React.CSSProperties}}><CircularProgress/></div>
          : <React.Fragment>
              <NavigationTabs pages={pages}/>
              <Footer 
                started={this.state.started} 
                ipv6={this.state.ipv6} 
                tcpipName={this.state.tcpipName} 
                t={this.props.t}
                selectTCPIPJobName={() => {this.setState({showTCPIPDialog: true})}}
              />
            </React.Fragment>
          }
        {this.state.showTCPIPDialog 
          ? <TCPIPDialog 
              tcpipName={this.state.tcpipName} 
              setTCPIPName={setTCPIPName}
              setDefaultTCPIPName={setDefaultTCPIPName}
            /> 
          : null
        }
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

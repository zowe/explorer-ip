/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

  SPDX-License-Identifier: EPL-2.0

  Copyright Contributors to the Zowe Project.
*/
import * as React from 'react';
import { withTranslation } from 'react-i18next';
import {
  Button,
  ButtonGroup,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from '@material-ui/core';
import { Alert, Skeleton } from '@material-ui/lab';
import Refresh from '@material-ui/icons/Refresh';
import TableHeaderWithSorting from './TableParts/TableHeaderWithSorting';
import SearchField from './TableParts/SearchField';
import LimitRow from './TableParts/LimitRow';
import { getComparator, stableSort } from '../utilities/stableSort';
import { TableProps, HeadCell } from '../common/types';
import styles from '../App-css';

const ROWLIMIT = 500;

const headCells: HeadCell[] = [
  { id: 'portNumber', numeric: true, label: 'Port' },
  { id: 'portNumberEnd', numeric: true, label: 'Range' },
  { id: 'jobname', numeric: false, label: 'Job' },
  { id: 'safname', numeric: false, label: 'SAF' },
  { id: 'useType', numeric: false, label: 'Use Type' },
];

interface RPTableState {
  filter: string,
  order: 'asc' | 'desc',
  orderBy: HeadCell["id"],
  tcp: boolean,
  openJobActions: ZLUX.Action[],
}

class ReservedPortsTable extends React.Component<TableProps, RPTableState> {
  constructor(props: TableProps) {
    super(props);
    this.state = {
      filter: this.props.predefinedFilter || '',
      order: null,
      orderBy: null,
      tcp: true,
      openJobActions: null,
    }
  }

  handleRequestSort = (event: React.MouseEvent<any>, property: HeadCell["id"]) => {
    const currentOrderBy = this.state.orderBy || this.props.preferredSorting.orderBy || 'portNumber';
    const currentOrder = this.state.order || this.props.preferredSorting.order || 'asc';
    const isAsc = currentOrderBy === property && currentOrder === 'asc';
    this.setState({order: isAsc ? 'desc' : 'asc', orderBy: property});
  };

  isSortingChanged(): boolean {
    const {order, orderBy} = this.state;
    return !!orderBy && (order !== this.props.preferredSorting.order || orderBy !== this.props.preferredSorting.orderBy);
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
          action.type = dispatcher.constants.ActionType[action.type];
          action.targetMode = dispatcher.constants.ActionTargetMode[action.targetMode];
          return action;
        })
        this.setState({openJobActions: actions});
    } 
  }

  componentDidMount() {
    const {ports, error} = this.props.ports;
    if (!ports.length || error) {
      this.props.getPorts();
    }
    this.findActions();
  }

  componentWillUnmount() {
    if (this.isSortingChanged()) {
      this.props.savePreferences("RPTableSorting", {order: this.state.order, orderBy: this.state.orderBy});
    }
  }

  public render(): JSX.Element {
    const { filter, tcp } = this.state;
    const order = this.state.order || this.props.preferredSorting.order || 'asc';
    const orderBy = this.state.orderBy || this.props.preferredSorting.orderBy || 'portNumber';
    const { t, started, ipv6, loading } = this.props;
    const { ports, timestamp, error } = this.props.ports;
    const rowToLine = (row: Object) => Object.keys(row).map(i => row[i]).join(' *** ').toLowerCase();
    const filteredPorts = ports
      .filter(row => !filter || rowToLine(row).includes(filter.toLowerCase()))
      .filter(row => row.flags.TCP === tcp)

    return (
      <div style={styles.portsTableContainer}>
        <div style={styles.portsTableToolbar}>
          <div style={styles.flexCenter}>
            <SearchField t={t} predefinedFilter={this.props.predefinedFilter} loading={loading} setFilter={(filter) => this.setState({filter})}/>
            <div style={{paddingLeft: '20px'}}><ButtonGroup disabled={loading} disableElevation variant="contained" size="small">
              <Button color={tcp ? "primary" : "default"} onClick={() => this.setState({tcp: true})}>TCP</Button>
              <Button color={!tcp ? "primary" : "default"} onClick={() => this.setState({tcp: false})}>UDP</Button>
            </ButtonGroup></div>
          </div>
          <div style={styles.flexCenter}>
            <span>{timestamp.getTime() ? `${t('updated')}: ${timestamp.toLocaleString()}` : ''}</span>
            <IconButton size="small" disabled={loading} onClick={this.props.getPorts}>
              <Refresh/>
            </IconButton>
          </div>
        </div>
        {loading || error
          ? <Skeleton animation={error ? false : "wave"} variant="rect" height={styles.portsTableBody.height}/>
          : <TableContainer style={styles.portsTableBody} component={Paper}>
            <Table stickyHeader size="small">
              <TableHeaderWithSorting
                order={order}
                orderBy={orderBy}
                onRequestSort={this.handleRequestSort}
                headCells={headCells}
              />
              <TableBody>
                {stableSort(filteredPorts, getComparator(order, orderBy))
                  .slice(0, ROWLIMIT)
                  .map((row, index) => <TableRow key={index}>
                    {headCells.map(cell => <TableCell align={cell.numeric ? 'right' : 'left'}>
                      {(cell.id === 'jobname' && this.state.openJobActions && this.state.openJobActions.length > 0)
                        ? <JobCellWithMenu jobName={row[cell.id]} actions={this.state.openJobActions}/>
                        : row[cell.id]
                      }</TableCell>)}
                  </TableRow>)
                }
                {filteredPorts.length > ROWLIMIT
                  ? <LimitRow colspan={headCells.length + 1} extraRowsCount={filteredPorts.length-ROWLIMIT}/>
                  : null}
              </TableBody>
            </Table>
          </TableContainer>}
        { error
          ? <div style={{...styles.alertContainer, position: 'absolute', top: styles.portsTableBody.height}}>
              <Alert severity="error">{`${t('error')}: ${error}`}</Alert>
            </div>
          : null}
        <div style={styles.portsTableFooter}>
          <span>{`${t('started')}: ${started.getTime() ? started.toLocaleString() : ''}. IPv6 ${ipv6 ? t('isEnabled') : t('isDisabled') }.`}</span>
          <span>{`${t('total')}: ${ports.length}`}</span>
        </div>
      </div>
    );
  }
}

function JobCellWithMenu(props: {jobName: string | number, actions: ZLUX.Action[]}) {
  const {jobName, actions} = props;
  const dispatcher = ZoweZLUX.dispatcher;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (action: ZLUX.Action) => {
    setAnchorEl(null);
    if (action) {
      const parameters = {owner: '*', jobId: '*', prefix: jobName};
      const argumentData = {'data': parameters};
      dispatcher.invokeAction(action, argumentData);
    }
  };

  return (
    <div>
      <div onClick={handleClick} style={{textDecoration: 'underline', cursor: 'pointer'}}>{jobName}</div> 
      <Menu
        id="job-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {actions.map((action: ZLUX.Action) => <MenuItem onClick={() => handleClose(action)}>{action.defaultName}</MenuItem>)}
      </Menu>
    </div>
  );
}

export default withTranslation('translation')(ReservedPortsTable);

/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

  SPDX-License-Identifier: EPL-2.0

  Copyright Contributors to the Zowe Project.
*/


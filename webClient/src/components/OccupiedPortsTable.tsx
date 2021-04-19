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
  IconButton,
  Paper,
  Table,
  TableBody,
  TableContainer,
} from '@material-ui/core';
import { Alert, Skeleton } from '@material-ui/lab';
import { Refresh } from '@material-ui/icons';
import { getComparator, stableSort } from '../utilities/stableSort';
import { TableProps, OPDataRow, HeadCell } from '../common/types';
import TableHeaderWithSorting from './TableParts/TableHeaderWithSorting';
import ExpandableTableRow from './TableParts/ExpandableTableRow';
import SearchField from './TableParts/SearchField';
import LimitRow from './TableParts/LimitRow';
import styles from '../App-css';

const ROWLIMIT = 500;

const headCells: HeadCell[] = [
  { id: 'localPort', numeric: true, label: 'Port' },
  { id: 'localIPaddress', numeric: false, label: 'Local IP Address' },
  { id: 'remoteIPaddress', numeric: false, label: 'Remote IP Address' },
  { id: 'remotePort', numeric: true, label: 'Remote Port' },
  { id: 'state', numeric: false, label: 'State' },
  { id: 'resourceName', numeric: false, label: 'Resource' },
];

interface DetailLabel {
  id: keyof OPDataRow;
  label: string;
  type: string;
}

const detailLabels: DetailLabel[] = [
  {id: "startTime", label: "Start Time", type: "STCK"},
  {id: "asid", label:  "Address Space ID", type: "hex"},
  {id: "resourceName", label:  "Resource", type: "string"},
  {id: "bytesIn", label:  "In", type: "data"},
  {id: "lastActivity", label:  "Last Activity", type: "STCK"},
  {id: "tcb", label:  "Task Control Block", type: "hex"},
  {id: "resourceID", label:  "Resource ID", type: "string"},
  {id: "bytesOut", label:  "Out", type: "data"},
];

interface OPTableState {
  filter: string,
  order: 'asc' | 'desc',
  orderBy: HeadCell["id"],
}

class OccupiedPortsTable extends React.Component<TableProps, OPTableState> {
  constructor(props: TableProps) {
    super(props);
    this.state = {
      filter: this.props.predefinedFilter || '',
      order: null,
      orderBy: null,
    }
  }

  handleRequestSort = (event: React.MouseEvent<any>, property: HeadCell["id"]) => {
    const currentOrderBy = this.state.orderBy || this.props.preferredSorting.orderBy || 'localPort';
    const currentOrder = this.state.order || this.props.preferredSorting.order || 'asc';
    const isAsc = currentOrderBy === property && currentOrder === 'asc';
    this.setState({order: isAsc ? 'desc' : 'asc', orderBy: property});
  };

  isSortingChanged(): boolean {
    const {order, orderBy} = this.state;
    return !!orderBy && (order !== this.props.preferredSorting.order || orderBy !== this.props.preferredSorting.orderBy);
  }

  componentDidMount() {
    const {ports, error} = this.props.ports;
    if (!ports.length || error) {
      this.props.getPorts();
    }
  }

  componentWillUnmount() {
    if (this.isSortingChanged()) {
      this.props.savePreferences("OPTableSorting", {order: this.state.order, orderBy: this.state.orderBy});
    }
  }

  public render(): JSX.Element {
    const { filter } = this.state;
    const order = this.state.order || this.props.preferredSorting.order || 'asc';
    const orderBy = this.state.orderBy || this.props.preferredSorting.orderBy || 'localPort';
    const { t, loading, openJobActions } = this.props;
    const { ports, timestamp, error } = this.props.ports;
    const rowToLine = (row: Object) => {
      const rowKeys = headCells.map(c => (c.id).toString());
      return Object.keys(row).filter(i => rowKeys.includes(i)).map(i => row[i]).join(' *** ').toLowerCase();
    }
    const filteredPorts = ports.filter(row => !filter || rowToLine(row).includes(filter.toLowerCase()))

    return (
      <div style={styles.portsTableContainer}>
        <div style={styles.portsTableToolbar}>
          <div style={styles.flexCenter}>
            <SearchField t={t} predefinedFilter={this.props.predefinedFilter} loading={loading} setFilter={(filter: string) => this.setState({filter})}/>
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
                zeroColumn={true}
              />
              <TableBody>
                {stableSort(filteredPorts, getComparator(order, orderBy))
                  .slice(0, ROWLIMIT)
                  .map(row => <ExpandableTableRow
                    key={rowToLine(row)}
                    row={row}
                    t={t}
                    headCells={headCells}
                    detailLabels={detailLabels}
                    openJobActions={openJobActions}
                  />)
                }
                {filteredPorts.length > ROWLIMIT
                  ? <LimitRow colspan={headCells.length + 1} extraRowsCount={filteredPorts.length-ROWLIMIT}/>
                  : null}
              </TableBody>
            </Table>
          </TableContainer>}
        { error
          ? <div style={styles.alertContainer as React.CSSProperties}>
              <Alert severity="error">{`${t('error')}: ${error}`}</Alert>
            </div>
          : null}
      </div>
    );
  }
}

export default withTranslation('translation')(OccupiedPortsTable);

/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

  SPDX-License-Identifier: EPL-2.0

  Copyright Contributors to the Zowe Project.
*/


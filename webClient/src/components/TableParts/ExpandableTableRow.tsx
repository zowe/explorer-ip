/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

  SPDX-License-Identifier: EPL-2.0

  Copyright Contributors to the Zowe Project.
*/
import * as React from 'react';
import {
    Box,
    Collapse,
    IconButton,
    TableCell,
    TableRow,
    Typography,
  } from '@material-ui/core';
import { KeyboardArrowUp } from '@material-ui/icons';
import TooltipCell from './TooltipCell';
import STCKtoTS from '../../utilities/STCKtoTS';
import styles from '../../App-css';
import { HeadCell } from '../../common/types';
import LabelWithMenu from './LabelWithMenu';

interface RowProps {
    row: any,
    t: any
    headCells: HeadCell[],
    detailLabels: any[],
    openJobActions: ZLUX.Action[],
  }

interface RowState {
    isOpen: boolean,
}

export default class ExpandableTableRow extends React.Component<RowProps, RowState> {
    constructor(props: RowProps) {
      super(props);
      this.state = {
        isOpen: false,
      }
    }

    private formatItem(item: any, type: string) {
      const units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      let formattedItem: string;
      switch (type) {
        case "STCK":
          formattedItem = STCKtoTS(item).toLocaleString();
          break;
        case "hex":
          formattedItem = parseInt(item, 10).toString(16);
          break;
        case "data":
          let l = 0;
          let n = parseInt(item, 10);
          while (n >= 1024 && ++l) {
            n = n/1024;
          }
          formattedItem = `${n.toFixed(n < 10 && l > 0 ? 1 : 0)} ${units[l]}`;
          break;
        default: formattedItem = item;
          break;
      }
      return formattedItem;
    }

    public render(): JSX.Element {
      const {isOpen} = this.state;
      const {row, headCells, detailLabels} = this.props;


      return (
        <React.Fragment>
          <TableRow>
            <TableCell>
              <IconButton aria-label="expand row" size="small" onClick={() => {
                this.setState({isOpen: !this.state.isOpen});
              }}>
                <KeyboardArrowUp style={{transform: isOpen ? 'none' : 'rotate(180deg)'}}/>
              </IconButton>
            </TableCell>
            {headCells.map(cell => {
              switch (cell.id) {
                case 'localIPaddress':
                case 'remoteIPaddress':
                  return <TooltipCell value={row[cell.id]}/>
                case 'resourceName':
                  if (this.props.openJobActions && this.props.openJobActions.length > 0) {
                    return (
                      <TableCell align={cell.numeric ? 'right' : 'left'}>
                        <LabelWithMenu jobName={row[cell.id]} actions={this.props.openJobActions}/>
                      </TableCell>
                    )
                  }
                default:
                  return <TableCell align={cell.numeric ? 'right' : 'left'}>{row[cell.id]}</TableCell>
              }
            })}
          </TableRow>
          <TableRow>
            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
              <Collapse in={isOpen} timeout="auto" unmountOnExit>
                <Box style={{padding: '16px 0 0 48px'}}>
                  <Typography variant="body2">
                    <div style={styles.detailsContainer}>
                      {detailLabels.map(item => (
                        <div>
                          {`${item.label}: ${this.formatItem(row[item.id], item.type)}`}
                        </div>
                      ))}
                    </div>
                  </Typography>
                </Box>
              </Collapse>
            </TableCell>
          </TableRow>
        </React.Fragment>
      );
    }
  }

/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

  SPDX-License-Identifier: EPL-2.0

  Copyright Contributors to the Zowe Project.
*/

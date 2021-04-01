/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

  SPDX-License-Identifier: EPL-2.0

  Copyright Contributors to the Zowe Project.
*/
import * as React from 'react';
import TableCell from '@material-ui/core/TableCell';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { HeadCell, Order } from '../../common/types';

interface TableHeaderWithSortingProps {
    onRequestSort: (event: React.MouseEvent<any>, property: HeadCell["id"]) => void;
    order: Order;
    orderBy: HeadCell["id"];
    headCells: HeadCell[];
    zeroColumn?: boolean;
}

const TableHeaderWithSorting: React.FC<TableHeaderWithSortingProps> = props => {
  const { headCells, order, orderBy, onRequestSort, zeroColumn } = props;
  const createSortHandler = (property: HeadCell["id"]) => (event: React.MouseEvent<any>) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {zeroColumn ? <TableCell /> : null}
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

export default TableHeaderWithSorting;

/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

  SPDX-License-Identifier: EPL-2.0

  Copyright Contributors to the Zowe Project.
*/

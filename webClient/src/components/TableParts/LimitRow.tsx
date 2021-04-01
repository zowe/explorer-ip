/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

  SPDX-License-Identifier: EPL-2.0

  Copyright Contributors to the Zowe Project.
*/
import * as React from 'react';
import {
  TableRow,
  TableCell,
} from '@material-ui/core';
import styles from '../../App-css';

// TODO: Use virtualized table instead of hard limit

const LimitRow: React.FC<any> = props => {
    return <TableRow>
        <TableCell colSpan={props.colspan}>
        <div style={styles.portsTableFooter}>
            {`... and ${props.extraRowsCount} more rows, use sorting and filtering to retrieve`}
        </div>
        </TableCell>
    </TableRow>
}

export default LimitRow;

/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

  SPDX-License-Identifier: EPL-2.0

  Copyright Contributors to the Zowe Project.
*/

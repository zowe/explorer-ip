/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

  SPDX-License-Identifier: EPL-2.0

  Copyright Contributors to the Zowe Project.
*/
import * as React from 'react';
import { Tooltip as MaterialTooltip, TableCell } from '@material-ui/core';
import HelpIcon from '@material-ui/icons/Help';
import styles from '../../App-css';

// TODO: Make separate dictionary with tooltips

const tooltipsDict = {
  '::ffff:': 'Prefix ::ffff: indicates IPv4-mapped IPv6 addresses',
  '::': 'Consecutive sections of zeros are replaced with two colons in IPv6',
};

const localStyles = {fixedWidth: {minWidth: '26px', marginLeft: 'auto'}};

interface TooltipCellProps {
  value: string;
}

const TooltipCell: React.FC<TooltipCellProps> = props => {
  const { value } = props;
  const hasTooltip = Object.keys(tooltipsDict).some(t => value.includes(t));
  const [showTooltip, setTooltipVisibility] = React.useState(false);

  return (
    <TableCell
      onMouseEnter={() => setTooltipVisibility(hasTooltip)}
      onMouseLeave={() => setTooltipVisibility(false)}>
        <div style={styles.flexCenter}>
          <div>{value}</div>
          <div style={localStyles.fixedWidth}>{showTooltip ? <Tooltip value={value}/> : null}</div>
        </div>
    </TableCell>
  )
}

const Tooltip: React.FC<TooltipCellProps> = props => {
  const { value } = props;
  const content = <div>{Object.keys(tooltipsDict).filter(tkey => value.includes(tkey)).map(tkey => tooltipsDict[tkey]).join(';\n ')}</div>;

  return (
    <MaterialTooltip title={content}>
      <HelpIcon fontSize='small' />
    </MaterialTooltip>
  );
}

export default TooltipCell;

/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

  SPDX-License-Identifier: EPL-2.0

  Copyright Contributors to the Zowe Project.
*/

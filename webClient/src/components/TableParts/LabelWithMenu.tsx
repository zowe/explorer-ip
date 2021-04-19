/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

  SPDX-License-Identifier: EPL-2.0

  Copyright Contributors to the Zowe Project.
*/
import * as React from 'react';
import { Menu, MenuItem } from '@material-ui/core';
import styles from '../../App-css';


const LabelWithMenu: React.FC<any> = (props: {jobName: string | number, actions: ZLUX.Action[]}) => {
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
    <div onClick={handleClick} style={styles.clickableText}>{jobName}</div> 
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
      

export default LabelWithMenu;

/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

  SPDX-License-Identifier: EPL-2.0

  Copyright Contributors to the Zowe Project.
*/

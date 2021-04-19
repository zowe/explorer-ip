/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

  SPDX-License-Identifier: EPL-2.0

  Copyright Contributors to the Zowe Project.
*/
import * as React from 'react';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import styles from '../App-css';
import { Page } from '../common/types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = props => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      style={styles.tabPanel}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && children}
    </div>
  );
}

interface NavTabProps {
  pages: Page[];
}

const NavigationTabs: React.FC<NavTabProps> = props => {
  const [value, toggle] = React.useState(0);

  return (
    <div style={styles.tabsContainer}>
      <AppBar position="static">
        <Tabs value={value} onChange={(event, newValue) => toggle(newValue)} aria-label="navigation tabs">
            {props.pages.map(p => <Tab label={p.label} id={`${p.id}-tab`} />)}
        </Tabs>
      </AppBar>
      {props.pages.map((p, ind) => (
            <TabPanel value={value} index={ind}>
                {p.component}
            </TabPanel>))}
    </div>
  );
}

export default NavigationTabs;

/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

  SPDX-License-Identifier: EPL-2.0

  Copyright Contributors to the Zowe Project.
*/

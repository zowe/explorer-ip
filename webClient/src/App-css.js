/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

  SPDX-License-Identifier: EPL-2.0

  Copyright Contributors to the Zowe Project.
*/
const tabsHeight = 48;
const toolbarHeight = 54;
const footerHeight = 34;
const border = 1;

const styles = {
  tabPanel: {
    height: `calc(100% - ${tabsHeight}px)`
  },

  portsTableContainer: {
    height: "100%",
  },

  portsTableToolbar: {
    color: "rgba(0, 0, 0, 0.54)",
    fontSize: "0.825rem",
    padding: "4px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #a9a9a9",
  },

  flexCenter: {
    display: "flex",
    alignItems: "center",
  },

  portsTableBody: {
    height: `calc(100% - ${toolbarHeight + footerHeight + border}px)`,
  },

  portsTableFooter: {
    color: "rgba(0, 0, 0, 0.54)",
    display: "flex",
    fontSize: "0.825rem",
    justifyContent: "space-between",
    padding: "8px 16px",
  },

  detailsContainer: {
    display: 'grid',
    gridTemplateColumns: '30% 30% 20% 20%',
    gridTemplateRows: '30px 30px',
    fontSize: '12px'
  },

  alertContainer: {
    padding: '0 10px',
    width: '-webkit-fill-available',
  }
};

export default styles;

/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html

  SPDX-License-Identifier: EPL-2.0

  Copyright Contributors to the Zowe Project.
*/

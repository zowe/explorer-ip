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

  tabsContainer: {
    height: `calc(100% - ${footerHeight}px)`
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

  portsTableBody: {
    height: `calc(100% - ${toolbarHeight + border}px)`,
  },

  portsTableFooter: {
    alignItems: "center",
    color: "rgba(0, 0, 0, 0.54)",
    display: "flex",
    fontSize: "0.825rem",
    height: `${footerHeight}px`,
    justifyContent: "space-between",
    padding: "0 16px",
  },

  detailsContainer: {
    display: 'grid',
    gridTemplateColumns: '30% 30% 20% 20%',
    gridTemplateRows: '30px 30px',
    fontSize: '12px'
  },

  alertContainer: {
    bottom: '45px',
    padding: '0 10px',
    position: 'absolute', 
    width: '-webkit-fill-available',
  },

  layer: {
    inset: "0px",
    height: "100%",
    position: "absolute",
    width: "100%",
  },

  flexCenter: {
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
  },

  clickableText: {
    cursor: "pointer",
    textDecoration: "underline",
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

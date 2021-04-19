import * as React from 'react';
import styles from '../App-css';

interface footerProps {
  started: Date, 
  ipv6: boolean, 
  tcpipName: string,
  t: any,
  selectTCPIPJobName: any,
}

const Footer: React.FC<footerProps> = props => {
  const {started, ipv6, tcpipName, t} = props;

  return (
    <div style={styles.portsTableFooter}>
      <span>
        <span>{`TCPIP Job Name: `}</span>
        <span onClick={props.selectTCPIPJobName} style={{...styles.clickableText, fontWeight: "bold"}}>{tcpipName}</span>
      </span>
      <span>{`${t('started')}: ${started.getTime() ? started.toLocaleString() : ''}. IPv6 ${ipv6 ? t('isEnabled') : t('isDisabled') }.`}</span>
    </div>
  )
}

export default Footer;
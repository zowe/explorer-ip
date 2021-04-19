import * as React from 'react';
import {Button, TextField} from '@material-ui/core';
import styles from '../App-css';

const localStyles = {
    modalDialogStyle: {
        backgroundColor: "white",
        borderTop: "solid 3px #3f51b5",
        display: "flex",
        flexDirection: "column",
        inset: "0px",
        height: "160px",
        justifyContent: "space-between",
        margin: "auto",
        padding: "20px",
        position: "absolute", 
        width: "340px",
        zIndex: 20,
    },
    translucentLayer: {
        backgroundColor: "gray",
        opacity: "0.6",
        zIndex: 10
    }
}

const TCPIPDialog: React.FC<any> = props => {
  const [value, setValue] = React.useState(props.tcpipName);

  return (
    <React.Fragment>
        <div style={localStyles.modalDialogStyle as React.CSSProperties}>
            <TextField
                id="standard-input"
                label={"Enter TCPIP Job Name"}
                size="small"
                value={value}
                onChange={evt => {
                    setValue(evt.target.value);
                }}
            />
            <div style={{...styles.flexCenter, justifyContent: "space-between"}}>
                <Button variant="outlined" onClick={() => props.setDefaultTCPIPName()}>Use Default</Button>
                <Button variant="contained" disabled={!value} color="primary" onClick={() => props.setTCPIPName(value.toUpperCase())}>Set</Button>
            </div>
        </div>
        <Overlay onClick={() => props.setTCPIPName(props.tcpipName)}/>
    </React.Fragment>
  )
}

const Overlay: React.FC<any> = props => {
    return (
        <div style={{...styles.layer as React.CSSProperties, ...localStyles.translucentLayer}}
            onClick={props.onClick ? () => props.onClick() : () => {}}
        >
          {props.children ? props.children : null}
        </div>
    );
}

export default TCPIPDialog;

import React, { useEffect, useRef, useState } from "react";
import dayjs from 'dayjs';
import { connect } from "react-redux";
import cx from 'classnames'
import { Button, notification, Switch, InputNumber, TimePicker  } from 'antd';
import { setDeviceControl, setAutoControlState } from "@/redux/action";

import "./Auto.scss";

const Auto = ({
  portStatus,
  deviceControl,
  autoControlState,
  deviceEr,

  setDeviceControl,
  setAutoControlState,
  setImpulsTime,
}) => {
  const disableFlag = portStatus === 'connected';
  const [api, contextHolder] = notification.useNotification();
  
  const format = 'HH:mm';

  return (
    <div className="auto">
      {contextHolder}
      <div className="auto_left">
        <span className="auto_left__title">Автоматическое управление:</span>
        <span className="auto_left__switch">
          <Switch
            // defaultValue={deviceControl === "manual"}
            value={deviceControl === "auto"}
            disabled={!disableFlag || deviceEr}
            onChange={() => {setDeviceControl("auto")}}
          ></Switch>
        </span>

        <Button
          style={{width: 110}}
          disabled={!disableFlag || deviceControl !== "auto"}
          className="scanControl_left__startBtn"
          type="primary" 
          onClick={() => setAutoControlState()} 
        >
          {autoControlState ? "Остановить" : "Начать"}
        </Button>
        
        
      </div>
      <div className="auto_right">
       
        </div>
    </div>
  )
}

export default connect(
  ({main: { portStatus, deviceControl, autoControlState, deviceEr }}) =>
  ({ portStatus, deviceControl, autoControlState, deviceEr }),
  ({ setDeviceControl, setAutoControlState })
)(Auto)
import React, { useEffect, useRef, useState } from "react";
import { connect } from "react-redux";
import cx from 'classnames'
import { Button, notification, Switch, InputNumber } from 'antd';
import { setDeviceControl, manualControl, setImpulsTime, lightControl } from "@/redux/action";

import "./Manual.scss";

const Manual = ({
  portStatus,
  deviceControl,
  manualControlBlock,
  impulsTime,
  deviceEr,
  lightStatus,

  setDeviceControl,
  manualControl,
  setImpulsTime,
  lightControl
}) => {
  const disableFlag = portStatus === 'connected';
  const [api, contextHolder] = notification.useNotification();
  
  return (
    <div className="manual">
      {contextHolder}
      <div className="manual_left">
        <span className="manual_left__title">Ручное управление:</span>
        <span className="manual_left__switch">
          <Switch
            // defaultValue={deviceControl === "manual"}
            value={deviceControl === "manual"}
            disabled={!disableFlag || deviceEr}
            onChange={() => {setDeviceControl("manual")}}
          ></Switch>
        </span>

        <Button
          style={{width: 90}}
          loading={manualControlBlock}
          disabled={!disableFlag || deviceControl !== "manual" || manualControlBlock}
          className="scanControl_left__startBtn"
          type="primary" 
          onClick={() => manualControl(api)} 
        >
          {"Реле"}
        </Button>
        <Button
          style={{marginLeft: 5, width: 140}}
          disabled={!disableFlag || deviceControl !== "manual"}
          className="scanControl_left__startBtn"
          type={!lightStatus ? "primary" : "default"} 
          onClick={() => lightControl(api)} 
        >
          {`${!lightStatus ? "Вкл" : "Откл"}  освещение`}
        </Button>
      </div>
      <div className="manual_right">
        <span className="manual_right__title">Время импульса, с</span>
        <InputNumber
          // style={{ width: 200 }}
          value={impulsTime}
          step="0.1"
          onChange={(v) => setImpulsTime(v)}
          stringMode
        />
      </div>
    </div>
  )
}

export default connect(
  ({main: { portStatus, deviceControl, manualControlBlock, impulsTime, deviceEr, lightStatus }}) =>
  ({ portStatus, deviceControl, manualControlBlock, impulsTime, deviceEr, lightStatus }),
  ({ setDeviceControl, manualControl, setImpulsTime, lightControl })
)(Manual)
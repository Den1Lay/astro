import React, { useEffect, useRef, useState } from "react";
import { connect } from "react-redux";
import cx from 'classnames'
import { Button, notification } from 'antd';
import { setScan, degSecondsAndCheck } from '@/redux/action'
import { ConfigModal } from '@/containers';

import "./ScanControl.scss";

const ScanControl = ({
  portStatus,
  scanStatus,
  leftTime,

  degSecondsAndCheck,
  setScan,
}) => {
  const disableFlag = portStatus === 'connected';
  const [api, contextHolder] = notification.useNotification();
  const [intervalStorage, setIntervalStorage] = useState({point: null, flag: false});

  // const savedCallback = useRef()
  // useEffect(() => {
  //   savedCallback.current = () => {
  //     console.log("tick");
  //   }
  // }, [])
  
  useEffect(() => {
    function tick() {
      scanStatus && degSecondsAndCheck();
    }

    let id = setInterval(tick, 1000);
    return () => clearInterval(id);
  })

  // useEffect(() => {
  //   if(!intervalStorage.flag) {
  //     const a = setInterval(() => {
  //       console.log("")
  //     }, 1000);
  //     setIntervalStorage({point: a, flag: true});
  //   }
  //   return () => {
  //     clearInterval(intervalStorage);
  //     setIntervalStorage(null);
  //   }
  // })
  let seconds = leftTime%60;
  let mins = ~~(leftTime/60);
  seconds = seconds < 10 ? '0'+seconds :seconds;
  mins = mins < 10 ? '0'+mins:mins;
  return (
    <div className="scanControl">
      {contextHolder}
      <div className="scanControl_left">
        <span>Сканирование</span>
        <Button
          disabled={!disableFlag}
          className="scanControl_left__startBtn"
          type="default" 
          onClick={() => setScan({api})} 
        >
          {scanStatus ? "Стоп" : "Старт"}
        </Button>
        <span>{`${mins}:${seconds}`}</span>
      </div>
      <div className="scanControl_right">
        <ConfigModal />
      </div>
    </div>
  )
}

export default connect(
  ({main: { portStatus, scanStatus, leftTime }}) =>
  ({ portStatus, scanStatus, leftTime }),
  ({ setScan, degSecondsAndCheck })
)(ScanControl)
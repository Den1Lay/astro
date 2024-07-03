import React, { useEffect, useRef, useState } from "react";
import dayjs from 'dayjs';
import { connect } from "react-redux";
import cx from 'classnames'
import { Button, notification, Switch, InputNumber, TimePicker  } from 'antd';
import { 
  setDeviceControl, 
  setAutoControlState, 
  setStageTime, 
  manualControl, 
  resetStages, 
  setSequenceName, 
  lightControl, 
  setAutoLoopState,
  setLightTimeDelay 
} from "@/redux/action";

import "./TimeControl.scss";


const TimeControl = ({
  stage1start, 
  stage1end, 
  stage2start, 
  stage2end,

  stage1startComplete, 
  stage1endComplete,
  stage2startComplete, 
  stage2endComplete,

  sequenceName,
  sequenceStartTime,
  s0,
  s1,
  s2,
  autoLoopState,

  autoControlState,
  lightTimeDelay,

  setStageTime,
  manualControl,
  resetStages,
  setSequenceName,
  lightControl,
  setAutoLoopState,
  setLightTimeDelay
}) => {
  const [api, contextHolder] = notification.useNotification();
  
  const format = 'HH:mm:ss';

  function getStrTime(time) {
    let h = ~~(time / (60*60))+'';
    let m = ~~((time % (60*60))/60)+'';
    let s = time % 60+'';
    h = h.length < 2 ? '0'+h : h;
    m = m.length < 2 ? '0'+m : m;
    s = s.length < 2 ? '0'+s : s;
    return `${h}:${m}:${s}`
  }
  const localStateObj = {stage1start, stage1end, stage2start, stage2end};

  useEffect(() => {
    function tick() {
      // var data = new Date();
      var data = new Date(2011, 0, 1, 5, 0, 0);
      const hours = data.getHours();
      const minutes = data.getMinutes();
      const secs = data.getSeconds();

      console.log(hours+" "+minutes+" "+secs);

      const etalon = hours*60*60 + minutes*60 + secs;
      const stage1startTimeDiff = Math.abs(etalon-stage1start);
      const stage1endTimeDiff = Math.abs(etalon-stage1end);
      const stage2startTimeDiff = Math.abs(etalon-stage2start);
      const stage2endTimeDiff = Math.abs(etalon-stage2end);

      if(!autoControlState) {
        return
      }

      // console.log(stage1startComplete, stage1timeDiff);
      // check stage1
      if(!sequenceName && stage1startTimeDiff === 0 && !stage1startComplete ) {
        // manualControl(api, "stage1startComplete");
        setSequenceName("stage1startComplete");

      }
      if(!sequenceName && stage1endTimeDiff === 0 && !stage1endComplete) {
        // manualControl(api, "stage1endComplete");
        setSequenceName("stage1endComplete");
      }

      // if(!sequenceName && stage2startTimeDiff === 0) {
      //   // manualControl(api, "stage2startComplete");
      //   setSequenceName("stage2startComplete");
      // }
      // if(!sequenceName && stage2endTimeDiff === 0) {
      //   // manualControl(api, "stage2endComplete");
      //   setSequenceName("stage2endComplete");
      // }

      // восстановление всех зарядов
      if(
        [stage1startTimeDiff, stage1endTimeDiff].every(el => el !== 0) &&
        stage1startComplete && stage1endComplete && autoLoopState
      ) {
        resetStages()
      }

      // sequence controller
      if(sequenceName) {
        const curTimeDif = Date.now() - sequenceStartTime;
        if(!s0) {
          lightControl(api, 2, "s0");
        }
        if(!s1 && curTimeDif > 5000) {
          manualControl(api, sequenceName, "s1");
        }
        if(!s2 && curTimeDif > ~~(lightTimeDelay*1000) + 5000) {
          lightControl(api, 1, "s2");
        }
      }
    }

    let id = setInterval(tick, 100);
    return () => clearInterval(id);
  })

  return (
    <div className="timeControl">
      {contextHolder}
      <div className="timeControl_left">
        <span className="timeControl_left__title">
            {"Время начала ч:м:c"}
        </span>
        <TimePicker
          status={stage1startComplete ? "warning" : ''}
          disabled={false}
          className={"timeControl_left__start"}
          style={{width: 100}}
          onChange={v => {if (v) {localStateObj.stage1start = v["$H"]*60*60+ v["$m"]*60 +v["$s"]; setStageTime(localStateObj);}}} 
          value={dayjs(getStrTime(stage1start), format)} 
          format={format} />

        <TimePicker
          status={stage1endComplete ? "warning" : ''}
          disabled={false}
          style={{width: 100}}
          onChange={v => {if (v) {localStateObj.stage1end = v["$H"]*60*60+ v["$m"]*60 +v["$s"]; setStageTime(localStateObj);}}} 
          value={dayjs(getStrTime(stage1end), format)} 
          format={format} />
        <Button
          onClick={setAutoLoopState}
          style={{marginLeft: 5}}
          type={!autoLoopState ? "primary" : "default"}>
          {!autoLoopState ? "Вкл цикл" : "Откл цикл"}
        </Button>
      </div>
      <div className="timeControl_right">
        <span className="timeControl_right__title">Длительность освещения, с</span>
        <InputNumber
          // style={{ width: 200 }}
          value={lightTimeDelay}
          step="0.1"
          min={5}
          onChange={(v) => setLightTimeDelay(v)}
          stringMode
        />
      </div>
      {/* <div className="timeControl_left second_el">
        <span className="timeControl_left__title">
          {"Время пуска - остановки 2 этапа, ч:м:c"}
        </span>
        <TimePicker
          status={stage2startComplete ? "warning" : ''}
          disabled={false}
          className={"timeControl_left__start"}
          style={{width: 100}}
          onChange={v => { localStateObj.stage2start = v["$H"]*60*60+ v["$m"]*60 +v["$s"]; setStageTime(localStateObj); }} 
          value={dayjs(getStrTime(stage2start), format)} 
          format={format} />

        <TimePicker
          status={stage2endComplete ? "warning" : ''}
          disabled={false}
          style={{width: 100}}
          onChange={v => { localStateObj.stage2end = v["$H"]*60*60+ v["$m"]*60 +v["$s"]; setStageTime(localStateObj); }} 
          value={dayjs(getStrTime(stage2end), format)} 
          format={format} />
        
      </div> */}
      {/* <div className="timeControl_right">
     
        </div> */}
    </div>
  )
}

export default connect(
  ({main: { 
    stage1start, 
    stage1end, 
    stage2start, 
    stage2end,
    stage1startComplete, 
    stage1endComplete,
    stage2startComplete, 
    stage2endComplete,
    autoControlState,
    sequenceName,
    sequenceStartTime,
    s0,
    s1,
    s2,
    autoLoopState,
    lightTimeDelay,
  }}) =>
  ({ 
    stage1start, 
    stage1end, 
    stage2start, 
    stage2end,
    stage1startComplete, 
    stage1endComplete,
    stage2startComplete, 
    stage2endComplete,
    autoControlState,
    sequenceName,
    sequenceStartTime,
    s0,
    s1,
    s2,
    autoLoopState,
    lightTimeDelay,
   }),
  ({ setStageTime, manualControl, resetStages, setSequenceName, lightControl, setAutoLoopState, setLightTimeDelay })
)(TimeControl)
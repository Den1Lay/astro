import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import cx from 'classnames'
import { getPorts, setPort, setBaudrate, portAction } from '@/redux/action';
import { Select, Input, Dropdown, Button, notification, message } from 'antd';
import { openNotificationWithIcon } from '@/utils';

import './PortControl.scss';

const PortControl = ({
  ports,
  selectedPort,
  baudrate,
  portStatus,
  portEr,
  manualControlBlock,

  getPorts,
  setPort,
  setBaudrate,
  portAction,
}) => {
  const [api, contextHolder] = notification.useNotification();
  const [messageApi, messageContextHolder] = message.useMessage();

  // Эффекты на выставление дефолтного порта
  const [initGetPorts, setInitGetPorts] = useState(false);
  const [baseSelectedPort, setBaseSelectedPort] = useState(false);
  useEffect(() => {
    if(!initGetPorts) {
      getPorts()
      setInitGetPorts(true);
    }
    if(initGetPorts && !baseSelectedPort && ports.length) {
      setPort(ports[0]);
      setBaseSelectedPort(true);
    }
  })
  
  let portStatusLabelObj = {
    "disconnected": {text: "Отключен", css: '', conBtn: "Открыть", inputState: true},
    "connected": {text: "Подключен", css: '__connected', conBtn: "Закрыть", inputState: false},
    "error": {text: "Ошибка подключения", css: '__error', conBtn: "Открыть", inputState: true},
  };
  const {text, css, conBtn, inputState} = portStatusLabelObj[portStatus];
  return (
  <div className="portControl">
    {messageContextHolder}
    {contextHolder}
    <span className="portControl_label">
      Порт: 
    </span>
    <Select
      // prefixCls="aa"
      disabled={!inputState}
      size="middle"
      onClick={() => getPorts()}
      // defaultValue="lucy"
      placeholder="порт"
      value={selectedPort}
      style={{ width: 100 }}
      onChange={val => setPort(val)}
      options={ports.map(el => ({value: el, label: el}))}
    />
    <Button
      className="portControl_conBtn"
      type="default" 
      onClick={()=>portAction(api, messageApi)} 
      disabled={manualControlBlock}
    >
      {conBtn}
    </Button>
    <span 
    onClick={() => portEr != "Ok" && openNotificationWithIcon({api, type:"error",message:text, description:portEr })} 
    className={cx("portControl_status", `portControl_status${css}`)}>
      {text}
    </span>
  </div>
  )
}

export default connect(
  ({main: {ports, selectedPort, baudrate, portStatus, portEr, manualControlBlock}}) => 
  ({ports, selectedPort, baudrate, portStatus, portEr, manualControlBlock}), 
  ({ getPorts, setPort, setBaudrate, portAction })
)(PortControl)
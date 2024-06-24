import {
  SET_PORT,
  SET_BAUDRATE,
  SET_DEVICE_CONTROL,
  SET_MANUAL_CONTROL_BLOCK,
  SET_IMPULS_TIME,
  SET_AUTO_CONTROL_STATE,
  SET_STAGE_TIME,
  SET_STAGE_STATUS,
  RESET_STAGES,
  
  GET_PORTS,
  SET_PORT_STATE
} from "./actionTypes";
import { 
  openNotificationWithIcon, 
  modbusCRC, 
  reqMiddle, 
  getDebugHexString,
  updateTableData
} from '@/utils';

import { invoke } from "@tauri-apps/api/tauri";

export const setPort = portname => ({
  type: SET_PORT,
  payload: portname
})

export const setBaudrate = baudrate => ({
  type: SET_BAUDRATE,
  payload: baudrate
})

export const getPorts = () => async (dispatch, getState) => {
  console.log("getPorts")
  const ports = await invoke("get_ports");
  dispatch({
    type: GET_PORTS,
    payload: ports
  })
}

export const setDeviceControl = control => ({
  type: SET_DEVICE_CONTROL,
  payload: control
})

export const setImpulsTime = payload => ({
  type: SET_IMPULS_TIME,
  payload
})

export const setAutoControlState = () => ({
  type: SET_AUTO_CONTROL_STATE
})

export const setStageTime = payload => ({
  type: SET_STAGE_TIME,
  payload
})

export const resetStages = () => ({
  type: RESET_STAGES
})

export const portAction = (api, messageApi) => async (dispatch, getState) => {
  const { portStatus, selectedPort: portname, baudrate, scanStatus } = getState().main;
  let newPortStatus = 'connected';
  let er = 'Ok';
  let deviceEr = null;
  if(portStatus === 'connected') {
    if(scanStatus) {
      const {raw, er} = await stopScanning();
      
      if(er) {
        const { message, description } = er;
        openNotificationWithIcon({api, type:"error", message, description});
      }
      
    }
    er = await invoke('close_port')
    newPortStatus = 'disconnected';

  } else {
    await invoke("init_port");
    // er = await invoke("open_port", {portname: "COM17", baudrate: 115200});
    er = await invoke("open_port", {portname, baudrate});
    newPortStatus = 'connected';
    
    // подмена при выяление ошибки
    if(er != "Ok") {
      openNotificationWithIcon({api, type:"error", message:"Ошибка открытия порта", description: er});
      newPortStatus = 'error'
      return
    }

    const checkID = new Promise(async (resolve, reject) => {
      const initPass = [0xF9, 0x03, 0x00, 0xD0, 0x00, 0x01];
      const write_er = await writeReg(initPass, '00D0');
      // [0xF9, 0x10, 0x00, 0x66, 0x00, 0x01, 0x02, 0x09, 0x00]
      if(write_er === 'Ok') {
        setTimeout(async () => {
          const raw = await readReg();
          const er = reqMiddle(raw);
          resolve({raw, er});
        }, 300)
      } else {
        resolve({raw: [], er: {message: "Ошибка записи", description: write_er}});
      }
    });

    let {raw, er: emb_er} = await checkID;

    if(emb_er) {
      const {message, description} = emb_er;
      openNotificationWithIcon({api, type:"error", message, description});
      deviceEr = 'error'
    } else {
      // проверка raw
      console.log("RAW: ", raw);
      let checkFlag = false;
      [0xF9, 0x03, 0x02, 0x17, 0x17, 0x56, 0x6E].forEach((el, i) => {
        if(raw[i] !== el) {
          checkFlag = true;
        }
      });

      if(checkFlag) {
        openNotificationWithIcon({api, type:"error", message: "Неверный ответ", description: "Ответ прибора не соответствует ожидаемому"});
        deviceEr = 'error'
      } else {
        messageApi.open({
          type: "success",
          content: "Успешное подключение к прибору",
        });
        // легкое уведомление о том, что успешно подключились
      }
    }
  }

  dispatch({
    type: SET_PORT_STATE,
    payload: { newPortStatus, er, deviceEr }
  })
}

export const manualControl = (api, stageName = null) => async (dispatch, getState) => {
  const { portStatus, impulsTime } = getState().main;
  const initPass = [0xF9, 0x10, 0x00, 0x01, 0x00, 0x01, 0x01, 0x00];
  if(stageName) {
    dispatch({
      type: SET_STAGE_STATUS,
      payload: stageName
    });
  };

  dispatch({
    type: SET_MANUAL_CONTROL_BLOCK,
    payload: true
  });
  const write_er = await writeReg(initPass, '0001');
  if(write_er === 'Ok') {
    // следующий шаг
    await sequenceDelay(100);
    const raw = await readReg();
    const er = reqMiddle(raw);
    if(er) {
      const { message, description } = er;
      openNotificationWithIcon({api, type: 'error', message, description});
      return
    }
    // check raw
    let deathFlag = false;
    [0xF9, 0x10, 0x00, 0x01, 0x00, 0x01, 0x45, 0xB1].forEach((el, i) => {
      if(raw[i] !== el) {
        deathFlag = true;
      }
    });
    if(deathFlag) {
      openNotificationWithIcon({api, type:"error", message: "Неверный ответ", description: "Ответ прибора не соответствует ожидаемому"});
      return;
    }

    // этап отключения
    setTimeout(async () => {
      const initPass = [0xF9, 0x10, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01];
      const write_er = await writeReg(initPass, '0001');
      if(write_er === 'Ok') {
        await sequenceDelay(100);
        const raw = await readReg();
        const er = reqMiddle(raw);
        if(er) {
          const { message, description } = er;
          openNotificationWithIcon({api, type: 'error', message, description});
          return
        }

        let deathFlag = false;
        [0xF9, 0x10, 0x00, 0x01, 0x00, 0x01, 0x45, 0xB1].forEach((el, i) => {
          if(raw[i] !== el) {
            deathFlag = true;
          }
        });
        if(deathFlag) {
          openNotificationWithIcon({api, type:"error", message: "Неверный ответ", description: "Ответ прибора не соответствует ожидаемому"});
          return;
        }

        dispatch({
          type: SET_MANUAL_CONTROL_BLOCK,
          payload: false
        });
        console.log("SUCCESS WORK");
      } else {
        openNotificationWithIcon({api, type: 'error', message: "Ошибка записи регистра", description: write_er})
      }
    }, impulsTime*1000)
  } else {
    openNotificationWithIcon({api, type: 'error', message: "Ошибка записи регистра", description: write_er})
  }


}


function writeReg(body, reg) {
  const pass = [...body, ...modbusCRC(body)];
  console.log(`--> ${getDebugHexString(pass)} REG: ${reg}`);
  return new Promise( async (resolve, reject) => {
    await invoke("clean_port");
    const write_er = await invoke("write_to_port", {message: pass});
    resolve(write_er);
  })
}

function readReg() {
  return new Promise( async (resolve, reject) => {
    const raw = await invoke('read_port');
    console.log(`<-- ${getDebugHexString(raw)}`);
    resolve(raw);
  })
}

function sequenceDelay(time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, time);
  })
}

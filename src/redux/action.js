import {
  SET_PORT,
  SET_BAUDRATE,
  SET_SCAN,
  GET_CONFIG,
  SET_LOC_CONFIG,
  WRITE_CONFIG,
  DEG_SECONDS_AND_CHECK,
  CLEAN_TABLE,
  
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

export const cleanTable = () => ({
  type: CLEAN_TABLE,
})

export const fakeUpdateTable = () => async (dispatch, getState) => {
  const {main: {tableStorage}} = getState();
  const raw = [0x4E, ~~(Math.random()*1000)%255, 0xBC, 0x00, 0x11, 0x61, 0x62, 0x2D, 0x07, 0x00, 0x00, 0x00];
  updateTableData({arr:raw, tableStorage});

  dispatch({
    type: DEG_SECONDS_AND_CHECK,
    payload: tableStorage
  });
}

export const downloadData = (api, notifApi) => async (dispatch, getState) => {
  const {main: { tableStorage }} = getState();
  let resStorage = tableStorage.map(({serialNumb, timeInNiceView, payload}) => {
    return [serialNumb+'', timeInNiceView+'', payload+'']
  });
  const res = await invoke("download_data", {data: resStorage});
  if(res[1] === 'Ok') {
    api.open({
      type: 'success',
      content: 'Данные успешно сохранены',
    })
  } else {
    openNotificationWithIcon({
      api: notifApi, 
      type:"error", 
      message: "Ошибка сохранения Excel файла", 
      description: res[1]
    })
  }
  console.log("downloadData: ", res);
}
// DOWNLOAD_DATA

export const degSecondsAndCheck = () => async (dispatch, getState) => {
  const raw = await readReg();
  const {main: {tableStorage}} = getState();
  if(!(raw.length === 30 && raw.every(el => el === 0))) {
    // произвести преобразование
    updateTableData({arr:raw, tableStorage})
  }
  dispatch({
    type: DEG_SECONDS_AND_CHECK,
    payload: tableStorage
  });
}

export const setScan = ({api}) => async (dispatch, getState) => {
  const {main: {locConfig: {isSetted}, scanStatus}} = getState();

  if(!scanStatus) {
    // Проверка && Первый этап 
    if(!isSetted) {
      const {config_row, er} = await getConfigPromise();
      if(er) {
        const { message, description } = er;
        openNotificationWithIcon({api, type:"error", message, description});
      } else {
        console.log(" %c FIRST STAGE COMPLETE", 'background: #1E90FF; color: #FFFAFA');
        dispatch({
          type: GET_CONFIG,
          payload: config_row
        })
      }
    }
  
    const secondStagePromise = new Promise(async (resolve, reject) => {
      const initPass = [0xF9, 0x10, 0x00, 0x66, 0x00, 0x01, 0x02, 0x08, 0x00];
      const write_er = await writeReg(initPass, '0066');
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
  
    (async () => {
      const { main: {config: {isSetted, scanTime}}} = getState();
      if(isSetted) {
        const {raw, er} = await secondStagePromise;
        if(er) {
          const { message, description } = er;
          openNotificationWithIcon({api, type:"error", message, description});
          console.log(" %c ER SECOND STAGE", 'background: #1E90FF; color: #FFFAFA', er);
        } else {
          console.log(" %c SECOND STAGE COMPLETE", 'background: #1E90FF; color: #FFFAFA');
          dispatch({
            type: SET_SCAN,
            payload: ""
          })
        }
      }
      
    })();
  } else {
    const {raw, er} = await stopScanning();
    if(er) {
      const { message, description } = er;
      openNotificationWithIcon({api, type:"error", message, description});
      console.log(" %c STOP SCANNING ER", 'background: #ff004c; color: #fafafa', er);
    } else {
      console.log(" %c STOP SCANNING", 'background: #ff004c; color: #fafafa');
      dispatch({
        type: SET_SCAN,
        payload: ""
      })
    }
  }

  

}

export const getPorts = () => async (dispatch, getState) => {
  console.log("getPorts")
  const ports = await invoke("get_ports");
  dispatch({
    type: GET_PORTS,
    payload: ports
  })
}

export const portAction = (api) => async (dispatch, getState) => {
  const { portStatus, selectedPort: portname, baudrate, scanStatus } = getState().main;
  let newPortStatus = 'connected';
  let er = 'Ok';
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
    }
  }

  dispatch({
    type: SET_PORT_STATE,
    payload: { newPortStatus, er }
  })
}

export const getConfig = (api) => async (dispatch, getState) => {
  console.log("getConfig");
  const {config_row, er} = await getConfigPromise();
  
  if(er) {
    const { message, description } = er;
    openNotificationWithIcon({api, type:"error", message, description});
  } else {
    dispatch({
      type: GET_CONFIG,
      payload: config_row
    })
  }
}


export const setLocConfig = configObj => ({
  type: SET_LOC_CONFIG,
  payload: configObj
})

export const writeConfig = (api, notifApi) => async (dispatch, getState) => {
  const {main: { locConfig }} = getState();
  const {radioFreq, sf, bw, scanTime, transmitPower, openWindowTime} = locConfig;
  const getHexArrFromInt = (int, byteLength=1) => {
    const resArr = [];
    for(let i=0; i < byteLength; i++) {
      const val = int & 0xFF;
      resArr.push(val);
      int = int >> 8;
    }
    return resArr
  }

  const res_mb_radioFreq_n = getHexArrFromInt(radioFreq*1000, 4);
	const sfObj = {'SF7': 1, 'SF8': 2, 'SF9': 3, 'SF10': 4, 'SF11': 5, 'SF12': 6};
	const bwObj = {'125': 0, '250': 1, '500': 2};
	const res_mb_sf_n = getHexArrFromInt(sfObj[sf] | (bwObj[bw] << 3));
	const res_mb_transmitPower_n = getHexArrFromInt(transmitPower);
	const res_mb_openWindowTime_n = getHexArrFromInt(openWindowTime);

	const res_mb_scanTime_n = getHexArrFromInt(scanTime);

	// Здесь необходимо формировать новый row
	const newRowDevConfData = [...res_mb_radioFreq_n, ...res_mb_sf_n, ...res_mb_openWindowTime_n, ...res_mb_scanTime_n, ...res_mb_transmitPower_n];
  const head = [0xF9, 0x10, 0x00,  0xAA, 0x00,  0x04, 0x08];
  const body = [...head, ...newRowDevConfData];
  const write_er = await writeReg(body, '00AA');
  
  if(write_er === 'Ok') {
    setTimeout(async () => {
      const response = await readReg();

      console.log("response", response);

      const er = reqMiddle(response);
      if(er) {
        const { message, description } = er;
        openNotificationWithIcon({notifApi, type:"error", message, description});
      } else {
        api.open({
          type: 'success',
          content: 'Данные успешно обновлены',
        });
      }
      // вводится обработка ответа
      dispatch({
        type: WRITE_CONFIG,
        payload: null
      })
    }, 300)
  } else {
    openNotificationWithIcon({notifApi, type:"error", message: "Ошибка записи в последовательный порт", description: write_er});
  }
  // 0xF9, 0x10, 0x00,  0xAA, 0x00,  0x04, 0x08
}


function getConfigPromise () {
  return new Promise(async (resolve, reject) => {
    // 0xF9, 0x03, 0x00, 0xAA, 0x00, 0x02

    // invoke("write_to_port", {message: [0xF9, 0x03, 0x00, 0xAA, 0x00, 0x02]})
    const write_er = await writeReg([0xF9, 0x03, 0x00, 0xAA, 0x00, 0x02], '00AA');
    if(write_er === 'Ok') {
      setTimeout(async () => {
        const config_row = await readReg();
        const er = reqMiddle(config_row);
        resolve({config_row, er});
        
      }, 300);
    } else {
      resolve({config_row: [], er: {message: "Ошибка записи", description: write_er}});
    }
  })
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

function stopScanning() {
  return new Promise( async (resolve, reject) => {
    const pass = [0xF9, 0x10, 0x00, 0x66, 0x00, 0x01, 0x02, 0x09, 0x00];
    const write_er = await writeReg(pass, '0066');

    if(write_er === 'Ok') {
      setTimeout(async () => {
        const raw = await readReg();
        const er = reqMiddle(raw);
        resolve({raw, er});
      }, 300)
    } else {
      resolve({raw: [], er: {message: "Ошибка записи", description: write_er}});
    }
  })
}


// export const asyncAction = () => async (dispatch, getState) => {
//   debugger
//   const state = getState();
//   let a = new Promise((resolve, reject) => {
//     setTimeout(() => resolve(33), 1000);
//   })
//   const res = await a;
//   dispatch({
//     type: LINE_ASYNC,
//     payload: res
//   })
// }
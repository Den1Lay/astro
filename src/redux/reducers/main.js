import { 
  SET_PORT, 
  GET_PORTS, 
  SET_BAUDRATE,
  SET_PORT_STATE,
  SET_SCAN,
  GET_CONFIG,
  SET_LOC_CONFIG,
  WRITE_CONFIG,
  DEG_SECONDS_AND_CHECK,
  CLEAN_TABLE
 } from '../actionTypes'

const initialState = {
  ports: [],
  selectedPort: "",
  baudrate: 1200,
  portStatus: 'disconnected', // connected, error
  portEr: 'Ok',
  scanStatus: false,
  config: {
    radioFreq: 10000,
    sf: "SF7",
    bw:  125,
    scanTime: 1,
    transmitPower: 1,
    openWindowTime: 1,
  },
  locConfig: {
    radioFreq: 10000,
    sf: "SF7",
    bw:  125,
    scanTime: 1,
    transmitPower: 1,
    openWindowTime: 1,
    isSetted: false,
  },
  seconds: 0,
  leftTime: 0,
  tableStorage: [],
  v: 0,
};

export default function(state=initialState, {type, payload=null}) {
  switch(type) {
    case SET_PORT: {
      return {
        ...state,
        selectedPort: payload
      }
    }
    case SET_BAUDRATE: 
      return {
        ...state, 
        baudrate: payload
      }
    case GET_PORTS: {
      return {
        ...state,
        ports: payload
      }
    }
    case SET_PORT_STATE: {
      return (() => {
        const { newPortStatus, er } = payload;
        return {
          ...state,
          portStatus: newPortStatus,
          portEr: er,
          scanStatus: false
        }
      })()
    }
    case SET_SCAN: {
      return {
        ...state, 
        scanStatus: !state.scanStatus,
        seconds: !state.scanStatus ? 0 : state.seconds,
        leftTime: !state.scanStatus ? state.config.scanTime*60 : state.leftTime
      }
    }

    case GET_CONFIG: {
      return (() => {
        function getHex(ar) {
          return ar.map(el => {
            const elHex = el.toString(16).toUpperCase();
            return elHex.length < 2 ? "0"+elHex : elHex;
          })
        }

        const radioFreq = getHex(payload.slice(3, 7));
        const altRadioParam = getHex(payload.slice(7, 8));
        const openWindowTime = getHex(payload.slice(8, 9));
        const scanTime = getHex(payload.slice(9, 10));
        const transmitPower = getHex(payload.slice(10, 11));

        const numbAltRadio = parseInt(altRadioParam, 16);
        const sf = numbAltRadio & 0b00000111;
        const bw = numbAltRadio >> 3;

        const consoleObj = {sf, bw};
        consoleObj['radioFreq'] = parseInt(radioFreq.reverse().join(''), 16);
        consoleObj.scanTime = parseInt(scanTime, 16);
        consoleObj.transmitPower = parseInt(transmitPower, 16);
        consoleObj.openWindowTime = parseInt(openWindowTime, 16);

        function getFormatedObj(obj) {
          Object.keys(obj).forEach((key) => {
            let setValue = obj[key];
            switch (key) {
              case 'radioFreq':
                setValue = setValue/1000;
                break
              case 'sf':
                setValue = `SF${6+setValue}`;
                break
              case 'bw':
                const table = ['125', '250', '500'];
                setValue = +table[setValue];
                break
              default:
                break
            }
            obj[key] = setValue;
          })

          return obj;
        }
        
        const dataObj = getFormatedObj(consoleObj);
        dataObj.isSetted = true;
        return {
          ...state,
          config: dataObj,
          locConfig: state.locConfig.isSetted ? state.locConfig : dataObj
        }
      })()
    }

    case SET_LOC_CONFIG: {
      return {
        ...state, 
        locConfig: payload
      }
    }

    case WRITE_CONFIG: {
      return {
        ...state,
        config: state.locConfig
      }
    }

    case DEG_SECONDS_AND_CHECK: {
      return (() => {
        let { leftTime, seconds, scanStatus } = state;
        leftTime = leftTime - 1;
        seconds = seconds + 1;
        if(leftTime === 0) {
          scanStatus = false;
        }

        return {
          ...state,
          leftTime,
          seconds,
          tableStorage: payload,
          scanStatus,
          v: Math.random(),
        }
      })()
    }

    case CLEAN_TABLE: {
      return {
        ...state, 
        tableStorage: [],
        v: Math.random()
      }
    }
    default:
      return state
  }
}
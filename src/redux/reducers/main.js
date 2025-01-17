import { 
  SET_PORT, 
  GET_PORTS, 
  SET_BAUDRATE,
  SET_PORT_STATE,
  SET_DEVICE_CONTROL,
  SET_MANUAL_CONTROL_BLOCK,
  SET_IMPULS_TIME,
  SET_AUTO_CONTROL_STATE,
  SET_STAGE_TIME,
  SET_STAGE_STATUS,
  RESET_STAGES,
  TOGGLE_LIGHT_STATUS,
  SET_SEQUENCE_NAME,
  SET_SEQUENCE_STATE,
  SET_AUTO_LOOP_STATE,
  SET_LIGHT_TIME_DELAY,

 } from '../actionTypes'

const initialState = {
  ports: [],
  selectedPort: "",
  baudrate: 115200,
  portStatus: 'disconnected', // connected, error
  portEr: 'Ok',
  deviceEr: null,
  deviceControl: null,
  impulsTime: 1,
  manualControlBlock: false,
  autoControlState: false,
  stage1startComplete: false, 
  stage1endComplete: false,
  stage2startComplete: false, 
  stage2endComplete: false,

  stage1start: 23*60*60+10*60+5,
  stage1end: 0*60*60+5*60+0,
  stage2start: 5*60*60+0*60+0,
  stage2end: 6*60*60+6*60+6,

  lightStatus: false,
  sequenceName: "",
  sequenceStartTime: 0,
  s0: false,
  s1: false,
  s2: false,

  autoLoopState: false,
  lightTimeDelay: 40,
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
        const { newPortStatus, er, deviceEr } = payload;
        return {
          ...state,
          portStatus: newPortStatus,
          portEr: er,
          scanStatus: false,
          deviceControl: null,
          deviceEr
        }
      })()
    }

    case SET_DEVICE_CONTROL: {
      return (() => {
        const resDeviceControl = state.deviceControl === payload ? null : payload;
        return {
          ...state, 
          deviceControl: resDeviceControl,
          autoControlState: resDeviceControl === null ? false : state.autoControlState,
          stage1startComplete: false, 
          stage1endComplete: false,
          
        }
      })();
    }

    case SET_MANUAL_CONTROL_BLOCK: {
      return {
        ...state,
        manualControlBlock: payload
      };
    }

    case SET_IMPULS_TIME: {
      return {
        ...state,
        impulsTime: payload
      }
    }

    case SET_AUTO_CONTROL_STATE: {
      return (() => {
        return {
          ...state,
          autoControlState: !state.autoControlState,
          stage1startComplete: false, 
          stage1endComplete: false,
          stage2startComplete: false, 
          stage2endComplete: false,
        }
      })();
    }

    case SET_STAGE_TIME: {
      return (() => {
        return {
          ...state,
          ...payload
        }
      })()
    }

    case SET_STAGE_STATUS: {
      return (() => {
        let res = state;
        res[payload] = true;
        return res
      })()
    }

    case RESET_STAGES: {
      return {
        ...state,
        stage1startComplete: false, 
        stage1endComplete: false,
        stage2startComplete: false, 
        stage2endComplete: false,
      }
    }

    case TOGGLE_LIGHT_STATUS: {

      let payState = null;
      if(payload) {
        payState = payload.state;
      }
      return {
        ...state,
        lightStatus: payState ? payState : !state.lightStatus
      }
    }

    case SET_SEQUENCE_NAME: {
      return {
        ...state,
        sequenceName: payload,
        sequenceStartTime: Date.now(),
        s0: false,
        s1: false,
        s2: false,
      }
    }

    case SET_SEQUENCE_STATE: {
      state[payload] = true;
      if(payload === "s2") {
        state.sequenceName = "";
      }
      return {
        ...state,
      }
    }

    case SET_AUTO_LOOP_STATE: {
      return {
        ...state,
        autoLoopState: !state.autoLoopState
      }
    }

    case SET_LIGHT_TIME_DELAY: {
      return {
        ...state, 
        lightTimeDelay: payload
      }
    }

    default:
      return state
  }
}
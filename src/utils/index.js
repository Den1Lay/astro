import XLSX from "xlsx";

export const openNotificationWithIcon = ({api, type, message, description}) => {
  api[type]({
    message,
    description,
  });
};

export function modbusCRC(message) {

	let crc = new Uint16Array([0xFFFF]);
	for(let sInd in message) {
		crc ^= message[sInd];
		for(let i = 8; i != 0; i--) {
			if((crc & 0x0001) != 0) {
				crc >>= 1;
				crc ^= 0xA001;
			} else {
				crc >>= 1;
			}
		}
	}
	// сначала младший бит, а уже затем старший
	const newRes = [crc & 0xFF, crc >> 8];
	return newRes;
}

export function checkCRC(arr) {
  const len = arr.length
  const crc = arr[len-2] << 8 | arr[len-1];
  const checkCRC = modbusCRC(arr.slice(0, arr.length-2));
  const checkCRCDec = checkCRC[0] << 8 | checkCRC[1];
  return crc === checkCRCDec;
}

export function reqMiddle(arr) {

  if(arr.length === 30 && arr.every(el => el === 0)) {
    return {message: "Нет ответа", description: "Ответ не пришел в установленное время"}
  }

  const functionCode = arr[1];
  const crc =  checkCRC(arr);
  if(!crc) return {message: "Ошибка CRC", description: "Не правильный CRC ответа устройства"};

  if(functionCode === 0x83 || functionCode === 0x90) {
    // Остановка рабочего процесса.
    return {message: "Modbus ошибка", description: `Ответ устройства имеет функциональный код 0x${functionCode.toString(16).toUpperCase()}`};
  } else {
    return false
  }
}

export const getDebugHexString = (numbArr=[]) => {
	const hexAr = numbArr.map(n => n.toString(16).toUpperCase()).map(el=> el.length > 1 ? el : `0${el}`);

	let resStr = ''
	while(hexAr.length) {
		resStr+=`${hexAr.splice(0, 16).join(' ')}`;
	}
	return resStr;
}

function getHex(ar) {
	return ar.map(el => {
		const elHex = el.toString(16).toUpperCase();
		return elHex.length < 2 ? "0"+elHex : elHex;
	})
}

export function updateTableData({arr, tableStorage}) {
	// parseDate
  // 4E 61 BC 00 11 61 62 2D 07 00 00 00
	const serialNumb = parseInt(getHex(arr.slice(0, 4).reverse()).join(''), 16);
	const timeStamp = parseInt(getHex(arr.slice(4, 8).reverse()).join(''), 16);
	const payload = parseInt(getHex(arr.slice(8, 12).reverse()).join(''), 16);
	const timeInNiceView = get_time(timeStamp);

	
	function get_time(dec) {
		const addZero = el => (''+el).length === 1 ? '0'+el : el;
		var start_time = new Date(2000, 2, 1, 0, 0, 0, 0);
		console.log("Dec: ",dec);
		let new_date = new Date(dec*1000+start_time.getTime());
		let new_date_y = new_date.getFullYear();
		let new_date_m =  addZero(1 + new_date.getMonth());
		let new_date_d = new_date.getDate();
		let new_date_h = addZero(new_date.getHours());
		let new_date_min = addZero(new_date.getMinutes()); 
		return `${new_date_h}:${new_date_min} ${new_date_d}.${new_date_m}.${(''+new_date_y).slice(2)}`
		// console.log(new_date_y +" "+new_date_m+" "+new_date_d+" "+new_date_h);
	}

	// const { tableStorage } = window.rootObj;
	let serialIsAlreadyAdded = -1;
	tableStorage.forEach(({serialNumb: sN}, i) => {
		if(sN === serialNumb) {
			serialIsAlreadyAdded = i;
		}
	});

	const resObj = {serialNumb, timeInNiceView, payload};
	if(serialIsAlreadyAdded > -1) {
		// Есть совпадение. Обновление данных
		tableStorage[serialIsAlreadyAdded] = resObj;
	} else {
		tableStorage.push(resObj);
	}
	
  return tableStorage;
}
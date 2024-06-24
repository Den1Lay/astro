// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rust_xlsxwriter::{worksheet, Workbook, XlsxError};
use serialport::{available_ports, DataBits, SerialPort, SerialPortInfo, SerialPortType, StopBits};

use tauri::State;
use std::io::Write;
use std::time::Duration;

use std::path::PathBuf;
use std::fs;

use std::sync::OnceLock;

use std::{
  collections::HashMap,
  sync::{
    atomic::{AtomicUsize, Ordering},
    Arc, Mutex,
  },
};

pub struct COM {
  port: Option<Box<dyn SerialPort>>
}

impl COM {
	pub fn new() -> Self {
		return COM { port: None };
	} 

	pub fn open(&mut self, portname: String, baudrate: u32) -> String {
		let databits = DataBits::Eight;
		let stopbits = StopBits::One;

		println!("{:?} {:?}", portname, baudrate);
		let port = serialport::new(portname, baudrate)
				.timeout(Duration::from_millis(10))
				.data_bits(databits)
				.stop_bits(stopbits)
				.open();

		match port {
				Ok(port) => {
					self.port = Some(port);
					println!("Success open port");
					return "Ok".to_string();
				}, 
				Err(er) => {
						println!("Open port er{}", er);
					return er.to_string();
				}
		}
	}

	pub fn write(&mut self, message: Vec<u8>) -> String {
		match &mut self.port {
      Some(port) => {
          let string = "rust".to_string();
					let pass_data = string.as_bytes();

					let pre = &message;
					let rel: &[u8] = &pre;
					println!("Write: {:?}", rel);
          match port.write(rel) {
              Ok(t) => {
                  println!("Success write {} bytes of '{}'",  t, string);
                  std::io::stdout().flush().unwrap();
									"Ok".to_string()
              },
              Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => e.to_string(),
              Err(er) => {
                  println!("Er loop write: {:?}", er);
									er.to_string()
              }
          }
      },
      None => { println!("none"); "Порт не открыт".to_string() }
    }
	}

	pub fn clean_buffer(&mut self) -> String {
		let mut buf: Vec<u8> = vec![0; 500];
		match &mut self.port {
			Some(port) => {
				match port.read_to_end(buf.as_mut()) {
					Ok(t) => {
						return "Ok".to_string();
					}, 
					Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => return e.to_string(),
					Err(er) => {
						println!("Er loop read: {:?}", er);
						return er.to_string()
					}
				}
		
			},
			None => {println!("none"); "Порт не открыт".to_string()}
		}
	}

	pub fn read(&mut self) -> Vec<u8> {

		let mut res_vec: Vec<u8> = vec![0; 30];
		match &mut self.port {
			Some(port) => {

				
				match port.read(res_vec.as_mut()) {
					Ok(t) => {
						println!("{:?}", &res_vec[..t]);
						return res_vec[..t].to_vec()
					}, 
					Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => return res_vec,
					Err(er) => {
						println!("Er loop read: {:?}", er);
						return res_vec
					}
				}
				

				// &serialbuf[..t]
			},
			None => { println!("none"); res_vec }
		}
	}

	pub fn close(&mut self) {
		self.port = None;
	}
}

#[derive(Default)]
struct COMConnection(Mutex<Option<COM>>);

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
	format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_ports() -> Vec<String> {
	let ports = available_ports().expect("not found");
	let mut res: Vec<String> = vec![];
	
	for p in ports {
		// println!("{:?}", p);
		res.push(p.port_name);
	}
	res
}

#[tauri::command]
fn init_port(com_wrap: State<'_, COMConnection>) {
	*com_wrap.0.lock().unwrap() = Some(COM::new());
}

#[tauri::command]
fn open_port(com_wrap: State<'_, COMConnection>, portname: String, baudrate: u32) -> String {
	let open_res = com_wrap
		.0
		.lock()
		.unwrap()
		.as_mut()
		.expect("troubles")
		.open(portname, baudrate);

	return open_res;
}

#[tauri::command]
fn close_port(com_wrap: State<'_, COMConnection>) -> String {
	let open_res = com_wrap
		.0
		.lock()
		.unwrap()
		.as_mut()
		.expect("troubles")
		.close();

	"Ok".to_string()
}

#[tauri::command]
fn write_to_port(com_wrap: State<'_, COMConnection>, message: Vec<u8>) -> String {
	
	let write_res = com_wrap
		.0
		.lock()
		.unwrap()
		.as_mut()
		.expect("troubles")
		.write(message);

	write_res
}

#[tauri::command]
fn read_port(com_wrap: State<'_, COMConnection>) -> Vec<u8>{
	let read_res = com_wrap
		.0
		.lock()
		.unwrap()
		.as_mut()
		.expect("troubles")
		.read();

		println!("read_res: {:?}", read_res);
		read_res
}

#[tauri::command]
fn clean_port(com_wrap: State<'_, COMConnection>) {

	let read_res = com_wrap
		.0
		.lock()
		.unwrap()
		.as_mut()
		.expect("troubles")
		.clean_buffer();

		println!("clean port");
}

#[tauri::command]
async fn download_data(data: Vec<Vec<String>>) -> (String, String) {
	// for el in &data {
	// 	for d in el {
	// 		println!("{:?}", d);
	// 	}
	// }

	fn save_data (data: &Vec<Vec<String>>) -> Result<(), XlsxError> {
		let mut workbook = Workbook::new();

		let worksheet = workbook.add_worksheet();
		worksheet.write(0, 0, "Серийный номер")?;
		worksheet.write(0, 1, "Время фиксации показаний")?;
		worksheet.write(0, 2, "Показания")?;

		let mut i = 0;
		while i < data.len() {
			let mut k = 0;
			while k < data[i].len() {
				let row = u32::try_from(i+1).unwrap();
				let col = u16::try_from(k).unwrap();
				worksheet.write(row, col, &data[i][k])?;
				k += 1;
			}
			i += 1;
		}

		for el in data {
			for d in el {
				println!("{:?}", d);
			}
		}

		// worksheet.write(0, 0, "Hello")?;
		// worksheet.write(1, 0, 12345)?;
		workbook.save("save_data.xlsx")?;

		Ok(())
	}

	let mut res_er = "Ok".to_string();
	match save_data(&data) {
		Ok(t) => {
			println!("Success save {:?}", t);
		},
		Err(er) => {
			let err_res = er.to_string();
			println!("{:?}", err_res);
			res_er = err_res;
		}
	}

	let mut res_string = "".to_string();
	let srcdir = PathBuf::from("./save_data.xlsx");
	match fs::canonicalize(&srcdir) {
		Ok(path) => {
			// println!("{:?}", path);
			let path_str = path.into_os_string().into_string().unwrap();
			res_string = path_str;
		},
		Err(er) => {
			res_string = er.to_string();
		}
	}

	(res_string, res_er)
}

fn main() {
	tauri::Builder::default()
		.manage(COMConnection(Default::default()))
		.invoke_handler(tauri::generate_handler![
			greet, 
			get_ports,
			open_port,
			init_port,
			close_port,
			write_to_port,
			read_port,
			clean_port,
			download_data
			])
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}

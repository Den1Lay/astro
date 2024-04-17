import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import cx from 'classnames';
import { Button, Modal, Select, Input, notification, message } from 'antd';
import { getConfig, setLocConfig, writeConfig } from '@/redux/action'

import "./ConfigModal.scss";

const ScanControl = ({
  portStatus,
  scanStatus,
	locConfig,
	config,

	getConfig,
	setLocConfig,
	writeConfig
}) => {
  const disableFlag = portStatus === 'connected';
	const [open, setOpen] = useState(false);
	const [notifApi, notifContextHolder] = notification.useNotification();
	const [api, contextHolder] = message.useMessage()

	const showModal = () => {
		!scanStatus && getConfig(notifApi);
    setOpen(true);
  };
  const handleOk = (e) => {
    console.log(e);
    setOpen(false);
  };
  const handleCancel = (e) => {
    console.log(e);
    setOpen(false);
  };

	const {
    radioFreq,
    sf,
    bw,
    scanTime,
    transmitPower,
    openWindowTime,
  } = locConfig;

	const isChanged = !Object.keys(locConfig).every(key => locConfig[key] === config[key]);
  return (
    <div className="configModal">
			{contextHolder}
			{notifContextHolder}
      <Button
				disabled={!disableFlag}
				type="default" 
				onClick={showModal} 
			>
				Конфигурация
			</Button>
			<Modal
        title="Конфигурация радиоканала"
        open={open}
        onOk={handleOk}
        onCancel={handleCancel}
        okButtonProps={{ disabled: false}}
        cancelButtonProps={{ disabled: false }}
				footer={[
					isChanged 
         	? (
					<>
						<Button disabled={scanStatus} key="1" type="primary" onClick={() => {writeConfig(api, notifApi)}}>
							Записать
						</Button>
						<Button key="2" type="default" onClick={() => setLocConfig(config)}>
							Сбросить
						</Button>
					</>
				 	) : null,
          <Button key="3" onClick={handleOk}>
            Закрыть
          </Button>,
        ]}
      >
				<div className="configModal_inner">
					<div className="configModal_line">
						<div className="configModal_line__left">
							Параметры
						</div>
						<div className="configModal_line__right">
							Значения
						</div>
					</div>

					<div className="configModal_line">
						<div className="configModal_line__left">
							Частота, кГц
						</div>
						<div className="configModal_line__right">
							<Input 
								type="number" 
								value={radioFreq} 
								onChange={({target: {value}}) => setLocConfig({...locConfig, radioFreq:+value})} />
						</div>
					</div>

					<div className="configModal_line">
						<div className="configModal_line__left">
							Фактор распространения (sf)
						</div>
						<div className="configModal_line__right">
							<Select
								size="middle"
								value={sf}
								style={{ width: 100 }}
								onChange={val => setLocConfig({...locConfig, sf: val})}
								options={[7,8,9,10,11,12].map(el => ({value: `SF${el}`, label: `SF${el}`}))}
							/>
						</div>
					</div>

					<div className="configModal_line">
						<div className="configModal_line__left">
							Полоса частот (bw), кГц
						</div>
						<div className="configModal_line__right">
							<Select
								size="middle"
								value={bw}
								style={{ width: 100 }}
								onChange={val => setLocConfig({...locConfig, bw: val})}
								options={[125, 250, 500].map(el => ({value: el, label: el}))}
								/>
						</div>
					</div>

					<div className="configModal_line">
						<div className="configModal_line__left">
							Мощность передатчика
						</div>
						<div className="configModal_line__right">
							<Input 
							type="number"
							value={transmitPower}
							onChange={({target: {value}}) => setLocConfig({...locConfig, transmitPower: +value})}/>
						</div>
					</div>

					<div className="configModal_line">
						<div className="configModal_line__left">
							Длительность окна приема
						</div>
						<div className="configModal_line__right">
						<Input 
							type="number"
							value={openWindowTime}
							onChange={({target: {value}}) => setLocConfig({...locConfig, openWindowTime: +value})}/>
						</div>
					</div>

					<div className="configModal_line">
						<div className="configModal_line__left">
							Время прослушивания, мин
						</div>
						<div className="configModal_line__right">
						<Input 
							type="number"
							value={scanTime}
							onChange={({target: {value}}) => setLocConfig({...locConfig, scanTime: +value})}/>
						</div>
					</div>
					
				</div>
        
      </Modal>
    </div>
  )
}

export default connect(
  ({main: { portStatus, scanStatus, locConfig, config }}) =>
  ({ portStatus, scanStatus, locConfig, config }),
  ({ getConfig, setLocConfig, writeConfig })
)(ScanControl)
import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import cx from 'classnames'
import { Button, message, notification } from 'antd';
import { fakeUpdateTable, downloadData, cleanTable } from '@/redux/action';


import "./TableControl.scss";

const TableControl = ({
  tableStorage,
  v,

  downloadData,
  fakeUpdateTable,
  cleanTable
}) => {
  const [api, contextHolder] = message.useMessage();
  const [notificationApi, notificationContextHolder] = notification.useNotification();

  return (
    <div className="tableControl">
      {contextHolder}
      {notificationContextHolder}
      <Button
          disabled={!tableStorage.length}
          type="default" 
          onClick={()=>{cleanTable()}} 
        >
          Очистить таблицу
        </Button>
        <Button
          disabled={!tableStorage.length}
          className="tableControl_download"
          type="default" 
          onClick={()=>{downloadData(api, notificationApi)}} 
        >
          Сохранить данные
        </Button>
        <Button type="primary" onClick={fakeUpdateTable}>
          fakeUpdateTable
        </Button>
    </div>
  )
}

export default connect(
  ({main: { tableStorage, v }}) =>
  ({ tableStorage, v }),
  ({fakeUpdateTable, downloadData, cleanTable})
)(TableControl)
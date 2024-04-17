import React from "react"

import "./TableLine.scss";

const TableLine = ({ 
  num="№", 
  serialNum="Серийный номер счетчика", 
  fixTime="Время фиксации показаний", 
  payload="Показания счетчика" 
}) => {
  return (
    <div className="tableLine">
      <div className="tableLine_num">
        {num}
      </div>
      <div className="tableLine_serialNum">
        {serialNum}
      </div>
      <div className="tableLine_fixTime">
        {fixTime}
      </div>
      <div className="tableLine_payload">
        {payload}
      </div>
    </div>
  )
}

export default TableLine;
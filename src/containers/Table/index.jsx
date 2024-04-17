import React from "react";
import { connect } from "react-redux";
import cx from "classnames";
import { TableLine } from '@/components';

import "./Table.scss";

const Table = ({
  tableStorage, v
}) => {
  console.log("tableStorage inside", tableStorage);
  return (
    // <div className="table">
    //   <div className="table_header">
    //     <TableLine 
    //       num={"#"} 
    //       serialNum={"Серийный номер счетчика"} 
    //       fixTime={"Время фиксации показаний"} 
    //       payload={"Показания счетчика"}/>
    //     <div className="table_header__snap"></div>
    //   </div>
    //   <div className="table_wrapper">
    //     {Array(20).fill('').map(_ => {
    //       return (
    //         <TableLine 
    //         num={"#"} 
    //         serialNum={"Серийный номер счетчика"} 
    //         fixTime={"Время фиксации показаний"} 
    //         payload={"Показания счетчика"}/>
    //       )
    //     })}
    //   </div>
    // </div>
    <div className="table_wrapper">
        {/* {Array(20).fill('').map(_ => {
          return (
            <TableLine 
            num={"#"} 
            serialNum={"Серийный номер счетчика"} 
            fixTime={"Время фиксации показаний"} 
            payload={"Показания счетчика"}/>
          )
        })} */}
        {
          tableStorage.map(({serialNumb, timeInNiceView, payload}, i) => {
            return (
              <TableLine 
                num={i} 
                serialNum={serialNumb} 
                fixTime={timeInNiceView} 
                payload={payload}/>
            )
          })
        }
      </div>
  )
}

export default connect(
  ({ main: { tableStorage, v } }) => 
  ({tableStorage, v}),
  ({})
)(Table)
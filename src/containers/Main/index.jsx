import React from "react";
import { useEffect } from "react";
import cx from 'classnames';
import { PortControl, ScanControl, TableControl, Table } from '@/containers'
import { TableLine } from '@/components';

import "./Main.scss";

export default function Main() {

  return (
    <section className="main">
      <div className="main__top">
        <PortControl />
      </div>
      <div className="main__line">
        <ScanControl />
      </div>
      <div className="main__line">
        <TableControl />
      </div>
      <div className={("main__line", "table_header")}>
        <TableLine />
        <div className="table_header__snap">

        </div>
      </div>
      {/* <div className="main__table">
        
      </div> */}
      <Table />
    </section>
  );
}
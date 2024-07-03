import React from "react";
import { useEffect } from "react";
import cx from 'classnames';
import { PortControl, Manual, Auto, TimeControl } from '@/containers'
import { TableLine } from '@/components';

import "./Main.scss";

export default function Main() {

  return (
    <section className="main">
      <div className="main__top">
        <PortControl />
      </div>
      <div className="main__line main__shift_top">
        <Manual />
      </div>
      <div className="main__line main__shift_top">
        <Auto />
      </div>
      <div className="main__line ">
        <TimeControl />
      </div>
      {/* <div className={("main__line", "table_header")}>

      </div> */}
      {/* <div className="main__table">
        
      </div> */}

    </section>
  );
}
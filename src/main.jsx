import React from "react";
import ReactDOM from "react-dom/client";
import { Main } from '@/containers'
import "./styles.css";

import { Provider } from "react-redux";
import store from './redux/store.js'

import '@/styles/index.scss';

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <Main />
    </Provider>
  </React.StrictMode>,
);

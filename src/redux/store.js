import { configureStore, Tuple } from "@reduxjs/toolkit";
import { createLogger } from 'redux-logger';
import { thunk } from 'redux-thunk';
import reducer from "./reducers";

const logger = createLogger();

export default configureStore({reducer, middleware: () => new Tuple(thunk , logger)})

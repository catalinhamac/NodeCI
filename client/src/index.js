import "materialize-css/dist/css/materialize.min.css";
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { createStore, applyMiddleware } from "redux";
import reduxThunk from "redux-thunk";

import App from "./components/App";
import reducers from "./reducers";

import axios from "axios";
window.axios = axios;

const store = createStore(reducers, {}, applyMiddleware(reduxThunk));

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.querySelector("#root")
);

//JS proxy better example
// class Page {
//   goto() {
//     console.log("I'm going to another page");
//   }

//   setCookie() {
//     console.log("I'm setting cookie");
//   }
// }
// class CustomPage {
//   static build() {
//     const page = new Page();
//     const customPage = new CustomPage(page);

//     const superPage = new Proxy(customPage, {
//       get: function (target, property) {
//         return target[property] || page[property];
//       },
//     });

//     return superPage;
//   }

//   constructor(page) {
//     this.page = page;
//   }

//   login() {
//     console.log("I'm login");
//   }
// }

// const superPage = CustomPage.build();
// superPage.login();

//example of response payload shape to decrease network request size
// const fieldsData = {
//   fields: {
//     trackId: "string",
//     reported_dt: "string",
//     longitude: "number",
//     latitude: "number",
//   },
//   data: [
//     ["AA-1234", "12/31/2019 23:59:59", -111.5125, 33.375],
//     ["BB-5678", "12/31/2019 23:59:59", -113.675, 35.875],
//     ["CC-4545", "12/31/2019 23:59:59", -115.575, 37.675],
//   ],
// };
// const { fields, data } = fieldsData;

// const transformedData = data.map((n, i) => {
//   let result = {};
//   for (let i = 0; i < n.length; i++) {
//     result = { ...result, [Object.keys(fields)[i]]: n[i] };
//   }

//   return result;
// });
// console.log(transformedData);

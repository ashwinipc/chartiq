// This file is intended for training purposes. Do not use it as is in your production environment.
import { environment } from "../../environments/environment";
const quoteFeed = {};
quoteFeed.url = `${environment.binance.base}${environment.binance.futures.klines}`;

/**
 * Fetches the data required when a chart loads.
 *
 * @param {string} symbol A stock symbol, such as SPY.
 * @param {Date} startDate The starting date of the fetched time series data.
 * @param {Date} endDate The ending date of the fetched time series data.
 * @param {object} params Additional information about the data request.
 * @param {function} cb A callback function that makes the response from the data provider
 * 		available to the chart engine. The function accepts an object as a parameter. The object
 * 		should contain the response from the data provider, which is either an array of data or
 * 		an error message; for example `{ quotes: quotesArray }` or
 * 		`{ error: errorTextOrStatusCode }`.
 */
quoteFeed.fetchInitialData = function (symbol, startDate, endDate, params, cb) {
  console.log(params);
  const queryUrl = `${this.url}?symbol=${symbol}&limit=500&interval=${params.period}m`;

  this.sendAjax(queryUrl, function (status, response) {
    if (status === 200) {
      const newQuotes = quoteFeed.formatChartData(response);
      cb({ quotes: newQuotes });
    } else {
      cb({ error: response ? response : status });
    }
  });
};
/**
 * Fetches the data required for real-time chart updates.
 *
 * @param {object} params						-Provides additional information on the data requested by the chart.
 * @param {CIQ.ChartEngine} params.stx 			-The chart object requesting data
 * @param {string} params.symbol 				-The symbol being added
 * @param {string} params.symbolObject 			-The symbol being added in object form
 * @param {number} params.period 				-The timeframe each returned object represents. For example, if using interval "minute", a period of 30 means your feed must return ticks (objects) with dates 30 minutes apart; where each tick represents the aggregated activity for that 30 minute period. **Note that this will not always be the same as the period set in {@link CIQ.ChartEngine#setPeriodicity}, since it represents the aggregation of the raw data to be returned by the feed server, rather than the final data to be displayed.**
 * @param {string} params.interval 				-The type of data your feed will need to provide. Allowable values: "millisecond,"second","minute","day","week","month". (This is **not** how much data you want the chart to show on the screen; for that you can use {@link CIQ.ChartEngine#setRange} or {@link CIQ.ChartEngine#setSpan})
 * @since 4.0.0 Changes to periodicity (period/interval) will now also cause subscribe calls
 */
quoteFeed.subscribe = function (params) {
  console.log(params);
  const webSocket = new WebSocket(
    `${environment.ws.base}${params.symbol.toLowerCase()}@kline_${
      params.period
    }m`
  );
  webSocket.onmessage = function (event) {
    const data = JSON.parse(event.data);
    const stxx = params.stx;
    stxx.updateChartData({
      DT: new Date(data["k"]["t"]),
      Open: Number(data["k"]["o"]),
      High: Number(data["k"]["h"]),
      Low: Number(data["k"]["l"]),
      Close: Number(data["k"]["c"]),
      Volume: Number(data["k"]["v"])
    });
  };
};
/**
 * Fetches the historical data required when a chart scrolls into past dates.
 *
 * @param {string} symbol A stock symbol.
 * @param {Date} startDate The starting date of the fetched time series data.
 * @param {Date} endDate The ending date of the fetched time series data.
 * @param {object} params Additional information about the data request.
 * @param {function} cb A callback function that makes the response from the data provider
 * 		available to the chart engine. The function accepts an object as a parameter. The object
 * 		should contain the response from the data provider, which is either an array of data or
 * 		an error message; for example `{ quotes: quotesArray }` or
 * 		`{ error: errorTextOrStatusCode }`.
 */
quoteFeed.fetchPaginationData = function (
  symbol,
  startDate,
  endDate,
  params,
  cb
) {
  const queryUrl = `${this.url}?symbol=${symbol}&limit=500&interval=${
    params.period
  }m&startTime=${startDate.getTime()}&endTime=${endDate.getTime()}`;
  this.sendAjax(queryUrl, function (status, response) {
    if (status === 200) {
      const newQuotes = quoteFeed.formatChartData(response);
      // Provide five days of historical data.
      cb({
        quotes: newQuotes,
        moreAvailable: startDate.getTime() > Date.now() - 86400000 * 5
      });
    } else {
      cb({ error: response ? response : status });
    }
  });
};
/**
 * Makes an HTTP request.
 *
 * Sends the response text or an HTTP 500 Internal Server Error to the chart engine by means of
 * the `cb` (callback) parameter.
 *
 * @param {string} url The endpoint of the HTTP request.
 * @param {function} cb A callback function called by event handlers of the HTTP request.
 * 		Function parameters include the status code and response of the HTTP request.
 */
quoteFeed.sendAjax = function (url, cb) {
  var server = new XMLHttpRequest();
  server.onload = function () {
    cb(this.status, this.responseText);
  };
  server.onerror = function () {
    cb(500);
  };
  //url += "&" + Date.now(); // Add a cache buster to the URL.
  server.open("GET", url);
  server.send();
};
/**
 * Converts the data from an HTTP response into the format required by ChartIQ charts.
 *
 * For illustrative purposes only. The simulator data is in the correct format. The response JSON
 * data is converted to an array of JavaScript objects.
 *
 * @param {string} response The data provider's response in JSON format.
 * @return {array} The data provider response properly formatted in an array of JavaScript objects.
 */
quoteFeed.formatChartData = function (response) {
  const data = JSON.parse(response);
  const newQuotes = [];
  for (let i = 0; i < data.length; i++) {
    newQuotes[i] = {};
    newQuotes[i].DT = new Date(data[i][0]);
    newQuotes[i].Open = Number(data[i][1]);
    newQuotes[i].High = Number(data[i][2]);
    newQuotes[i].Low = Number(data[i][3]);
    newQuotes[i].Close = Number(data[i][4]);
    newQuotes[i].Volume = Number(data[i][5]);
  }
  return newQuotes;
};
export default quoteFeed;

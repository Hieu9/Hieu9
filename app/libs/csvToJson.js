"use strict";

let stringUtils = require("./util/stringUtils");

const newLine = /\r?\n/;
// const defaultFieldDelimiter = ",";

class CsvToJson {
  fieldDelimiter(delimieter) {
    this.delimiter = delimieter;
    return this;
  }

  csvStringToJson(csvString) {
    return this.csvToJson(csvString);
  }

  csvToJson(parsedCsv, defaultFieldDelimiter = ',') {
    let lines = parsedCsv.split(newLine);
    // replace ,
    let lineClears = [];
    for(let i=1; i < lines.length; i++){
      lines[i] = lines[i].replace(/","/g, '";"');
      lines[i] = lines[i].replace(',', ';');
      lines[i] = lines[i].replace(/";"/g, '","');
      lineClears.push(lines[i]);
    }

    let fieldDelimiter = this.getFieldDelimiter(defaultFieldDelimiter);
    let headers = lines[0].split(fieldDelimiter);

    let jsonResult = [];
    for (let i = 0; i < lineClears.length; i++) {
      let currentLine = lineClears[i].split(fieldDelimiter);
      if (stringUtils.hasContent(currentLine)) {
        jsonResult.push(this.buildJsonResult(headers, currentLine));
      }
    }
    return jsonResult;
  }

  getFieldDelimiter(defaultFieldDelimiter) {
    if (this.delimiter) {
      return this.delimiter;
    }
    return defaultFieldDelimiter;
  }

  buildJsonResult(headers, currentLine) {
    let jsonObject = {};
    for (let j = 0; j < headers.length; j++) {
      let propertyName = stringUtils.trimPropertyName(headers[j]);
      let value = currentLine[j];
      if (this.printValueFormatByType) {
        value = stringUtils.getValueFormatByType(currentLine[j]);
      }
      jsonObject[propertyName] = value;
    }
    return jsonObject;
  }
}

module.exports = new CsvToJson();
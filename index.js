const request = require("request-promise");
const cheerio = require("cheerio");

var api = require('./api');

var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');

var app = express();

var port = process.env.PORT || 8000;

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// get api
app.get('/api', api);

app.get('/fiis', function (req, res) {
  const url = 'https://www.fundsexplorer.com.br/ranking';

  async function main() {
    const result = await request.get(url);
    const $ = cheerio.load(result);
    const scrapedData = [];
    const tableHeaders = [];

    const teste = $("#table-ranking tr");
    teste.each((index, element_main) => {
      if (index === 0) {
        const ths = $(element_main).find("th");
        $(ths).each((i, element) => {
          let names = $(element).text();
          tableHeaders.push(
            names.replace(/[&\\óô]/g, 'o')
            .replace(/[&\\ç]/g, 'c')
            .replace(/[&\\áãâ]/g, 'a')
            .replace(/[&\\é]/g, 'e')
            .replace(/[&\/\\().]/g, '')
            .replace(/[&\\í]/g, 'i')
            .replace(' ','')
          );
        });
      }else{
        const tds = $(element_main).find("td");
        const tableRow = {};
        $(tds).each((i, element) => {
          tableRow[tableHeaders[i]] = $(element).text();
        });
        scrapedData.push(tableRow);
        console.log(tableRow)
      }
    });
    const row = html => `<tr>\n${html}</tr>\n`,
      heading = object => row(Object.keys(object).reduce((html, heading) => (html + `<th>${heading}</th>`), '')),
      datarow = object => row(Object.values(object).reduce((html, value) => (html + `<td>${value}</td>`), ''));
                               
    function htmlTable(dataList) {
      return `<table>
                ${heading(dataList[0])}
                ${dataList.reduce((html, object) => (html + datarow(object)), '')}
              </table>`
    }
        
    let html = htmlTable(scrapedData);

    res.send(html);
   }

   main();
});

// error handler
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(400).send(err.message);
});

app.listen(port, function() {
  console.log('GSX2JSON listening on port ' + port);
});
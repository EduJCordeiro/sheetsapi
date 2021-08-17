const request = require("request-promise");
const cheerio = require("cheerio");

const json2html = require('node-json2html');
 

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

    const data = $("#table-ranking tr");
    data.each((index, element_main) => {
      if (index === 0) {
        const ths = $(element_main).find("th");
        $(ths).each((i, element) => {
          let names = $(element).text();
          tableHeaders.push(
            names
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


app.get('/data', function (req, res) {
  const url = 'https://docs.google.com/spreadsheets/d/17KWqNApbA1YAzvhScOKRH2ITH3_NCHheb_8dgdm6VQ0/gviz/tq?tqx=out:html&sheet=1';

  async function main() {
    const result = await request.get(url);
    const $ = cheerio.load(result);

    var json = [];
    var data = `{"data": [`;

    const tr = $("tr");
    tr.each((index, element_main) => {
      if(index == 0){
        const ths = $(element_main).find("td");
        $(ths).each((i, element) => {
          let names = $(element).text();
          json.push(
            names.toLocaleLowerCase()
          );
        });
      }else{
        data += (index == 1) ? `{` : `, {`;
        const ths = $(element_main).find("td");
        $(ths).each((i, element) => {
          let names1 = $(element).text();
          
          data += (i == 0) ? `"${json[i]}": "${names1}"` : `, "${json[i]}": "${names1}"`;
        });
        data += `}`;
      }
    });

    data += `]}`

    res.send(data);
   }

   main();
});

// error handler
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(400).send(err.message);
});

app.listen(port, function() {
  // console.log('GSX2JSON listening on port ' + port);
});
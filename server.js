String.prototype.replaceAll = function (search, replace) {
    return this.split(search).join(replace);
};

var request = require('request');
var http = require('http');
var url = require('url');
var fs = require("fs");
var selected = '';
var index = fs.readFileSync('./index.html');

setInterval(function () {
    index = fs.readFileSync('./index.html');
    dir = fs.readdirSync('./files');
    sortDir();
    data = fs.readFileSync('./files/' + dir[0], 'utf8');
    answ = csvToJson(data.toString());
}, 200); //for debug

var dir, data, answ;

try {
    dir = fs.readdirSync('./files');
    sortDir();
    data = fs.readFileSync('./files/' + dir[0], 'utf8');
    answ = csvToJson(data.toString());
}
catch (e) {
    console.error('ERROR:', 'An occurrence with first-loading');
}

var port = 8553;
var serverUrl = "http://127.0.0.1:" + port;

var server = http.createServer(function (req, res) {
    var urlParsed = url.parse(req.url, true);

    console.log(req.socket.remoteAddress + ': ' + urlParsed.pathname);

    switch (urlParsed.pathname) {
        case '/favicon.ico': {
            res.end(fs.readFileSync('./favicon-192x192.png'));
            break;
        }
        case '/getCurrentData': {
            console.log(urlParsed.query.num);
            try {
                data = fs.readFileSync('./files/' + urlParsed.query.num, 'utf8');
                answ = csvToJson(data.toString());

                res.statusCode = 200;
                res.end(answ);
            }
            catch (e) {
                console.error('ERROR:', e);
                res.statusCode = 403;
                res.end('Invalid request');
            }
            break;
        }
        case '/getFilesList': {
            res.statusCode = 200;
            res.end(JSON.stringify(dir));
            break;
        }
        case '/': {
            res.statusCode = 200;
            res.end(index);
            break;
        }
        case '/setData': {
            if (req.method == 'POST') {
                console.log('POST REQUEST')
                console.log("[200] " + req.method + " to " + req.url);
                var fullBody = '';

                req.on('data', function (chunk) {
                    // append the current chunk of data to the fullBody variable
                    fullBody += chunk.toString();
                });

                req.on('end', function () {
                    var date = new Date();
                    try {
                        var month = date.getMonth();
                        var day = date.getDate();
                        fs.writeFile("./files/" +  (date.getFullYear() + (month < 10) ? ('0'+month) : month + (day < 10) ? ('0'+day) : day) + '.csv', fullBody, function (err) {
                            if (err)
                                return console.log(err);
                            console.log("The file was saved!");
                        });
                    }
                    catch (e) {
                        console.error('ERROR:', 'An occurrence with .csv saving');
                    }
                    // request ended -> do something with the data
                    res.writeHead(200, "OK", { 'Content-Type': 'text/html' });
                    res.end();
                });

            } else {
                console.log("[405] " + req.method + " to " + req.url);
                res.writeHead(405, "Method not supported", { 'Content-Type': 'text/html' });
                res.end('<html><head><title>405 - Method not supported</title></head><body><h1>Method not supported.</h1></body></html>');
            }
            break;
        }
        case '/data': {            
            res.statusCode = 200;
            res.end(answ);
            break;
        }
    }
}).listen(port);

function csvToJson(csv) {
    csv = csv.replaceAll(',', '.');
    var lines = csv.split('\r\n');
    var arr = [];
    var firstRow = lines[0].split(' ;');
    for (var l in firstRow)
        if (!isNaN(parseFloat(firstRow[l]))) arr.push([]);
    for (var ll in lines) {
        var rows = lines[ll].split(' ;');
        for (var r in rows)
            if (!isNaN(parseFloat(rows[r]))) arr[r].push({ x: ll, y: rows[r] });
    }
    return JSON.stringify(arr);
}

function sortDir() {
    var arr = [];
    for (var d in dir) {
        arr.push(dir[d].split('.')[0]);
    }    
    arr.sort(compareNumbers);    
    arr = arr.reverse();
    for (var a in arr) arr[a] += '.csv';
    dir = arr;
}

function compareNumbers(a, b) {
  return a - b;
}

/*
request(serverUrl, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    res.statusCode = 200;
                    res.end(body); 
                }
                else {
                    res.statusCode = 500;
                    res.end('Some error...');
                    console.error(error);
                }
            });   
            */
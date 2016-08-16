String.prototype.replaceAll = function (search, replace) {
    return this.split(search).join(replace);
}

var request = require('request');
var http = require('http');
var url = require('url');
var fs = require("fs");
var index = fs.readFileSync('./index.html');

setInterval(function () { index = fs.readFileSync('./index.html'); }, 200); //for debug

var dir = fs.readdirSync('./files');
var data = fs.readFileSync('./files/' + dir[0], 'utf8');

var answ = csvToJson(data);

var port = 8553;
var serverUrl = "http://127.0.0.1:" + port;

var server = http.createServer(function (req, res) {
    var urlParsed = url.parse(req.url, true);

    console.log(req.socket.remoteAddress + ': ' + urlParsed.pathname);

    switch (urlParsed.pathname) {
        case '/': {
            res.statusCode = 200;
            res.end(index);
            break;
        }
        case '/setData': {
            if (req.method == 'POST') {
                console.log("[200] " + req.method + " to " + req.url);
                var fullBody = '';

                req.on('data', function (chunk) {
                    // append the current chunk of data to the fullBody variable
                    fullBody += chunk.toString();
                });

                req.on('end', function () {
                    var date = new Date();
                    fs.writeFile("/files/"+date.getTime()+'.csv', fullBody, function (err) {
                        if (err)
                            return console.log(err);                        
                        console.log("The file was saved!");
                    });
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
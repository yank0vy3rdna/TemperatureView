String.prototype.replaceAll = function (search, replace) {
    return this.split(search).join(replace);
};

var request = require('request');
var http = require('http');
var url = require('url');
var fs = require("fs");
var selected = '';
var index = fs.readFileSync('./index.html');
var averageTime = 100;

var dir, data, answ, time, dir2;
var path = "C:/temp/";
try {
    dir = fs.readdirSync(path);	
    dir = sortDir(dir,'csv');
	console.log(dir);    
	data = fs.readFileSync(path + dir[0], 'utf8');
    answ = csvToJson(data.toString());
}
catch (e) {
    console.error('ERROR:', 'An occurrence with first-loading',e);
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
                data = fs.readFileSync(path + urlParsed.query.num, 'utf8');
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
                    fullBody += chunk.toString();
                });

                req.on('end', function () {
                    var date = new Date();
                    try {
                        var month = date.getMonth();
                        var day = date.getDate();
                        var path = "./files/" +  date.getFullYear().toString();                        
                        path +=  (month < 10) ? ('0'+month.toString()) : month.toString();                        
                        path +=  (day < 10) ? ('0'+day.toString()) : day.toString();                       
                        fs.writeFile(path + '.csv', fullBody, function (err) {
                            if (err)
                                return console.log(err);
                            console.log("The file was saved!");
                        });
                    }
                    catch (e) {
                        console.error('ERROR:', 'An occurrence with .csv saving',e);
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
    var lines = csv.split('N');    
    var arr = [];
    var firstRow = lines[0].split(' ;');
    for (var l in firstRow)
        if (!isNaN(parseFloat(firstRow[l]))) arr.push([]);
    for (var ll in lines) {        
        var parts = lines[ll].split('T');  
        if (parts.length < 2) continue;
        var timeParts = parts[1].split('.');        
        var rows = parts[0].split(' ;');        
        for (var r in rows)
            if (!isNaN(parseFloat(rows[r]))) arr[r].push({ x: JSON.stringify(timeParts), y: rows[r]}); //parts - for debug
    }
    var log = '';
    for (var a in arr[0]) log += arr[0][a].x + '\n';
    fs.writeFile('./log.txt',log);
    return JSON.stringify(arr);
}

function sortDir(d, extension) {
    var arr = [];
	for (var v in d){
		var t = d[v];
		var t2 = "";
		t = t.split('.');
		t.splice(t.length-1,1);
		var buff = t[0];
		t[0] = t[t.length-1];
		t[t.length-1] = buff;
		console.log(t);
		for (var v2 = 0; v2 < t.length; v2++)
		{
			t2 += t[v2].toString();		
			console.log(t[v2]);
		}
		arr.push(t2);
	}    
	console.log(arr);
    arr.sort(compareNumbers);    
	console.log('---------- sorted -------------');
	console.log(arr);	
    arr = arr.reverse();
	console.log('---------- reversed -------------');
	console.log(arr);	
    for (var a = 0; a < arr.length; a++) 
	{
		var elem = arr[a];		
		elem = spliceSplit(elem, 4,0,'.');
		elem = spliceSplit(elem, 7,0,'.');				
		elem += '.' + extension;
		arr[a] = elem;
	}	
	var buffarr = [];
	for (var v in arr){
		var t = arr[v];
		var t2 = "";
		t = t.split('.');		
		var buff = t[0];
		t[0] = t[t.length-2];
		t[t.length-2] = buff;		
		for (var v2 = 0; v2 < t.length-1; v2++)
		{
			t2 += t[v2].toString();		
			console.log(t[v2]);
		}		
		buffarr.push(t2);
	}
	arr = buffarr;	
	for (var a = 0; a < arr.length; a++) 
	{
		var elem = arr[a];		
		elem = spliceSplit(elem, 2,0,'.');
		elem = spliceSplit(elem, 5,0,'.');				
		elem += '.' + extension;
		arr[a] = elem;
	}	
	console.log('---------- formated -------------');
	console.log(arr);
    d = arr;
    return d;
}

function readTimes(times){
    var tts = times.split('N');
    try{
        //console.log(tts)
    }
    catch(e){
        console.error('ERROR:',e);
    }
}

function spliceSplit(str, index, count, add) {
  var ar = str.split('');
  ar.splice(index, count, add);
  return ar.join('');
}

function compareNumbers(a, b) {
	if (typeof a != 'number') a = parseInt(a);
	if (typeof b != 'number') b = parseInt(b);
	return a - b;
}

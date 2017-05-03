var http = require("http");
var fs = require('fs');
var path = require('path');
var MongoClient = require('mongodb').MongoClient;
var qs = require('querystring');
var url = require('url');

//Server Creation
var server = http.createServer(function (request, response) {
    console.log('request ', request.url);

    var filePath = '.' + request.url;
    if (filePath == './')
        filePath = './landing_page.html';

    var extname = String(path.extname(filePath)).toLowerCase();
    console.log(extname);
    var contentType = 'text/html';
    var mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.svg': 'application/image/svg+xml',
        '.ico': 'image/x-icon'
    };
    contentType = mimeTypes[extname];

    //Check for method type and act accordingly here
    if(!contentType){
        if(request.method == "POST"){
            postAPI(request,response);
        }

        if(request.method == "GET"){
            getAPI(request,response);
        }
    }else{
        fs.readFile(filePath, function(error, content) {
        if (error) {
            if(error.code == 'ENOENT'){
                fs.readFile('./404.html', function(error, content) {
                    response.writeHead(200, { 'Content-Type': contentType });
                    response.end(content, 'utf-8');
                });
            }
            else {
                response.writeHead(500);
                response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                response.end();
            }
        }
        else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
     });
    }
});

server.listen(3000);

//GET Function calls 
function getAPI(req,response){
    var reqName = req.url.split("?")[0];
    
    if(reqName == "/searchUser"){
        var url_parts = JSON.stringify(url.parse(req.url,true).query);
        var result;
        MongoClient.connect("mongodb://127.0.0.1:27017/test",function(err,db){
            if(err){
                throw err;
            }else{
                 db.collection('users').find({email:JSON.parse(url_parts).email}).toArray(function(err,docs){
                    if(err){
                        throw err;
                    }else{
                        response.setHeader("Content-Type",'text/plain');
                        response.end(JSON.stringify(docs));
                    }
                });
            }
            db.close();
        });
    }
}

//POST Function calls

function postAPI(req,response){
    if(req.url == "/addUser"){
            var body = "";
            var postData="";
            req.on("data",function(data){   
                body = body+ data;
            });
            req.on("end",function(){
                postData = qs.parse(body);
            });

            MongoClient.connect("mongodb://127.0.0.1:27017/test",function(err,db){
                if(err){
                    throw err;
                }else{
                    db.collection('users').insert({firstName:postData.firstName,lastName:postData.lastName,email:postData.email});
                }
                db.close();
            });

            response.writeHead(200,{"Content-Type":"text/plain;charset=utf-8"});
            response.end(JSON.stringify({'status':'ok'})); 
            response.end();
    }
}
console.log('Server running at port 3000');

/**
 * Created by ASE Lab on 15/07/14.
 */
//var gm = require('gm');
var fs = require('fs');
var dataDirectory = 'data/temp/';
//var thumbnailSize = 400;
var util = require('./util');
var mime = require('mime');
var locator = require('./locator');

exports.show = function(req, res){
    var fileName = req.params.fileName;
    var ext = req.params.ext;
    var filePath = dataDirectory + fileName + "." + ext;

    fs.readFile(filePath, function(err, data){
        if(err){
            if(err.code === 'ENOENT'){
                sendNotFoundError(req,res);
            } else{
                sendInternalServerError(req, res);
            }
        }
        else{
            var mimeType = mime.lookup(filePath);
            console.log(mimeType);
            res.writeHead(200, {'Content-Type':mimeType});
            res.write(data);
            res.end();
        }
    });
}

exports.fileList = function(req, res){
    var walk    = require('walk');
    var files   = [];

    // Walker options
    var walker  = walk.walk('./data/temp', { followLinks: false });

    walker.on('file', function(root, stat, next) {
        // Add this file to the list of files
        files.push(stat.name);
        //console.log('stat: '+JSON.stringify(stat));
        //console.log('-> lookup: ' +mime.lookup('data\\'+stat.name))
        //locator.registerData({name:stat.name,type:mime.lookup('data\\'+stat.name),dataPath:'\\files\\'+stat.name});
        next();
    });

    walker.on('end', function() {
        //console.log(files);
        res.send(files);
    });
}

function sendInternalServerError(req, res){
    // Reply with ERROR 500
    res.status(500);
    // respond with html page
    /*
    if (req.accepts('html')) {
        res.render('error', {
            title: '500 | Internal Server Error',
            code: 500,
            myuid: req.myuid
        });
        return;
    }
    */

    // respond with json
    if (req.accepts('json')) {
        res.send({ error: 'Internal Server Error' });
        return;
    }

    // default to plain-text. send()
    res.type('txt').send('Internal Server Error');
    return;
}

function sendNotFoundError(req,res){
    // Reply with ERROR 404
    res.status(404);
    // respond with html page
    /*
    if (req.accepts('html')) {
     res.render('error', {
     title: '404 | Page Not Found',
     code: 404,
     myuid: req.myuid
     });
     return;
     }
    */

    // respond with json
    if (req.accepts('json')) {
        res.send({ error: 'Not found' });
        return;
    }

    // default to plain-text. send()
    res.type('txt').send('Not found');
    return;
}
exports.saveDataToFile = function(data,path,callback){
    fs.writeFile(path, data, function(err) {
        if(err) {
            callback(err);
            return console.log(err);
        }else {
            callback(1);
            console.log(path+" was saved!");
        }
    });
}

exports.loadJSONWithCallback = function(path,callback){
    var obj;
    fs.readFile(path, 'utf8', function (err, data) {
        if (err) {
            throw err;
            callback(null);
        }
        else{
            try {
                console.log(data);
                obj = JSON.parse(data);
                callback(obj)
            }catch(e){
                console.log("config maybe empty "+e);
            }
        }
    });
}
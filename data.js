/**
 * Created by ASE Lab on 15/07/14.
 */
//var gm = require('gm');
var fs = require('fs');
var imageDirectory = 'data/';
//var thumbnailSize = 400;
var util = require('util');

exports.show = function(req, res){
    var fileName = req.params.fileName;
    var ext = req.params.ext;
    var filePath = imageDirectory + fileName + "." + ext;

    fs.readFile(filePath, function(err, data){
        if(err){
            if(err.code === 'ENOENT'){
                sendNotFoundError(req,res);
            } else{
                sendInternalServerError(req, res);
            }
        }
        else{
            switch(ext)
            {
                case 'gif':
                    res.writeHead(200, {'Content-Type':'image/gif'});
                    res.write(data);
                    break;
                case 'jpg':
                    res.writeHead(200, {'Content-Type':'image/jpg'});
                    res.write(data);
                    break;
                case 'jpeg':
                    res.writeHead(200, {'Content-Type':'image/jpeg'});
                    res.write(data);
                    break;
                case 'png':
                    res.writeHead(200, {'Content-Type':'image/png'});
                    res.write(data);
                    break;
                case 'bmp':
                    res.writeHead(200, {'Content-Type':'image/bmp'});
                    res.write(data);
                    break;
                default:
                    /// TODO: Clarify this!
                    /// I am not sure if this should be reached since we will
                    /// perform the file check when the image is uploaded!
                    console.log("Image type may not be supported.");
                    res.writeHead(200, {'Content-Type':'image/jpg'});
            }
            res.end();
        }
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
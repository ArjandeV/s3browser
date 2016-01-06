'use strict';

// Load the plugin modules
let express = require('express');
let path = require('path');
let s3 = require('s3');

// Load the config
let env = require('./env.json');

// Initialise the client
let client = s3.createClient(env);

// Initialise the application
let app = express();

app.set('view engine', 'jade');

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.redirect('/browse/');
});

app.get('/browse/*', function(req, res) {
    let url = decodeURI(req.url.replace('/browse/', ''));
    let params = {
        s3Params: {
            Bucket: env.bucket,
            Prefix: url
        } 
    };
    
    let emitter = client.listObjects(params);

    emitter.on('data', function(data) {
        res.render('index', {
            req: req,
            path: path,
            dirname: url,
            contents: data.Contents
        });
    });

});

app.get('/stream/*', function(req, res) {
    let url = decodeURI(req.url.replace('/stream/', ''));
    let params = {
        Bucket: env.bucket,
        Key: url 
    };

    let stream = client.downloadStream(params);

    stream.pipe(res);
});


let server = app.listen(8000);

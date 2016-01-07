'use strict';

// ----------
// Preload
// ----------
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

// ----------
// Routes
// ----------
// Redirect root to browsing route
app.get('/', function(req, res) {
    res.redirect('/browse/');
});

// Browsing route for navigating file tree
app.get('/browse/*', function(req, res) {
    let url = decodeURI(req.url.replace('/browse/', ''));
    let params = {
        s3Params: {
            Bucket: env.bucket,
            Delimiter: '/',
            Prefix: url
        } 
    };
    
    let emitter = client.listObjects(params);
    let sent = false;

    emitter.on('data', function(data) {
        if(!sent) {
            sent = true;

            res.render('index', {
                req: req,
                path: path,
                dirname: url,
                commonPrefixes: data.CommonPrefixes || [],
                contents: data.Contents || [],
                bucket: env.bucket
            });
        }
    });

});

// Streaming route for passing through file data
app.get('/stream/*', function(req, res) {
    let url = decodeURI(req.url.replace('/stream/', ''));
    let params = {
        Bucket: env.bucket,
        Key: url 
    };

    let stream = client.downloadStream(params);

    stream.pipe(res);
});

let server = app.listen(80);

console.log('s3browser is running on port 80');

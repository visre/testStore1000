var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var azure = require('azure');
var fs = require('fs');
var storage_account = 'gallerie';
var gallerieKey = 'SiQVY98VhO+NI1m6jfBMgB1M/00geM/puCgpMpRvsBSUz0H/xcgF77Wx9SiD7buJFvXZ9NTvyRNvf200CNT6Kg==';
var package_container = 'packages';
var index_container = 'descriptifs';
var admzip = require('adm-zip');
var blobService = azure.createBlobService(storage_account,gallerieKey);
var packages_folder = __dirname + '/databases/packages/';

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();
app.use("/databases", express.static(__dirname + '/databases'));
app.use("/controllers", express.static(__dirname + '/controllers'));

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', routes);
app.get('/', function (req, res){
	res.render('index.html');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

function Init(){
	// Get index.json
	blobService.getBlobToFile(index_container, 'index.json', __dirname + '/databases/index.json', function(error, result, response){
	});
}

app.get('/gallery/product/download', function(req, res){
	var item = url.parse(req.url).query;
	var filePath = packages_folder + item + '.zip';
	blobService.getBlobToFile(package_container, item + '.mob', filePath, function(error, result, response){
		if(!error){
		    var returnHeaders = {};
			returnHeaders['Content-Disposition'] = 'attachment; filename="'+ item +'.zip"';
			returnHeaders['Content-Type'] = 'application/zip';
			res.writeHead(200, returnHeaders); 
			var stream = fs.createReadStream(filePath);
			stream.on('open', function () {				
				stream.pipe(res);
			});
			stream.on('end', function () {
				res.end();
			});			
		}	
	});			
});

app.get('/gallery/product/install', function(req, res){
    var item = url.parse(req.url).query;
	var filePath = packages_folder + item + '.zip';
	
	blobService.getBlobToFile(package_container, item + '.mob', filePath, function(error, result, response){
		if(!error){
			var zip = new admzip(filePath);
			zip.extractAllTo('\Extracted\\' + item, true);
			res.redirect(req.get('referer'));
		}
	});	
});

Init();
var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});
module.exports = app;

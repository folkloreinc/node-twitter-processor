var http = require('http');
var fs = require('fs');
var path = require('path');
var utils = require('../utils');

var HTTPProcessor = function(options) {

	this.options = utils.merge({
		'host' : {
			'host': 'http://localhost',
			'port': 80,
			'path': '/?text=?'
		}
	},options);

};

HTTPProcessor.prototype.process = function(job,done) {

	var now = new Date();
	
	var publicFolder = '/audio/'+(now.getMonth()+1)+'-'+now.getDay()+'/'+now.getHours()+'-'+now.getMinutes();
	var publicPath = publicFolder+'/'+id+'.mp3';
	var folder = __dirname+'/../web'+publicFolder
	var filename = __dirname+'/../web'+publicPath;
	
	if (!path.existsSync(folder+'/')) {
		fs.mkdirSync(folder+'/',0775,true);
	}
	
	http.get(this.options.host, function(response) {

		var file = fs.createWriteStream(filename);
		response.on('data', function(chunk){ 
			file.write(chunk);
		});
		response.on('end', function(){
			file.end();
			done();
		});

	}).on('error', function(e) {
		done(e.message);
	});

};
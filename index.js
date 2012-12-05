
var TwitterProcessor = require('./lib/processor');

module.exports = exports = {

	'TwitterProcessor' : TwitterProcessor,

	'createProcessor' : function(opts) {

		var processor = new TwitterProcessor(opts);

		return processor;

	}


};
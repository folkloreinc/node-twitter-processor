
var twitterProcessor = require('../index');
var CONFIG = require('./config');

var processor = twitterProcessor.createProcessor({
    'debug' : true,
    'processor' : function(job,done) {
        job.data.addedKey = 'value';
        done();
    },
    'twitter' : CONFIG.twitter,
    'filter' : {
        'track' : 'Twitter'
    }
});

processor.on('tweet', function(tweet) {
	console.log('Tweet',tweet.text);
});
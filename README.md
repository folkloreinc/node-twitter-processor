twitter-processor
===========

Receive Tweets from the Twitter Streaming API and process them using custom processors.


Installation
---------------
    npm install twitter-processor


Usage
---------------

    var twitterProcessor = require('twitter-processor');
    
	var processor = twitterProcessor.createProcessor({
		'debug' : true,
		'processor' : function(tweet,done) {
			tweet.addedKey = 'value';
			done();
		},
		'twitter' : {
			'consumer_key' : '',
			'consumer_secret' : '',
			'access_token_key' : '',
			'access_token_secret' : ''
		},
		'filter' : {
			'track' : 'Twitter'
		}
	});

	processor.on('tweet',function(tweet) {
		console.log(tweet.addedKey); //value
	});
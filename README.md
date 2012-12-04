Twitter-processing
===========

Receive Tweets from the Twitter Streaming API and process them using custom processors.


Installation
---------------
    npm install twitter-processing


Usage
---------------

    var twitterProcessing = require('twitter-processing');
    
	var processing = twitterProcessing({
		'debug' : true,
		'processor' : function(job,done) {
			job.data.addedKey = 'value';
			done();
		},
		'redis' : {
			'host' : 'localhost',
			'post' : 6379,
			'password' : ''
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

	processing.on('data',function(tweet) {
		console.log(tweet.addedKey); //value
	});
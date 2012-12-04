
var kue = require('kue');
var twitter = require('ntwitter');
var EventEmitter = require('events').EventEmitter;

var utils = require('./lib/utils');

/*
 *
 * TwitterProcessing
 *
 */
var TwitterProcessing = function(options) {

	//Call eventemitter constructor
	EventEmitter.call(this);

	//Options
	this.options = utils.merge({
		'debug' : false,
		'processor' : null,
		'redis' : {
			'host' : '127.0.0.1',
			'port' : 6379
		},
		'twitter' : {
			'consumer_key' : 'Twitter',
			'consumer_secret' : 'API',
			'access_token_key' : 'keys',
			'access_token_secret' : 'go here'
		},
		'filter' : {
			'track' : ['twitter']
		},
		'pauseTimeout' : 5000,
		'queueName' : 'twitter_processing_'
	},options);

	//Server
	this.twitter = this.createTwitter();

	//Twitter Stream
	this.currentStream = null;

	//Queue
	//this.redis = this.createRedis();
	this.jobs = this.createQueue();
	this.jobsCount = 0;

	//Processor
	this.processor = this.options.processor || null;

	//State
	this.isProcessing = false;
	this.isStarted = false;

	//Initialize
	this.init();

};

//Extend EventEmitter
TwitterProcessing.prototype = Object.create(EventEmitter.prototype);

/*
 *
 * Create methods
 *
 */
//Create queue
TwitterProcessing.prototype.createQueue = function() {
	var self = this;
	kue.redis.createClient = function() {
		var redis = require('redis');
		var client = redis.createClient(self.options.redis.port, self.options.redis.host);
		if(self.options.redis.password) {
	    	client.auth(self.options.redis.password);
		}
		return client;
	};
	var jobs = kue.createQueue();
	return jobs;
}

//Create Redis
TwitterProcessing.prototype.createRedis = function() {
	var redis = require('redis');
	var client = redis.createClient(this.options.redis.port, this.options.redis.host);
	if(this.options.redis.password) {
    	client.auth(this.options.redis.password);
	}
    return client;
}

//Create Twitter
TwitterProcessing.prototype.createTwitter = function() {
	var twit = new twitter(this.options.twitter);
	return twit;
};

/*
 *
 * Init methods
 *
 */
TwitterProcessing.prototype.init = function() {

	var self = this;

	//Init kue
	this.jobs.on('job complete', function(id){
		if(self.options.debug) {
			console.log('Kue: Job completed', id);
		}
		self.jobsCount--;
		kue.Job.get(id, function(err, job){
			if (err || !job) return;

			self.emit('tweet',job.data);

			job.remove(function(err){
				if(self.options.debug) {
					console.log('Kue: Removing job', err, job.data.text);
				}
				if(self.jobsCount == 0) {
					self.isProcessing = false;
					if(self.options.debug) {
						console.log('Kue: Queue completed');
					}
				}
				if (err) throw err;
			});
		});
	});

};

TwitterProcessing.prototype._startStream = function() {

	if(!this._retriesCount) {
		this._retriesCount = 1;
	}

	var self = this;

	this.twitter.stream('statuses/filter', this.options.filter, function(stream) {

		if(self.options.debug) {
			console.log('Twitter stream started');
		}

		self.currentStream = stream;

		//On new tweet
		stream.on('data', function (tweet) {
			
			//Filter tweet text to remove symbols
			tweet.textFiltered = utils.filterTweetText(tweet.text);

			//console.log('Tweet: '+tweet.textFiltered);

			//Create the job
			self.jobs.create(self.options.queueName, tweet).save();
			self.jobsCount++;

			//Start the queue if it is paused
			if(!self.isProcessing) {
				self.jobs.process(self.options.queueName,function() {
					self.process.apply(self,arguments);
				});
				self.isProcessing = true;
			}

		});

		//On stream error
		stream.on('error', function (response) {
			if(self.options.debug) {
				console.log('Twitter error',arguments);
			}
			try {
				self._retriesCount = self._retriesCount * 2;
				stream.destroy();
			} catch(e){}
		});

		//On stream end
		stream.on('end', function (response) {
			try {
				self._retriesCount = 1;
				stream.destroy();
			} catch(e){}
		});

		//On stream destroy, reconnect
		stream.on('destroy', function (response) {

			//Reconnect if the destroy was not intented
			if(self.isStarted) {
				if(self.options.debug) {
					console.log('Twitter stream reconnect in '+self._retriesCount+' second(s)');
				}
				setTimeout(function() {
					self._startStream();
				},self._retriesCount * 1000);
			}
		});

	});

};

//Start
TwitterProcessing.prototype.start = function() {

	if(this.options.debug) {
		console.log('TwitterProcessing start');
	}

	this.isStarted = true;

	this._startStream();

};

//Stop the streamer
TwitterProcessing.prototype.stop = function() {

	if(this.options.debug) {
		console.log('TwitterProcessing stop');
	}

	this.isStarted = false;

	if(this.currentStream) {
		this.currentStream.end();
	}

};


//Process tweet
TwitterProcessing.prototype.process = function(job,done) {

	if(!this.processor) done();

	this.processor.process(job,function() {
		job.save(done);
	});
	
	return;

};


/*
 *
 * Factory
 *
 */
function factory(options) {

	var twittertts = new TwitterProcessing(options);

	return twittertts;

}

module.exports = exports = factory;
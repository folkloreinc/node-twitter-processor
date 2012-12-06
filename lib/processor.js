var twitter = require('ntwitter');
var queueleuleu = require('queueleuleu');
var EventEmitter = require('events').EventEmitter;
var utils = require('./utils');

/*
 *
 * TwitterProcessor
 *
 */
var TwitterProcessor = function(options) {

	//Call eventemitter constructor
	EventEmitter.call(this);

	//Options
	this.options = utils.merge({
		'debug' : false,
		'processor' : function(tweet,done){
			done();
		},
		'twitter' : {
			'consumer_key' : 'Twitter',
			'consumer_secret' : 'API',
			'access_token_key' : 'keys',
			'access_token_secret' : 'go here'
		},
		'filter' : {
			'track' : 'twitter'
		},
		'pauseTimeout' : 5000
	},options);

	//Server
	this.twitter = null;

	//Twitter Stream
	this.currentStream = null;

	//Queue
	this.queue = null;

	//Processor
	this.processor = this.options.processor || null;

	//State
	this.isProcessing = false;
	this.isStarted = false;

	//Initialize
	this.init();

};

//Extend EventEmitter
TwitterProcessor.prototype = Object.create(EventEmitter.prototype);

/*
 *
 * Init method
 *
 */
TwitterProcessor.prototype.init = function() {

	var self = this;

	this.twitter = new twitter(this.options.twitter);

	//Create queue
	this.queue = queueleuleu.createQueue({
		'debug' : this.options.debug,
		'autostart' : true,
		'processor' : function(job,done) {
			self.process.call(self,job,function() {
				done();
			});
		}
	});

	//When a job is processed
	this.queue.on('job end', function(job) {

		self.emit('tweet',job.data);
		
	});

};

TwitterProcessor.prototype._startStream = function() {

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

			//Add tweet to queue
			self.queue.add(tweet);

			self.emit('add',tweet);

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
TwitterProcessor.prototype.start = function() {

	if(this.isStarted) return;

	if(this.options.debug) {
		console.log('TwitterProcessor start');
	}

	this.isStarted = true;

	this._startStream();

	if(this.queue) {
		this.queue.start();
	}

};

//Stop the streamer
TwitterProcessor.prototype.stop = function() {

	if(!this.isStarted) return;

	if(this.options.debug) {
		console.log('TwitterProcessor stop');
	}

	this.isStarted = false;

	if(this.currentStream) {
		this.currentStream.destroy();
	}

	if(this.queue) {
		this.queue.stop();
	}

};


//Process tweet
TwitterProcessor.prototype.process = function(job,done) {

	if(!this.processor) done();

	if(this.processor) {
		this.processor(job.data,function() {
			done();
		});
	}
	
	return;

};


module.exports = exports = TwitterProcessor;
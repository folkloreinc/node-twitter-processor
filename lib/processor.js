var queueleuleu = require('queueleuleu');
var EventEmitter = require('events').EventEmitter;
var utils = require('./utils');
var Twit = require('twit');

var debug = require('debug')('twitter-processor');

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
	this.stream = null;

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
	
	debug('Init');
	
	this.twitter = new Twit({
		consumer_key:         this.options.twitter.consumer_key,
		consumer_secret:      this.options.twitter.consumer_secret,
		access_token:         this.options.twitter.access_token_key,
		access_token_secret:  this.options.twitter.access_token_secret
	});

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
	this.queue.on('job end', function(job)
	{
		self.emit('tweet',job.data);
	});

};

TwitterProcessor.prototype._startStream = function() {

	var self = this;
	
	this.stream = this.twitter.stream('statuses/filter', this.options.filter);
	this.stream.on('tweet', function (tweet)
	{
		if(typeof(tweet.text) != 'undefined') {
			self.addTweet.call(self,tweet);
		}
	});
	
	this.stream.on('connect', function ()
	{
		debug('Twitter stream connecting...');
	});
	
	this.stream.on('connected', function ()
	{
		debug('Twitter stream connected.');
	});
	
	this.stream.on('reconnect', function ()
	{
		debug('Twitter stream reconnect.');
	});
	
	this.stream.on('disconnect', function ()
	{
		debug('Twitter stream disconnect.');
	});
	
	this.stream.on('error', function (err)
	{
		debug('Twitter stream error', err);
	});

};

//Add tweet
TwitterProcessor.prototype.addTweet = function(tweet) {

	//Add tweet to queue
	this.queue.add(tweet);

	//Emit add event
	this.emit('add',tweet);

};

//Start
TwitterProcessor.prototype.start = function() {

	if(this.isStarted) return;

	if(this.options.debug)
	{
		debug('Start');
	}

	this.isStarted = true;

	this._startStream();

	if(this.queue)
	{
		this.queue.start();
	}

};

//Stop the streamer
TwitterProcessor.prototype.stop = function() {

	if(!this.isStarted) return;

	if(this.options.debug)
	{
		debug('Stop');
	}

	this.isStarted = false;

	if(this.stream)
	{
		this.stream.stop();
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


var twitterProcessor = require('../index');
var CONFIG = require('./config');

var processor = twitterProcessor.createProcessor({
    'debug' : true,
    'processor' : function(tweet,done) {
        tweet.addedKey = 'value';
        setTimeout(function() {
            done();
        },Math.round(Math.random()*3000));
    },
    'twitter' : CONFIG.twitter,
    'filter' : {
        'track' : 'Bieber'
    }
});

processor.on('add', function(tweet) {
    //console.log('Tweet added',tweet.text);
});

processor.on('tweet', function(tweet) {
	console.log('Tweet processed',tweet.text);
});

processor.start();


setTimeout(function() {

    console.log('Stopped');
    processor.stop();

    setTimeout(function() {

        console.log('Restart');
        processor.start();

    },10000);

},10000);
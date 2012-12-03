

/**
 *
 * Filter text of tweet to remove symbols
 *
 */
exports.filterTweetText = function(text) {
	text = text.replace(/RT ?\@[a-zA-Z0-9\_\-]+ ?\:?/gi,'');
	text = text.replace(/(https?:\/\/([-\w\.]+)+(:\d+)?(\/([\w\/_\.]*(\?\S+)?)?)?)/gi,'');
	text = text.replace(/ \#[^\ ]+$/gi,'');
	text = text.replace(/ \#[^\ ]+$/gi,'');
	text = text.replace(/ \#[^\ ]+$/gi,'');
	text = text.replace('@','');
	text = text.replace('#','');
	text = text.replace('\n','');
	text = text.replace('"',' ');
	text = text.replace('  ',' ');
	text = text.replace('  ',' ');
	return text;
}

/**
 * Merge object b with object a.
 *
 *     var a = { foo: 'bar' }
 *       , b = { bar: 'baz' };
 *     
 *     utils.merge(a, b);
 *     // => { foo: 'bar', bar: 'baz' }
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object}
 * @api public
 */
exports.merge = function(a, b){
	if (a && b) {
		for (var key in b) {
			a[key] = b[key];
		}
	}
	return a;
};
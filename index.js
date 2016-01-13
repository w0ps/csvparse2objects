var _ = require( 'underscore' ),
		async = require( 'async' ),
		csv = require( 'csv' );

var delimiters = [ ',', '.', ':', ';', '|', '$', '/', '\\', '-', '_', '`', '~', '\'' ];

function getDelimiter( line ) {
  return delimiters.map( splitByDelimiter ).sort( returnSplitLength ).pop().delimiter;

  function splitByDelimiter( character ) {
    return {
      items: line.split( character ),
      delimiter: character
    };
  }

  function returnSplitLength( a, b ) {
    return a.items.length - b.items.length;
  }
}

function smartParse( csvData, passedHeader, cb ) {
	if( typeof passedHeader === 'function' ){
		cb = passedHeader;
		passedHeader = null;
	}

	var header = passedHeader || /[^\n^\r\n]+/.exec( csvData )[ 0 ],
			csvDatalines = csvData,
			delimiter;

	delimiter = getDelimiter( header );

	return csv.parse( csvDatalines, { delimiter: delimiter, relax: true }, postParse );

	function postParse( err, lines ) {
		if( err ) return cb( err );

		header = lines.shift();

		var objects = [];

		lines.forEach( parseAndStow );

		return cb( null, {
			objects: objects,
			delimiter: delimiter
		} );

		function parseAndStow( values ){
			if( !values.reduce( addStringLength, 0 ) ) return; // skip empty lines

			var lineObject = {};

			values.forEach( stow );

			objects.push( lineObject );

			return;

			function addStringLength( value, string ) { return value + string.length; }

			function stow( value, index ) {
				var key = header[ index ],
						i;

				if( !key ) {
					i = 1;
					while( ( key = 'unknown-key-' + i ) in lineObject ) ++i;
				}
				
				lineObject[ key ] = value;
			}
		}
	}
}

module.exports = smartParse;

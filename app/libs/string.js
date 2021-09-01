module.exports = {
    base64Data: function(string){
    	let buff = new Buffer(string);
        return buff.toString('base64');
    },
    csvJSON: function(csv){
	  var lines=csv.split("\n");

	  var result = [];

	  var headers=lines[0].split(",");

	  for(var i=1;i<lines.length;i++){

		  var obj = {};
		  var currentline=lines[i].split(",");

		  for(var j=0;j<headers.length;j++){
			  obj[headers[j]] = currentline[j];
		  }

		  result.push(obj);

	  }
	  
	  //return result; //JavaScript object
	  return result; //JSON
	},
	replace: function(string, char = ''){
		return string.replace(/"/g, char);
	}
}
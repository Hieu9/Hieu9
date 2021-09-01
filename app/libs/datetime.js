module.exports = {
    dayvnNow: function(type,pre = 0){
    	let date_ob = new Date();
		date_ob.setDate(date_ob.getDate() - pre);
	    // current year
	    let year = date_ob.getFullYear();
	    // current month
	    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
	    // adjust 0 before single digit date
	    let date = ("0" + date_ob.getDate()).slice(-2);
	    // current hours
	    let hours = date_ob.getHours();
	    // current minutes
	    let minutes = date_ob.getMinutes();
	    // current seconds
	    let seconds = date_ob.getSeconds();
	    let key = '';
	    if(type == 'minute'){
		    key = `${year}${month}${date}${hours}${minutes}`;
	    }else if (type == 'hours'){
	    	key = `${year}${month}${date}${hours}`;
	    }else if (type == 'date'){
	    	key = `${year}${month}${date}`;
	    }else if (type == 'month'){
	    	key = `${year}${month}`;
	    }else if (type == 'year'){
	    	key = `${year}`;
	    }else{
	    	key = `${year}${month}${date}${hours}${minutes}${seconds}`;
	    }
	    return key;
    },
    format: function(d, format = ''){
    	let m = new Date(d);
    	let dateString =
						  ("0" + m.getUTCDate()).slice(-2) + "" +
						  ("0" + (m.getUTCMonth()+1)).slice(-2) + "" +
						  m.getUTCFullYear() + "" +
						  ("0" + m.getUTCHours()).slice(-2) + "" +
						  ("0" + m.getUTCMinutes()).slice(-2) + "" +
						  ("0" + m.getUTCSeconds()).slice(-2);
    	return dateString;
    }
}
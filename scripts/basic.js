
var get = function (query) {
	var elems = document.querySelectorAll(query)
	if (elems.length == 1) return elems[0];
	else return elems;
};

var getFile = function (filename, callback) {
	var xmlhttp;
	if (window.XMLHttpRequest) {
		xmlhttp = new XMLHttpRequest();
	} else {
	// code for older browsers
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			callback(this.responseText);
		}
	};

	if (window.location.protocol == 'file:') {
		switch(filename) {
			default:
				return '';
		}
	} else {
		xmlhttp.open("GET", filename, true);
		xmlhttp.send();
	}
};
		
var getJSONfile = function (filename, callback) {
	getFile(filename, function (value) {
		var o;
		try {
			o = JSON.parse(value);
		} catch (ex) {
			o = ex;
		}
		callback(o);
	});
};

Number.prototype.roundTo = function (places) {
	var value = (Math.round(this*Math.pow(10, places))/Math.pow(10, places)).toString();
	var splitsies = value.split('.');
	if (splitsies.length == 1) {
		value += '.0';
		splitsies = value.split('.');
	}
	while (splitsies[1].length < places) {
		value += '0';
		splitsies = value.split('.');
	}
	return value;
};

String.prototype.padLeft = function (len, pad) {
	var ret = this;
	while (ret.length < len) {
		ret = pad + ret;
	}
	return ret;
};

Date.prototype.getMonthName = function () {
	var monthNames = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];
	return monthNames[this.getMonth()];
}

Date.prototype.getDayName = function () {
	var dayNames = [
		'Sunday',
		'Monday',
		'Tuesday',
		'Wednesday',
		'Thursday',
		'Friday',
		'Saturday'
	];
	return dayNames[this.getDay()];
}

Date.prototype.get12Hours = function () {
	var hour = this.getHours() % 12;
	if (hour == 0) hour = 12;
	return hour;
}

Date.prototype.addDays = function (days) {
	var millsecondsInADay = 1000 * 60 * 60 * 24;
	this.setTime(this.getTime() + (days * millsecondsInADay));
}

Date.prototype.toStringFormat = function (format) {
	format = format.replace(/yyyy/g, this.getFullYear());
	format = format.replace(/yy/g, this.getFullYear().toString().substring(2));
	
	format = format.replace(/MMMM/g, 'X');
	format = format.replace(/MMM/g, 'XX');
	format = format.replace(/MM/g, (this.getMonth() + 1).toString().padLeft(2, '0'));
	format = format.replace(/M/g, (this.getMonth() + 1));
	
	format = format.replace(/dddd/g, 'XXX');
	format = format.replace(/ddd/g, 'XXXX');
	format = format.replace(/dd/g, this.getDate().toString().padLeft(2, '0'));
	format = format.replace(/d/g, this.getDate());
	
	format = format.replace(/HH/g, this.getHours().toString().padLeft(2, '0'));
	format = format.replace(/H/g, this.getHours());
	format = format.replace(/hh/g, this.get12Hours().toString().padLeft(2, '0'));
	format = format.replace(/h/g, this.get12Hours());
	
	format = format.replace(/mm/g, this.getMinutes().toString().padLeft(2, '0'));
	format = format.replace(/m/g, this.getMinutes());
	
	format = format.replace(/ss/g, this.getSeconds().toString().padLeft(2, '0'));
	format = format.replace(/s/g, this.getSeconds());
	
	format = format.replace(/ampm/g, this.getHours() > 11 ? 'pm' : 'am');
	
	format = format.replace(/XXXX/g, this.getDayName().substring(0, 3).toUpperCase());
	format = format.replace(/XXX/g, this.getDayName());
	format = format.replace(/XX/g, this.getMonthName().substring(0, 3).toUpperCase());
	format = format.replace(/X/g, this.getMonthName());
	
	return format;
}

Object.prototype.forEach = function (callback) {
	var keys = Object.keys(this);
	for (var i=0; i < keys.length; i++) {
		callback(this[keys[i]], keys[i], this);
	}
}

Array.prototype.forEach = function (callback) {
	for (var i=0; i < this.length; i++) {
		callback(this[i], i, this);
	}
}

Array.prototype.getAll = function (field, chasers) {
	var addChasers = function (target, origin) {
		for(var c=0; c < chasers.length; c++) {
			var field = chasers[c];
			var rename = field;
			if (field.split(':').length == 2) {
				field = field.split(':')[0];
				rename = rename.split(':')[1];
			}
			target[rename] = origin[field];
		}
	};
	
	var results = [];
	for (var i=0; i < this.length; i++) {
		var obj = this[i];
		var target = obj[field];
		if (Array.isArray(target)) {
			for(var j=0; j < target.length; j++) {
				addChasers(target[j], obj);
			}
			results = results.concat(target);
		} else {
			addChasers(target, obj);
			results.push(target);
		}
	}
	return results;
}

Array.prototype.where = function (criteria) {
	var results = [];
	for (var i=0; i < this.length; i++) {
		if (criteria(this[i])) results.push(this[i]);
	}
	return results;
};

Array.prototype.last = function (limit) {
	limit = limit || 1;
	if (this.length > limit) {
		return this.slice(this.length - (limit + 1));
	} else {
		return this.slice();
	}
};

Array.prototype.first = function (limit) {
	limit = limit || 1;
	if (this.length > limit) {
		return this.slice(0, limit - 1);
	} else {
		return this.slice();
	}
};

Array.prototype.query = function (where, fields) {
	var results = [];
	for (var i=0; i < this.length; i++) {
		var obj = this[i];
		var match = true;
		if (where !== true) {
			var keys = Object.keys(where);
			for (var k=0; k < keys.length; k++) {
				var key = keys[k];
				if (key == 'each') continue;
				match = match && obj[key] == where[key];
			}
		}
		if (match) {
			if (fields) {
				var copy = {};
				for(var f=0; f < fields.length; f++) {
					var field = fields[f]; 
					copy[field] = obj[field];
				}
				results.push(copy);
			} else {
				results.push(obj);
			}
		}
	}
	return results;
}

Array.prototype.getElementById = function (id) {
	var value = null;
	for (var i in this) {
		if (this[i].id == id) {
			value = this[i];
			break;
		}
	}
	return value;
}

var getLocalValue = function (key) {
	var value = window.localStorage.getItem(key);
	if (typeof value == 'undefined' || value == 'undefined') {
		window.localStorage.removeItem(key);
		value = null;
	}
	try {
		if (value) {
			value = JSON.parse(value);
		}
	} catch (e) { }

	return value;
};

var setLocalValue = function (key, value) {
	try {
		if (typeof value == 'undefined' || value == 'undefined') {
			return;
		}
		value = JSON.stringify(value);
	} catch (e) { }

	window.localStorage.setItem(key, value);
	};

var clearLocalValue = function (key) {
	window.localStorage.removeItem(key);
};
'use strict';

/**
 * This class provides API to perform manipulation of test file bars
 * such as appending, detaching, and sorting test file bars on Travis-reporter.
 */
define(function (require) {
	var testGenerator = require('fakeData');

	/**
	 * @private Private variables.
	 */

	const large_to_small = true;

	/**
	 * Deciding:
	 * type: current data sorting type.
	 * option: what option data will sort by.
	 */
	var sortConfigure = {
		"type": large_to_small,
		"option": null
	};

	var optionRegExp = {
		"id": "_id",
		"name": "fileName",
		"date": "date",
		"error": "errCount",
		"count": "displayCount"
	};

	/**
	 * The target DOM object to be manipulated, the contains of manipulations
	 * including such as appending and showing data, sorting data, and removing
	 * data from it.
	 */
	var target = null;

	/**
	 * Warning: this variable may be moved to another Javascript file in the future.
	 * The querying options.
	 */
	var options = {};

	/**
	 * @private This is a private function.
	 * Swap two DOM which are children of target DOM.
	 * @param {DOM} element01 The first DOM to be swaped.
	 * @param {DOM} element02 The second DOM to be swaped.
	 */
	function dataSwap(element01, element02) {
		$(element02).after($(element01).detach());
	}

	/**
	 * @constructor
	 * @param {DOM} target The target DOM which the test bar to be appended to.
	 */
	function Container (inputTarget) {
		target = inputTarget;
	}

	/**
	 * @public The following functions and variables are public.
	 */
	Container.prototype = {
		/**
		 * This is an init function to give Travis-reporter an initial view
		 * of test files.
		 */
		init: function() {
			this.setOptions('count', 10);
			this.clear();
			this.appendData(this.query());
		},
		
		/**
		 * Append data to Travis-reporter as a bar.
		 *
		 * @param {JSON} data The data to be appended to target DOM.
		 */
		appendData: function(data) {
			for(var i=0; i<data.length; i++) {
				var bar = '<tr id="info_bar_no' + data[i]['id'] + '" class="tb_info_bar">';
				var btDetail = '<button id="bt_detail_no' + data[i]['id'] + '" class="bt_detail">Detail</button>';

				for(var key in data[i]) {
					if(key != 'id') {
						bar = bar + '<td class="' + key + '">' + data[i][key] + '</td>';
					}
				}
			
				bar = bar + '<td class="tb_last">' + btDetail + '</td>';
				bar = bar + '</tr>';
			
				$(target).append(bar);
			}
		},
		
		/**
		 * Set the options for data querying.
		 *
		 * @param {String} name The name (key) of the restriction to be set.
		 * @param {String or Integer} value The content of certain restriction.
		 */
		setOptions: function(name, value) {
			if(name != null) {
				if(value != "null") {
					options[optionRegExp[name]] = value;
				}
				else {
					delete options[optionRegExp[name]];
				}
			}
			else {
				console.log('container.js function setRestriction() error.');
			}
		},

		getData: function(name, value) {
			var data = $('tr.tb_info_bar').children('td.' + name).find(':contains("' + value + '")');
			var columns = null;
			var result = [];

			for(var i=0; i<data.length; i++) {
				columns = $(data[i]).children();
				for(var j=0; j<columns.length; j++) {
					result[i][$(columns[j]).attr('class')] = $(columns[j]).text();
				}
			}

			return result;
		},

		/**
		 * Reset the options for data querying.
		 */
		resetOptions: function() {
			$.each(options, function (index, value) {
				delete options[index];
			});
		},

		/**
		 * Warning: This function may be moved to another Javascript file in the future.
		 * Querying data through restful API from back-end server with some options.
		 *
		 * @returns {JSON} A JSON contains the result from restful API.
		 */
		query: function() {
			var result = [],
				option;

			if(options.length != 0) {
				option = options;
			}
			else {
				option = {};
			}

			$.ajax({
				url: "/data",
				type: "GET",
				data: option,
				async: false,
				success: function (data) {
					var length = data.length,
						i = 0;

					for (i = 0; i < length; i++) {
						result[i] = new Array();
						result[i]["id"] = data[i][optionRegExp["id"]];
						result[i]["name"] = data[i][optionRegExp["name"]];
						result[i]["date"] = data[i][optionRegExp["date"]];
						result[i]["error"] = data[i][optionRegExp["error"]];
					}
				}
			});

			return result;
		},

		/**
		 * Set total count to be shown to the user.
		 * 
		 * @param {Integer} count The count to be set.
		 */
		setCount: function(count) {
			this.dataCount = count;
		},
		
		/**
		 * Sort data which are children of target DOM by specific option.
		 *
		 * @param {String} option Data will sorted by this argument.
		 * @return {Boolean} True for sorting data from large to small, false otherwise.
		 */
		sort: function(option) {
			//Here starts the sorting.
			var hasChange = true,
				data = $('.tb_info_bar'),
				value01,
				value02,
				isDigit = $.isNumeric($('.tb_info_bar').children('.' + option).text());

			if(option == null && sortConfigure['option'] == null) {
				console.log('container.js function sort() error.');
			}
			else {
				//Configuring the sorting type and option.
				if(sortConfigure['option'] == option) {
					sortConfigure['type'] = !sortConfigure['type'];
				}
				else {
					sortConfigure['option'] = option;
					sortConfigure['type'] = large_to_small;
				}
		
				while(hasChange) {
					hasChange = false;
					for(var i=0; i<data.length-1; i++) {
						value01 = $(data[i]).children('.' + option).text();
						value02 = $(data[i+1]).children('.' + option).text();
				
						if(isDigit) {
							value01 = parseInt(value01);
							value02 = parseInt(value02);
						}
						
						if(sortConfigure['type'] == large_to_small) {
							if(value01 < value02) {
								dataSwap(data[i], data[i+1]);
								hasChange = true;
							}
						}
						else {
							if(value01 > value02) {
								dataSwap(data[i], data[i+1]);
								hasChange = true;
							}
						}

						var temp = data[i];
						data[i] = data[i+1];
						data[i+1] = temp;
					}
				}
			}

			return sortConfigure['type'];
		},
		
		/**
		 * Swap two DOM which are children of target DOM.
		 * @param {DOM} element01 The first DOM to be swaped.
		 * @param {DOM} element02 The second DOM to be swaped.
		 */
		dataSwap: function (element01, element02) {
			$(element02).after($(element01).detach());
		},

		/**
		 * Clear all data appended to target.
		 */
		clear: function() {
			$('.tb_info_bar').detach();
		}
	};

	return Container;
});
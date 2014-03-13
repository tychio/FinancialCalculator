'use strict';

window.UtilizationCalculator = (function ($, undefined) {
	var $timeSheet = $('#timeSheet');
	var $teamList = $('#teamList');
	var $workDays = $('#workDays');
	var $hoursDaily = $('#hoursDaily');

	function calculate (target) {
		$('#currentType').text(target);
		var teamList = getTeamList(parseExcel($teamList.val()));
		var filter = $.noop;
		if (target.match(/^(TCC|TBS|TCX)$/)) {
			filter = function (co, id) {
				var inAnyTeam = false;
				$.each(teamList, function (name, team) {
					if (team[id]) { inAnyTeam = true; }
				});
				return co === target && !inAnyTeam;
			};
		} else if (typeof teamList[target] === 'object') {
			filter = function (co, id) {
				return teamList[target][id];
			};
		} else if (target.match(/^(TCC|TBS|TCX)(_ALL)$/)){
			filter = function (co) {
				return co === target.match(/^(TCC|TBS|TCX)/)[0];
			};
		}

		var timeSheet = getTimeSheet(parseExcel($timeSheet.val()), filter);
		showResult(timeSheet, teamList);
	}

	function parseExcel(excelString) {
		var excelArray = [];

		excelString.split(/\r\n|\r|\n/g).forEach(function (excelLine) {
			excelLine = excelLine.split(/\t/g);
			if (excelLine.length > 1) {// reject invaild line
				excelArray.push(excelLine);
			}
		});

		return excelArray;
	}

	function getTeamList(excelString) {
		var teamList = {};
		if (excelString.length <= 0) {
			return teamList;
		}

		var teamNameArray = excelString.shift();
		var teamIndex = 0;

		teamNameArray.forEach(function (title, index) {
			if (index % 2 === 0) {
				teamList[title] = {};
			}
		});

		function getTeamId (id) {
			var idVal = id[teamIndex*2+1] - 0;
			if (idVal > 0) {
				teamList[team][idVal] = true;
			}
		}

		for (var team in teamList) {
			excelString.forEach(getTeamId);
			teamIndex++;
		}

		return teamList;
	}

	function getTimeSheet(excelString, filter) {
		var chinaTimeSheet = [];
		function _timeSheetIndex (targetKey) {
			var targetIndex = 0;
			excelString[1].forEach(function (key, index) {
				if (targetKey === key) {
					targetIndex = index;
				}
			});
			return targetIndex;
		}

		excelString.forEach(function (item) {
			var itemObj = {
				'co': item[_timeSheetIndex('Co')],
				'psid': item[_timeSheetIndex('PSID')],
				'hours': item[_timeSheetIndex('Client Nonbillable Hours')]
			};
			if (filter(itemObj.co, itemObj.psid)) {
				chinaTimeSheet.push(itemObj);
			}
		});

		return chinaTimeSheet;
	}

	function showResult(list) {
		var hours = 0;
		var ps = {};
		var count = 0;
		function _percent(rate) {
			return ((rate||0)*100).toFixed(2) + '%';
		}

		list.forEach(function (item) {
			hours += item.hours - 0;
			if (!ps[item.psid]) {
				ps[item.psid] = true;
				count++;
			}
		});

		var utilization = _percent(hours / ($hoursDaily.val() * count * $workDays.val()));
		$('#op_utilization').val(utilization);
		$('#op_hours').val(hours);
		$('#op_count').val(count);
	}

	return calculate;
})(jQuery);
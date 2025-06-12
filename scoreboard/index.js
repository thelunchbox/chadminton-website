// -------------------------------------------------------------------------- youtube api

// Array.prototype.shuffle = function () {
// 	var i = this.length, j, temp;
// 	if (i == 0) return this;
// 	while (--i) {
// 		j = Math.floor(Math.random() * (i + 1));
// 		temp = this[i];
// 		this[i] = this[j];
// 		this[j] = temp;
// 	}
// 	return this;
// }

// var ytReady = false;
// var commercials = [
// 	'B4PNk7Y4XSE', // sonic
// 	'E03D1PS3ypk', // pacific life
// 	'aZo4yKpROL0', // kfc
// 	'F1WOtKbIPJA', // arby's
// 	'6FcFUINjjAk', // oreo
// 	'VNw8SJ1nIHc', // skyline
// 	'ZUDkrkykvZs', // nintendo switch
// 	'D692JJPPUe4', // VW mr. roboto
// 	'3tSiE6bTnxE', // captain morgan
// 	'QkMUZ1U1Ye8', // huntington
// 	'7LQpRQh2KSQ'  // quiznos
// ];

// commercials.shuffle();

// function onYouTubePlayerAPIReady() {
// 	ytReady = true;
// }

// var adWait = false;
// var nextCommercial = 0;
// var playNextCommercial = function (callback) {
// 	adWait = true;

// 	var c = document.getElementById('commercial');
// 	c.innerHTML = '<div id="commercial-inner">LOADING ADVERTISEMENT</div>';
// 	c.style.display = 'block';
// 	var video = commercials[nextCommercial];

// 	var player = new YT.Player('commercial-inner', {
// 		height: '390',
// 		width: '640',
// 		videoId: video,
// 		events: {
// 			onReady: function (event) {
// 				event.target.playVideo();
// 			},
// 			onStateChange: function (event) {
// 				if (event.data === 0) {
// 					var c = document.getElementById('commercial');
// 					c.innerHTML = '';
// 					c.style.display = 'none';
// 					adWait = false;
// 					if (callback) callback();
// 					nextCommercial = (nextCommercial + 1) % commercials.length;
// 				}
// 			}
// 		}
// 	});
// }

// -------------------------------------------------------------------------- utility functions

async function getJsonfile(filename) {
  const response = await fetch(filename);
  if (!response.ok) {
    console.error(response.status);
    console.error(response.statusText);
    throw new Error(response);
  }
  const json = await response.json();
  return json;
}

function getLocalValue(key) {
  let value = window.localStorage.getItem(key);
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

function setLocalValue(key, value) {
  try {
    if (typeof value == 'undefined' || value == 'undefined') {
      return;
    }
    value = JSON.stringify(value);
  } catch (e) {
    console.error(e);
  }

  window.localStorage.setItem(key, value);
};

function clearLocalValue(key) {
  window.localStorage.removeItem(key);
};

// -------------------------------------------------------------------------- scoreboard operation

let play, last, time, settings, teams;
let mirror;

window.onbeforeunload = function () {
  setLocalValue('settings', {
    ...settings, 
    teams,
  });
};

const MINUTES = 60 * 1000;
const SECONDS = 1000;

const defaultTeams = {
  left: {
    name: 'Team A',
    score: 0,
    timeouts: 2,
    color: '#f12',
    text: '#fff',
  },
  right: {
    name: 'Team B',
    score: 0,
    timeouts: 2,
    color: '#21f',
    text: '#fff',
  },
};

function setup() {
  const savedSettings = getLocalValue('settings') || {};
  settings = {
    periodLength: 20 * MINUTES,
    totalPeriods: 2,
    intermissionLength: 5 * MINUTES,
    ...savedSettings,
  };
  play = false;
  period = 1;
  time = settings.periodLength;

  teams = settings.teams || { ...defaultTeams };

  teams.left.score = 0;
  teams.left.timeouts = 2;
  teams.right.score = 0;
  teams.right.timeouts = 2;

  displayTime();
  updateScoreboard();

  window.addEventListener('message', (event) => {
    // event.origin
    if (origin !== window.origin) return;
    // event.data
    const { method, params } = event.data;
    switch (method) {
      case 'setClockDisplay':
        setClockDisplay(...params);
        break;
      case 'setPeriodMessage':
        setPeriodMessage(...params);
        break;
      case 'setTeams':
        teams = params[0];
        break;
      case 'updateScoreboard':
        updateScoreboard(...params);
        break;
    }
  });
};

function toggleClock(override = null) {
  play = override != null ? override : !play;
  last = play ? new Date() : null;
};

function timeout(team) {
  if (teams[team].timeouts > 0) {
    teams[team].timeouts -= 1;
    if (play) toggleClock();
    showInfo('TIMEOUT', { color: teams[team].color, text: teams[team].text }, { resume: true });
  }
};

function formatTime(time) {
  let display = ['', '', ''];
  const min = Math.floor(time / MINUTES);
  const sec = Math.floor((time % MINUTES) / SECONDS);
  const tenths = Math.floor((time % SECONDS) / 100);
  if (min == 0) {
    display = [sec.toString(), '.', tenths];
  } else {
    display = [min.toString(), ':', sec.toString().padStart(2, '0')];
  }
  return display;
}

function parseTime(text) {
  let value = time;
  try {
    if (text.includes('.')) {
      const [sec, tenths] = text.split('.').map(x => parseInt(x));
      value = (sec * SECONDS) + (tenths * SECONDS / 10);
    } else if (text.includes(':')) {
      const [min, sec] = text.split(':').map(x => parseInt(x));
      value = (min * MINUTES) + (sec * SECONDS);
    } else {
      value = parseInt(text) * MINUTES
    }
    if (isNaN(value)) throw Error(`${text} is not a valid time format`);
  } catch (ex) {
    console.error(ex);
  }
  return value;
}

function displayTime() {
  let display = ['', '', ''];
  if (period <= settings.totalPeriods) {
    if (play) {
      const now = new Date();
      const difference = now.getTime() - last.getTime();
      last = now;
      time -= difference;

      if (time <= 0) {
        time = 0;
        // document.getElementById('buzzer-sound').play();
        play = false;
        clockStateChange();
      }
    }
    display = formatTime(time);
  }
  const clockEdit = document.querySelector('#clock-edit');
  if (play || clockEdit.value == '') {    
    clockEdit.value = display.join('');
    clockEdit.setAttribute('disabled', 'disabled');
  }
  else clockEdit.removeAttribute('disabled');

  setClockDisplay(display);
  if (mirror) {
    mirror.postMessage({
      method: 'setClockDisplay',
      params: [display]
    }, window.origin);
  }

  window.requestAnimationFrame(displayTime);
};

function setClockDisplay(display) {
  const clock = document.querySelector('#middle .clock');
  if (display[1] === '.') {
    clock.classList.add('seconds');
  } else {
    clock.classList.remove('seconds');
  }

  clock.querySelector('.high').innerHTML = display[0];
  clock.querySelector('.separator').innerHTML = display[1];
  if (display[0] >= 20) {
    clock.querySelector('.separator').style.opacity = '0';
  } else {
    clock.querySelector('.separator').style.opacity = '1';
  }
  clock.querySelector('.low').innerHTML = display[2];

  if (play) {
    clock.classList.remove('stopped');
  } else {
    clock.classList.add('stopped');
  }
}

let resumeOnInfoClose = null;
function showInfo(msg, style, { resume = false } = {}) {
  resumeOnInfoClose = resume;
  style = style || { color: '#000', text: '#fff' };
  var showMe = function () {
    var info = document.getElementById('info');
    info.innerHTML = msg;
    info.style.fontSize = (1200 / msg.length) + 'pt';
    info.style.color = style.text;
    info.style.background = style.color;
  };
};

function closeInfo() {
  if (resumeOnInfoClose) {
    resumeOnInfoClose = null;
    toggleClock();
  }
};

function clockStateChange(override = null) {
  toggleClock(false);
  if (override != null) {
    period = override;
  } else if (period >= settings.totalPeriods) {
      period += 1;
  } else {
    // we always add a half a period here
    period += 0.5;
    const displayPeriod = Math.floor(period);
    if (period == displayPeriod) {
      time = settings.periodLength;
    } else if (displayPeriod < settings.totalPeriods) {
      time = settings.intermissionLength;
      // start the clock for the intermission break
      // (after a small delay)
      setTimeout(() => toggleClock(true), 3 * SECONDS);
    }
  }
  document.querySelector('#period-edit').value = period;
  setPeriodMessage();
}

function setPeriodMessage(message = null) {
  // set period message
  let periodMessage = '';
  if (period > settings.totalPeriods) {
    if (teams.left.score === teams.right.score) {
      periodMessage = 'OVERTIME';
    } else {
      periodMessage = 'GAME OVER';
    }
  } else {
    const displayPeriod = Math.floor(period);
    if (period == displayPeriod) {
      // if this is true, we're actually inside a period of play
      periodMessage = `Period ${displayPeriod}`;
    } else if (displayPeriod < settings.totalPeriods) {
      // otherwise we're either in an intermission or pregame
      periodMessage = `INTERMISSION ${displayPeriod}`;
    }
  }
  document.querySelector('#middle .period').innerHTML = periodMessage;
  if (mirror) {
    mirror.postMessage({
      method: 'setPeriodMessage',
      params: [periodMessage]
    }, window.origin);
  }
};

async function loadAds() {
  const advertisements = await getJsonfile('advertisements.json');
  let currentAd = 0;
  const changeAd = () => {
    const ad = advertisements[currentAd];
    // const adBox = document.getElementById('ad');
    // adBox.onclick = function () {
    // 	window.open(ad.href);
    // };
    // const image = ad.images[Math.floor(Math.random() * ad.images.length)];
    // adBox.style.backgroundImage = 'url(\'' + image + '\')';
    // adBox.innerHTML = '<div class="pad" style="font-family: ' + ad.font + ';">' +
    // 	ad.name +
    // 	'</div>';
    currentAd = (currentAd + 1) % advertisements.length;
  };
  window.setInterval(changeAd, (30000)); // change ad every 30 seconds
  changeAd();
}

function ready() {
  setup();
  // loadAds();
};

function refresh() {
  clearLocalValue('settings');
  setup();
};

function checkKey(event) {
  let handled = true;
  switch (event.keyCode) {
    case 32: // space
      toggleClock();
      break;
    default: // in this case pass the event on
      handled = false;
      break;
  }
  if (handled) {
    event.stopPropagation();
    event.preventDefault();
  }
};

function showSettings() {
  document.querySelector('#period-length').value = formatTime(settings.periodLength).join('');
  document.querySelector('#intermission-length').value = formatTime(settings.intermissionLength).join('');
  document.querySelector('#total-periods').value = settings.totalPeriods;

  document.querySelector('#left-team-name').value = teams.left.name;
  document.querySelector('#left-team-color').value = teams.left.color;
  document.querySelector('#left-team-text').value = teams.left.text;

  document.querySelector('#right-team-name').value = teams.right.name;
  document.querySelector('#right-team-color').value = teams.right.color;
  document.querySelector('#right-team-text').value = teams.right.text;

  document.querySelector('.settings-form').style.display = 'block';
}

function closeSettings() {
  settings.periodLength = parseTime(document.querySelector('#period-length').value);
  settings.intermissionLength = parseTime(document.querySelector('#intermission-length').value);
  settings.totalPeriods = parseInt(document.querySelector('#total-periods').value);

  teams.left.name = document.querySelector('#left-team-name').value;
  teams.left.color = document.querySelector('#left-team-color').value;
  teams.left.text = document.querySelector('#left-team-text').value;

  teams.right.name = document.querySelector('#right-team-name').value;
  teams.right.color = document.querySelector('#right-team-color').value;
  teams.right.text = document.querySelector('#right-team-text').value;

  updateScoreboard();

  document.querySelector('.settings-form').style.display = 'none';
}

function showControls() {
  document.querySelector('#left-score').value = teams.left.score;
  document.querySelector('#left-timeouts').value = teams.left.timeouts;
  document.querySelector('#right-score').value = teams.right.score;
  document.querySelector('#right-timeouts').value = teams.right.timeouts;

  document.querySelector('#period-edit').value = period;

  document.querySelector('.controls-form').style.display = 'flex';
}

function hideControls() {
  document.querySelector('.controls-form').style.display = 'none';
}

function edit(event, property) {
  const { target } = event;
  const { value } = target;

  switch (property) {
    case 'time':
      time = parseTime(value);
      break;
    case 'period':
      clockStateChange(parseFloat(value));
      break;
    case 'left.score':
      teams.left.score = parseInt(value);
      break;
    case 'left.timeouts':
      teams.left.timeouts = parseInt(value);
      break;
    case 'right.score':
      teams.right.score = parseInt(value);
      break;
    case 'right.timeouts':
      teams.right.timeouts = parseInt(value);
      break;
  }
  updateScoreboard();
}

function updateScoreboard() {
  const teamPairs = [
    [document.querySelector('#left'), teams.left],
    [document.querySelector('#right'), teams.right],
  ];
  teamPairs.forEach(([element, team]) => {
    element.querySelector('.name').innerHTML = team.name;
    element.querySelector('.score').innerHTML = team.score;
    element.querySelector('.timeouts').innerHTML = new Array(team.timeouts).fill('.').join(' ');
    element.style.background = team.color;
    element.style.color = team.text;
  });
  if (mirror) {
    mirror.postMessage({
      method: 'setTeams',
      params: [teams]
    }, window.origin);
    mirror.postMessage({
      method: 'updateScoreboard',
      params: []
    }, window.origin);
  }
}

function addGoal(teamId) {
  teams[teamId].score += 1;
  updateScoreboard();
}

function openMirror() {
  if (!mirror) {
    const tempMirror = window.open('./display.html', '_blank', "location=no menubar=yes status=no toolbar=no");
    setTimeout(() => {
      mirror = tempMirror;
    }, 1000);
  }
}
// Ch3 multi-player page: cards are shuffled and numbered on load, shown via
// ?slug=true parameters, and each card has its own audio element.
(function () {
  'use strict';

  var row = document.getElementById('ch3-row');
  var params = new URLSearchParams(location.search);
  var snumShow = 0;

  function cardSlug(col) {
    return col.querySelector('.station-card').id;
  }

  // ---- shuffle the cards and number them 1..N; "+" reveals them in this order
  var cols = Array.prototype.slice.call(row.children);
  for (var i = cols.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = cols[i];
    cols[i] = cols[j];
    cols[j] = tmp;
  }
  cols.forEach(function (col, index) {
    col.id = String(index + 1);
    row.appendChild(col);
  });

  // ---- show the cards named in the query string (?nts=true&wmfu=true)
  cols.forEach(function (col) {
    var value = params.get(cardSlug(col));
    var show = value === 'true' || value === '1';
    col.classList.toggle('d-block', show);
    col.classList.toggle('d-none', !show);
  });

  // ---- link sharing
  function showLink() {
    var input = document.getElementById('input-link');
    var button = document.getElementById('btn-link');
    if (input.classList.contains('d-none')) {
      input.classList.remove('d-none');
      input.value = createLink();
      button.textContent = 'Hide link';
    } else {
      hideLink();
    }
  }

  function hideLink() {
    document.getElementById('input-link').classList.add('d-none');
    document.getElementById('btn-link').textContent = 'Show link';
  }

  function createLink() {
    var url = new URL(location.href);
    url.search = '';
    url.hash = '';
    row.querySelectorAll('.col.d-block').forEach(function (col) {
      url.searchParams.set(cardSlug(col), 'true');
    });
    return url.toString();
  }

  // ---- card management
  function getStationNum(stationID) {
    return document.getElementById(stationID).parentNode.id;
  }

  function switchStationCards(toStation, fromStation) {
    var toCol = document.getElementById(getStationNum(toStation));
    var fromCol = document.getElementById(getStationNum(fromStation));
    var toHTML = toCol.innerHTML;
    toCol.innerHTML = fromCol.innerHTML;
    fromCol.innerHTML = toHTML;
  }

  function clearStations() {
    hideLink();
    pauseAll();
    var shown = Array.prototype.slice.call(document.getElementsByClassName('col themed-grid-col d-block'));
    shown.forEach(function (col) {
      col.classList.add('d-none');
      col.classList.remove('d-block');
    });
  }

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
  }

  function showRandomStations(n) {
    hideLink();
    clearStations();
    var count = row.getElementsByClassName('themed-grid-col').length;
    var randomNumbers = [];
    for (var k = 0; k < n; k++) {
      randomNumbers.push(getRandomInt(1, count - 1));
    }
    while (randomNumbers.length > 1 && randomNumbers[0] === randomNumbers[1]) {
      randomNumbers[1] = getRandomInt(1, count - 1);
    }
    randomNumbers.forEach(function (num) {
      var col = document.getElementById(String(num));
      col.classList.remove('d-none');
      col.classList.add('d-block');
    });
  }

  function playAll() {
    document.querySelectorAll('.col.d-block').forEach(function (col) {
      var play = col.getElementsByClassName('btn-play')[0];
      if (play) play.click();
    });
  }

  function pauseAll() {
    document.querySelectorAll('audio').forEach(function (audio) {
      if (!audio.paused) audio.pause();
    });
  }

  function addStation() {
    hideLink();
    snumShow++;
    var toShow = document.getElementById(String(snumShow));
    if (!toShow) return;
    toShow.classList.remove('d-none');
    toShow.classList.add('d-block');
  }

  function deleteStation(snum) {
    hideLink();
    var numRemove = snum;
    if (snum == null) {
      var shown = document.getElementsByClassName('col d-block');
      if (shown.length === 0) return;
      numRemove = shown[shown.length - 1].id;
    }
    var toRemove = document.getElementById(String(numRemove));
    toRemove.classList.add('d-none');
    toRemove.classList.remove('d-block');
    var stationPlayer = toRemove.getElementsByTagName('audio')[0];
    if (stationPlayer && !stationPlayer.paused) stationPlayer.pause();
    if (snumShow > 1) snumShow--;
  }

  function loadStream(stationName, streamUrl, streamID) {
    var player = document.getElementById('audio-' + streamID);
    var source = document.getElementById('audio-source-' + streamID);
    source.src = streamUrl;
    player.load();
    player.play();
  }

  // ---- delegated handlers for the per-card controls
  document.addEventListener('click', function (event) {
    var play = event.target.closest('.play-btn');
    if (play) {
      loadStream(play.dataset.title, play.dataset.url, play.dataset.slug);
      return;
    }
    var remove = event.target.closest('.btn-remove');
    if (remove) deleteStation(remove.closest('.themed-grid-col').id);
  });

  document.addEventListener('change', function (event) {
    var select = event.target.closest('.stationselect-ch3');
    if (!select || !document.getElementById(select.value)) return;
    switchStationCards(select.closest('.station-card').id, select.value);
  });

  // header buttons use inline onclick handlers
  window.showLink = showLink;
  window.hideLink = hideLink;
  window.addStation = addStation;
  window.deleteStation = deleteStation;
  window.playAll = playAll;
  window.pauseAll = pauseAll;
  window.clearStations = clearStations;
  window.showRandomStations = showRandomStations;

  // ---- live status for the on-air dots
  applyStreamStatus(null);
  loadStreamStatus(function (map) { applyStreamStatus(map); });
})();

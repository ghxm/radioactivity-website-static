// radioactivity.directory main page: view and filter parameters, audio player,
// jump dropdown, chat card and the optional Song ID button.
(function () {
  'use strict';

  var params = new URLSearchParams(location.search);
  var listView = params.get('display') === 'list';
  var onair = params.get('onair') === 'true';
  var random = params.get('random') === 'true';

  // ---- views: keep only the selected one so element ids stay unique
  var gridView = document.getElementById('grid-view');
  var listViewEl = document.getElementById('list-view');
  if (listView) {
    gridView.remove();
    listViewEl.classList.remove('d-none');
  } else {
    listViewEl.remove();
  }

  // ---- header links keep the other parameters; "random" is dropped so toggles do not re-roll
  function hrefWith(mutate) {
    var query = new URLSearchParams(location.search);
    query.delete('random');
    mutate(query);
    var s = query.toString();
    return location.pathname + (s ? '?' + s : '');
  }

  var btnRandom = document.getElementById('btn-random');
  var btnLive = document.getElementById('btn-live');
  var btnView = document.getElementById('btn-view');

  btnRandom.href = hrefWith(function (q) { q.set('random', 'true'); });

  if (onair) {
    btnLive.href = hrefWith(function (q) { q.delete('onair'); });
    btnLive.title = 'Show all stations';
    btnLive.innerHTML = '<span class="dot-air offline me-0 me-sm-1"></span><span class="d-none d-xl-inline-block">ALL</span>';
  } else {
    btnLive.href = hrefWith(function (q) { q.set('onair', 'true'); });
  }

  if (listView) {
    btnView.href = hrefWith(function (q) { q.delete('display'); });
    btnView.title = 'View as grid';
    btnView.innerHTML = '<i class="bi bi-grid-3x3"></i>';
  } else {
    btnView.href = hrefWith(function (q) { q.set('display', 'list'); });
  }

  // ---- chat card (grid view only): shown once JS runs, chat loads on demand
  var chatCard = document.getElementById('chat-card');
  if (chatCard) chatCard.classList.remove('d-none');

  window.loadChat = function () {
    document.getElementById('btn-load-chat').classList.add('d-none');
    document.getElementById('btn-open-chat').classList.add('d-none');
    document.getElementById('chatangoscript').classList.remove('d-none');
  };

  // ---- jump dropdown
  document.getElementById('stationselect').onchange = function () {
    var target = document.getElementById(listView ? 'list-' + this.value : this.value);
    if (!target) return;
    window.location.hash = target.id;
    target.classList.add('animate-blue-pulse-quick');
  };

  // ---- audio player
  var ICON_PLAY = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-play-fill" viewBox="0 0 16 16">' +
    '<path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg>';
  var ICON_STOP = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-stop-fill" viewBox="0 0 16 16">' +
    '<path d="M5 3.5h6A1.5 1.5 0 0 1 12.5 5v6a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 11V5A1.5 1.5 0 0 1 5 3.5z"/></svg>';
  var ICON_VOL_DOWN = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-volume-down-fill" viewBox="0 0 16 16">' +
    '<path d="M9 4a.5.5 0 0 0-.812-.39L5.825 5.5H3.5A.5.5 0 0 0 3 6v4a.5.5 0 0 0 .5.5h2.325l2.363 1.89A.5.5 0 0 0 9 12V4zm3.025 4a4.486 4.486 0 0 1-1.318 3.182L10 10.475A3.489 3.489 0 0 0 11.025 8 3.49 3.49 0 0 0 10 5.525l.707-.707A4.486 4.486 0 0 1 12.025 8z"/></svg>';
  var ICON_VOL_UP = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-volume-up-fill" viewBox="0 0 16 16">' +
    '<path d="M11.536 14.01A8.473 8.473 0 0 0 14.026 8a8.473 8.473 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z"/>' +
    '<path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89l.706.706z"/>' +
    '<path d="M8.707 11.182A4.486 4.486 0 0 0 10.025 8a4.486 4.486 0 0 0-1.318-3.182L8 5.525A3.489 3.489 0 0 1 9.025 8 3.49 3.49 0 0 1 8 10.475l.707.707zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z"/></svg>';

  var streamDiv = document.getElementById('stream');
  streamDiv.innerHTML += '<div class="btn-group w-100" role="group">' +
    '<button class="btn btn-outline-dark fw-bold" id="btn-play">' + ICON_PLAY + '</button>' +
    '<button class="btn btn-outline-dark fw-bold" id="btn-vol-down">' + ICON_VOL_DOWN + '</button>' +
    '<button class="btn btn-outline-dark fw-bold" id="btn-vol-up">' + ICON_VOL_UP + '</button>' +
    '</div>';

  var audio = streamDiv.getElementsByTagName('audio')[0];
  audio.classList.add('d-none');

  var playBtn = document.getElementById('btn-play');
  var btnVolUp = document.getElementById('btn-vol-up');
  var btnVolDown = document.getElementById('btn-vol-down');
  var originalTitle = document.title;

  if (audio.src === '') playBtn.disabled = true;

  function showPlayButton() { playBtn.innerHTML = ICON_PLAY; }
  audio.addEventListener('pause', showPlayButton);
  audio.addEventListener('error', showPlayButton);
  audio.addEventListener('play', function () { playBtn.innerHTML = ICON_STOP; });

  function setMediaSessionState(state) {
    try { navigator.mediaSession.playbackState = state; } catch (e) { /* unsupported */ }
  }

  function playPause() {
    if (audio.volume < 0.1) {
      btnVolDown.disabled = true;
    } else if (audio.volume > 0.9) {
      btnVolUp.disabled = true;
    } else {
      btnVolUp.disabled = false;
      btnVolDown.disabled = false;
    }
    playBtn.disabled = false;

    if (audio.paused) {
      audio.load();
      var playing = audio.play();
      // autoplay without a user gesture is rejected by the browser; the play icon stays
      if (playing && playing.catch) playing.catch(function () {});
      setMediaSessionState('playing');
    } else {
      audio.pause();
      setMediaSessionState('paused');
    }
  }

  function volumeDown(val) {
    audio.volume -= val;
    if (audio.volume < 0.1) {
      btnVolDown.disabled = true;
      btnVolUp.disabled = false;
    } else {
      btnVolUp.disabled = false;
    }
  }

  function volumeUp(val) {
    audio.volume += val;
    if (audio.volume >= 0.9) {
      btnVolUp.disabled = true;
      btnVolDown.disabled = false;
    } else {
      btnVolDown.disabled = false;
    }
  }

  playBtn.addEventListener('click', playPause);
  btnVolDown.addEventListener('click', function () { volumeDown(0.1); });
  btnVolUp.addEventListener('click', function () { volumeUp(0.1); });

  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', playPause);
    navigator.mediaSession.setActionHandler('pause', playPause);
  }

  function updateMediaSession(stationName) {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'Live',
      artist: stationName,
      album: 'Radio',
      artwork: [{ src: '', sizes: '526x626', type: 'image/jpg' }]
    });
  }

  function loadStream(stationName, streamUrl, stationID) {
    var player = document.getElementById('audio-player');
    var source = document.getElementById('audio-source');
    var stationselector = document.getElementById('stationselect');

    player.title = stationName;
    source.src = streamUrl;
    stationselector.value = stationID;

    // mark the playing station in the dropdown
    stationselector.querySelectorAll('option').forEach(function (option) {
      option.textContent = option.textContent.replace(/^▶ /, '');
    });
    var selected = stationselector.querySelector('option[value="' + stationID + '"]');
    if (selected) selected.textContent = '▶ ' + stationName;

    document.title = originalTitle + ' (' + stationName + ')';

    activateSongIdButton();

    player.load();
    playPause();

    updateMediaSession(stationName);
  }

  document.addEventListener('click', function (event) {
    var btn = event.target.closest('.play-btn');
    if (btn) loadStream(btn.dataset.title, btn.dataset.url, btn.dataset.slug);
  });

  // ---- Song ID (only when a Song ID API URL was configured at build time)
  var songIdUrl = document.body.dataset.songIdUrl;
  var activateSongIdButton = function () {};

  if (songIdUrl) {
    var nowPlayingBtns = document.getElementById('now-playing');
    var shazamBtn = document.createElement('button');
    shazamBtn.setAttribute('class', 'd-inline-block btn btn-outline-dark text-truncate');
    shazamBtn.setAttribute('id', 'shazam-button');
    shazamBtn.innerHTML = '<i class="bi bi-shazam"></i> <span class="small">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-music-fill" viewBox="0 0 16 16">' +
      '<path d="M12 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm-.5 4.11v1.8l-2.5.5v5.09c0 .495-.301.883-.662 1.123C7.974 12.866 7.499 13 7 13c-.5 0-.974-.134-1.338-.377-.36-.24-.662-.628-.662-1.123s.301-.883.662-1.123C6.026 10.134 6.501 10 7 10c.356 0 .7.068 1 .196V4.41a1 1 0 0 1 .804-.98l1.5-.3a1 1 0 0 1 1.196.98z"/></svg> ID</span>';
    shazamBtn.disabled = true;
    shazamBtn.addEventListener('click', function () { shazamUrl(); });
    nowPlayingBtns.appendChild(shazamBtn);

    activateSongIdButton = function () { shazamBtn.disabled = false; };

    var parseShazapiResponse = function (resp) {
      var response = { time: resp.timestamp, artist: '', title: '' };
      try {
        response.artist = resp.shazam.track.subtitle;
        response.title = resp.shazam.track.title;
      } catch (error) { /* no track in response */ }
      response.displayTrack = (response.artist || response.title)
        ? response.artist + ' - ' + response.title
        : 'No ID found';
      return response;
    };

    var shazamUrl = function () {
      var currentStreamUrl = document.getElementById('audio-source').src;

      openShazamBox();
      document.getElementById('shazam-loading').classList.remove('d-none');
      document.getElementById('shazam-info').classList.add('d-none');

      var xhr = new XMLHttpRequest();
      xhr.open('POST', songIdUrl, true);
      xhr.send(JSON.stringify({
        url: currentStreamUrl,
        history: 5,
        requester: 'radioactivity.directory',
        exclude_not_found: true
      }));

      xhr.onload = function () {
        if (xhr.status === 200) {
          var data = JSON.parse(xhr.response);
          var current = parseShazapiResponse(data);
          document.getElementById('shazam-current-time').textContent = current.time;
          document.getElementById('shazam-current-id').textContent = current.displayTrack;

          var shazamPrevious = document.getElementById('shazam-previous');
          (data.history || []).forEach(function (element) {
            var historyItem = parseShazapiResponse(element);
            var dt = document.createElement('dt');
            dt.className = 'fw-normal';
            dt.textContent = historyItem.displayTrack;
            var dd = document.createElement('dd');
            dd.className = 'fst-italic';
            dd.textContent = historyItem.time;
            shazamPrevious.appendChild(dt);
            shazamPrevious.appendChild(dd);
          });
        } else {
          showShazamError();
        }
        document.getElementById('shazam-loading').classList.add('d-none');
        document.getElementById('shazam-info').classList.remove('d-none');
      };

      // network or CORS failure: onload never fires, so report it here
      xhr.onerror = function () {
        showShazamError();
        document.getElementById('shazam-loading').classList.add('d-none');
        document.getElementById('shazam-info').classList.remove('d-none');
      };
    };

    var showShazamError = function () {
      document.getElementById('shazam-current-time').textContent = 'Error';
      document.getElementById('shazam-current-id').textContent = 'Error';
    };

    var openShazamBox = function () {
      var shazamBox = document.getElementById('shazam-row');
      if (!shazamBox.classList.contains('d-none')) closeShazamBox();
      shazamBox.classList.remove('d-none');
      shazamBox.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    };

    var closeShazamBox = function () {
      var shazamBox = document.getElementById('shazam-row');
      document.getElementById('shazam-previous').innerHTML = '';
      document.getElementById('shazam-current-time').textContent = '';
      document.getElementById('shazam-current-id').textContent = '';
      shazamBox.classList.add('d-none');
    };

    window.closeShazamBox = closeShazamBox;
  }

  // ---- remove focus from buttons and button-like links after clicking
  document.querySelectorAll('button, a.btn').forEach(function (el) {
    el.setAttribute('onfocus', 'this.blur()');
  });

  // ---- stream status, LIVE filter and random station
  function applyFilter() {
    if (!(onair || random)) return;
    document.querySelectorAll('[data-station]').forEach(function (el) {
      el.classList.toggle('d-none', el.dataset.online !== 'true');
    });
  }

  function playRandom() {
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-station]:not(.d-none)'));
    if (!cards.length) return;
    var card = cards[Math.floor(Math.random() * cards.length)];
    var buttons = card.querySelectorAll('.play-btn');
    if (!buttons.length) return;
    var btn = buttons[Math.floor(Math.random() * buttons.length)];
    loadStream(btn.dataset.title, btn.dataset.url, btn.dataset.slug);
    card.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
  }

  applyStreamStatus(null);
  applyFilter();
  loadStreamStatus(function (map) {
    applyStreamStatus(map);
    applyFilter();
    if (random) playRandom();
  });
})();

// Runtime stream status, fetched from the status API configured at build time
// (data-status-url on <body>). Expected JSON: {"streams": {"<stream url>": "online" | "offline"}}.
(function () {
  'use strict';

  // Update the on-air dots from a {url: status} map, then recompute each
  // station's data-online flag from its first stream.
  function applyStreamStatus(map) {
    if (map) {
      document.querySelectorAll('.play-btn').forEach(function (btn) {
        var status = map[btn.dataset.url];
        if (status && typeof status === 'object') status = status.status;
        if (status !== 'online' && status !== 'offline') return;
        var dot = btn.querySelector('.dot-air');
        if (!dot) return;
        dot.classList.remove('online', 'offline');
        dot.classList.add(status);
        dot.title = 'station appears to be ' + status;
      });
    }
    document.querySelectorAll('[data-station]').forEach(function (el) {
      var first = el.querySelector('.play-btn .dot-air');
      el.dataset.online = first && first.classList.contains('online') ? 'true' : 'false';
    });
  }

  // Fetch the status map and call back with it, or with null when there is
  // no status URL or the request fails.
  function loadStreamStatus(callback) {
    var url = document.body.dataset.statusUrl;
    if (!url) {
      callback(null);
      return;
    }
    fetch(url, { signal: AbortSignal.timeout(5000) })
      .then(function (response) {
        if (!response.ok) throw new Error('status API responded ' + response.status);
        return response.json();
      })
      .then(function (data) { callback(data && data.streams ? data.streams : null); })
      .catch(function (err) {
        console.warn('stream status unavailable:', err);
        callback(null);
      });
  }

  window.applyStreamStatus = applyStreamStatus;
  window.loadStreamStatus = loadStreamStatus;
})();

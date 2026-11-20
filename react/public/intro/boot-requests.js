/*
 * boot-requests.js: classic (non-module) script, loaded first in <head>.
 *
 * Starts the portfolio's API calls at second 0, before the intro or React has
 * even downloaded, so a sleeping Fly.io machine starts waking during the ocean
 * phase. The intro reads progress from here; React should reuse these same
 * promises instead of fetching again (see REACT_INTEGRATION.md).
 *
 * Real mode:  set `window.__API_BASE__ = "/api"` before this script, or ?api=<base>
 * Demo mode (no API configured): requests are simulated; tune them per URL:
 *   ?profile=40000  ?stats=5000  ?github=30000   (ms)   or  =fail  /  =never
 *   ?hold=N is kept as an alias for ?profile=N.   ?cap=N overrides the 60 s limit.
 */
(function () {
  "use strict";

  var params = new URLSearchParams(location.search);
  var startedAt = performance.now();
  var capMs = Number(params.get("cap")) || 60000;   // hard limit for the whole intro wait
  var apiBase = window.__API_BASE__ || params.get("api") || null;
  var RETRY_MS = 3000;

  var endpoints = { profile: "/profile", stats: "/coding-stats", github: "/github/repos" };
  var demoDefaults = { profile: 1200, stats: 2500, github: 9000 };

  var state = {};
  var listeners = [];

  function emit() {
    listeners.forEach(function (fn) {
      try { fn(state); } catch { /* listener errors must not break loading */ }
    });
  }

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function fetchJson(key, path) {
    var deadline = startedAt + capMs;
    function attempt() {
      state[key].attempts += 1;
      return fetch(apiBase + path, { headers: { Accept: "application/json" } })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json();
        })
        .catch(function (error) {
          // cold starts can briefly 502/timeout: keep retrying until the cap
          if (performance.now() + RETRY_MS > deadline) throw error;
          state[key].status = "retrying";
          emit();
          return wait(RETRY_MS).then(attempt);
        });
    }
    return attempt();
  }

  function simulate(key) {
    var raw = params.get(key);
    if (raw === null && key === "profile") raw = params.get("hold");
    if (raw === null) raw = String(demoDefaults[key]);
    if (raw === "never") return new Promise(function () {});
    if (raw === "fail") {
      return wait(1500).then(function () { throw new Error("simulated failure"); });
    }
    return wait(Number(raw) || 0).then(function () { return { simulated: true }; });
  }

  var requests = {};
  Object.keys(endpoints).forEach(function (key) {
    state[key] = { status: "pending", attempts: 0, ms: null, error: null };
    var promise = (apiBase ? fetchJson(key, endpoints[key]) : simulate(key)).then(
      function (data) {
        state[key].status = "done";
        state[key].ms = Math.round(performance.now() - startedAt);
        emit();
        return data;
      },
      function (error) {
        state[key].status = "failed";
        state[key].error = String(error && error.message || error);
        emit();
        throw error;
      }
    );
    promise.catch(function () {}); // consumers handle failures; avoid unhandled-rejection noise
    requests[key] = promise;
  });

  window.__portfolioBoot = {
    requests: requests,
    state: state,
    capMs: capMs,
    startedAt: startedAt,
    simulated: !apiBase,
    elapsed: function () { return performance.now() - startedAt; },
    onChange: function (fn) {
      listeners.push(fn);
      return function () { listeners = listeners.filter(function (f) { return f !== fn; }); };
    },
  };
})();

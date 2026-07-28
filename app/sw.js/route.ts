/**
 * Serves the site's service worker from /sw.js with the current deployment's
 * build id baked in. The worker runtime-caches every static asset (images,
 * GLB, video, fonts, /_next/image responses) for 24h — see SW_SOURCE.
 *
 * Deploy-wide invalidation works through the version stamp: a new deployment
 * changes BUILD_ID, which makes this file byte-different; the browser's
 * update check (every navigation, HTTP cache bypassed via max-age=0 here and
 * updateViaCache:"none" at registration) installs the new worker, which
 * deletes the previous versioned cache on activate. So every user drops the
 * old cache on their first visit after a deploy — the earliest moment a
 * browser cache can physically be invalidated.
 */

// force-static: prerendered once per build, so BUILD_ID is a per-deployment
// constant. VERCEL_GIT_COMMIT_SHA exists on Vercel builds; the Date.now()
// fallback still yields a fresh id per local/other build.
export const dynamic = "force-static";

const BUILD_ID =
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.VERCEL_DEPLOYMENT_ID ??
  String(Date.now());

const SW_SOURCE = /* js */ `
"use strict";

var VERSION = "__BUILD_ID__";
var CACHE = "ananda-static-" + VERSION;
var TTL_MS = 24 * 60 * 60 * 1000; // 24h per entry
var STAMP = "sw-cached-at";

// What we runtime-cache: optimizer output plus raw static assets by extension.
// /_next/static is excluded — Next serves it content-hashed + immutable, the
// HTTP cache already keeps it forever.
function isCacheable(url) {
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.indexOf("/_next/static/") === 0) return false;
  if (url.pathname.indexOf("/_next/image") === 0) return true;
  return /\\.(png|jpe?g|webp|avif|gif|svg|glb|mp4|webm|woff2?|ico)$/i.test(url.pathname);
}

function isFresh(res) {
  var at = Number(res.headers.get(STAMP));
  return at > 0 && Date.now() - at < TTL_MS;
}

// Store a timestamped copy so isFresh() can apply the 24h TTL (the Cache API
// keeps no metadata of its own). Only complete 200s — never partials.
function putStamped(cache, request, res) {
  if (!res || res.status !== 200 || res.type === "opaque") return Promise.resolve();
  return res
    .clone()
    .blob()
    .then(function (body) {
      var headers = new Headers(res.headers);
      headers.set(STAMP, String(Date.now()));
      return cache.put(request, new Response(body, { status: 200, headers: headers }));
    })
    .catch(function () {});
}

// Serve a Range request as a 206 sliced from the cached full body — video
// elements (iOS Safari always) fetch media this way and a full-body 200 reply
// would be ignored.
function sliceResponse(fullRes, rangeHeader) {
  return fullRes.arrayBuffer().then(function (buf) {
    var size = buf.byteLength;
    var m = /bytes=(\\d*)-(\\d*)/.exec(rangeHeader);
    if (!m) return new Response(null, { status: 416 });
    var start, end;
    if (m[1] === "") {
      start = Math.max(0, size - Number(m[2]));
      end = size - 1;
    } else {
      start = Number(m[1]);
      end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
    }
    if (isNaN(start) || start >= size || start > end) {
      return new Response(null, { status: 416, headers: { "Content-Range": "bytes */" + size } });
    }
    return new Response(buf.slice(start, end + 1), {
      status: 206,
      headers: {
        "Content-Type": fullRes.headers.get("Content-Type") || "application/octet-stream",
        "Content-Range": "bytes " + start + "-" + end + "/" + size,
        "Content-Length": String(end - start + 1),
        "Accept-Ranges": "bytes",
      },
    });
  });
}

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
        );
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET" || request.mode === "navigate") return;
  var url = new URL(request.url);
  if (!isCacheable(url)) return;

  var rangeHeader = request.headers.get("range");
  event.respondWith(
    caches.open(CACHE).then(function (cache) {
      // Cache key ignores the Range header so slices and full fetches share
      // one entry (the full body).
      var key = request.url;
      return cache.match(key).then(function (cached) {
        if (cached && isFresh(cached)) {
          return rangeHeader ? sliceResponse(cached, rangeHeader) : cached;
        }
        if (rangeHeader) {
          // Miss/stale on a media Range request: stream this one from the
          // network untouched, and cache the FULL file in the background so
          // later requests (and the next 24h of visits) slice from cache.
          event.waitUntil(
            fetch(key)
              .then(function (full) { return putStamped(cache, key, full); })
              .catch(function () {})
          );
          return fetch(request);
        }
        return fetch(request)
          .then(function (res) {
            event.waitUntil(putStamped(cache, key, res));
            return res;
          })
          .catch(function (err) {
            // Network down: an expired copy beats a broken page.
            if (cached) return cached;
            throw err;
          });
      });
    })
  );
});
`;

export function GET() {
  return new Response(SW_SOURCE.replace("__BUILD_ID__", BUILD_ID), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      // The worker file itself must never be cached long — it's the update
      // signal that busts everything else.
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}

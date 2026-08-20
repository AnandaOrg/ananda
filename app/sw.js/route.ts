
export const dynamic = "force-static";

const BUILD_ID =
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.VERCEL_DEPLOYMENT_ID ??
  String(Date.now());

const SW_SOURCE =  `
"use strict";

var VERSION = "__BUILD_ID__";
var CACHE = "ananda-static-" + VERSION;
var TTL_MS = 24 * 60 * 60 * 1000;
var STAMP = "sw-cached-at";

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
      var key = request.url;
      return cache.match(key).then(function (cached) {
        if (cached && isFresh(cached)) {
          return rangeHeader ? sliceResponse(cached, rangeHeader) : cached;
        }
        if (rangeHeader) {
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
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}

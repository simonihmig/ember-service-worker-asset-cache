import {
  FILES,
  PREPEND,
  VERSION
} from 'ember-service-worker-asset-cache/service-worker/config';
import cleanupCaches from 'ember-service-worker/service-worker/cleanup-caches';

const CACHE_KEY_PREFIX = 'esw-asset-cache';
const CACHE_NAME = `${CACHE_KEY_PREFIX}-${VERSION}`;
const CACHE_URLS = FILES.map((file) => {
  return new URL(file, (PREPEND || self.location)).toString();
});

/*
 * Removes all cached requests from the cache that aren't in the `CACHE_URLS`
 * list.
 */
const PRUNE_CURRENT_CACHE = () => {
  caches.open(CACHE_NAME).then((cache) => {
    return cache.keys().then((keys) => {
      keys.forEach((request) => {
        if (CACHE_URLS.indexOf(request.url) === -1) {
          cache.delete(request);
        }
      });
    });
  });
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CACHE_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      cleanupCaches(CACHE_KEY_PREFIX, CACHE_NAME),
      PRUNE_CURRENT_CACHE()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  let isGETRequest = event.request.method === 'GET';
  let shouldRespond = CACHE_URLS.indexOf(event.request.url) !== -1;

  if (isGETRequest && shouldRespond) {
    event.respondWith(
      caches.match(event.request, { cacheName: CACHE_NAME })
    );
  }
});

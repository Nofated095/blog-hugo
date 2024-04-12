importScripts('/workbox/workbox-sw.js');

workbox.setConfig({
    modulePathPrefix: '/workbox/'
});

const { core, precaching, routing, strategies, expiration, cacheableResponse, backgroundSync } = workbox;
const { CacheFirst, NetworkFirst, NetworkOnly, StaleWhileRevalidate } = strategies;
const { ExpirationPlugin } = expiration;
const { CacheableResponsePlugin } = cacheableResponse;

const cacheSuffixVersion = '-240412a',
    maxEntries = 100;

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(keys.map((key) => {
                if (key.includes('waline-cdn-cache')) return caches.delete(key);
                if (key.includes('waline-img-cache')) return caches.delete(key);
                if (!key.includes(cacheSuffixVersion)) return caches.delete(key);
            }));
        })
    );
});


core.setCacheNameDetails({
    prefix: 'amaneblog',
    suffix: cacheSuffixVersion
});

core.skipWaiting();
core.clientsClaim();
precaching.cleanupOutdatedCaches();

routing.registerRoute(
    /.*cdn\.jsdelivr\.net/,
    new CacheFirst({
        cacheName: 'static-immutable' + cacheSuffixVersion,
        fetchOptions: {
            mode: 'cors',
            credentials: 'omit'
        },
        plugins: [
            new ExpirationPlugin({
                maxAgeSeconds: 30 * 24 * 60 * 60,
                purgeOnQuotaError: true
            })
        ]
    })
);

routing.registerRoute(
    /.*fonts\.googleapis\.com/,
    new CacheFirst({
        cacheName: 'static-immutable' + cacheSuffixVersion,
        fetchOptions: {
            mode: 'cors',
            credentials: 'omit'
        },
        plugins: [
            new ExpirationPlugin({
                maxAgeSeconds: 30 * 24 * 60 * 60,
                purgeOnQuotaError: true
            })
        ]
    })
);

routing.registerRoute(
    /.*fonts\.gstatic\.com/,
    new CacheFirst({
        cacheName: 'static-immutable' + cacheSuffixVersion,
        fetchOptions: {
            mode: 'cors',
            credentials: 'omit'
        },
        plugins: [
            new ExpirationPlugin({
                maxAgeSeconds: 30 * 24 * 60 * 60,
                purgeOnQuotaError: true
            })
        ]
    })
);


routing.registerRoute(
    new RegExp('google-analytics.com'),
    new NetworkOnly({
        plugins: [
            new backgroundSync.BackgroundSyncPlugin('ga', {
                maxRetentionTime: 12 * 60
            }),
        ]
    }),
    "POST"
);

routing.registerRoute(
    new RegExp('waline'),
    new NetworkFirst({
        plugins: [
            new backgroundSync.BackgroundSyncPlugin('waline', {
                maxRetentionTime: 12 * 60
            }),
        ]
    })
);

routing.registerRoute(
    new RegExp('analytics.google.com'),
    new NetworkOnly({
        plugins: [
            new backgroundSync.BackgroundSyncPlugin('ga_new', {
                maxRetentionTime: 12 * 60
            }),
        ]
    }),
    "POST"
)

const StaleWhileRevalidateInstance = new StaleWhileRevalidate();
/*
 * Others img
 * Method: staleWhileRevalidate
 * cacheName: img-cache
 */
routing.registerRoute(
    // Cache image files
    /.*\.(?:png|jpg|jpeg|gif|webp)/,
    StaleWhileRevalidateInstance
);

/*
 * Static Assets
 * Method: staleWhileRevalidate
 * cacheName: static-assets-cache
 */
routing.registerRoute(
    // Cache CSS files
    /.*\.(css|js)/,
    // Use cache but update in the background ASAP
    StaleWhileRevalidateInstance
);

/*
 * sw.js - Revalidate every time
 * staleWhileRevalidate
 */
routing.registerRoute(
    '/sw.js',
    StaleWhileRevalidateInstance
);



routing.registerRoute(
    new RegExp('blog'),
    StaleWhileRevalidateInstance
);

routing.registerRoute(
    /.*localhost/,
    new NetworkOnly()
);

/*
 * Default - Serve as it is
 * StaleWhileRevalidate
 */
routing.setDefaultHandler(
    new NetworkOnly()
);

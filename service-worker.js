/* =====================================================================
   PROVAS LAURA — SERVICE WORKER
===================================================================== */

const CACHE_NAME =
  'prova-laura-cache-v5';


const APP_SHELL = [

  './',

  './index.html',

  './app.js',

  './ui.js',

  './manifest.json',

  './icons/icon-192.png',

  './icons/icon-512.png'

];


/* =====================
   INSTALAÇÃO
===================== */

self.addEventListener(
  'install',
  event => {

    event.waitUntil(

      caches
        .open(CACHE_NAME)

        .then(
          cache =>
            /* Cacheia cada item individualmente: se um arquivo faltar
               ou falhar (ex.: ícone não encontrado), os demais continuam
               sendo salvos normalmente — cache.addAll() falharia por
               completo com apenas 1 item ausente. */
            Promise.all(
              APP_SHELL.map(url =>
                cache.add(url).catch(err => {
                  console.warn('Service Worker: falha ao cachear', url, err);
                })
              )
            )
        )

        .then(() => {

          self.skipWaiting();

        })

    );

  }
);


/* =====================
   ATIVAÇÃO
===================== */

self.addEventListener(
  'activate',
  event => {

    event.waitUntil(

      caches
        .keys()

        .then(
          names =>

            Promise.all(

              names
                .filter(
                  name =>
                    name !== CACHE_NAME
                )

                .map(
                  name =>
                    caches.delete(name)
                )

            )

        )

        .then(() => {

          return self.clients.claim();

        })

    );

  }
);


/* =====================
   FETCH
===================== */

self.addEventListener(
  'fetch',
  event => {

    if (
      event.request.method !== 'GET'
    ) {

      return;

    }


    const requestUrl =
      new URL(
        event.request.url
      );


    /* Não interfere
       com recursos externos */

    if (
      requestUrl.origin !==
      self.location.origin
    ) {

      return;

    }


    /* =====================
       QUESTIONS.JSON
       REDE PRIMEIRO
    ===================== */

    if (
      requestUrl.pathname
        .endsWith(
          '/questions.json'
        )
    ) {

      event.respondWith(

        fetch(event.request)

          .then(
            response => {

              if (
                response &&
                response.ok
              ) {

                const clone =
                  response.clone();


                caches
                  .open(CACHE_NAME)

                  .then(
                    cache =>
                      cache.put(
                        event.request,
                        clone
                      )
                  );

              }


              return response;

            }
          )

          .catch(
            async () => {

              const cache =
                await caches.open(
                  CACHE_NAME
                );


              const cached =
                await cache.match(
                  event.request
                );


              if (cached) {

                return cached;

              }


              return new Response(

                JSON.stringify({

                  bank: [],

                  discursive: []

                }),

                {

                  status: 503,

                  headers: {

                    'Content-Type':
                      'application/json'

                  }

                }

              );

            }
          )

      );

      return;

    }


    /* =====================
       APP SHELL
       CACHE PRIMEIRO
    ===================== */

    event.respondWith(

      caches.match(
        event.request
      )

      .then(
        cached => {

          if (cached) {

            return cached;

          }


          return fetch(
            event.request
          )

          .then(
            response => {

              if (
                !response ||
                !response.ok
              ) {

                return response;

              }


              const clone =
                response.clone();


              caches
                .open(CACHE_NAME)

                .then(
                  cache =>
                    cache.put(
                      event.request,
                      clone
                    )
                );


              return response;

            }
          );

        }
      )

      .catch(
        () => {

          if (
            event.request.mode ===
            'navigate'
          ) {

            return caches.match(
              './index.html'
            );

          }

          return new Response(
            'Offline',
            {
              status: 503
            }
          );

        }
      )

    );

  }
);

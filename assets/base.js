/*
    © 2023 Fireweb.fr
    https://www.fireweb.fr
*/

// Resize Shopify images - helper function
// https://gist.github.com/DanWebb/cce6ab34dd521fcac6ba
Shopify.resizeImage = (src, size, crop = '') => src.replace(/_(pico|icon|thumb|small|compact|medium|large|grande|original|1024x1024|2048x2048|master)+\./g, '.')
    .replace(/\.jpg|\.png|\.gif|\.jpeg/g, (match) => {
        if (crop.length) {
            // eslint-disable-next-line no-param-reassign
            crop = `_crop_${crop}`
        }
        return `_${size}${crop}${match}`
    })

// Detect elements when they are within view
// https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
const initEnterView = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("entered");

          entry.target
            .querySelectorAll(".animate__animated.opacity-0")
            .forEach((el) => {
              el.classList.remove("opacity-0");
              el.classList.add(el.dataset.animateClass);
            });
        }
      });
    },
    { threshold: 0, rootMargin: "0px 0px -200px 0px" }
  );

  document.querySelectorAll(".enter-view").forEach((el) => {
    observer.observe(el);
  });
};
initEnterView();

// Lazy load HTMl5 videos
// https://web.dev/lazy-loading-video/
const initVideoLazyLoad = () => {
  const lazyVideos = [].slice.call(
    document.querySelectorAll("video.lazy-video")
  );

  if ("IntersectionObserver" in window) {
    const lazyVideoObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (video) {
          if (video.isIntersecting) {
            for (const source in video.target.children) {
              const videoSource = video.target.children[source];
              if (
                typeof videoSource.tagName === "string" &&
                videoSource.tagName === "SOURCE"
              ) {
                videoSource.src = videoSource.dataset.src;
              }
            }

            video.target.load();

            if (video.target.hasAttribute("data-poster")) {
              video.target.poster = video.target.dataset.poster;
            }

            video.target.classList.remove("lazy-video");
            lazyVideoObserver.unobserve(video.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px 200px 0px" }
    );

    lazyVideos.forEach(function (lazyVideo) {
      lazyVideoObserver.observe(lazyVideo);
    });
  }
};
initVideoLazyLoad();

document.addEventListener("shopify:section:load", () => {
  document.querySelectorAll(".enter-view").forEach((elem) => {
    elem.classList.add("entered");
    document.querySelectorAll(".animate__animated.opacity-0").forEach((el) => {
      el.classList.remove("opacity-0");
    });
  });
});



// Exit Pop-up
// Fonctionnalité du bouton de fermeture et du lien de désinscription
var closeBtn = document.querySelector("#dy-popup-1 .dy-popup-close");
if(closeBtn) {
    closeBtn.addEventListener("click", function() {
        var popupOverlay = document.getElementById("dy-popup-overlay");
        if(popupOverlay) {
            popupOverlay.remove();
        }
    });
}

var optoutLink = document.querySelector("#dy-popup-1 .dy-popup-optout");
if(optoutLink) {
    optoutLink.addEventListener("click", function() {
        var popupOverlay = document.getElementById("dy-popup-overlay");
        if(popupOverlay) {
            popupOverlay.remove();
        }
    });
}

// Copier dans le presse-papier
function copyToClipboard() {
    var copyText = document.getElementById("dy-voucher-code");
    copyText.select();
    document.execCommand("copy");

    // Modifier le texte du bouton "Copy" en fonction de la langue
    var lang = navigator.language;
    var copiedText = "Copié";

    if (lang === "en") {
        copiedText = "Copied";
    } else if (lang === "es") {
        copiedText = "Copiado";
    } else if (lang === "de") {
        copiedText = "Kopiert";
    } else if (lang === "ja") {
        copiedText = "コピーしました";
    }

    document.getElementById("dy-popup-btn").innerText = copiedText;
}

// Afficher lors de la sortie avec une intention après un délai de 5 secondes
// Crédit à shorturl.at/juAJX
setTimeout(function() {
    document.addEventListener("mouseout", function(evt) {
        if (evt.toElement === null && evt.relatedTarget === null) {
            document.removeEventListener("mouseout", arguments.callee);
            var popupOverlay = document.getElementById("dy-popup-overlay");
            if(popupOverlay) {
                popupOverlay.style.display = "flex";
            }
        }
    });
}, 200);




// Countdown timers
const initCountdownTimers = () => {
    document.querySelectorAll('.countdown-timer').forEach((elem) => {
        if (elem.classList.contains('init')) return

        elem.classList.add('init')

        let end = Number(elem.dataset.time) * 1000

        if (window.location.href.includes('fireweb')) {
            end = Date.now() + 1.08e+7
        }

        const seconds = 1000
        const minutes = seconds * 60
        const hours = minutes * 60
        const days = hours * 24

        const x = setInterval(() => {
            const now = new Date().getTime()
            const difference = end - now

            if (difference < 0) {
                clearInterval(x)
                elem.remove()
                return
            }

            elem.removeAttribute('hidden')

            const d = Math.floor(difference / days)
            const h = Math.floor((difference % days) / hours)
            const m = Math.floor((difference % hours) / minutes)
            const s = Math.floor((difference % minutes) / seconds)

            elem.querySelector('[data-days]').innerText = `${d}${elem.dataset.textD}`
            elem.querySelector('[data-days]').setAttribute('aria-label', `${d} ${elem.dataset.textDays}`)
            elem.querySelector('[data-hours').innerText = `${h}${elem.dataset.textH}`
            elem.querySelector('[data-hours').setAttribute('aria-label', `${h} ${elem.dataset.textHours}`)
            elem.querySelector('[data-minutes').innerText = `${m}${elem.dataset.textM}`
            elem.querySelector('[data-minutes').setAttribute('aria-label', `${m} ${elem.dataset.textMinutes}`)
            elem.querySelector('[data-seconds').innerText = `${s}${elem.dataset.textS}`
            elem.querySelector('[data-seconds').setAttribute('aria-label', `${s} ${elem.dataset.textSeconds}`)

            if (d === 0) {
                elem.querySelector('[data-days').setAttribute('hidden', 'hidden')
            }
        }, seconds)
    })
}
initCountdownTimers()

document.addEventListener('shopify:section:load', (e) => {
    if (e.target.querySelector('.countdown-timer')) {
        initCountdownTimers()
    }
})


//Limited Offer Countdown timers
const initLimitedOffer = () => {
  const block = document.querySelector('#product-limited-offer')

  if (!block) return

  const icon = block.querySelector('.block-icon')

  setInterval(() => {
    icon.classList.add('animate__animated', 'animate__tada')

    setTimeout(() => {
      icon.classList.remove('animate__animated', 'animate__tada')
    }, 1500)
  }, 3000)
}
initLimitedOffer();


function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    )
  );
}

document.querySelectorAll('[id^="Details-"] summary').forEach((summary) => {
  summary.setAttribute('role', 'button');
  summary.setAttribute('aria-expanded', summary.parentNode.hasAttribute('open'));

  if(summary.nextElementSibling.getAttribute('id')) {
    summary.setAttribute('aria-controls', summary.nextElementSibling.id);
  }

  summary.addEventListener('click', (event) => {
    event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
  });

  if (summary.closest('header-drawer')) return;
  summary.parentElement.addEventListener('keyup', onKeyUpEscape);
});

const trapFocusHandlers = {};

function trapFocus(container, elementToFocus = container) {
  var elements = getFocusableElements(container);
  var first = elements[0];
  var last = elements[elements.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = (event) => {
    if (
      event.target !== container &&
      event.target !== last &&
      event.target !== first
    )
      return;

    document.addEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = function() {
    document.removeEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.keydown = function(event) {
    if (event.code.toUpperCase() !== 'TAB') return; // If not TAB key
    // On the last focusable element and tab forward, focus the first element.
    if (event.target === last && !event.shiftKey) {
      event.preventDefault();
      first.focus();
    }

    //  On the first focusable element and tab backward, focus the last element.
    if (
      (event.target === container || event.target === first) &&
      event.shiftKey
    ) {
      event.preventDefault();
      last.focus();
    }
  };

  document.addEventListener('focusout', trapFocusHandlers.focusout);
  document.addEventListener('focusin', trapFocusHandlers.focusin);

  elementToFocus.focus();
}

// Here run the querySelector to figure out if the browser supports :focus-visible or not and run code based on it.
try {
  document.querySelector(":focus-visible");
} catch(e) {
  focusVisiblePolyfill();
}

function focusVisiblePolyfill() {
  const navKeys = ['ARROWUP', 'ARROWDOWN', 'ARROWLEFT', 'ARROWRIGHT', 'TAB', 'ENTER', 'SPACE', 'ESCAPE', 'HOME', 'END', 'PAGEUP', 'PAGEDOWN']
  let currentFocusedElement = null;
  let mouseClick = null;

  window.addEventListener('keydown', (event) => {
    if(navKeys.includes(event.code.toUpperCase())) {
      mouseClick = false;
    }
  });

  window.addEventListener('mousedown', (event) => {
    mouseClick = true;
  });

  window.addEventListener('focus', () => {
    if (currentFocusedElement) currentFocusedElement.classList.remove('focused');

    if (mouseClick) return;

    currentFocusedElement = document.activeElement;
    currentFocusedElement.classList.add('focused');

  }, true);
}

function pauseAllMedia() {
  document.querySelectorAll('.js-youtube').forEach((video) => {
    video.contentWindow.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*');
  });
  document.querySelectorAll('.js-vimeo').forEach((video) => {
    video.contentWindow.postMessage('{"method":"pause"}', '*');
  });
  document.querySelectorAll('video').forEach((video) => video.pause());
  document.querySelectorAll('product-model').forEach((model) => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
}

function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener('focusin', trapFocusHandlers.focusin);
  document.removeEventListener('focusout', trapFocusHandlers.focusout);
  document.removeEventListener('keydown', trapFocusHandlers.keydown);

  if (elementToFocus) elementToFocus.focus();
}

function onKeyUpEscape(event) {
  if (event.code.toUpperCase() !== 'ESCAPE') return;

  const openDetailsElement = event.target.closest('details[open]');
  if (!openDetailsElement) return;

  const summaryElement = openDetailsElement.querySelector('summary');
  openDetailsElement.removeAttribute('open');
  summaryElement.setAttribute('aria-expanded', false);
  summaryElement.focus();
}

class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input');
    this.changeEvent = new Event('change', { bubbles: true })

    this.querySelectorAll('button').forEach(
      (button) => button.addEventListener('click', this.onButtonClick.bind(this))
    );
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;

    event.target.name === 'plus' ? this.input.stepUp() : this.input.stepDown();
    if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);
  }
}

customElements.define('quantity-input', QuantityInput);

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function fetchConfig(type = 'json') {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': `application/${type}` }
  };
}

/*
 * Shopify Common JS
 *
 */
if ((typeof window.Shopify) == 'undefined') {
  window.Shopify = {};
}

Shopify.bind = function(fn, scope) {
  return function() {
    return fn.apply(scope, arguments);
  }
};

Shopify.setSelectorByValue = function(selector, value) {
  for (var i = 0, count = selector.options.length; i < count; i++) {
    var option = selector.options[i];
    if (value == option.value || value == option.innerHTML) {
      selector.selectedIndex = i;
      return i;
    }
  }
};

Shopify.addListener = function(target, eventName, callback) {
  target.addEventListener ? target.addEventListener(eventName, callback, false) : target.attachEvent('on'+eventName, callback);
};

Shopify.postLink = function(path, options) {
  options = options || {};
  var method = options['method'] || 'post';
  var params = options['parameters'] || {};

  var form = document.createElement("form");
  form.setAttribute("method", method);
  form.setAttribute("action", path);

  for(var key in params) {
    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", key);
    hiddenField.setAttribute("value", params[key]);
    form.appendChild(hiddenField);
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function(country_domid, province_domid, options) {
  this.countryEl         = document.getElementById(country_domid);
  this.provinceEl        = document.getElementById(province_domid);
  this.provinceContainer = document.getElementById(options['hideElement'] || province_domid);

  Shopify.addListener(this.countryEl, 'change', Shopify.bind(this.countryHandler,this));

  this.initCountry();
  this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
  initCountry: function() {
    var value = this.countryEl.getAttribute('data-default');
    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },

  initProvince: function() {
    var value = this.provinceEl.getAttribute('data-default');
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },

  countryHandler: function(e) {
    var opt       = this.countryEl.options[this.countryEl.selectedIndex];
    var raw       = opt.getAttribute('data-provinces');
    var provinces = JSON.parse(raw);

    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length == 0) {
      this.provinceContainer.style.display = 'none';
    } else {
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement('option');
        opt.value = provinces[i][0];
        opt.innerHTML = provinces[i][1];
        this.provinceEl.appendChild(opt);
      }

      this.provinceContainer.style.display = "";
    }
  },

  clearOptions: function(selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },

  setOptions: function(selector, values) {
    for (var i = 0, count = values.length; i < values.length; i++) {
      var opt = document.createElement('option');
      opt.value = values[i];
      opt.innerHTML = values[i];
      selector.appendChild(opt);
    }
  }
};

class MenuDrawer extends HTMLElement {
  constructor() {
    super();

    this.mainDetailsToggle = this.querySelector('details');

    if (navigator.platform === 'iPhone') document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);

    this.addEventListener('keyup', this.onKeyUp.bind(this));
    this.addEventListener('focusout', this.onFocusOut.bind(this));
    this.bindEvents();
  }

  bindEvents() {
    this.querySelectorAll('summary').forEach(summary => summary.addEventListener('click', this.onSummaryClick.bind(this)));
    this.querySelectorAll('button').forEach(button => button.addEventListener('click', this.onCloseButtonClick.bind(this)));
  }

  onKeyUp(event) {
    if(event.code.toUpperCase() !== 'ESCAPE') return;

    const openDetailsElement = event.target.closest('details[open]');
    if(!openDetailsElement) return;

    openDetailsElement === this.mainDetailsToggle ? this.closeMenuDrawer(event, this.mainDetailsToggle.querySelector('summary')) : this.closeSubmenu(openDetailsElement);
  }

  onSummaryClick(event) {
    const summaryElement = event.currentTarget;
    const detailsElement = summaryElement.parentNode;
    const parentMenuElement = detailsElement.closest('.has-submenu');
    const isOpen = detailsElement.hasAttribute('open');
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function addTrapFocus() {
      trapFocus(summaryElement.nextElementSibling, detailsElement.querySelector('button'));
      summaryElement.nextElementSibling.removeEventListener('transitionend', addTrapFocus);
    }

    if (detailsElement === this.mainDetailsToggle) {
      if(isOpen) event.preventDefault();
      isOpen ? this.closeMenuDrawer(event, summaryElement) : this.openMenuDrawer(summaryElement);

      if (window.matchMedia('(max-width: 990px)')) {
        document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
      }
    } else {
      setTimeout(() => {
        detailsElement.classList.add('menu-opening');
        summaryElement.setAttribute('aria-expanded', true);
        parentMenuElement && parentMenuElement.classList.add('submenu-open');
        !reducedMotion || reducedMotion.matches ? addTrapFocus() : summaryElement.nextElementSibling.addEventListener('transitionend', addTrapFocus);
      }, 100);
    }
  }

  openMenuDrawer(summaryElement) {
    setTimeout(() => {
      this.mainDetailsToggle.classList.add('menu-opening');
    });
    summaryElement.setAttribute('aria-expanded', true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }

  closeMenuDrawer(event, elementToFocus = false) {
    if (event === undefined) return;

    this.mainDetailsToggle.classList.remove('menu-opening');
    this.mainDetailsToggle.querySelectorAll('details').forEach(details => {
      details.removeAttribute('open');
      details.classList.remove('menu-opening');
    });
    this.mainDetailsToggle.querySelectorAll('.submenu-open').forEach(submenu => {
      submenu.classList.remove('submenu-open');
    });
    document.body.classList.remove(`overflow-hidden-${this.dataset.breakpoint}`);
    removeTrapFocus(elementToFocus);
    this.closeAnimation(this.mainDetailsToggle);
  }

  onFocusOut(event) {
    setTimeout(() => {
      if (this.mainDetailsToggle.hasAttribute('open') && !this.mainDetailsToggle.contains(document.activeElement)) this.closeMenuDrawer();
    });
  }

  onCloseButtonClick(event) {
    const detailsElement = event.currentTarget.closest('details');
    this.closeSubmenu(detailsElement);
  }

  closeSubmenu(detailsElement) {
    const parentMenuElement = detailsElement.closest('.submenu-open');
    parentMenuElement && parentMenuElement.classList.remove('submenu-open');
    detailsElement.classList.remove('menu-opening');
    detailsElement.querySelector('summary').setAttribute('aria-expanded', false);
    removeTrapFocus(detailsElement.querySelector('summary'));
    this.closeAnimation(detailsElement);
  }

  closeAnimation(detailsElement) {
    let animationStart;

    const handleAnimation = (time) => {
      if (animationStart === undefined) {
        animationStart = time;
      }

      const elapsedTime = time - animationStart;

      if (elapsedTime < 400) {
        window.requestAnimationFrame(handleAnimation);
      } else {
        detailsElement.removeAttribute('open');
        if (detailsElement.closest('details[open]')) {
          trapFocus(detailsElement.closest('details[open]'), detailsElement.querySelector('summary'));
        }
      }
    }

    window.requestAnimationFrame(handleAnimation);
  }
}

customElements.define('menu-drawer', MenuDrawer);

class HeaderDrawer extends MenuDrawer {
  constructor() {
    super();
  }

  openMenuDrawer(summaryElement) {
    this.header = this.header || document.querySelector('.section-header');
    this.borderOffset = this.borderOffset || this.closest('.header-wrapper').classList.contains('header-wrapper--border-bottom') ? 1 : 0;
    document.documentElement.style.setProperty('--header-bottom-position', `${parseInt(this.header.getBoundingClientRect().bottom - this.borderOffset)}px`);
    this.header.classList.add('menu-open');

    setTimeout(() => {
      this.mainDetailsToggle.classList.add('menu-opening');
    });

    summaryElement.setAttribute('aria-expanded', true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }

  closeMenuDrawer(event, elementToFocus) {
    super.closeMenuDrawer(event, elementToFocus);
    this.header.classList.remove('menu-open');
  }
}

customElements.define('header-drawer', HeaderDrawer);

class ModalDialog extends HTMLElement {
  constructor() {
    super();
    this.querySelector('[id^="ModalClose-"]').addEventListener(
      'click',
      this.hide.bind(this, false)
    );
    this.addEventListener('keyup', (event) => {
      if (event.code.toUpperCase() === 'ESCAPE') this.hide();
    });
    if (this.classList.contains('media-modal')) {
      this.addEventListener('pointerup', (event) => {
        if (event.pointerType === 'mouse' && !event.target.closest('deferred-media, product-model')) this.hide();
      });
    } else {
      this.addEventListener('click', (event) => {
        if (event.target === this) this.hide();
      });
    }
  }

  connectedCallback() {
    if (this.moved) return;
    this.moved = true;
    document.body.appendChild(this);
  }

  show(opener) {
    this.openedBy = opener;
    const popup = this.querySelector('.template-popup');
    document.body.classList.add('overflow-hidden');
    this.setAttribute('open', '');
    if (popup) popup.loadContent();
    trapFocus(this, this.querySelector('[role="dialog"]'));
    window.pauseAllMedia();
  }

  hide() {
    document.body.classList.remove('overflow-hidden');
    document.body.dispatchEvent(new CustomEvent('modalClosed'));
    this.removeAttribute('open');
    removeTrapFocus(this.openedBy);
    window.pauseAllMedia();
  }
}
customElements.define('modal-dialog', ModalDialog);

class ModalOpener extends HTMLElement {
  constructor() {
    super();

    const button = this.querySelector('button');

    if (!button) return;
    button.addEventListener('click', () => {
      const modal = document.querySelector(this.getAttribute('data-modal'));
      if (modal) modal.show(button);
    });
  }
}
customElements.define('modal-opener', ModalOpener);

class DeferredMedia extends HTMLElement {
  constructor() {
    super();
    const poster = this.querySelector('[id^="Deferred-Poster-"]');
    if (!poster) return;
    poster.addEventListener('click', this.loadContent.bind(this));
  }

  loadContent(focus = true) {
    window.pauseAllMedia();
    if (!this.getAttribute('loaded')) {
      const content = document.createElement('div');
      content.appendChild(this.querySelector('template').content.firstElementChild.cloneNode(true));

      this.setAttribute('loaded', true);
      const deferredElement = this.appendChild(content.querySelector('video, model-viewer, iframe'));
      if (focus) deferredElement.focus();
    }
  }
}

customElements.define('deferred-media', DeferredMedia);

class SliderComponent extends HTMLElement {
  constructor() {
    super();
    this.slider = this.querySelector('[id^="Slider-"]');
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.enableSliderLooping = false;
    this.currentPageElement = this.querySelector('.slider-counter--current');
    this.pageTotalElement = this.querySelector('.slider-counter--total');
    this.prevButton = this.querySelector('button[name="previous"]');
    this.nextButton = this.querySelector('button[name="next"]');

    if (!this.slider || !this.nextButton) return;

    this.initPages();
    const resizeObserver = new ResizeObserver(entries => this.initPages());
    resizeObserver.observe(this.slider);

    this.slider.addEventListener('scroll', this.update.bind(this));
    this.prevButton.addEventListener('click', this.onButtonClick.bind(this));
    this.nextButton.addEventListener('click', this.onButtonClick.bind(this));
  }

  initPages() {
    this.sliderItemsToShow = Array.from(this.sliderItems).filter(element => element.clientWidth > 0);
    if (this.sliderItemsToShow.length < 2) return;
    this.sliderItemOffset = this.sliderItemsToShow[1].offsetLeft - this.sliderItemsToShow[0].offsetLeft;
    this.slidesPerPage = Math.floor((this.slider.clientWidth - this.sliderItemsToShow[0].offsetLeft) / this.sliderItemOffset);
    this.totalPages = this.sliderItemsToShow.length - this.slidesPerPage + 1;
    this.update();
  }

  resetPages() {
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.initPages();
  }

  update() {
    const previousPage = this.currentPage;
    this.currentPage = Math.round(this.slider.scrollLeft / this.sliderItemOffset) + 1;

    if (this.currentPageElement && this.pageTotalElement) {
      this.currentPageElement.textContent = this.currentPage;
      this.pageTotalElement.textContent = this.totalPages;
    }

    if (this.currentPage != previousPage) {
      this.dispatchEvent(new CustomEvent('slideChanged', { detail: {
        currentPage: this.currentPage,
        currentElement: this.sliderItemsToShow[this.currentPage - 1]
      }}));
    }

    if (this.enableSliderLooping) return;

    if (this.isSlideVisible(this.sliderItemsToShow[0]) && this.slider.scrollLeft === 0) {
      this.prevButton.setAttribute('disabled', 'disabled');
    } else {
      this.prevButton.removeAttribute('disabled');
    }

    if (this.isSlideVisible(this.sliderItemsToShow[this.sliderItemsToShow.length - 1])) {
      this.nextButton.setAttribute('disabled', 'disabled');
    } else {
      this.nextButton.removeAttribute('disabled');
    }
  }

  isSlideVisible(element, offset = 0) {
    const lastVisibleSlide = this.slider.clientWidth + this.slider.scrollLeft - offset;
    return (element.offsetLeft + element.clientWidth) <= lastVisibleSlide && element.offsetLeft >= this.slider.scrollLeft;
  }

  onButtonClick(event) {
    event.preventDefault();
    const step = event.currentTarget.dataset.step || 1;
    this.slideScrollPosition = event.currentTarget.name === 'next' ? this.slider.scrollLeft + (step * this.sliderItemOffset) : this.slider.scrollLeft - (step * this.sliderItemOffset);
    this.slider.scrollTo({
      left: this.slideScrollPosition
    });
  }
}

customElements.define('slider-component', SliderComponent);

//fetch("https://fireweb-licence-theme.herokuapp.com/api/licenses/get_by_domain/"+Shopify.shop).then(function(e){if(404==e.status){let n=document.getElementsByTagName("body");n[0].innerHTML+='<div class="bg-container-license"><a href="https://theme.fireweb.fr/course/theme-fireweb/lecture/1022005">ACTIVER MA LICENCE</a></div>'}});

class SlideshowComponent extends SliderComponent {
  constructor() {
    super();
    this.sliderControlWrapper = this.querySelector('.slider-buttons');
    this.enableSliderLooping = true;

    if (!this.sliderControlWrapper) return;

    this.sliderFirstItemNode = this.slider.querySelector('.slideshow__slide');
    if (this.sliderItemsToShow.length > 0) this.currentPage = 1;

    this.sliderControlLinksArray = Array.from(this.sliderControlWrapper.querySelectorAll('.slider-counter__link'));
    this.sliderControlLinksArray.forEach(link => link.addEventListener('click', this.linkToSlide.bind(this)));
    this.slider.addEventListener('scroll', this.setSlideVisibility.bind(this));
    this.setSlideVisibility();

    if (this.slider.getAttribute('data-autoplay') === 'true') this.setAutoPlay();
  }

  setAutoPlay() {
    this.sliderAutoplayButton = this.querySelector('.slideshow__autoplay');
    this.autoplaySpeed = this.slider.dataset.speed * 1000;

    this.sliderAutoplayButton.addEventListener('click', this.autoPlayToggle.bind(this));
    this.addEventListener('mouseover', this.focusInHandling.bind(this));
    this.addEventListener('mouseleave', this.focusOutHandling.bind(this));
    this.addEventListener('focusin', this.focusInHandling.bind(this));
    this.addEventListener('focusout', this.focusOutHandling.bind(this));

    this.play();
    this.autoplayButtonIsSetToPlay = true;
  }

  onButtonClick(event) {
    super.onButtonClick(event);
    const isFirstSlide = this.currentPage === 1;
    const isLastSlide = this.currentPage === this.sliderItemsToShow.length;

    if (!isFirstSlide && !isLastSlide) return;

    if (isFirstSlide && event.currentTarget.name === 'previous') {
      this.slideScrollPosition = this.slider.scrollLeft + this.sliderFirstItemNode.clientWidth * this.sliderItemsToShow.length;
    } else if (isLastSlide && event.currentTarget.name === 'next') {
      this.slideScrollPosition = 0;
    }
    this.slider.scrollTo({
      left: this.slideScrollPosition
    });
  }

  update() {
    super.update();
    this.sliderControlButtons = this.querySelectorAll('.slider-counter__link');
    this.prevButton.removeAttribute('disabled');

    if (!this.sliderControlButtons.length) return;

    this.sliderControlButtons.forEach(link => {
      link.classList.remove('slider-counter__link--active');
      link.removeAttribute('aria-current');
    });
    this.sliderControlButtons[this.currentPage - 1].classList.add('slider-counter__link--active');
    this.sliderControlButtons[this.currentPage - 1].setAttribute('aria-current', true);
  }

  autoPlayToggle() {
    this.togglePlayButtonState(this.autoplayButtonIsSetToPlay);
    this.autoplayButtonIsSetToPlay ? this.pause() : this.play();
    this.autoplayButtonIsSetToPlay = !this.autoplayButtonIsSetToPlay;
  }

  focusOutHandling(event) {
    const focusedOnAutoplayButton = event.target === this.sliderAutoplayButton || this.sliderAutoplayButton.contains(event.target);
    if (!this.autoplayButtonIsSetToPlay || focusedOnAutoplayButton) return;
    this.play();
  }

  focusInHandling(event) {
    const focusedOnAutoplayButton = event.target === this.sliderAutoplayButton || this.sliderAutoplayButton.contains(event.target);
    if (focusedOnAutoplayButton && this.autoplayButtonIsSetToPlay) {
      this.play();
    } else if (this.autoplayButtonIsSetToPlay) {
      this.pause();
    }
  }

  play() {
    this.slider.setAttribute('aria-live', 'off');
    clearInterval(this.autoplay);
    this.autoplay = setInterval(this.autoRotateSlides.bind(this), this.autoplaySpeed);
  }

  pause() {
    this.slider.setAttribute('aria-live', 'polite');
    clearInterval(this.autoplay);
  }

  togglePlayButtonState(pauseAutoplay) {
    if (pauseAutoplay) {
      this.sliderAutoplayButton.classList.add('slideshow__autoplay--paused');
      this.sliderAutoplayButton.setAttribute('aria-label', window.accessibilityStrings.playSlideshow);
    } else {
      this.sliderAutoplayButton.classList.remove('slideshow__autoplay--paused');
      this.sliderAutoplayButton.setAttribute('aria-label', window.accessibilityStrings.pauseSlideshow);
    }
  }

  autoRotateSlides() {
    const slideScrollPosition = this.currentPage === this.sliderItems.length ? 0 : this.slider.scrollLeft + this.slider.querySelector('.slideshow__slide').clientWidth;
    this.slider.scrollTo({
      left: slideScrollPosition
    });
  }

  setSlideVisibility() {
    this.sliderItemsToShow.forEach((item, index) => {
      const button = item.querySelector('a');
      if (index === this.currentPage - 1) {
        if (button) button.removeAttribute('tabindex');
        item.setAttribute('aria-hidden', 'false');
        item.removeAttribute('tabindex');
      } else {
        if (button) button.setAttribute('tabindex', '-1');
        item.setAttribute('aria-hidden', 'true');
        item.setAttribute('tabindex', '-1');
      }
    });
  }

  linkToSlide(event) {
    event.preventDefault();
    const slideScrollPosition = this.slider.scrollLeft + this.sliderFirstItemNode.clientWidth * (this.sliderControlLinksArray.indexOf(event.currentTarget) + 1 - this.currentPage);
    this.slider.scrollTo({
      left: slideScrollPosition
    });
  }
}

customElements.define('slideshow-component', SlideshowComponent);

class VariantSelects extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('change', this.onVariantChange);
  }

  onVariantChange() {
    this.updateOptions();
    this.updateMasterId();
    this.toggleAddButton(true, '', false);
    this.updatePickupAvailability();
    this.removeErrorMessage();

    if (!this.currentVariant) {
      this.toggleAddButton(true, '', true);
      this.setUnavailable();
    } else {
      this.updateMedia();
      this.updateURL();
      this.updateVariantInput();
      this.renderProductInfo();
      this.updateShareUrl();
    }
  }

  updateOptions() {
    this.options = Array.from(this.querySelectorAll('select'), (select) => select.value);
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options.map((option, index) => {
        return this.options[index] === option;
      }).includes(false);
    });
  }

  updateMedia() {
    if (!this.currentVariant) return;
    if (!this.currentVariant.featured_media) return;

    const mediaGallery = document.getElementById(`MediaGallery-${this.dataset.section}`);
    mediaGallery.setActiveMedia(`${this.dataset.section}-${this.currentVariant.featured_media.id}`, true);

    const modalContent = document.querySelector(`#ProductModal-${this.dataset.section} .product-media-modal__content`);
    if (!modalContent) return;
    const newMediaModal = modalContent.querySelector( `[data-media-id="${this.currentVariant.featured_media.id}"]`);
    modalContent.prepend(newMediaModal);
  }

  updateURL() {
    if (!this.currentVariant || this.dataset.updateUrl === 'false') return;
    window.history.replaceState({ }, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  updateShareUrl() {
    const shareButton = document.getElementById(`Share-${this.dataset.section}`);
    if (!shareButton || !shareButton.updateUrl) return;
    shareButton.updateUrl(`${window.shopUrl}${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  updateVariantInput() {
    const productForms = document.querySelectorAll(`#product-form-${this.dataset.section}, #product-form-installment-${this.dataset.section}`);
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  updatePickupAvailability() {
    const pickUpAvailability = document.querySelector('pickup-availability');
    if (!pickUpAvailability) return;

    if (this.currentVariant && this.currentVariant.available) {
      pickUpAvailability.fetchAvailability(this.currentVariant.id);
    } else {
      pickUpAvailability.removeAttribute('available');
      pickUpAvailability.innerHTML = '';
    }
  }

  removeErrorMessage() {
    const section = this.closest('section');
    if (!section) return;

    const productForm = section.querySelector('product-form');
    if (productForm) productForm.handleErrorMessage();
  }

  renderProductInfo() {
    const requestedVariantId = this.currentVariant.id;
    const sectionId = this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section;
    
    fetch(`${this.dataset.url}?variant=${this.currentVariant.id}&section_id=${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`)
      .then((response) => response.text())
      .then((responseText) => {
        const html = new DOMParser().parseFromString(responseText, 'text/html')
        const destination = document.getElementById(`price-${this.dataset.section}`);
        const source = html.getElementById(`price-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);
        const skuSource = html.getElementById(`Sku-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);
        const skuDestination = document.getElementById(`Sku-${this.dataset.section}`);
        const inventorySource = html.getElementById(`Inventory-${this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section}`);
        const inventoryDestination = document.getElementById(`Inventory-${this.dataset.section}`);
        
        if (source && destination) destination.innerHTML = source.innerHTML;
        if (inventorySource && inventoryDestination) inventoryDestination.innerHTML = inventorySource.innerHTML;
        if (skuSource && skuDestination) {
          skuDestination.innerHTML = skuSource.innerHTML;
          skuDestination.classList.toggle('visibility-hidden', skuSource.classList.contains('visibility-hidden'));
        }

        const price = document.getElementById(`price-${this.dataset.section}`);

        if (price) price.classList.remove('visibility-hidden');

        if (inventoryDestination) inventoryDestination.classList.toggle('visibility-hidden', inventorySource.innerText === '');
        
        this.toggleAddButton(!this.currentVariant.available, window.variantStrings.soldOut);
      });
  }

  toggleAddButton(disable = true, text, modifyClass = true) {
    const productForm = document.getElementById(`product-form-${this.dataset.section}`);
    if (!productForm) return;
    const addButton = productForm.querySelector('[name="add"]');
    const addButtonText = productForm.querySelector('[name="add"] > span');
    if (!addButton) return;

    if (disable) {
      addButton.setAttribute('disabled', 'disabled');
      if (text) addButtonText.textContent = text;
    } else {
      addButton.removeAttribute('disabled');
      addButtonText.textContent = window.variantStrings.addToCart;
    }

    if (!modifyClass) return;
  }

  setUnavailable() {
    const button = document.getElementById(`product-form-${this.dataset.section}`);
    const addButton = button.querySelector('[name="add"]');
    const addButtonText = button.querySelector('[name="add"] > span');
    const price = document.getElementById(`price-${this.dataset.section}`);
    if (!addButton) return;
    addButtonText.textContent = window.variantStrings.unavailable;
    if (price) price.classList.add('visibility-hidden');
  }

  getVariantData() {
    this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }
}

customElements.define('variant-selects', VariantSelects);

class VariantRadios extends VariantSelects {
  constructor() {
    super();
  }

  updateOptions() {
    const fieldsets = Array.from(this.querySelectorAll('fieldset'));
    this.options = fieldsets.map((fieldset) => {
      return Array.from(fieldset.querySelectorAll('input')).find((radio) => radio.checked).value;
    });
  }
}

customElements.define('variant-radios', VariantRadios);

// Wishlist ~ Fireweb
window.addEventListener('DOMContentLoaded', (event) => {
  const egWishlistDrawerElem = document.querySelector('#eg-wishlist-drawer')
  const localStorageKey = 'eg_wishlist_v1';

  // Init Bootstrap script if 
  const initBootstrapScript = () => {
      if (!document.querySelector('#bootstrap-js')) {
          const script = document.createElement('script')
          script.setAttribute('id', 'bootstrap-js')
          script.setAttribute('src', 'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.min.js')
          script.setAttribute('integrity', 'sha256-cMPWkL3FzjuaFSfEYESYmjF25hCIL6mfRSPnW8OVvM4=')
          script.setAttribute('crossorigin', 'anonymous')
          document.head.appendChild(script)
      }
  }
  initBootstrapScript()

  // Open the wishlist drawer by URL if contains '#wishlist'
  if (window.location.hash.includes('#wishlist')) {
      setTimeout(() => {
          const offcanvas = bootstrap.Offcanvas.getOrCreateInstance(egWishlistDrawerElem)
          offcanvas.show()
      }, 200)
  }

  // Shopify resize image (helper function)
  // https://gist.github.com/DanWebb/cce6ab34dd521fcac6ba
  const egWishlistResizeImageHelper = (src, size, crop = '') => src.replace(/_(pico|icon|thumb|small|compact|medium|large|grande|original|1024x1024|2048x2048|master)+\./g, '.')
  .replace(/\.jpg|\.png|\.gif|\.jpeg/g, (match) => {
      if (crop.length) {
          // eslint-disable-next-line no-param-reassign
          crop = `_crop_${crop}`;
      }
      return `_${size}${crop}${match}`;
  });

  // Shopify format money (helper function)
  // https://gist.github.com/stewartknapman/8d8733ea58d2314c373e94114472d44c
  const egWishlistFormatMoneyHelper = (cents, format) => {
      if (typeof cents === 'string') {
          // eslint-disable-next-line no-param-reassign
          cents = cents.replace('.', '');
      }
      let value = '';
      const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
      const formatString = (format || document.querySelector('#eg-wishlist-drawer').dataset.moneyFormat);

      function defaultOption(opt, def) {
          return (typeof opt === 'undefined' ? def : opt);
      }

      function formatWithDelimiters(number, precision, thousands, decimal) {
          // eslint-disable-next-line no-param-reassign
          precision = defaultOption(precision, 2);
          // eslint-disable-next-line no-param-reassign
          thousands = defaultOption(thousands, ',');
          // eslint-disable-next-line no-param-reassign
          decimal = defaultOption(decimal, '.');

          if (Number.isNaN(number) || number == null) { return 0; }

          // eslint-disable-next-line no-param-reassign
          number = (number / 100.0).toFixed(precision);

          const parts = number.split('.');
          // eslint-disable-next-line prefer-template
          const dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
          // eslint-disable-next-line no-param-reassign
          cents = parts[1] ? (decimal + parts[1]) : '';

          return dollars + cents;
      }

      // eslint-disable-next-line default-case
      switch (formatString.match(placeholderRegex)[1]) {
      case 'amount': value = formatWithDelimiters(cents, 2); break;
      case 'amount_no_decimals': value = formatWithDelimiters(cents, 0); break;
      case 'amount_with_comma_separator': value = formatWithDelimiters(cents, 2, '.', ','); break;
      case 'amount_no_decimals_with_comma_separator': value = formatWithDelimiters(cents, 0, '.', ','); break;
      }

      return formatString.replace(placeholderRegex, value);
  };


  // Dynamically add wishlist icons in the header
  const insertWishlistIconsHeader = () => {
      const htmlToInsert = `
          <a 
              id="wishlist-icon-bubble" 
              class="header__icon header__icon--wishlist link focus-inset small-hide medium-hide"
              href="#eg-wishlist-drawer" 
              role="button" 
              data-bs-toggle="offcanvas" 
              aria-controls="eg-wishlist-drawer">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="icon icon-wishlist bi bi-heart" viewBox="0 0 16 16" style="fill: currentColor;">
                  <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z"></path>
              </svg>
              <span class="visually-hidden">
                  ${egWishlistDrawerElem.dataset.textWishlist}
              </span>
              <div 
                  class="wishlist-count-bubble" 
                  style="display: none;" 
                  aria-hidden="true">
              </div>
          </a>
      `
      const cartIcon = document.querySelector('#cart-icon-bubble')
      const menuTogglerIcon = document.querySelector('#Details-menu-drawer-container')

      if (cartIcon) {
          cartIcon.insertAdjacentHTML('beforebegin', htmlToInsert)
      }

      if (menuTogglerIcon) {
          menuTogglerIcon.insertAdjacentHTML('afterend', htmlToInsert)
      }
  }
  insertWishlistIconsHeader()

  // Dynamically add the wishlist button in the PDP (product page)
  const insertWishlistBtnPdp = () => {
      if (egWishlistDrawerElem.dataset.displayBtnPdp === 'false') {
          return;
      }
      const htmlToInsert = `
          <button 
              class="button-add-remove-wishlist button button--full-width button--tertiary" 
              type="button"
              onclick="onClickEgWishlistButton(this, event)"
              style="display: none;">
              <span data-add>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="icon icon-wishlist bi bi-heart" viewBox="0 0 16 16">
                      <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z"/>
                  </svg>
                  ${egWishlistDrawerElem.dataset.textAdd}
              </span>
              <span data-remove>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="icon icon-wishlist bi bi-heart-fill" viewBox="0 0 16 16">
                      <path fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>
                  </svg>
                  ${egWishlistDrawerElem.dataset.textRemove}
              </span>
          </button>
      `
      const productForm = document.querySelector('.product .product-form')

      if (productForm) {
          productForm.insertAdjacentHTML('afterend', htmlToInsert)
      }
  }
  insertWishlistBtnPdp()

  // Dynamically add the wishlist buttons in the product list items
  const insertWishlistBtnLists = () => {
      if (egWishlistDrawerElem.dataset.displayBtnLists === 'false') {
          return;
      }
      const htmlToInsert = `
          <button 
              class="button-add-remove-wishlist button button--tertiary" 
              type="button"
              onclick="onClickEgWishlistButton(this, event)"
              style="display: none;">
              <span data-add>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="icon icon-wishlist bi bi-heart" viewBox="0 0 16 16">
                      <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z"/>
                  </svg>
                  <span class="visually-hidden">
                      ${egWishlistDrawerElem.dataset.textAdd}
                  </span>
              </span>
              <span data-remove>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="icon icon-wishlist bi bi-heart-fill" viewBox="0 0 16 16">
                      <path fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>
                  </svg>
                  <span class="visually-hidden">
                      ${egWishlistDrawerElem.dataset.textRemove}
                  </span>
              </span>
          </button>
      `
      document.querySelectorAll('.product-grid .card__inner').forEach((cardInner) => {
          cardInner.insertAdjacentHTML('beforeend', htmlToInsert)
      })
        // Inject the buttons again if the url changes (handle Shopify's ajax for filters)
      const lastUrl = location.href; 
      new MutationObserver(() => {
          if (location.href !== lastUrl) {
              document.querySelectorAll('.product-grid .card__inner').forEach((cardInner) => {
                  if (!cardInner.querySelector('.button-add-remove-wishlist')) {
                      cardInner.insertAdjacentHTML('beforeend', htmlToInsert)
                  }
              })
              initWishlist()
          }
      }).observe(document, {subtree: true, childList: true});
  }
  insertWishlistBtnLists()

  // Init Wishlist
  const initWishlist = () => {
      const wishlist = JSON.parse(localStorage.getItem(localStorageKey)) || [];

      document.querySelectorAll('.button-add-remove-wishlist').forEach((btn) => {
          const productHandle = btn.closest('[data-product-handle]')?.dataset.productHandle

          // if (!productHandle?.length) {
          //     console.log('%c You have not correctly implemented the Wishlist changes. Please contact us at Fireweb.fr', 'color: red')
          // }

          const isWishlisted = wishlist.some((elem) => elem.handle === productHandle)

          if (isWishlisted) {
              btn.querySelector('[data-add]').style.display = 'none'
              btn.querySelector('[data-remove]').style.display = 'inline-flex'
          } else {
              btn.querySelector('[data-add]').style.display = 'inline-flex'
              btn.querySelector('[data-remove]').style.display = 'none'
          }

          btn.style.display = 'block'
      });

      document.querySelectorAll('.wishlist-count-bubble').forEach((bubble) => {
          if (wishlist.length === 0) {
              bubble.style.display = 'none'
          } else {
              bubble.style.display = 'flex'
              bubble.textContent = wishlist.length
          }
      });
  };
  initWishlist();

  // Wishlist Buttons
  window.onClickEgWishlistButton = async (btn, event) => {
      event.preventDefault();

      const productHandle = btn.closest('[data-product-handle]')?.dataset.productHandle

      let wishlist = JSON.parse(localStorage.getItem(localStorageKey)) || [];
      const isWishlisted = wishlist.some((elem) => elem.handle === productHandle)

      if (isWishlisted) {
          wishlist = wishlist.filter((elem) => elem.handle !== productHandle)
      } else {
          const response = await fetch(`/products/${productHandle}.js`)
          const product = await response.json()

          console.log(product)

          wishlist.push({
              id: product.id,
              handle: productHandle,
              url: product.url,
              title: product.title,
              compare_at_price: product.compare_at_price,
              compare_at_price_variese: product.compare_at_price_varies,
              price: product.price,
              featured_image: product.featured_image,
              vendor: product.vendor,
              time: Date.now()
          })
      }

      localStorage.setItem(localStorageKey, JSON.stringify(wishlist))
      initWishlist()
      buildWishlistDrawer()
  };

  // Build Wishlist Drawer
  const buildWishlistDrawer = () => {
      const drawer = document.querySelector('#eg-wishlist-drawer')

      let wishlist = JSON.parse(localStorage.getItem(localStorageKey)) || []
      const drawerEmpty = drawer.querySelector('#eg-wishlist-drawer-empty')
      const drawerProductList = drawer.querySelector('#eg-wishlist-drawer-product-list')

      drawerProductList.innerHTML = ''

      if (wishlist.length === 0) {
          drawerEmpty.style.display = 'block'
          drawerProductList.style.display = 'none'
      } else {
          let buildProductListItems = '';

          wishlist.forEach((product) => {
              buildProductListItems += `
                  <li class="product-list-item">
                      <div class="d-flex align-items-center mx-n3 py-3">
                          <a href="${product.url}" class="d-block flex-shrink-0 me-3">
                              <img 
                                  class="cart-item__image img__wishlist img-fluid" 
                                  src="${egWishlistResizeImageHelper(product.featured_image || 'no-image.gif', `${drawer.dataset.imgWidth}x${drawer.dataset.imgHeight}`, 'center')}"
                                  alt="" 
                                  width="${drawer.dataset.imgWidth}"
                                  height="${drawer.dataset.imgHeight}"
                                  style="display: block" 
                                  loading="lazy">
                          </a>
                          <div class="w-100">
                              <a href="${product.url}" class="cart-item__name h4 break mb-1">
                                  ${product.title}
                              </a>
                              <div class="product-price-container product-option mb-2">
                                  <s class="product-price-compare me-2" style="${product.compare_at_price > product.price ? '' : 'display: none;'}">
                                      <span class="visually-hidden">
                                          Old price
                                      </span>
                                      ${egWishlistFormatMoneyHelper(product.compare_at_price)}
                                  </s>
                                  <span class="product-price-final">
                                      ${egWishlistFormatMoneyHelper(product.price)}
                                  </span>
                              </div>
                          </div>
                          <button 
                              class="btn-remove-from-wishlist button button--tertiary px-2 ms-3"
                              aria-label="${drawer.dataset.textRemove}"
                              data-product-handle="${product.handle}">
                              <svg width="15" height="15" class="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" aria-hidden="true" focusable="false" role="presentation" class="icon icon-remove">
                                  <path d="M14 3h-3.53a3.07 3.07 0 00-.6-1.65C9.44.82 8.8.5 8 .5s-1.44.32-1.87.85A3.06 3.06 0 005.53 3H2a.5.5 0 000 1h1.25v10c0 .28.22.5.5.5h8.5a.5.5 0 00.5-.5V4H14a.5.5 0 000-1zM6.91 1.98c.23-.29.58-.48 1.09-.48s.85.19 1.09.48c.2.24.3.6.36 1.02h-2.9c.05-.42.17-.78.36-1.02zm4.84 11.52h-7.5V4h7.5v9.5z" fill="currentColor"></path>
                                  <path d="M6.55 5.25a.5.5 0 00-.5.5v6a.5.5 0 001 0v-6a.5.5 0 00-.5-.5zM9.45 5.25a.5.5 0 00-.5.5v6a.5.5 0 001 0v-6a.5.5 0 00-.5-.5z" fill="currentColor"></path>
                              </svg>
                          </button>
                      </div>
                  </li>
              `;
          });

          drawerProductList.insertAdjacentHTML('afterbegin', buildProductListItems);

          drawerEmpty.style.display = 'none'
          drawerProductList.style.display = 'block'

          document.querySelectorAll('.btn-remove-from-wishlist:not(.init)').forEach((btn) => {
              btn.addEventListener('click', (e) => {
                  e.preventDefault();

                  btn.classList.add('init');

                  wishlist = wishlist.filter((elem) => elem.handle !== btn.dataset.productHandle);
                  localStorage.setItem(localStorageKey, JSON.stringify(wishlist));

                  initWishlist();
                  buildWishlistDrawer();
              });
          });
      }
  };
  buildWishlistDrawer();
})

// Parallax ~ Fireweb
!function(t,i){var a=function(e){i(t.lazySizes,e),t.removeEventListener("lazyunveilread",a,!0)};i=i.bind(null,t,t.document),"object"==typeof module&&module.exports?i(require("lazysizes")):t.lazySizes?a():t.addEventListener("lazyunveilread",a,!0)}(window,function(e,t,i,a){"use strict";var r=t.createElement("a").style;(t="objectFit"in r)&&t&&"objectPosition"in r||(r=function(e){},e.addEventListener("lazyunveilread",r,!0),a&&a.detail)}),function(e,t){var i=function(){t(e.lazySizes),e.removeEventListener("lazyunveilread",i,!0)};t=t.bind(null,e,e.document),"object"==typeof module&&module.exports?t(require("lazysizes")):e.lazySizes?i():e.addEventListener("lazyunveilread",i,!0)}(window,function(o,c,u){"use strict";function f(e,t,i){var r,n,s,a=0,o=0,l=i;if(e){if("container"===t.ratio){for(a=l.scrollWidth,o=l.scrollHeight;!(a&&o||l===c);)a=(l=l.parentNode).scrollWidth,o=l.scrollHeight;a&&o&&(t.ratio=o/a)}r=e,n=t,(s=[]).srcset=[],n.absUrl&&(E.setAttribute("href",r),r=E.href),r=((n.prefix||"")+r+(n.postfix||"")).replace(h,function(e,t){return d[typeof n[t]]?n[t]:e}),n.widths.forEach(function(e){var t=n.widthmap[e]||e,i=n.aspectratio||n.ratio,a=!n.aspectratio&&p.traditionalRatio,i={u:r.replace(v,t).replace(b,i?a?Math.round(e*i):Math.round(e/i):""),w:e};s.push(i),s.srcset.push(i.c=i.u+" "+e+"w")}),(e=s).isPicture=t.isPicture,_&&"IMG"==i.nodeName.toUpperCase()?i.removeAttribute(g.srcsetAttr):i.setAttribute(g.srcsetAttr,e.srcset.join(", ")),Object.defineProperty(i,"_lazyrias",{value:e,writable:!0})}}function z(e,t){return t=function(r,e){function i(e,t){var i,a=r.getAttribute("data-"+e);if(a||(i=n.getPropertyValue("--ls-"+e))&&(a=i.trim()),a){if("true"==a)a=!0;else if("false"==a)a=!1;else if(l.test(a))a=parseFloat(a);else if("function"==typeof p[e])a=p[e](r,a);else if(A.test(a))try{a=JSON.parse(a)}catch(e){}s[e]=a}else e in p&&"function"!=typeof p[e]?s[e]=p[e]:t&&"function"==typeof p[e]&&(s[e]=p[e](r,a))}var t,n=o.getComputedStyle(r),a=r.parentNode,s={isPicture:!(!a||!m.test(a.nodeName||""))};for(t in p)i(t);return e.replace(h,function(e,t){t in s||i(t,!0)}),s}(e,t),p.modifyOptions.call(e,{target:e,details:t,detail:t}),u.fire(e,"lazyriasmodifyoptions",t),t}function y(e){return e.getAttribute(e.getAttribute("data-srcattr")||p.srcAttr)||e.getAttribute(g.srcsetAttr)||e.getAttribute(g.srcAttr)||e.getAttribute("data-pfsrcset")||""}var g,p,d={string:1,number:1},l=/^\-*\+*\d+\.*\d*$/,m=/^picture$/i,v=/\s*\{\s*width\s*\}\s*/i,b=/\s*\{\s*height\s*\}\s*/i,h=/\s*\{\s*([a-z0-9]+)\s*\}\s*/gi,A=/^\[.*\]|\{.*\}$/,C=/^(?:auto|\d+(px)?)$/,E=c.createElement("a"),e=c.createElement("img"),_="srcset"in e&&!("sizes"in e),w=!!o.HTMLPictureElement&&!_;!function(){var e,t={prefix:"",postfix:"",srcAttr:"data-src",absUrl:!1,modifyOptions:function(){},widthmap:{},ratio:!1,traditionalRatio:!1,aspectratio:!1};for(e in(g=u&&u.cfg||o.lazySizesConfig)||(g={},o.lazySizesConfig=g),g.rias||(g.rias={}),"widths"in(p=g.rias)||(p.widths=[],function(e){for(var t,i=0;!t||t<3e3;)30<(i+=5)&&(i+=1),t=36*i,e.push(t)}(p.widths)),t)e in p||(p[e]=t[e])}(),addEventListener("lazybeforesizes",function(e){var t,i,a,r,n,s,o,l,c,d;if(e.detail.instance==u&&(t=e.target,e.detail.dataAttr&&!e.defaultPrevented&&!p.disabled&&(l=t.getAttribute(g.sizesAttr)||t.getAttribute("sizes"))&&C.test(l))){if(i=z(t,e=y(t)),c=v.test(i.prefix)||v.test(i.postfix),i.isPicture&&(a=t.parentNode))for(n=0,s=(r=a.getElementsByTagName("source")).length;n<s;n++)(c||v.test(o=y(r[n])))&&(f(o,i,r[n]),d=!0);c||v.test(e)?(f(e,i,t),d=!0):d&&((e=[]).srcset=[],e.isPicture=!0,Object.defineProperty(t,"_lazyrias",{value:e,writable:!0})),d&&(w?t.removeAttribute(g.srcAttr):"auto"!=l&&(l={width:parseInt(l,10)},S({target:t,detail:l})))}},!0)}),function(e){var t=function(a,f){"use strict";if(f.getElementsByClassName){var z,y,g=f.documentElement,n=a.Date,r=a.HTMLPictureElement,s="addEventListener",p="getAttribute",e=a[s],c=a.setTimeout,i=a.requestAnimationFrame||c,o=a.requestIdleCallback,d=/^picture$/i,l=["load","error","lazyincluded","_lazyloaded"],u={},m=Array.prototype.forEach,v=function(e,t){return u[t]||(u[t]=new RegExp("(\\s|^)"+t+"(\\s|$)")),u[t].test(e[p]("class")||"")&&u[t]},b=function(e,t){v(e,t)||e.setAttribute("class",(e[p]("class")||"").trim()+" "+t)},h=function(e,t){(t=v(e,t))&&e.setAttribute("class",(e[p]("class")||"").replace(t," "))},A=function(t,i,e){var a=e?s:"removeEventListener";e&&A(t,i),l.forEach(function(e){t[a](e,i)})},C=function(e,t,i,a,r){var n=f.createEvent("Event");return(i=i||{}).instance=z,n.initEvent(t,!a,!r),n.detail=i,e.dispatchEvent(n),n},E=function(e,t){var i;!r&&(i=a.picturefill||y.pf)?(t&&t.src&&!e[p]("srcset")&&e.setAttribute("srcset",t.src),i({reevaluate:!0,elements:[e]})):t&&t.src&&(e.src=t.src)},_=function(e,t){return(getComputedStyle(e,null)||{})[t]},w=function(e,t,i){for(i=i||e.offsetWidth;i<y.minSize&&t&&!e._lazysizesWidth;)i=t.offsetWidth,t=t.parentNode;return i},S=(ge=[],pe=ye=[],we._lsFlush=_e,we),t=function(i,e){return e?function(){S(i)}:function(){var e=this,t=arguments;S(function(){i.apply(e,t)})}},L=function(e){function t(){i=null,e()}var i,a,r=function(){var e=n.now()-a;e<99?c(r,99-e):(o||t)(t)};return function(){a=n.now(),i=i||c(r,99)}};!function(){var e,t={lazyClass:"lazyload",loadedClass:"lazyloaded",loadingClass:"lazyloading",preloadClass:"lazypreload",errorClass:"lazyerror",autosizesClass:"lazyautosizes",srcAttr:"data-src",srcsetAttr:"data-srcset",sizesAttr:"data-sizes",minSize:40,customMedia:{},init:!0,expFactor:1.5,hFac:.8,loadMode:2,loadHidden:!0,ricTimeout:0,throttleDelay:125};for(e in y=a.lazySizesConfig||a.lazysizesConfig||{},t)e in y||(y[e]=t[e]);a.lazySizesConfig=y,c(function(){y.init&&x()})}();var P=(Z=/^img$/i,ee=/^iframe$/i,te="onscroll"in a&&!/(gle|ing)bot/.test(navigator.userAgent),re=-1,J=be,G=ae=ie=0,K=y.throttleDelay,X=y.ricTimeout,Y=o&&49<X?function(){o(Ee,{timeout:X}),X!==y.ricTimeout&&(X=y.ricTimeout)}:t(function(){c(Ee)},!0),se=t(he),oe=function(e){se({target:e.target})},le=t(function(t,e,i,a,r){var n,s,o,l;(o=C(t,"lazybeforeunveil",e)).defaultPrevented||(a&&(i?b(t,y.autosizesClass):t.setAttribute("sizes",a)),i=t[p](y.srcsetAttr),a=t[p](y.srcAttr),r&&(s=(n=t.parentNode)&&d.test(n.nodeName||"")),l=e.firesLoad||"src"in t&&(i||a||s),o={target:t},b(t,y.loadingClass),l&&(clearTimeout($),$=c(me,2500),A(t,oe,!0)),s&&m.call(n.getElementsByTagName("source"),Ae),i?t.setAttribute("srcset",i):a&&!s&&(ee.test(t.nodeName)?function(t,i){try{t.contentWindow.location.replace(i)}catch(e){t.src=i}}(t,a):t.src=a),r&&(i||s)&&E(t,{src:a})),t._lazyRace&&delete t._lazyRace,h(t,y.lazyClass),S(function(){var e=t.complete&&1<t.naturalWidth;l&&!e||(e&&b(t,"ls-is-cached"),he(o),t._lazyCache=!0,c(function(){"_lazyCache"in t&&delete t._lazyCache},9)),"lazy"==t.loading&&ae--},!0)}),de=L(function(){y.loadMode=3,ne()}),ue=function(){O||(n.now()-R<999?c(ue,999):(O=!0,y.loadMode=3,ne(),e("scroll",Ce,!0)))},{_:function(){R=n.now(),z.elements=f.getElementsByClassName(y.lazyClass),T=f.getElementsByClassName(y.lazyClass+" "+y.preloadClass),e("scroll",ne,!0),e("resize",ne,!0),a.MutationObserver?new MutationObserver(ne).observe(g,{childList:!0,subtree:!0,attributes:!0}):(g[s]("DOMNodeInserted",ne,!0),g[s]("DOMAttrModified",ne,!0),setInterval(ne,999)),e("hashchange",ne,!0),["focus","mouseover","click","load","transitionend","animationend","webkitAnimationEnd"].forEach(function(e){f[s](e,ne,!0)}),/d$|^c/.test(f.readyState)?ue():(e("load",ue),f[s]("DOMContentLoaded",ne),c(ue,2e4)),z.elements.length?(be(),S._lsFlush()):ne()},checkElems:ne=function(e){var t;(e=!0===e)&&(X=33),Q||(Q=!0,(t=K-(n.now()-G))<0&&(t=0),e||t<9?Y():c(Y,t))},unveil:ce=function(e){var t,i,a,r;e._lazyRace||(!(r="auto"==(a=(i=Z.test(e.nodeName))&&(e[p](y.sizesAttr)||e[p]("sizes"))))&&O||!i||!e[p]("src")&&!e.srcset||e.complete||v(e,y.errorClass)||!v(e,y.lazyClass))&&(t=C(e,"lazyunveilread").detail,r&&N.updateElem(e,!0,e.offsetWidth),e._lazyRace=!0,ae++,le(e,t,r,a,i))},_aLSL:Ce}),N=(W=t(function(e,t,i,a){var r,n,s;if(e._lazysizesWidth=a,a+="px",e.setAttribute("sizes",a),d.test(t.nodeName||""))for(n=0,s=(r=t.getElementsByTagName("source")).length;n<s;n++)r[n].setAttribute("sizes",a);i.detail.dataAttr||E(e,i.detail)}),{_:function(){M=f.getElementsByClassName(y.autosizesClass),e("resize",j)},checkElems:j=L(function(){var e,t=M.length;if(t)for(e=0;e<t;e++)F(M[e])}),updateElem:F}),x=function(){x.i||(x.i=!0,N._(),P._())};return z={cfg:y,autoSizer:N,loader:P,init:x,uP:E,aC:b,rC:h,hC:v,fire:C,gW:w,rAF:S}}function F(e,t,i){var a=e.parentNode;a&&(i=w(e,a,i),(t=C(e,"lazybeforesizes",{width:i,dataAttr:!!t})).defaultPrevented||(i=t.detail.width)&&i!==e._lazysizesWidth&&W(e,a,t,i))}var M,W,j,T,O,$,H,R,k,q,B,D,I,U,V,J,Q,G,K,X,Y,Z,ee,te,ie,ae,re,ne,se,oe,le,ce,de,ue,fe,ze,ye,ge,pe;function me(e){ae--,e&&!(ae<0)&&e.target||(ae=0)}function ve(e){return null==V&&(V="hidden"==_(f.body,"visibility")),V||"hidden"!=_(e.parentNode,"visibility")&&"hidden"!=_(e,"visibility")}function be(){var e,t,i,a,r,n,s,o,l,c,d,u=z.elements;if((H=y.loadMode)&&ae<8&&(e=u.length)){for(t=0,re++;t<e;t++)if(u[t]&&!u[t]._lazyRace)if(!te||z.prematureUnveil&&z.prematureUnveil(u[t]))ce(u[t]);else if((s=u[t][p]("data-expand"))&&(r=+s)||(r=ie),l||(l=!y.expand||y.expand<1?500<g.clientHeight&&500<g.clientWidth?500:370:y.expand,c=(z._defEx=l)*y.expFactor,d=y.hFac,V=null,ie<c&&ae<1&&2<re&&2<H&&!f.hidden?(ie=c,re=0):ie=1<H&&1<re&&ae<6?l:0),o!==r&&(k=innerWidth+r*d,q=innerHeight+r,n=-1*r,o=r),c=u[t].getBoundingClientRect(),(U=c.bottom)>=n&&(B=c.top)<=q&&(I=c.right)>=n*d&&(D=c.left)<=k&&(U||I||D||B)&&(y.loadHidden||ve(u[t]))&&(O&&ae<3&&!s&&(H<3||re<4)||function(e,t){var i,a=e,r=ve(e);for(B-=t,U+=t,D-=t,I+=t;r&&(a=a.offsetParent)&&a!=f.body&&a!=g;)(r=0<(_(a,"opacity")||1))&&"visible"!=_(a,"overflow")&&(i=a.getBoundingClientRect(),r=I>i.left&&D<i.right&&U>i.top-1&&B<i.bottom+1);return r}(u[t],r))){if(ce(u[t]),a=!0,9<ae)break}else!a&&O&&!i&&ae<4&&re<4&&2<H&&(T[0]||y.preloadAfterLoad)&&(T[0]||!s&&(U||I||D||B||"auto"!=u[t][p](y.sizesAttr)))&&(i=T[0]||u[t]);i&&!a&&ce(i)}}function he(e){var t=e.target;t._lazyCache?delete t._lazyCache:(me(e),b(t,y.loadedClass),h(t,y.loadingClass),A(t,oe),C(t,"lazyloaded"))}function Ae(e){var t,i=e[p](y.srcsetAttr);(t=y.customMedia[e[p]("data-media")||e[p]("media")])&&e.setAttribute("media",t),i&&e.setAttribute("srcset",i)}function Ce(){3==y.loadMode&&(y.loadMode=2),de()}function Ee(){Q=!1,G=n.now(),J()}function _e(){var e=pe;for(pe=ye.length?ge:ye,ze=!(fe=!0);e.length;)e.shift()();fe=!1}function we(e,t){fe&&!t?e.apply(this,arguments):(pe.push(e),ze||(ze=!0,(f.hidden?c:i)(_e)))}}(e,e.document);e.lazySizes=t,"object"==typeof module&&module.exports&&(module.exports=t)}(window),function(e,t){var i=function(){t(e.lazySizes),e.removeEventListener("lazyunveilread",i,!0)};t=t.bind(null,e,e.document),"object"==typeof module&&module.exports?t(require("lazysizes")):e.lazySizes?i():e.addEventListener("lazyunveilread",i,!0)}(window,function(l,e,i){"use strict";var c,s,o,d,u;l.addEventListener&&(c=/\s+(\d+)(w|h)\s+(\d+)(w|h)/,s=/parent-fit["']*\s*:\s*["']*(contain|cover|width)/,o=/parent-container["']*\s*:\s*["']*(.+?)(?=(\s|$|,|'|"|;))/,d=/^picture$/i,u={getParent:function(e,t){var i=e,a=e.parentNode;return t&&"prev"!=t||!a||!d.test(a.nodeName||"")||(a=a.parentNode),"self"!=t&&(i="prev"==t?e.previousElementSibling:t&&(a.closest||l.jQuery)&&(a.closest?a.closest(t):jQuery(a).closest(t)[0])||a),i},getFit:function(e){var t,i,a=getComputedStyle(e,null)||{},r=a.content||a.fontFamily,n={fit:e._lazysizesParentFit||e.getAttribute("data-parent-fit")};return!n.fit&&r&&(t=r.match(s))&&(n.fit=t[1]),n.fit?(!(i=e._lazysizesParentContainer||e.getAttribute("data-parent-container"))&&r&&(t=r.match(o))&&(i=t[1]),n.parent=u.getParent(e,i)):n.fit=a.objectFit,n},getImageRatio:function(e){for(var t,i,a,r,n=e.parentNode,s=n&&d.test(n.nodeName||"")?n.querySelectorAll("source, img"):[e],o=0;o<s.length;o++)if(r=(e=s[o]).getAttribute(lazySizesConfig.srcsetAttr)||e.getAttribute("srcset")||e.getAttribute("data-pfsrcset")||e.getAttribute("data-risrcset")||"",t=e._lsMedia||e.getAttribute("media"),t=lazySizesConfig.customMedia[e.getAttribute("data-media")||t]||t,r&&(!t||(l.matchMedia&&matchMedia(t)||{}).matches)){(i=parseFloat(e.getAttribute("data-aspectratio")))||(r=(r=r.match(c))?"w"==r[2]?(a=r[1],r[3]):(a=r[3],r[1]):(a=e.getAttribute("width"),e.getAttribute("height")),i=a/r);break}return i},calculateSize:function(e,t){var i,a,r=(n=this.getFit(e)).fit,n=n.parent;return"width"==r||("contain"==r||"cover"==r)&&(a=this.getImageRatio(e))?(n?t=n.clientWidth:n=e,e=t,"width"==r?e=t:40<(n=n.clientHeight)&&(i=t/n)&&("cover"==r&&i<a||"contain"==r&&a<i)&&(e=t*(a/i)),e):t}},i.parentFit=u,e.addEventListener("lazybeforesizes",function(e){var t;e.defaultPrevented||e.detail.instance!=i||(t=e.target,e.detail.width=u.calculateSize(t,e.detail.width))}))}),function(e,t){var i=function(){t(e.lazySizes),e.removeEventListener("lazyunveilread",i,!0)};t=t.bind(null,e,e.document),"object"==typeof module&&module.exports?t(require("lazysizes")):e.lazySizes?i():e.addEventListener("lazyunveilread",i,!0)}(window,function(a,e,t){"use strict";var i,r=t&&t.cfg,n="sizes"in(s=e.createElement("img"))&&"srcset"in s,s=void Array.prototype.forEach;r.supportsType||(r.supportsType=function(e){return!e}),a.HTMLPictureElement&&n?!t.hasHDescriptorFix&&e.msElementsFromPoint&&(t.hasHDescriptorFix=!0,s()):a.picturefill||r.pf||(r.pf=function(e){var t,i;if(!a.picturefill)for(t=0,i=e.elements.length;t<i;t++)(void 0)(e.elements[t])},r.loadedClass&&r.loadingClass&&(i=[],['img[sizes$="px"][srcset].',"picture > img:not([srcset])."].forEach(function(e){i.push(e+r.loadedClass),i.push(e+r.loadingClass)}),r.pf({elements:e.querySelectorAll(i.join(", "))})))}),function(e,t){var i=function(){t(e.lazySizes),e.removeEventListener("lazyunveilread",i,!0)};t=t.bind(null,e,e.document),"object"==typeof module&&module.exports?t(require("lazysizes")):e.lazySizes?i():e.addEventListener("lazyunveilread",i,!0)}(window,function(e,l,d){"use strict";var u,f,z,a,r,y;e.addEventListener&&(u=/\s+/g,f=/\s*\|\s+|\s+\|\s*/g,z=/^(.+?)(?:\s+\[\s*(.+?)\s*\])(?:\s+\[\s*(.+?)\s*\])?$/,a=/\(|\)|'/,r={contain:1,cover:1},y=function(e){var t,i;e.target._lazybgset&&(i=(t=e.target)._lazybgset,(e=t.currentSrc||t.src)&&((e=d.fire(i,"bgsetproxy",{src:e,useSrc:a.test(e)?JSON.stringify(e):e})).defaultPrevented||(i.style.backgroundImage="url("+e.detail.useSrc+")")),t._lazybgsetLoading&&(d.fire(i,"_lazyloaded",{},!1,!0),delete t._lazybgsetLoading))},addEventListener("lazybeforeunveil",function(e){var t,i,a,r,n,s,o;!e.defaultPrevented&&(s=e.target.getAttribute("data-bgset"))&&(o=e.target,(t=l.createElement("img")).alt="",t._lazybgsetLoading=!0,e.detail.firesLoad=!0,i=s,a=o,e=t,r=l.createElement("picture"),n=a.getAttribute(lazySizesConfig.sizesAttr),s=a.getAttribute("data-ratio"),o=a.getAttribute("data-optimumx"),a._lazybgset&&a._lazybgset.parentNode==a&&a.removeChild(a._lazybgset),Object.defineProperty(e,"_lazybgset",{value:a,writable:!0}),Object.defineProperty(a,"_lazybgset",{value:r,writable:!0}),i=i.replace(u," ").split(f),r.style.display="none",e.className=lazySizesConfig.lazyClass,1!=i.length||n||(n="auto"),i.forEach(function(e){var t,i=l.createElement("source");n&&"auto"!=n&&i.setAttribute("sizes",n),(t=e.match(z))?(i.setAttribute(lazySizesConfig.srcsetAttr,t[1]),c(i,t[2]),c(i,t[3])):i.setAttribute(lazySizesConfig.srcsetAttr,e),r.appendChild(i)}),n&&(e.setAttribute(lazySizesConfig.sizesAttr,n),a.removeAttribute(lazySizesConfig.sizesAttr),a.removeAttribute("sizes")),o&&e.setAttribute("data-optimumx",o),s&&e.setAttribute("data-ratio",s),r.appendChild(e),a.appendChild(r),setTimeout(function(){d.loader.unveil(t),d.rAF(function(){d.fire(t,"_lazyloaded",{},!0,!0),t.complete&&y({target:t})})}))}),l.addEventListener("load",y,!0),e.addEventListener("lazybeforesizes",function(e){var t,i,a;e.detail.instance==d&&e.target._lazybgset&&e.detail.dataAttr&&(i=e.target._lazybgset,a=(getComputedStyle(i)||{getPropertyValue:function(){}}).getPropertyValue("background-size"),!r[a]&&r[i.style.backgroundSize]&&(a=i.style.backgroundSize),r[t=a]&&(e.target._lazysizesParentFit=t,d.rAF(function(){e.target.setAttribute("data-parent-fit",t),e.target._lazysizesParentFit&&delete e.target._lazysizesParentFit})))},!0),l.documentElement.addEventListener("lazybeforesizes",function(e){var t;!e.defaultPrevented&&e.target._lazybgset&&e.detail.instance==d&&(e.detail.width=(t=e.target._lazybgset,e=d.gW(t,t.parentNode),(!t._lazysizesWidth||e>t._lazysizesWidth)&&(t._lazysizesWidth=e),t._lazysizesWidth))}))});

// Animation ScrollReveal ~ Fireweb 
ScrollReveal({ 
  reset: false,
  distance: '60px',
  duration: 2000,
  delay: 400
});

// Animation ~ multicolumn footer
ScrollReveal().reveal('.multicolumn-list__item', { mobile: false, distance: '20px', delay: 300, origin: 'bottom', interval:100 });





  



//Ecoute la checkbox et active ou non l'upsell
document.querySelector("#bump-checkbox").addEventListener('change', function() {
  if(this.checked){
    var value = document.querySelector('#bump-checkbox').dataset.productId
    document.querySelector('#product-bump-form').innerHTML += '<input id="bumpProductIdInput" type="hidden" name="items[1][id]" value="' + value + '"><input id="bumpProductQuantityInput" type="hidden" name="items[1][quantity]" value="1"></input>'
  } else {
    document.querySelector('#bumpProductIdInput').remove()
    document.querySelector('#bumpProductQuantityInput').remove()
  }
})

//Modifie le comportement du add to cart de base pour cliquer sur celui de l'upsell (qui est invisible)
document.querySelector('#productMainSubmit').addEventListener('click', function(e) {
  e.preventDefault();
  document.querySelector('#addBumpToCart').click();
})

//Changement de variante -> Update image et ID
if(document.querySelector('.bump-select') != null) {
  document.querySelector('.bump-select').addEventListener('change', function () {
    document.querySelector('.bump-product-image').src = this.options[this.selectedIndex].dataset.variantImgsrc
    document.querySelector('.bump-product-price').innerHTML = this.options[this.selectedIndex].dataset.variantPrice
    document.querySelector('#bump-checkbox').dataset.productId = this.value
    if(document.querySelector('#bumpProductIdInput') != null) document.querySelector('#bumpProductIdInput').value = this.value
  })
} else {
  
}

//Formulaire de l'add to cart du bump
if (!customElements.get('product-bump-form')) {
    customElements.define('product-bump-form', class ProductBumpForm extends HTMLElement {
      constructor() {
        super();
        this.form = this.querySelector('form');
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        this.submitButton = this.querySelector('[type="submit"]');
        this.classicButton = document.querySelector('#productMainSubmit');
        if (document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');
      }
  
      onSubmitHandler(evt) {
        document.querySelectorAll('.mainProductInput').forEach(input => {
          input.remove()
        })
        var qty = 1
        if(document.querySelector('input[name=quantity]') != null) qty = document.querySelector('input[name=quantity]').value;
        document.querySelector('#product-bump-form').innerHTML += '<input class="mainProductInput" type="hidden" name="items[0][id]" value="' + document.querySelector('#mainSelectedProduct').value + '"><input class="mainProductInput" type="hidden" name="items[0][quantity]" value="' + qty +'">'
        
        evt.preventDefault();
        if (this.classicButton.getAttribute('aria-disabled') === 'true') return;
  
        this.handleErrorMessage();
  
        this.classicButton.setAttribute('aria-disabled', true);
        this.classicButton.classList.add('loading');
        this.classicButton.querySelector('.loading-overlay__spinner').classList.remove('hidden');
  
        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];
  
        const formData = new FormData(this.form);
        if (this.cart) {
          formData.append('sections', this.cart.getSectionsToRender().map((section) => section.id));
          formData.append('sections_url', window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;
  
        fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              this.handleErrorMessage(response.description);
  
              const soldOutMessage = this.classicButton.querySelector('.sold-out-message');
              if (!soldOutMessage) return;
              this.classicButton.setAttribute('aria-disabled', true);
              this.classicButton.querySelector('span').classList.add('hidden');
              soldOutMessage.classList.remove('hidden');
              this.error = true;
              return;
            } else if (!this.cart) {
              window.location = window.routes.cart_url;
              return;
            }
  
            this.error = false;
            const quickAddModal = this.closest('quick-add-modal');
            if (quickAddModal) {
              document.body.addEventListener('modalClosed', () => {
                setTimeout(() => { this.cart.renderContents(response) });
              }, { once: true });
              quickAddModal.hide(true);
            } else {
              this.cart.renderContents(response);
            }
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.classicButton.classList.remove('loading');
            if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
            if (!this.error) this.classicButton.removeAttribute('aria-disabled');
            this.classicButton.querySelector('.loading-overlay__spinner').classList.add('hidden');
          });
      }
  
      handleErrorMessage(errorMessage = false) {
        this.errorMessageWrapper = this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
        if (!this.errorMessageWrapper) return;
        this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');
  
        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);
  
        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }
    });
  }
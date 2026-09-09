const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbypLEImTucfBCqI27P53omAOFQHVZm1kI7t2fPHBRi6sfa7snlyuCo8uJNwnkDyJ5dPew/exec';
const FLAVORS = ['Кокосова', 'Шоколадна', 'Керобова'];
const FLAVOR_IMAGES = {
    Кокосова: 'images/flavor-1.jpg',
    Шоколадна: 'images/flavor-2.jpg',
    Керобова: 'images/flavor-3.jpg'
};
const STORAGE_KEY = 'proteinka-cart';
const CART_HISTORY_KEY = 'proteinkaCartOpen';

const orderForm = document.querySelector('.order-form');
const cartDrawer = document.querySelector('.cart-drawer');
const cartOverlay = document.querySelector('.cart-overlay');
const cartContent = document.querySelector('.cart-content');
const cartView = document.querySelector('.cart-view');
const cartItems = document.querySelector('.cart-items');
const cartEmpty = document.querySelector('.cart-empty');
const cartPricing = document.querySelector('.cart-pricing');
const cartHint = document.querySelector('.cart-hint');
const summaryTotal = document.querySelector('.summary-total');
const cartCount = document.querySelector('.cart-count');
const cartHeaderTotal = document.querySelector('.cart-header-total');
const addButtons = document.querySelectorAll('.add-to-cart');
const cartToast = document.querySelector('.cart-toast');

let cart = loadCart();
let toastTimer;

function createEmptyCart() {
    return { Кокосова: 0, Шоколадна: 0, Керобова: 0 };
}

function loadCart() {
    const emptyCart = createEmptyCart();

    try {
        const savedCart = JSON.parse(localStorage.getItem(STORAGE_KEY));

        FLAVORS.forEach(function(flavor) {
            const quantity = Number(savedCart && savedCart[flavor]);
            emptyCart[flavor] = Number.isInteger(quantity) && quantity > 0 ? quantity : 0;
        });
    } catch (error) {
        console.warn('Не вдалося завантажити кошик:', error);
    }

    return emptyCart;
}

function saveCart() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
        console.warn('Не вдалося зберегти кошик:', error);
    }
}

function getTotalQuantity() {
    return FLAVORS.reduce(function(total, flavor) {
        return total + cart[flavor];
    }, 0);
}

function getSelectedFlavorCount() {
    return FLAVORS.filter(function(flavor) {
        return cart[flavor] > 0;
    }).length;
}

function getUnitPrice(quantity) {
    if (quantity >= 10) return 25;
    if (quantity >= 6) return 27;
    return quantity > 0 ? 30 : 0;
}

function getCartData() {
    const quantity = getTotalQuantity();
    const unitPrice = getUnitPrice(quantity);

    return {
        quantity,
        unitPrice,
        total: quantity * unitPrice
    };
}

function getPriceHint(quantity) {
    if (quantity === 0) return '';
    if (quantity < 6) return 'Додайте ще ' + (6 - quantity) + ' шт. — і кожна коштуватиме 27 грн.';
    if (quantity < 10) return 'Додайте ще ' + (10 - quantity) + ' шт. — і кожна коштуватиме 25 грн.';
    return 'Для вас діє найвигідніша ціна — 25 грн/шт.';
}

function openCart(options) {
    if (!cartDrawer || !cartOverlay) return;

    const fromHistory = options && options.fromHistory;

    if (!fromHistory && !cartDrawer.classList.contains('is-open')) {
        const currentState = history.state || {};

        if (!currentState[CART_HISTORY_KEY]) {
            const cartState = Object.assign({}, currentState);
            cartState[CART_HISTORY_KEY] = true;
            history.pushState(cartState, '', window.location.href);
        }
    }

    showCartView();
    cartOverlay.hidden = false;
    cartDrawer.classList.add('is-open');
    cartOverlay.classList.add('is-visible');
    cartDrawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('cart-is-open');

    document.querySelectorAll('[data-cart-open]').forEach(function(button) {
        button.setAttribute('aria-expanded', 'true');
    });

    const closeButton = cartDrawer.querySelector('.cart-close');
    if (closeButton) closeButton.focus();
}

function showCartView() {
    if (cartView) cartView.hidden = false;
}

function closeCart(options) {
    if (!cartDrawer || !cartOverlay) return;

    const fromHistory = options && options.fromHistory;
    const wasOpen = cartDrawer.classList.contains('is-open');

    cartDrawer.classList.remove('is-open');
    cartOverlay.classList.remove('is-visible');
    cartDrawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cart-is-open');

    document.querySelectorAll('[data-cart-open]').forEach(function(button) {
        button.setAttribute('aria-expanded', 'false');
    });

    if (!fromHistory && wasOpen && history.state && history.state[CART_HISTORY_KEY]) {
        history.back();
    }
}

function changeQuantity(flavor, amount) {
    if (!FLAVORS.includes(flavor)) return;

    cart[flavor] = Math.max(0, cart[flavor] + amount);
    saveCart();
    renderCart();
}

function showCartMessage(message) {
    if (!cartToast) return;

    window.clearTimeout(toastTimer);
    cartToast.textContent = message;
    cartToast.hidden = false;

    window.requestAnimationFrame(function() {
        cartToast.classList.add('is-visible');
    });

    toastTimer = window.setTimeout(function() {
        cartToast.classList.remove('is-visible');
        window.setTimeout(function() {
            if (!cartToast.classList.contains('is-visible')) cartToast.hidden = true;
        }, 250);
    }, 1500);
}

function removeFlavor(flavor) {
    if (!FLAVORS.includes(flavor)) return;

    cart[flavor] = 0;
    saveCart();
    renderCart();
}

function createQuantityButton(symbol, label, flavor, amount) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'quantity-button';
    button.textContent = symbol;
    button.setAttribute('aria-label', label + ': ' + flavor);
    button.addEventListener('click', function() {
        changeQuantity(flavor, amount);
    });
    return button;
}

function createCartRow(flavor, quantity, unitPrice) {
    const row = document.createElement('div');
    row.className = 'cart-item';

    const image = document.createElement('img');
    image.className = 'cart-item-image';
    image.src = FLAVOR_IMAGES[flavor];
    image.alt = '';

    const details = document.createElement('div');
    details.className = 'cart-item-details';

    const name = document.createElement('strong');
    name.className = 'cart-item-name';
    name.textContent = flavor;

    const price = document.createElement('span');
    price.className = 'cart-item-price';
    price.textContent = quantity + ' × ' + unitPrice + ' грн = ' + (quantity * unitPrice) + ' грн';

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'cart-remove';
    removeButton.textContent = 'Видалити';
    removeButton.addEventListener('click', function() {
        removeFlavor(flavor);
    });

    details.append(name, price, removeButton);

    const controls = document.createElement('div');
    controls.className = 'quantity-controls';
    const minus = createQuantityButton('−', 'Зменшити кількість', flavor, -1);
    const value = document.createElement('span');
    value.className = 'quantity-value';
    value.textContent = quantity;
    const plus = createQuantityButton('+', 'Збільшити кількість', flavor, 1);
    controls.append(minus, value, plus);

    row.append(image, details, controls);
    return row;
}

function renderCardControls() {
    FLAVORS.forEach(function(flavor) {
        const quantity = cart[flavor];
        const addButton = document.querySelector('.add-to-cart[data-flavor="' + flavor + '"]');

        if (addButton) {
            addButton.classList.toggle('in-cart', quantity > 0);
            addButton.textContent = quantity > 0 ? 'Додати ще (' + quantity + ')' : 'Додати в кошик';
        }
    });
}

function renderCart() {
    if (!cartItems || !summaryTotal) return;

    const cartData = getCartData();
    cartItems.innerHTML = '';

    FLAVORS.forEach(function(flavor) {
        if (cart[flavor] > 0) {
            cartItems.appendChild(createCartRow(flavor, cart[flavor], cartData.unitPrice));
        }
    });

    if (cartEmpty) cartEmpty.hidden = cartData.quantity > 0;
    if (cartContent) cartContent.hidden = cartData.quantity === 0;
    if (cartCount) cartCount.textContent = cartData.quantity;
    if (cartHeaderTotal) cartHeaderTotal.textContent = cartData.total + ' грн';
    if (cartPricing) cartPricing.textContent = 'Усього: ' + cartData.quantity + ' шт. × ' + cartData.unitPrice + ' грн';
    if (cartHint) cartHint.textContent = getPriceHint(cartData.quantity);
    summaryTotal.textContent = 'Разом: ' + cartData.total + ' грн';

    const displayedUnitPrice = cartData.unitPrice || 30;
    document.querySelectorAll('.flavor-price').forEach(function(price) {
        price.textContent = 'Поточна ціна: ' + displayedUnitPrice + ' грн/шт.';
    });

    if (cartData.quantity === 0 && orderForm) {
        showCartView();
    }

    renderCardControls();
}

addButtons.forEach(function(button) {
    button.addEventListener('click', function() {
        const flavor = button.dataset.flavor;
        const isNewFlavor = cart[flavor] === 0;

        changeQuantity(flavor, 1);

        if (isNewFlavor && getSelectedFlavorCount() === FLAVORS.length) {
            openCart();
        } else {
            showCartMessage(flavor + ': ' + cart[flavor] + ' шт. у кошику ✓');
        }
    });
});

document.querySelectorAll('[data-cart-open]').forEach(function(button) {
    button.addEventListener('click', openCart);
});

document.querySelectorAll('[data-cart-close]').forEach(function(button) {
    button.addEventListener('click', closeCart);
});

document.querySelectorAll('[data-cart-continue]').forEach(function(button) {
    button.addEventListener('click', function() {
        closeCart();
        document.querySelector('#flavors').scrollIntoView({ behavior: 'smooth' });
    });
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && cartDrawer && cartDrawer.classList.contains('is-open')) {
        closeCart();
    }
});

window.addEventListener('popstate', function(event) {
    if (event.state && event.state[CART_HISTORY_KEY]) {
        openCart({ fromHistory: true });
    } else {
        closeCart({ fromHistory: true });
    }
});

if (orderForm) {
    orderForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const cartData = getCartData();
        const formData = new FormData(orderForm);
        const name = String(formData.get('name') || '').trim();
        const phone = String(formData.get('phone') || '').trim();
        const nameInput = orderForm.querySelector('input[name="name"]');
        const phoneInput = orderForm.querySelector('input[name="phone"]');

        if (cartData.quantity === 0) {
            alert('Будь ласка, додайте хоча б одну цукерку до кошика.');
            return;
        }

        if (!name) {
            alert('Будь ласка, введіть ім’я.');
            nameInput.focus();
            return;
        }

        if (!phone || phone.replace(/\D/g, '').length < 7) {
            alert('Будь ласка, введіть коректний номер телефону.');
            phoneInput.focus();
            return;
        }

        const orderText = FLAVORS
            .filter(function(flavor) { return cart[flavor] > 0; })
            .map(function(flavor) { return flavor + ' x ' + cart[flavor]; })
            .join('; ') + '; усього ' + cartData.quantity + ' шт.; ціна ' + cartData.unitPrice + ' грн/шт.';

        const data = new URLSearchParams();
        data.append('type', 'order');
        data.append('name', name);
        data.append('phone', phone);
        data.append('order', orderText);
        data.append('total', String(cartData.total));

        const submitButton = orderForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Надсилаємо...';

        fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: data })
            .then(function() {
                alert('Дякуємо! Ваша заявка прийнята. Ми зв’яжемося з вами найближчим часом.');
                orderForm.reset();
                showCartView();
                cart = createEmptyCart();
                saveCart();
                renderCart();
                closeCart();
            })
            .catch(function(error) {
                console.error('Помилка відправлення замовлення:', error);
                alert('Не вдалося надіслати заявку. Перевірте інтернет і спробуйте ще раз.');
            })
            .finally(function() {
                submitButton.disabled = false;
                submitButton.textContent = 'Надіслати заявку';
            });
    });
}

renderCart();

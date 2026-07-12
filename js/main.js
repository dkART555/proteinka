const PRICES = {
    3: 80,
    6: 150,
    9: 210
};

const orderForm = document.querySelector('.order-form');

const SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbypLEImTucfBCqI27P53omAOFQHVZm1kI7t2fPHBRi6sfa7snlyuCo8uJNwnkDyJ5dPew/exec';

const constructorInputs = document.querySelectorAll(
    '.constructor-table input[data-pack-size]'
);

const summaryList = document.querySelector('.summary-list');
const summaryTotal = document.querySelector('.summary-total');

const priceDisplays = document.querySelectorAll('[data-price-display]');

const header = document.querySelector('.header');
const orderSection = document.querySelector('#order');

if (header && orderSection) {
    const orderObserver = new IntersectionObserver(
        function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    header.classList.add('header-hidden');
                } else {
                    header.classList.remove('header-hidden');
                }
            });
        },
        {
            threshold: 0.15
        }
    );

    orderObserver.observe(orderSection);
}

function scrollToElement(element) {
    if (!element) {
        return;
    }

    const header = document.querySelector('.header');
    const headerHeight = header ? header.offsetHeight : 0;

    const elementTop =
        element.getBoundingClientRect().top +
        window.pageYOffset -
        headerHeight -
        20;

    window.scrollTo({
        top: elementTop,
        behavior: 'smooth'
    });
}

function updateDisplayedPrices() {
    priceDisplays.forEach(function(element) {
        const packSize = Number(element.dataset.priceDisplay);
        const price = PRICES[packSize];

        if (price !== undefined) {
            element.textContent = price + ' грн';
        }
    });
}

function getOrderData() {
    const items = [];
    let total = 0;

    constructorInputs.forEach(function(input) {
        const quantity = Number(input.value);

        if (quantity <= 0) {
            return;
        }

        const flavor = input.dataset.flavor;
        const pack = input.dataset.pack;
        const packSize = Number(input.dataset.packSize);
        const price = PRICES[packSize];

        if (price === undefined) {
            console.error('Не знайдена ціна для набору:', packSize);
            return;
        }

        const itemTotal = quantity * price;

        items.push({
            flavor,
            pack,
            packSize,
            quantity,
            price,
            itemTotal
        });

        total += itemTotal;
    });

    return {
        items,
        total
    };
}

function updateSummary() {
    if (!summaryList || !summaryTotal) {
        return;
    }

    const orderData = getOrderData();

    if (orderData.items.length === 0) {
        summaryList.textContent = 'Замовлення ще не вибрано.';
        summaryTotal.textContent = 'Разом: 0 грн';
        return;
    }

    summaryList.innerHTML = '';

    orderData.items.forEach(function(item) {
        const line = document.createElement('div');

        line.textContent =
            item.flavor +
            ' — ' +
            item.pack +
            ' × ' +
            item.quantity +
            ' = ' +
            item.itemTotal +
            ' грн';

        summaryList.appendChild(line);
    });

    summaryTotal.textContent = 'Разом: ' + orderData.total + ' грн';
}

constructorInputs.forEach(function(input) {
    input.addEventListener('input', updateSummary);
});

if (orderForm) {
    orderForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const formData = new FormData(orderForm);

        const name = String(formData.get('name') || '').trim();
        const phone = String(formData.get('phone') || '').trim();

        const orderData = getOrderData();

        const nameInput = orderForm.querySelector('input[name="name"]');
        const phoneInput = orderForm.querySelector('input[name="phone"]');
        const orderConstructor = orderForm.querySelector(
            '.order-constructor'
        );

        if (!name) {
            alert('Будь ласка, введіть ім’я.');

            if (nameInput) {
                nameInput.focus();
                scrollToElement(nameInput);
            }

            return;
        }

        if (!phone) {
            alert('Будь ласка, введіть номер телефону.');

            if (phoneInput) {
                phoneInput.focus();
                scrollToElement(phoneInput);
            }

            return;
        }

        if (orderData.items.length === 0) {
            alert('Будь ласка, оберіть хоча б один набір.');

            scrollToElement(orderConstructor);
            return;
        }

        const orderText = orderData.items
            .map(function(item) {
                return (
                    item.flavor +
                    ' - ' +
                    item.pack +
                    ' x ' +
                    item.quantity +
                    ' = ' +
                    item.itemTotal +
                    ' грн'
                );
            })
            .join('; ');

        const data = new URLSearchParams();

        data.append('type', 'order');
        data.append('name', name);
        data.append('phone', phone);
        data.append('order', orderText);
        data.append('total', String(orderData.total));

        const submitButton = orderForm.querySelector(
            'button[type="submit"]'
        );

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Надсилаємо...';
        }

        fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: data
        })
            .then(function() {
                alert(
                    'Дякуємо! Ваша заявка прийнята. Ми зв’яжемося з вами найближчим часом.'
                );

                orderForm.reset();
                updateSummary();
            })
            .catch(function(error) {
                console.error(
                    'Помилка відправлення замовлення:',
                    error
                );

                alert(
                    'Не вдалося надіслати заявку. Перевірте інтернет і спробуйте ще раз.'
                );
            })
            .finally(function() {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Надіслати заявку';
                }
            });
    });
}

updateDisplayedPrices();
updateSummary();
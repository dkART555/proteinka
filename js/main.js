const orderForm = document.querySelector('.order-form');

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz13d8LrkE3mb9lJZQwakQKtAfRx-6AcbxzbaTvwhH8P8i9R5uleBrjm7--J5SUvhzvSA/exec';

const constructorInputs = document.querySelectorAll('.constructor-table input');
const summaryList = document.querySelector('.summary-list');
const summaryTotal = document.querySelector('.summary-total');

function getOrderData() {
    const items = [];
    let total = 0;

    constructorInputs.forEach(function(input) {
        const quantity = Number(input.value);

        if (quantity > 0) {
            const flavor = input.dataset.flavor;
            const pack = input.dataset.pack;
            const price = Number(input.dataset.price);
            const itemTotal = quantity * price;

            items.push({
                flavor,
                pack,
                quantity,
                price,
                itemTotal
            });

            total += itemTotal;
        }
    });

    return { items, total };
}

function updateSummary() {
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
            item.flavor + ' — ' +
            item.pack + ' × ' +
            item.quantity + ' = ' +
            item.itemTotal + ' грн';

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

        const name = formData.get('name');
        const phone = formData.get('phone');

        const orderData = getOrderData();

        if (!name || !phone || orderData.items.length === 0) {
            alert('Будь ласка, заповніть ім’я, телефон та оберіть замовлення.');
            return;
        }

        const orderText = orderData.items
            .map(function(item) {
                return item.flavor + ' - ' + item.pack + ' x ' + item.quantity;
            })
            .join('; ');

        const data = new URLSearchParams();

        data.append('name', name);
        data.append('phone', phone);
        data.append('order', orderText);
        data.append('total', orderData.total);

        fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: data
        });

        alert('Дякуємо! Ваша заявка прийнята. Ми зв’яжемося з вами найближчим часом.');

        orderForm.reset();
        updateSummary();
    });
}

updateSummary();
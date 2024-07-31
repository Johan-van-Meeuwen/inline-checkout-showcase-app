let itemList

fetch('/get-settings', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id: sessionStorage.getItem('mySettingsId') })
})
    .then(response => response.json())
    .then(response => {
        console.log(response)
        document.getElementById('pricingImage').src = response.preCheckoutUrlApiFlashUrl
        if (response.priceIdTwo) {
            itemList = [
                {
                    priceId: response.priceId,
                    quantity: Number(response.priceQuantity)
                },
                {
                    priceId: response.priceIdTwo,
                    quantity: Number(response.priceQuantityTwo)
                }
            ]
        } else {
            itemList = [
                {
                    priceId: response.priceId,
                    quantity: Number(response.priceQuantity)
                }
            ]
        }
    })
    .catch(error => {
        console.log(error)
    })

fetch('/env', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id: sessionStorage.getItem('mySettingsId') })
})
    .then(response => response.json())
    .then(data => {
        console.log(data)
        let clientSideToken = data.clientSideToken;

        Paddle.Environment.set("sandbox");
        Paddle.Initialize({
            token: clientSideToken,
            eventCallback: function (data) {
                console.log(data)
            }
        });
        console.log('Paddle Initialized...')
    })
    .catch(error => {
        console.error('Error fetching environment variables:', error);
    });

const toggleSwitch = document.getElementById('toggle')
const checkoutButton = document.getElementById('checkoutButton')

toggleSwitch.addEventListener('change', function () {
    const toggleLabel = document.querySelector('.toggle-label');
    if (this.checked) {
        console.log(toggleSwitch.checked);
        checkoutButton.href = '#'
        checkoutButton.setAttribute('onclick', 'openOverlayCheckout(itemList)')
    } else {
        console.log(toggleSwitch.checked);
        checkoutButton.href = '/checkout'
        checkoutButton.removeAttribute('onclick', 'openOverlayCheckout(itemList)')
    }
});

const openOverlayCheckout = (items) => {
    Paddle.Checkout.open({
        items: items
    })
}

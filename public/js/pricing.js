fetch('/get-settings', {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    },
})
    .then(response => response.json())
    .then(response => {
        console.log(response)
        sessionStorage.setItem('mySettingsId', response._id);
        console.log('get-settings string:', response._id);
        // setTimeout(() => {
            document.getElementById('pricingImage').src = response.preCheckoutUrlApiFlashUrl
        // }, 4000);
    })
    .catch(error => {
        console.log(error)
    })

fetch('/env')
    .then(response => response.json())
    .then(data => {
        let clientSideToken = data.clientSideToken;

        Paddle.Environment.set("sandbox");
        Paddle.Initialize({
            token: clientSideToken,
            eventCallback: function (data) {
                console.log(data)
            }
        });
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

let itemList

fetch('/get-checkout-settings', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id: sessionStorage.getItem('mySettingsId') })
})
    .then(response => response.json())
    .then(response => {
        console.log(response)
        console.log('get-checkout-settings string:', response._id)
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

const openOverlayCheckout = (items) => {
    Paddle.Checkout.open({
        items: items
    })
}

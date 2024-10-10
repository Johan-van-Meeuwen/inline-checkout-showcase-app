let itemList = [];
let customerAuthToken = '';

function fetchCheckoutSettings() {
    return fetch('/get-checkout-settings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: sessionStorage.getItem('mySettingsId') })
    })
        .then(response => response.json())
        .then(response => {
            console.log(response);
            document.getElementById('desktopLogo').src = response.logo;
            document.getElementById('mobileLogo').src = response.logo;

            const styleSheet = document.styleSheets[0];
            const rules = styleSheet.cssRules || styleSheet.rules;
            for (let i = 0; i < rules.length; i++) {
                if (rules[i].selectorText === '.quantityAdjuster') {
                    rules[i].style.setProperty('--primary-color', `${response.primaryColour}25`);
                }
                if (rules[i].selectorText === '.brandedText') {
                    rules[i].style.color = response.primaryColour;
                }
                if (rules[i].selectorText === '.backgroundBeams') {
                    rules[i].style.setProperty('--primary-color', `${response.primaryColour}40`);
                }
            }

            itemList = [
                {
                    priceId: response.spmPriceId,
                    quantity: Number(response.spmQuantitySelect)
                }
            ]

            console.log('Fetched checkout settings');
        })
        .catch(error => {
            console.error('Error fetching checkout settings:', error);
        });
}

const openCheckout = (items, token) => {
    console.log(`Before call: ${token}`);  // Check if the token exists here

    const checkoutOptions = {
        settings: {
            displayMode: "inline",
            variant: 'one-page',
            frameTarget: "checkoutContainer",
            frameInitialHeight: "450",
            frameStyle: "width: 100%; min-width: 390px; background-color: transparent; border: none;",
            successUrl: 'https://inline-checkout-showcase-app.vercel.app/success'
        },
        customerAuthToken: token,  // Ensure token is passed here
        items: items
    };

    console.log('Checkout options:', checkoutOptions);  // Log the full object being passed to Paddle.Checkout.open

    Paddle.Checkout.open(checkoutOptions);  // Confirm it's receiving the correct parameters

    console.log(`After call: ${token}`);  // Check if token remains unchanged
}

if (typeof paddleInitialization !== 'undefined') {
    paddleInitialization.then(() => {
        fetchCheckoutSettings().then(() => {
            console.log('Opening checkout...')

            fetch('/get-customer-auth-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ customerId: sessionStorage.getItem('customerId'), mySettingsId: sessionStorage.getItem('mySettingsId') })
            })
                .then(response => response.json())
                .then(data => {
                    customerAuthToken = data
                    console.log(`Received auth token: ${customerAuthToken}`);
                    customerAuthToken = customerAuthToken.replace(/^"+|"+$/g, '');
            
                    if (customerAuthToken) {
                        openCheckout(itemList, customerAuthToken);
                    } else {
                        console.error('Failed to retrieve customerAuthToken');
                    }
                })
        });
    }).catch(error => {
        console.error('Paddle initialization failed:', error);
    });
} else {
    console.error('Paddle initialization promise is undefined.');
}

const decreaseCheckoutQuantity = () => {
    let priceQuantity = document.getElementById('priceQuantity');
    let currentValue = parseInt(priceQuantity.innerText, 10);
    if (currentValue > 1) {
        priceQuantity.innerText = currentValue - 1;
    }

    fetch('/get-prices', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: sessionStorage.getItem('mySettingsId') })
    })
        .then(response => response.json())
        .then(response => {
            if (response.hasOwnProperty('spmPriceId')) {
                Paddle.Checkout.updateItems([
                    {
                        priceId: response.spmPriceId,
                        quantity: Number(priceQuantity.innerText)
                    }
                ])
            }
        })
        .catch(error => {
            console.log(error)
        })
};

const increaseCheckoutQuantity = () => {
    let priceQuantity = document.getElementById('priceQuantity');
    let currentValue = parseInt(priceQuantity.innerText, 10);
    priceQuantity.innerText = currentValue + 1;

    fetch('/get-prices', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: sessionStorage.getItem('mySettingsId') })
    })
        .then(response => response.json())
        .then(response => {
            if (response.hasOwnProperty('spmPriceId')) {
                Paddle.Checkout.updateItems([
                    {
                        priceId: response.spmPriceId,
                        quantity: Number(priceQuantity.innerText)
                    }
                ])
            }
        })
        .catch(error => {
            console.log(error)
        })
};

const decreaseCheckoutQuantityTwo = () => {
    let priceQuantityTwo = document.getElementById('priceQuantityTwo');
    let currentValue = parseInt(priceQuantityTwo.innerText, 10);
    if (currentValue > 1) {
        priceQuantityTwo.innerText = currentValue - 1;
    }

    fetch('/get-prices', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: sessionStorage.getItem('mySettingsId') })
    })
        .then(response => response.json())
        .then(response => {
            Paddle.Checkout.updateItems([
                {
                    priceId: response.priceOneId,
                    quantity: Number(priceQuantity.innerText)
                },
                {
                    priceId: response.priceTwoId,
                    quantity: Number(priceQuantityTwo.innerText)
                }
            ])
        })
        .catch(error => {
            console.log(error)
        })
};

const increaseCheckoutQuantityTwo = () => {
    let priceQuantityTwo = document.getElementById('priceQuantityTwo');
    let currentValue = parseInt(priceQuantityTwo.innerText, 10);
    priceQuantityTwo.innerText = currentValue + 1;

    fetch('/get-prices', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: sessionStorage.getItem('mySettingsId') })
    })
        .then(response => response.json())
        .then(response => {
            Paddle.Checkout.updateItems([
                {
                    priceId: response.priceOneId,
                    quantity: Number(priceQuantity.innerText)
                },
                {
                    priceId: response.priceTwoId,
                    quantity: Number(priceQuantityTwo.innerText)
                }
            ])
        })
        .catch(error => {
            console.log(error)
        })
};
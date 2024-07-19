let itemList = []

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
        document.getElementById('logo').src = response.logo
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
        openCheckout(itemList)

        const styleSheet = document.styleSheets[0];
        const rules = styleSheet.cssRules || styleSheet.rules;
        for (let i = 0; i < rules.length; i++) {
            if (rules[i].selectorText === '.quantityAdjuster') {
                rules[i].style.setProperty('--primary-color', `${response.primaryColour}25`);
            }
        }

        for (let i = 0; i < rules.length; i++) {
            if (rules[i].selectorText === '.brandedText') {
                rules[i].style.color = response.primaryColour;
            }
        }

        for (let i = 0; i < rules.length; i++) {
            if (rules[i].selectorText === '.backgroundBeams') {
                rules[i].style.setProperty('--primary-color', `${response.primaryColour}40`);
                break;
            }
        }

    })
    .catch(error => {
        console.log(error)
    })

const openCheckout = (items) => {
    Paddle.Checkout.open({
        settings: {
            displayMode: "inline",
            frameTarget: "checkoutContainer",
            frameInitialHeight: "450",
            frameStyle: "width: 100%; min-width: 410px; background-color: transparent; border: none;",
        },
        items: items
    })
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
            if (!response.hasOwnProperty('priceTwoId')) {
                Paddle.Checkout.updateItems([
                    {
                        priceId: response.priceOneId,
                        quantity: Number(priceQuantity.innerText)
                    }
                ])
            } else {
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
            if (!response.hasOwnProperty('priceTwoId')) {
                Paddle.Checkout.updateItems([
                    {
                        priceId: response.priceOneId,
                        quantity: Number(priceQuantity.innerText)
                    }
                ])
            } else {
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




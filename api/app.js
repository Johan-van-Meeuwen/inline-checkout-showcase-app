import express, { json } from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { connectToDatabase } from "./config/database.js";
import Settings from './models/Settings.js'
import https from 'https'
import axios from 'axios'
import dotenv from 'dotenv'

// Set up environment variables
dotenv.config()
const apiToken = process.env.API_TOKEN;
const clientSideToken = process.env.CLIENT_SIDE_TOKEN;
const opcApiToken = process.env.OPC_API_TOKEN;
const opcClientSideToken = process.env.OPC_CLIENT_SIDE_TOKEN;
const apiFlashKey = process.env.API_FLASH_KEY;

const app = express()
app.use(express.json())

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(express.static(__dirname + '/public'))

app.post('/env', async (req, res) => {
    await connectToDatabase()
    const id = req.body.id
    const returnedResult = await Settings.findById(id).exec()
    if (returnedResult.inlineVariant === 'standard') {
        res.json({
            clientSideToken: clientSideToken
        });
    } else {
        res.json({
            clientSideToken: opcClientSideToken
        });
    }

});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/index.html'))
})

app.get('/pricing', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/pricing.html'))
})

app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/checkout.html'))
})

app.get('/success', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/success.html'))
})

app.get('/checkout-saved-payment-method', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/checkout-saved-payment-method.html'))
})

app.use(express.urlencoded({ extended: true }))

function getApiFlashUrl(preCheckoutUrl) {
    const startingScreenshotJobTime = Date.now()
    console.log(`${startingScreenshotJobTime}: Starting screenshot job`)
    return new Promise((resolve, reject) => {
        const url = "https://api.apiflash.com/v1/urltoimage?" + new URLSearchParams({
            access_key: `${apiFlashKey}`,
            url: preCheckoutUrl,
            quality: 100,
            width: 1512,
            full_page: true,
            scroll_page: true,
            no_cookie_banners: true,
            no_ads: true,
            no_tracking: true,
            scale_factor: 2,
            response_type: 'json'
        }).toString();

        https.get(url, (response) => {
            const gettingScreenshotResponseTime = Date.now()
            console.log(`${gettingScreenshotResponseTime}: Getting screenshot job response`)
            console.log(`Time it took to get screenshot: ${(gettingScreenshotResponseTime - startingScreenshotJobTime) / 1000} seconds`)
            let data = '';

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    console.log(`${Date.now()}: Resolving screenshot job response`)
                    resolve(parsedData.url);
                } catch (error) {
                    reject('Error parsing JSON response: ' + error);
                }
            }).on('error', (err) => {
                reject('Error with the request: ' + err);
            });
        });
    });
}

app.post('/settings', async (req, res) => {
    await connectToDatabase();

    const requestReceived = Date.now();
    console.log(`${requestReceived}: /settings request received`);

    const {
        productName,
        productImage,
        // priceDescription,
        basePrice,
        basePriceName,
        priceQuantitySelect,
        interval,
        frequency,
        productNameTwo,
        productImageTwo,
        // priceDescriptionTwo,
        basePriceTwo,
        basePriceNameTwo,
        priceQuantitySelectTwo,
        intervalTwo,
        frequencyTwo,
        logo,
        primaryColour,
        preCheckoutUrl,
        inlineVariant,
        spmProductName,
        spmProductImage,
        spmBasePriceName,
        spmBasePrice,
        spmQuantitySelect
    } = req.body;

    console.log(req.body);

    let productIdTwo;
    let priceIdTwo;

    let spmProductId;
    let spmPriceId;

    const placeholderImageUrl = 'https://icons.veryicon.com/png/o/miscellaneous/fu-jia-intranet/product-29.png';
    const placeholderImageUrlTwo = 'https://cdn-icons-png.flaticon.com/256/1311/1311144.png';
    const placeholderSpmImageUrl = 'https://cdn-icons-png.flaticon.com/256/1311/1311144.png';

    const createProductRequest = {
        name: productName,
        tax_category: "standard",
        image_url: productImage ? productImage : placeholderImageUrl
    };

    try {
        const productResponse = await axios.post('https://sandbox-api.paddle.com/products', createProductRequest, {
            headers: {
                'Authorization': `Bearer ${inlineVariant === 'standard' ? apiToken : opcApiToken}`,
                'Content-Type': 'application/json'
            }
        });

        const productId = productResponse.data.data.id;
        console.log(`${Date.now()}: Product 1 created ${productId}`);
        let billingCycle = interval === 'one-time' ? null : { frequency: Number(frequency), interval: interval };

        const createPricesRequest = {
            description: basePriceName,
            product_id: productId,
            unit_price: { amount: basePrice, currency_code: "USD" },
            name: basePriceName,
            billing_cycle: billingCycle,
            quantity: { minimum: 1, maximum: 999999 }
        };

        const priceResponse = await axios.post('https://sandbox-api.paddle.com/prices', createPricesRequest, {
            headers: {
                'Authorization': `Bearer ${inlineVariant === 'standard' ? apiToken : opcApiToken}`,
                'Content-Type': 'application/json'
            }
        });

        const priceId = priceResponse.data.data.id;
        console.log(`${Date.now()}: Price 1 created ${priceId}`);

        if (productNameTwo) {
            const createProductRequestTwo = {
                name: productNameTwo,
                tax_category: "standard",
                image_url: productImageTwo ? productImageTwo : placeholderImageUrlTwo
            };

            const productResponseTwo = await axios.post('https://sandbox-api.paddle.com/products', createProductRequestTwo, {
                headers: {
                    'Authorization': `Bearer ${inlineVariant === 'standard' ? apiToken : opcApiToken}`,
                    'Content-Type': 'application/json'
                }
            });

            productIdTwo = productResponseTwo.data.data.id;
            console.log(`${Date.now()}: Product 2 created ${productIdTwo}`);
            let billingCycleTwo = intervalTwo === 'one-time' ? null : { frequency: Number(frequencyTwo), interval: intervalTwo };

            const createPricesRequestTwo = {
                description: basePriceNameTwo,
                product_id: productIdTwo,
                unit_price: { amount: basePriceTwo, currency_code: "USD" },
                name: basePriceNameTwo,
                billing_cycle: billingCycleTwo,
                quantity: { minimum: 1, maximum: 999999 }
            };

            const priceResponseTwo = await axios.post('https://sandbox-api.paddle.com/prices', createPricesRequestTwo, {
                headers: {
                    'Authorization': `Bearer ${inlineVariant === 'standard' ? apiToken : opcApiToken}`,
                    'Content-Type': 'application/json'
                }
            });

            priceIdTwo = priceResponseTwo.data.data.id;
            console.log(`${Date.now()}: Price 2 created ${priceIdTwo}`);
        }

        if (spmProductName) {
            const createSpmProductRequest = {
                name: spmProductName,
                tax_category: "standard",
                image_url: spmProductImage ? spmProductImage : placeholderSpmImageUrl
            };

            const spmProductResponse = await axios.post('https://sandbox-api.paddle.com/products', createSpmProductRequest, {
                headers: {
                    'Authorization': `Bearer ${inlineVariant === 'standard' ? apiToken : opcApiToken}`,
                    'Content-Type': 'application/json'
                }
            });

            spmProductId = spmProductResponse.data.data.id;
            console.log(`${Date.now()}: SPM Product created ${spmProductId}`);

            const createSpmPriceRequest = {
                description: spmBasePriceName,
                product_id: spmProductId,
                unit_price: { amount: spmBasePrice, currency_code: "USD" },
                name: spmBasePriceName,
                quantity: { minimum: 1, maximum: 999999 }
            };

            const spmPriceResponse = await axios.post('https://sandbox-api.paddle.com/prices', createSpmPriceRequest, {
                headers: {
                    'Authorization': `Bearer ${inlineVariant === 'standard' ? apiToken : opcApiToken}`,
                    'Content-Type': 'application/json'
                }
            });

            spmPriceId = spmPriceResponse.data.data.id;
            console.log(`${Date.now()}: SPM Price created ${spmPriceId}`);
        }

        const preCheckoutUrlApiFlashUrl = await getApiFlashUrl(preCheckoutUrl);

        const newlyCreatedSettings = await Settings.create({
            productId: productId,
            priceId: priceId,
            priceDescription: basePriceName,
            basePrice: basePrice,
            basePriceName: basePriceName,
            priceQuantity: priceQuantitySelect,
            interval: interval,
            frequency: frequency,
            productIdTwo: productIdTwo,
            priceIdTwo: priceIdTwo,
            priceDescriptionTwo: basePriceNameTwo,
            basePriceTwo: basePriceTwo,
            basePriceNameTwo: basePriceNameTwo,
            priceQuantityTwo: priceQuantitySelectTwo,
            intervalTwo: intervalTwo,
            frequencyTwo: frequencyTwo,
            logo: logo,
            primaryColour: primaryColour,
            preCheckoutUrl: preCheckoutUrl,
            preCheckoutUrlApiFlashUrl: preCheckoutUrlApiFlashUrl,
            inlineVariant: inlineVariant,
            spmProductId: spmProductId,
            spmPriceId: spmPriceId,
            spmProductName: spmProductName,
            spmProductImage: spmProductImage,
            spmBasePriceName: spmBasePriceName,
            spmBasePrice: spmBasePrice,
            spmQuantitySelect: spmQuantitySelect
        });

        const settingsCreated = Date.now();
        console.log(`${settingsCreated}: Newly Created Settings created: ${newlyCreatedSettings._id}`);
        console.log(`Time taken between request received and settings created: ${(settingsCreated - requestReceived) / 1000} seconds`);

        res.json({ id: newlyCreatedSettings._id });
    } catch (error) {
        if (error.response) {
            console.log(error.response.data);
        } else {
            console.log(error.message);
        }
        res.status(500).send('Internal Server Error');
    }
});

app.post('/get-settings', async (req, res) => {
    await connectToDatabase()
    const mySettingsId = req.body.id
    const returnedResult = await Settings.findById(mySettingsId).exec()
    console.log(returnedResult)
    res.json(returnedResult)
})

app.post('/get-checkout-settings', async (req, res) => {
    await connectToDatabase()
    const id = req.body.id
    const returnedResult = await Settings.findById(id).exec();
    console.log(returnedResult)
    res.json(returnedResult)
})

app.post('/get-prices', async (req, res) => {
    await connectToDatabase()
    const id = req.body.id
    const returnedResult = await Settings.findById(id).exec();
    const items = {
        priceOneId: returnedResult.priceId,
        priceOneQuantity: returnedResult.priceQuantity,
        priceTwoId: returnedResult.priceIdTwo,
        priceTwoQuantity: returnedResult.priceQuantityTwo,
        spmPriceId: returnedResult.spmPriceId,
        spmQuantitySelect: returnedResult.spmQuantitySelect
    }
    res.json(items)
})

app.post('/get-customer-auth-token', async (req, res) => {
    console.log(req.body)
    // await connectToDatabase()
    // const mySettingsId = req.body.mySettingsId
    // const returnedResult = await Settings.findById(mySettingsId).exec()
    // const inlineVariant = returnedResult.inlineVariant
    // console.log(inlineVariant)

    const customerId = req.body.customerId
    console.log(opcApiToken)

    // const customerAuthTokenResponse = await axios.post(
    //     `https://sandbox-api.paddle.com/customers/${customerId}/auth-token`, null,
    //     {
    //         headers: {
    //             'Authorization': `Bearer ${opcApiToken}`,
    //             // 'Authorization': `Bearer 41f3631dbfbb138228a79eb3f57179604339b5f459ed0f5845`,
    //             'Content-Type': 'application/json'
    //         }
    //     }
    // );
    // console.log(customerAuthTokenResponse)
    // const customerAuthToken = customerAuthTokenResponse.data.data.customer_auth_token
    // res.json(customerAuthToken)

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://sandbox-api.paddle.com/customers/ctm_01j9vz3hv71g7cza67abmhy0h0/auth-token',
        headers: {
            'Authorization': `Bearer ${opcApiToken}`,
            'Content-Type': 'application/json'
        }
        // data: {}
    };

    axios.request(config)
        .then((response) => {
            const authToken = JSON.stringify(response.data.data.customer_auth_token);
            res.json(authToken)
        })
        .catch((error) => {
            console.log(error);
        });
})

app.listen('8000', (req, res) => {
    console.log('Server is listening on port 8000')
})
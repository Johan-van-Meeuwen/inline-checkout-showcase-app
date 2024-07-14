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
const apiFlashKey = process.env.API_FLASH_KEY;

const app = express()
app.use(express.json())

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(express.static(__dirname + '/public'))

app.get('/env', (req, res) => {
    res.json({
        clientSideToken: clientSideToken,
    });
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

    console.log(req.body);
    const requestReceived = Date.now();
    console.log(`${requestReceived}: /settings request received`);

    const {
        productName,
        productImage,
        priceDescription,
        basePrice,
        basePriceName,
        priceQuantitySelect,
        interval,
        frequency,
        productNameTwo,
        productImageTwo,
        priceDescriptionTwo,
        basePriceTwo,
        basePriceNameTwo,
        priceQuantitySelectTwo,
        intervalTwo,
        frequencyTwo,
        logo,
        primaryColour,
        preCheckoutUrl
    } = req.body;

    let productIdTwo;
    let priceIdTwo;

    const placeholderImageUrl = 'https://icons.veryicon.com/png/o/miscellaneous/fu-jia-intranet/product-29.png';
    const placeholderImageUrlTwo = 'https://cdn-icons-png.flaticon.com/256/1311/1311144.png';

    const createProductRequest = {
        name: productName,
        tax_category: "standard",
        image_url: productImage ? productImage : placeholderImageUrl
    };

    try {
        const productResponse = await axios.post('https://sandbox-api.paddle.com/products', createProductRequest, {
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        const productId = productResponse.data.data.id;
        console.log(`${Date.now()}: Product 1 created ${productId}`);
        let billingCycle = interval === 'one-time' ? null : { frequency: Number(frequency), interval: interval };

        const createPricesRequest = {
            description: priceDescription,
            product_id: productId,
            unit_price: { amount: basePrice, currency_code: "GBP" },
            name: basePriceName,
            billing_cycle: billingCycle,
            quantity: { minimum: 1, maximum: 999999 }
        };

        const priceResponse = await axios.post('https://sandbox-api.paddle.com/prices', createPricesRequest, {
            headers: {
                'Authorization': `Bearer ${apiToken}`,
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
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                }
            });

            productIdTwo = productResponseTwo.data.data.id;
            console.log(`${Date.now()}: Product 2 created ${productIdTwo}`);
            let billingCycleTwo = intervalTwo === 'one-time' ? null : { frequency: Number(frequencyTwo), interval: intervalTwo };

            const createPricesRequestTwo = {
                description: priceDescriptionTwo,
                product_id: productIdTwo,
                unit_price: { amount: basePriceTwo, currency_code: "GBP" },
                name: basePriceNameTwo,
                billing_cycle: billingCycleTwo,
                quantity: { minimum: 1, maximum: 999999 }
            };

            const priceResponseTwo = await axios.post('https://sandbox-api.paddle.com/prices', createPricesRequestTwo, {
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                }
            });

            priceIdTwo = priceResponseTwo.data.data.id;
            console.log(`${Date.now()}: Price 2 created ${priceIdTwo}`);
        }

        const preCheckoutUrlApiFlashUrl = await getApiFlashUrl(preCheckoutUrl);

        const newlyCreatedSettings = await Settings.create({
            productId: productId,
            priceId: priceId,
            priceDescription: priceDescription,
            basePrice: basePrice,
            basePriceName: basePriceName,
            priceQuantity: priceQuantitySelect,
            interval: interval,
            frequency: frequency,
            productIdTwo: productIdTwo,
            priceIdTwo: priceIdTwo,
            priceDescriptionTwo: priceDescriptionTwo,
            basePriceTwo: basePriceTwo,
            basePriceNameTwo: basePriceNameTwo,
            priceQuantityTwo: priceQuantitySelectTwo,
            intervalTwo: intervalTwo,
            frequencyTwo: frequencyTwo,
            logo: logo,
            primaryColour: primaryColour,
            preCheckoutUrl: preCheckoutUrl,
            preCheckoutUrlApiFlashUrl: preCheckoutUrlApiFlashUrl
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
        priceTwoQuantity: returnedResult.priceQuantityTwo
    }
    res.json(items)
})

app.listen('8000', (req, res) => {
    console.log('Server is listening on port 8000')
})
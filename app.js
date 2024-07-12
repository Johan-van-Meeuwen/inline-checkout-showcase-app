import express, { json } from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import "./config/database.js"
import Settings from './models/Settings.js'
import https from 'https'
import fs from 'fs'
import axios from 'axios'
import dotenv from 'dotenv'

// Set up environment variables
dotenv.config()
const apiToken = process.env.API_TOKEN;
const clientSideToken = process.env.CLIENT_SIDE_TOKEN;

const app = express()
app.use(express.json())

app.use(express.static('./public'))

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.get('/env', (req, res) => {
    res.json({
        clientSideToken: clientSideToken,
    });
});

app.get('/pricing', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/pricing.html'))
})

app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/checkout.html'))
})

app.use(express.urlencoded({ extended: true }))

app.post('/settings', async (req, res) => {
    const {
        productName,
        priceDescription,
        basePrice,
        basePriceName,
        priceQuantitySelect,
        interval,
        frequency,
        productNameTwo,
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

    let productIdTwo
    let priceIdTwo

    const createProductRequest = {
        name: productName,
        tax_category: "standard"
    };

    try {
        // Create the product
        const productResponse = await axios.post('https://sandbox-api.paddle.com/products', createProductRequest, {
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        const productId = productResponse.data.data.id;

        let billingCycle

        if (interval === 'one-time') {
            billingCycle = null
        } else {
            billingCycle = {
                frequency: Number(frequency),
                interval: interval
            }
        }

        const createPricesRequest = {
            description: priceDescription,
            product_id: productId,
            unit_price: {
                amount: basePrice,
                currency_code: "USD"
            },
            name: basePriceName,
            billing_cycle: billingCycle,
            quantity: {
                minimum: 1,
                maximum: 999999
            }
        };

        const priceResponse = await axios.post('https://sandbox-api.paddle.com/prices', createPricesRequest, {
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        const priceId = priceResponse.data.data.id;

        // 2nd product check and creation
        if (productNameTwo !== '') {
            const createProductRequestTwo = {
                name: productNameTwo,
                tax_category: "standard"
            };
            // Create the 2nd product
            const productResponseTwo = await axios.post('https://sandbox-api.paddle.com/products', createProductRequestTwo, {
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                }
            });

            productIdTwo = productResponseTwo.data.data.id;
            console.log(productIdTwo);

            let billingCycleTwo

            if (intervalTwo === 'one-time') {
                billingCycleTwo = null
            } else {
                billingCycleTwo = {
                    frequency: Number(frequencyTwo),
                    interval: intervalTwo
                }
            }

            const createPricesRequestTwo = {
                description: priceDescriptionTwo,
                product_id: productIdTwo,
                unit_price: {
                    amount: basePriceTwo,
                    currency_code: "USD"
                },
                name: basePriceNameTwo,
                billing_cycle: billingCycleTwo,
                quantity: {
                    minimum: 1,
                    maximum: 999999
                }
            };

            const priceResponseTwo = await axios.post('https://sandbox-api.paddle.com/prices', createPricesRequestTwo, {
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                }
            });

            priceIdTwo = priceResponseTwo.data.data.id;
            console.log(priceIdTwo);
        }

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
            preCheckoutUrl: preCheckoutUrl
        });

        console.log(`Newly Created Settings: ${newlyCreatedSettings}`);
    } catch (error) {
        if (error.response) {
            console.log(error.response.data);
        } else {
            console.log(error.message);
        }
    }

    https.get("https://api.apiflash.com/v1/urltoimage?" + new URLSearchParams({
        access_key: "19076f52b14d44f5a5c7240bc2d270e9",
        url: `${preCheckoutUrl}`,
        quality: 100,
        width: 1512,
        full_page: true,
        scroll_page: true,
        no_cookie_banners: true,
        no_ads: true,
        no_tracking: true,
    }).toString(), (response) => {
        response.pipe(fs.createWriteStream('./public/images/screenshot.jpeg'));
    });
    setTimeout(() => {
        res.status(200).redirect('/pricing');
    }, 10000);
})

app.get('/get-settings', async (req, res) => {
    const returnedResult = await Settings.find().sort({ _id: -1 }).limit(1)
    console.log(returnedResult[0])
    res.json(returnedResult[0])
})

app.post('/get-checkout-settings', async (req, res) => {
    const id = req.body.id
    const returnedResult = await Settings.findById(id).exec();
    console.log(returnedResult)
    res.json(returnedResult)
})

app.post('/get-prices', async (req, res) => {
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
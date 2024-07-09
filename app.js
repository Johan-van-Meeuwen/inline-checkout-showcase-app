import express, { json } from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import "./config/database.js"
import Settings from './models/Settings.js'
import https from 'https'
import fs from 'fs'
import axios from 'axios'

const app = express()
app.use(express.json())

app.use(express.static('./public'))

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
        interval,
        frequency,
        logo,
        primaryColour,
        secondaryColour,
        preCheckoutUrl
    } = req.body;

    const createProductRequest = {
        name: productName,
        tax_category: "standard"
    };

    try {
        // Create the product
        const productResponse = await axios.post('https://sandbox-api.paddle.com/products', createProductRequest, {
            headers: {
                'Authorization': 'Bearer 638d13ef531c884274a084cb3eb102e021cef14a91e7d4802a',
                'Content-Type': 'application/json'
            }
        });

        const productId = productResponse.data.data.id;
        console.log(productId);

        // Create the price
        const createPricesRequest = {
            description: priceDescription,
            product_id: productId,
            unit_price: {
                amount: basePrice,
                currency_code: "USD"
            },
            name: basePriceName,
            billing_cycle: {
                frequency: Number(frequency),
                interval: interval
            }
        };

        const priceResponse = await axios.post('https://sandbox-api.paddle.com/prices', createPricesRequest, {
            headers: {
                'Authorization': 'Bearer 638d13ef531c884274a084cb3eb102e021cef14a91e7d4802a',
                'Content-Type': 'application/json'
            }
        });

        const priceId = priceResponse.data.data.id;
        console.log(priceId);

        // Save settings to the database
        const newlyCreatedSettings = await Settings.create({
            productId: productId,
            priceId: priceId,
            priceDescription: priceDescription,
            basePrice: basePrice,
            basePriceName: basePriceName,
            interval: interval,
            frequency: frequency,
            logo: logo,
            primaryColour: primaryColour,
            secondaryColour: secondaryColour,
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
        res.status(200).redirect('http://localhost:8000/pricing');
    }, 10000);
})

app.get('/get-settings', async (req, res) => {
    console.log("Server hit")
    const returnedResult = await Settings.find().sort({ _id: -1 }).limit(1)
    console.log(returnedResult[0])
    res.json(returnedResult[0])
})

app.listen('8000', (req, res) => {
    console.log('Server is listening on port 8000')
})
import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
    productId: { type: String },
    priceId: { type: String },
    priceDescription: { type: String },
    basePrice: { type: String },
    basePriceName: { type: String },
    priceQuantity: { type: String },
    interval: { type: String },
    frequency: { type: String },
    productIdTwo: { type: String },
    priceIdTwo: { type: String },
    priceDescriptionTwo: { type: String },
    basePriceTwo: { type: String },
    basePriceNameTwo: { type: String },
    priceQuantityTwo: { type: String },
    intervalTwo: { type: String },
    frequencyTwo: { type: String },
    logo: { type: String },
    primaryColour: { type: String },
    preCheckoutUrl: { type: String },
    preCheckoutUrlApiFlashUrl: { type: String },
    inlineVariant: { type: String }
})

const Settings = new mongoose.model('Settings', settingsSchema)
export default Settings
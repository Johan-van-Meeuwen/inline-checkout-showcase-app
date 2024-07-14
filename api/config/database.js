import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://defaultUser:defaultPassword@defaultCluster.mongodb.net/defaultDatabase?retryWrites=true&w=majority&appName=defaultAppName';

let isConnected = false;

export const connectToDatabase = async () => {
    console.log('Connecting to database...')
    if (isConnected) {
        console.log('Using existing database connection');
        return;
    }

    try {
        await mongoose.connect(mongoURI);
        isConnected = true;
        console.log('MongoDB connected');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
};

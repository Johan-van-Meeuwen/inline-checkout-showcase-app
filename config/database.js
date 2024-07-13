import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://defaultUser:defaultPassword@defaultCluster.mongodb.net/defaultDatabase?retryWrites=true&w=majority&appName=defaultAppName';

mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error(err));

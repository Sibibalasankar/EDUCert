import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import studentRoutes from './routes/studentRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/students', studentRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'EDUCert API is running',
    contract: '0xea43f9561566CA74690199d4D29acc89159F99be'
  });
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Contract deployed at: 0xea43f9561566CA74690199d4D29acc89159F99be`);
});
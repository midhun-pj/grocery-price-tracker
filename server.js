import express from 'express';
import cors from 'cors';
import { PORT } from './config.js';
import authRoutes from './routes/authRoutes.js';
import superMarketRoutes from './routes/superMarketRoutes.js';
import groceryRoutes from './routes/groceryRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/supermarkets', superMarketRoutes);
app.use('/api/grocery-items', groceryRoutes);

app.use(express.static('public'));        // serve frontend

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));

// src/server.ts
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import { AppDataSource } from './config/database';
import adminRoutes from './routes/admin.routes';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

app.use('/admin', adminRoutes);

AppDataSource.initialize()
  .then(() => {
    console.log('Database connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => console.log(error));

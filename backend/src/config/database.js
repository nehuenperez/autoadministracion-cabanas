import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Supabase requiere SSL pero con certificado autofirmado
    },
  },
  logging: false, // poné esto en true si en algún momento querés ver el SQL que genera Sequelize
});

export default sequelize;
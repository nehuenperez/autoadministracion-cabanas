import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Supabase exige SSL. Sólo se apaga con DB_SSL=false, para un Postgres local
// (el de los tests o uno de desarrollo).
const usarSsl = process.env.DB_SSL !== 'false';

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: usarSsl
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false, // Supabase requiere SSL pero con certificado autofirmado
        },
      }
    : {},
  logging: false, // poné esto en true si en algún momento querés ver el SQL que genera Sequelize
});

export default sequelize;
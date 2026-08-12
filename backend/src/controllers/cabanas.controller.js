import { Cabana } from '../models/index.js';

async function listar(req, res, next) {
  try {
    const cabanas = await Cabana.findAll({ order: [['id', 'ASC']] });
    res.status(200).json(cabanas);
  } catch (error) {
    next(error);
  }
}

export { listar };
import multer from 'multer';

export class AppError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: `Não foi possível encontrar a rota ${req.method} ${req.originalUrl}`
  });
}

export function errorHandler(err, req, res, next) {
  console.error('[Error]', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {})
    });
  }

  // Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxMb = process.env.MAX_FILE_SIZE_MB || 5;
      return res.status(400).json({
        error: 'Arquivo muito grande',
        message: `O arquivo excede o limite máximo permitido de ${maxMb}MB.`
      });
    }
    return res.status(400).json({
      error: 'Erro no upload de arquivo',
      message: err.message
    });
  }

  // SQLite Constraint Errors
  if (err.code === 'SQLITE_CONSTRAINT' || err.message?.includes('UNIQUE constraint failed')) {
    if (err.message.includes('users.email')) {
      return res.status(409).json({
        error: 'Conflito de dados',
        message: 'O e-mail informado já está cadastrado no sistema.'
      });
    }
    return res.status(400).json({
      error: 'Restrição do banco de dados violada',
      message: err.message
    });
  }

  // Fallback
  return res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Ocorreu um erro inesperado.'
  });
}

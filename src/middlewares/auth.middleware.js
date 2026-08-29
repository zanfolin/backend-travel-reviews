import jwt from 'jsonwebtoken';
import db from '../../database/connection.js';

/**
 * Middleware para autenticação via JWT
 */
export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        error: 'Token de autenticação não fornecido',
        message: 'Cabeçalho Authorization no formato Bearer <token> é obrigatório'
      });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        error: 'Formato de token inválido',
        message: 'O formato esperado é "Bearer <token>"'
      });
    }

    const token = parts[1];
    const secret = process.env.JWT_SECRET || 'secret';

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expirado',
          message: 'Sua sessão expirou. Faça login novamente.'
        });
      }
      return res.status(401).json({
        error: 'Token inválido',
        message: 'Assinatura do token inválida'
      });
    }

    // Buscar usuário no banco
    const user = await db('users')
      .where({ id: decoded.id })
      .select('id', 'full_name', 'email', 'user_type', 'email_verified', 'profile_picture')
      .first();

    if (!user) {
      return res.status(401).json({
        error: 'Usuário não encontrado',
        message: 'O usuário associado ao token não existe mais'
      });
    }

    // Regra estrita: apenas usuários verificados podem navegar
    if (user.email_verified !== 1) {
      return res.status(403).json({
        error: 'E-mail não verificado',
        message: 'É necessário verificar seu e-mail antes de acessar a plataforma.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware para verificar os papéis (roles) autorizados
 * @param  {...string} allowedRoles - Ex: 'TRAVELER', 'BUSINESS'
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Não autenticado',
        message: 'Autenticação necessária para acessar este recurso'
      });
    }

    if (!allowedRoles.includes(req.user.user_type)) {
      return res.status(403).json({
        error: 'Acesso não autorizado',
        message: `Este recurso é restrito para o perfil [${allowedRoles.join(', ')}]. Seu perfil atual é [${req.user.user_type}].`
      });
    }

    next();
  };
}

/**
 * Middleware para autenticação opcional (ex: rotas públicas que se beneficiam de saber quem é o usuário)
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next();
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return next();
  }

  try {
    const token = parts[1];
    const secret = process.env.JWT_SECRET || 'secret';
    const decoded = jwt.verify(token, secret);
    const user = await db('users')
      .where({ id: decoded.id })
      .select('id', 'full_name', 'email', 'user_type', 'email_verified', 'profile_picture')
      .first();

    if (user && user.email_verified === 1) {
      req.user = user;
    }
  } catch {
    // Silently ignore invalid token in optional auth
  }

  next();
}

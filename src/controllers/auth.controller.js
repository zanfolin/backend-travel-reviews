import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../../database/connection.js';
import { AppError } from '../middlewares/error.middleware.js';
import { sendVerificationCodeEmail } from '../services/email.service.js';

/**
 * Gera token JWT
 */
function generateToken(user) {
  const secret = process.env.JWT_SECRET || 'secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      user_type: user.user_type
    },
    secret,
    { expiresIn }
  );
}

/**
 * Gera código de verificação numérico de 4 dígitos
 */
function generate4DigitCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Registro de novo usuário (TRAVELER ou BUSINESS)
 */
export async function register(req, res, next) {
  try {
    const { email, password, full_name, user_type } = req.body;

    if (!email || !password || !user_type) {
      throw new AppError('E-mail, senha e tipo de usuário (user_type) são obrigatórios.', 400);
    }

    const normalizedUserType = user_type.toUpperCase();
    if (!['TRAVELER', 'BUSINESS'].includes(normalizedUserType)) {
      throw new AppError("O tipo de usuário deve ser 'TRAVELER' ou 'BUSINESS'.", 400);
    }

    if (password.length < 6) {
      throw new AppError('A senha deve ter pelo menos 6 caracteres.', 400);
    }

    // Verificar se e-mail já existe
    const existingUser = await db('users').where({ email: email.toLowerCase().trim() }).first();
    if (existingUser) {
      throw new AppError('Este endereço de e-mail já está cadastrado.', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = generate4DigitCode();

    console.log('\n======================================================');
    console.log(`🔑 [AUTH DEV] Código de verificação para ${email} (${normalizedUserType}): [ ${verificationCode} ]`);
    console.log('======================================================\n');

    const [userId] = await db('users').insert({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      full_name: full_name?.trim() || null,
      user_type: normalizedUserType,
      email_verified: 0,
      email_code: verificationCode,
      profile_picture: null
    });

    // Enviar código por e-mail (24h de validade)
    let emailInfo = null;
    try {
      emailInfo = await sendVerificationCodeEmail(
        email.toLowerCase().trim(),
        verificationCode,
        full_name
      );
    } catch (emailErr) {
      console.error('[Auth] Falha ao enviar e-mail de verificação:', emailErr);
    }

    return res.status(201).json({
      message:
        'Cadastro realizado com sucesso! Um código de verificação de 4 dígitos foi enviado para seu e-mail (válido por 24 horas).',
      userId,
      email: email.toLowerCase().trim(),
      user_type: normalizedUserType,
      emailPreview: emailInfo?.previewUrl || null
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Validação do código de e-mail (4 dígitos, validade de 24 horas)
 */
export async function verifyEmail(req, res, next) {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      throw new AppError('E-mail e código de verificação são obrigatórios.', 400);
    }

    const user = await db('users').where({ email: email.toLowerCase().trim() }).first();
    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    if (user.email_verified === 1) {
      return res.status(200).json({
        message: 'E-mail já está verificado. Você já pode fazer login.',
        alreadyVerified: true
      });
    }

    if (!user.email_code || user.email_code !== code.toString().trim()) {
      throw new AppError('Código de verificação incorreto ou inválido.', 400);
    }

    // Checar validade de 24 horas
    const updatedAt = new Date(user.updated_at || user.created_at).getTime();
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (now - updatedAt > twentyFourHours) {
      throw new AppError(
        'O código de verificação expirou (validade de 24 horas). Solicite um novo código.',
        400
      );
    }

    // Atualiza email_verified = 1 e remove o código conforme nota do DBML
    await db('users')
      .where({ id: user.id })
      .update({
        email_verified: 1,
        email_code: null
      });

    const updatedUser = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      user_type: user.user_type,
      profile_picture: user.profile_picture,
      email_verified: 1
    };

    const token = generateToken(updatedUser);

    return res.status(200).json({
      message: 'E-mail verificado com sucesso! Seu acesso foi liberado.',
      user: updatedUser,
      token
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reenvio de código de verificação
 */
export async function resendVerificationCode(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError('O e-mail é obrigatório.', 400);
    }

    const user = await db('users').where({ email: email.toLowerCase().trim() }).first();
    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    if (user.email_verified === 1) {
      return res.status(200).json({
        message: 'Este e-mail já foi verificado anteriormente.'
      });
    }

    const newCode = generate4DigitCode();

    console.log('\n======================================================');
    console.log(`🔑 [AUTH DEV] Novo código de verificação para ${user.email}: [ ${newCode} ]`);
    console.log('======================================================\n');

    await db('users').where({ id: user.id }).update({
      email_code: newCode
    });

    const emailInfo = await sendVerificationCodeEmail(user.email, newCode, user.full_name);

    return res.status(200).json({
      message: 'Novo código de verificação enviado para seu e-mail (válido por 24 horas).',
      emailPreview: emailInfo?.previewUrl || null
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Login com e-mail e senha
 */
export async function login(req, res, next) {
  try {
    const { email, password, expected_role } = req.body;

    if (!email || !password) {
      throw new AppError('E-mail e senha são obrigatórios.', 400);
    }

    const user = await db('users').where({ email: email.toLowerCase().trim() }).first();
    if (!user) {
      throw new AppError('Credenciais inválidas.', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError('Credenciais inválidas.', 401);
    }

    // Regra do DBML: Liberação depende exclusivamente da validação por e-mail
    if (user.email_verified !== 1) {
      return res.status(403).json({
        error: 'E-mail não verificado',
        message:
          'Seu e-mail ainda não foi verificado. Insira o código de 4 dígitos enviado para seu e-mail para liberar seu acesso.',
        email: user.email,
        requiresVerification: true
      });
    }

    // Se a aplicação especificar o papel esperado (Mobile = TRAVELER, Web = BUSINESS)
    if (expected_role && user.user_type !== expected_role.toUpperCase()) {
      return res.status(403).json({
        error: 'Acesso negado para este tipo de frontend',
        message: `Esta interface é exclusiva para usuários [${expected_role}]. Sua conta possui o perfil [${user.user_type}].`
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: 'Login realizado com sucesso!',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        user_type: user.user_type,
        profile_picture: user.profile_picture,
        email_verified: user.email_verified
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retorna dados do usuário logado
 */
export async function getMe(req, res, next) {
  try {
    return res.status(200).json({
      user: req.user
    });
  } catch (error) {
    next(error);
  }
}

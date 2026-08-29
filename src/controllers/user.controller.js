import db from '../../database/connection.js';
import { AppError } from '../middlewares/error.middleware.js';

/**
 * Obter perfil do usuário logado
 */
export async function getProfile(req, res, next) {
  try {
    const user = await db('users')
      .where({ id: req.user.id })
      .select('id', 'full_name', 'email', 'user_type', 'profile_picture', 'email_verified', 'created_at', 'updated_at')
      .first();

    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    return res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
}

/**
 * Atualizar informações básicas do perfil
 */
export async function updateProfile(req, res, next) {
  try {
    const { full_name, profile_picture } = req.body;

    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name?.trim() || null;
    if (profile_picture !== undefined) updateData.profile_picture = profile_picture?.trim() || null;

    if (Object.keys(updateData).length === 0) {
      throw new AppError('Nenhum dado informado para atualização.', 400);
    }

    await db('users').where({ id: req.user.id }).update(updateData);

    const updatedUser = await db('users')
      .where({ id: req.user.id })
      .select('id', 'full_name', 'email', 'user_type', 'profile_picture', 'email_verified', 'updated_at')
      .first();

    return res.status(200).json({
      message: 'Perfil atualizado com sucesso!',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Upload de foto de perfil
 */
export async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) {
      throw new AppError('Nenhum arquivo de imagem foi enviado.', 400);
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;

    await db('users').where({ id: req.user.id }).update({
      profile_picture: fileUrl
    });

    return res.status(200).json({
      message: 'Foto de perfil atualizada com sucesso!',
      profile_picture: fileUrl,
      filename: req.file.filename
    });
  } catch (error) {
    next(error);
  }
}

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const UPLOADS_FOLDER = path.resolve(__dirname, '..', '..', 'uploads');
export const AVATARS_FOLDER = path.resolve(UPLOADS_FOLDER, 'avatars');
export const PLACES_FOLDER = path.resolve(UPLOADS_FOLDER, 'places');

// Ensure upload directories exist
[UPLOADS_FOLDER, AVATARS_FOLDER, PLACES_FOLDER].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de arquivo inválido. Apenas imagens JPEG, PNG, WEBP ou GIF são permitidas.'), false);
  }
};

const maxFileSize = (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 5) * 1024 * 1024;

export const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, AVATARS_FOLDER);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `avatar-${uniqueSuffix}${ext}`);
    }
  }),
  limits: {
    fileSize: maxFileSize
  },
  fileFilter
});

export const placeImageUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, PLACES_FOLDER);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `place-${uniqueSuffix}${ext}`);
    }
  }),
  limits: {
    fileSize: maxFileSize
  },
  fileFilter
});

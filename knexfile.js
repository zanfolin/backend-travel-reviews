import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_FILE || path.resolve(__dirname, 'database/accesstrip.sqlite');

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
const config = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: dbPath
    },
    useNullAsDefault: true,
    pool: {
      afterCreate: (conn, cb) => {
        conn.run('PRAGMA foreign_keys = ON', cb);
      }
    },
    migrations: {
      directory: path.resolve(__dirname, 'database/migrations'),
      extension: 'js'
    },
    seeds: {
      directory: path.resolve(__dirname, 'database/seeds'),
      extension: 'js'
    }
  },
  test: {
    client: 'sqlite3',
    connection: {
      filename: ':memory:'
    },
    useNullAsDefault: true,
    pool: {
      afterCreate: (conn, cb) => {
        conn.run('PRAGMA foreign_keys = ON', cb);
      }
    },
    migrations: {
      directory: path.resolve(__dirname, 'database/migrations'),
      extension: 'js'
    },
    seeds: {
      directory: path.resolve(__dirname, 'database/seeds'),
      extension: 'js'
    }
  },
  production: {
    client: 'sqlite3',
    connection: {
      filename: dbPath
    },
    useNullAsDefault: true,
    pool: {
      afterCreate: (conn, cb) => {
        conn.run('PRAGMA foreign_keys = ON', cb);
      }
    },
    migrations: {
      directory: path.resolve(__dirname, 'database/migrations'),
      extension: 'js'
    },
    seeds: {
      directory: path.resolve(__dirname, 'database/seeds'),
      extension: 'js'
    }
  }
};

export default config;

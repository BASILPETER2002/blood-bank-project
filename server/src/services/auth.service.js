import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config/index.js';
import User from '../models/User.model.js';

const SALT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRES_IN = '15m'; // short-lived
const REFRESH_TOKEN_EXPIRES_DAYS = 30; // keep longer

export const hashPassword = async (plain) => {
  return bcrypt.hash(plain, SALT_ROUNDS);
};

export const comparePassword = async (plain, hash) => {
  return bcrypt.compare(plain, hash);
};

export const generateAccessToken = (user) => {
  // minimal payload
  const payload = { sub: user._id.toString(), role: user.role, email: user.email };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
};

export const generateRefreshToken = () => {
  // random token (not JWT) — stored server-side
  return crypto.randomBytes(48).toString('hex');
};

export const saveRefreshToken = async (userId, token) => {
  const entry = { token, createdAt: new Date() };
  await User.findByIdAndUpdate(userId, { $push: { refreshTokens: entry } }, { new: true });
};

export const revokeRefreshToken = async (userId, token) => {
  await User.findByIdAndUpdate(userId, { $pull: { refreshTokens: { token } } });
};

export const revokeAllRefreshTokens = async (userId) => {
  await User.findByIdAndUpdate(userId, { $set: { refreshTokens: [] } });
};

export const findUserByEmail = (email) => {
  return User.findOne({ email: email.toLowerCase().trim() });
};

export const createUser = async ({ name, email, password, role = 'donor', phone = '', meta = {}, bloodType = null }) => {
  const passwordHash = await hashPassword(password);
  const u = new User({
    name,
    email: email.toLowerCase().trim(),
    phone,
    role,
    meta,
    passwordHash,
    bloodType
  });
  await u.save();
  return u;
};

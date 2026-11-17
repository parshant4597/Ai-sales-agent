import mongoose from 'mongoose';
import { USER_ROLES } from '../constants.js';

// A team member who can sign in. There is no public sign-up: an admin creates every account.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 120 },
    // "scrypt$<salt>$<hash>". The password itself is never stored.
    passwordHash: { type: String, required: true },
    role: { type: String, enum: USER_ROLES, default: 'member' },
    // A login token issued before this moment is rejected, so a password reset signs everyone out.
    passwordChangedAt: { type: Date, default: Date.now },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const User = mongoose.model('User', userSchema);

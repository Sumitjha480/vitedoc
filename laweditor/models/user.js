import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: String,
  name: String,
  email: String
});

export const User = mongoose.model('User', userSchema);
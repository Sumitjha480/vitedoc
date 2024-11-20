import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  name: String,
  content: Buffer,
  richContent: String,  // For HTML content from editor
  type: String,
  createdAt: { type: Date, default: Date.now }
});

export const Document = mongoose.model('Document', documentSchema);
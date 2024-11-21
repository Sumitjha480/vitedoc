import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  name: String,
  content: Buffer,
  richContent: String,  // For HTML content from editor
  type: String,
  annotations: [{
    id: String,
    content: String,
    text: String,
    pageId: String,
    createdAt: { type: Date, default: Date.now },
    position: {
      start: { type: Number, required: true },
      end: { type: Number, required: true }
    }
  }],
  createdAt: { type: Date, default: Date.now }
});

export const Document = mongoose.model('Document', documentSchema);